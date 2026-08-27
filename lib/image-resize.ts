/* Shrink a picture in the browser before it is uploaded.

   A photo straight off a phone is 3-8 MB. The avatar is drawn at 56px. Raising
   the storage limit to fit the camera would mean paying to keep several
   megabytes so we can throw almost all of them away on every render, and would
   still fail for whoever owns a better camera. Resizing first means the limit
   stops being something the person has to think about. */

const MAX_EDGE = 512; // generous for a 56px avatar, still tiny on disk
const QUALITY = 0.85;

export interface ResizedImage {
  blob: Blob;
  type: string;
  width: number;
  height: number;
}

/**
 * Returns a square-ish, downscaled JPEG. Falls back to the original file if
 * the browser cannot decode it, so an unusual format still gets its chance
 * server-side rather than being rejected here.
 */
export async function shrinkForAvatar(file: File): Promise<ResizedImage> {
  let bitmap: ImageBitmap;
  try {
    /* from-image applies the EXIF rotation the camera recorded. Without it a
       portrait photo taken on a phone arrives on its side. */
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { blob: file, type: file.type, width: 0, height: 0 };
  }

  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { blob: file, type: file.type, width: w, height: h };
  }

  /* A white ground under the drawing: a transparent PNG re-encoded as JPEG
     would otherwise composite onto black. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );

  // toBlob can hand back null; the original is better than nothing
  if (!blob) return { blob: file, type: file.type, width: w, height: h };
  return { blob, type: "image/jpeg", width: outW, height: outH };
}
