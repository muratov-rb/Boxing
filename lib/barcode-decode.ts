"use client";

/* ===========================================================================
   Reading a product barcode from camera frames or an uploaded photo.

   Two engines, best first:

   1. The browser's own BarcodeDetector. On Android, Chrome backs it with
      Google's ML Kit -- the same scanner native food apps use. It reads
      barcodes at an angle, upside down, curved round a bottle, small, soft
      or in poor light, straight from the video element, in a few
      milliseconds. The first phone test of this scanner ran on the fallback
      below and read one code in the whole session; this is the fix for that.
   2. @zxing/library, for browsers without it (Safari on iPhone, Firefox,
      Chrome on Windows). Pure JavaScript: the WebAssembly decoders are faster
      but need 'wasm-unsafe-eval' in the site's Content-Security-Policy, and
      loosening the CSP for a snack scanner is the wrong trade. Checked for
      eval / new Function before it was added: none. Downloaded only on a
      device that needs it.

   Both are loaded on demand, and the reader is built once per session.
   =========================================================================== */

export interface BarcodeReader {
  /** True when the platform's own detector is doing the reading. */
  native: boolean;
  /** A product barcode in the current video frame, or null. Cheap enough to
      call several times a second. */
  readFrame(video: HTMLVideoElement): Promise<string | null>;
  /** A product barcode anywhere in a still photo, searched thoroughly --
      any position, either orientation, several scales. */
  readPhoto(image: HTMLImageElement): Promise<string | null>;
}

/** The guide band, as fractions of what the preview shows. The scanner draws
    its overlay from these same numbers, so the band people aim with and the
    band the fallback decodes cannot drift apart. */
export const BAND_WIDTH = 0.9;
export const BAND_HEIGHT = 0.5;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/** Product barcodes are digits only; anything else a detector returns (a QR
    code's URL, say) is not a product number. */
function digitsOnly(value: string): string | null {
  const v = value.trim();
  if (v.length < 8 || v.length > 14) return null;
  for (let i = 0; i < v.length; i++) {
    const c = v.charCodeAt(i);
    if (c < 48 || c > 57) return null;
  }
  return v;
}

/* ------------------------- 1. the platform detector ----------------------- */

interface DetectedBarcode {
  rawValue: string;
  boundingBox: DOMRectReadOnly;
}
interface NativeDetector {
  detect(source: HTMLVideoElement | HTMLImageElement): Promise<DetectedBarcode[]>;
}
interface NativeDetectorClass {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
}

async function nativeDetector(): Promise<NativeDetector | null> {
  const Detector = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (!Detector) return null;
  try {
    /* Present is not the same as working: Chrome on Windows exposes the class
       and supports no formats at all. */
    const supported = await Detector.getSupportedFormats();
    const formats = FORMATS.filter((f) => supported.includes(f));
    return formats.length ? new Detector({ formats }) : null;
  } catch {
    return null;
  }
}

/** The product barcode nearest the middle, when a frame holds several (a
    shelf, a multipack). The one being aimed at is the one in the middle. */
async function nativeRead(
  detector: NativeDetector,
  source: HTMLVideoElement | HTMLImageElement,
  width: number,
  height: number,
): Promise<string | null> {
  try {
    const found = await detector.detect(source);
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const b of found) {
      const code = digitsOnly(b.rawValue);
      if (!code) continue;
      const cx = b.boundingBox.x + b.boundingBox.width / 2 - width / 2;
      const cy = b.boundingBox.y + b.boundingBox.height / 2 - height / 2;
      const distance = cx * cx + cy * cy;
      if (distance < bestDistance) {
        best = code;
        bestDistance = distance;
      }
    }
    return best;
  } catch {
    /* A frame that is not ready yet, or a detector hiccup: no code this time. */
    return null;
  }
}

/* ----------------------------- 2. the fallback ---------------------------- */

interface ZxingDecoder {
  decode(image: ImageData): string | null;
}

async function zxingDecoder(): Promise<ZxingDecoder> {
  const zx = await import("@zxing/library");

  /* Product barcodes only. Leaving QR codes and the rest enabled makes every
     frame slower to reject. TRY_HARDER spends more effort per frame, which is
     the right way round for a code someone is holding still. */
  const hints = new Map<unknown, unknown>();
  hints.set(zx.DecodeHintType.POSSIBLE_FORMATS, [
    zx.BarcodeFormat.EAN_13,
    zx.BarcodeFormat.EAN_8,
    zx.BarcodeFormat.UPC_A,
    zx.BarcodeFormat.UPC_E,
  ]);
  hints.set(zx.DecodeHintType.TRY_HARDER, true);
  const reader = new zx.MultiFormatReader();
  reader.setHints(hints as Map<never, never>);

  return {
    decode(image: ImageData): string | null {
      /* RGBLuminanceSource takes a Uint8ClampedArray AS greyscale, one byte
         per pixel -- it only converts colour when handed an Int32Array of
         packed pixels. The canvas gives four bytes (RGBA) per pixel, so the
         conversion is done here; passing the RGBA bytes straight through
         would decode nothing and raise no error. Weights are ITU-R 601. */
      const pixels = image.width * image.height;
      const grey = new Uint8ClampedArray(pixels);
      const rgba = image.data;
      for (let i = 0, j = 0; i < pixels; i++, j += 4) {
        grey[i] = (rgba[j] * 299 + rgba[j + 1] * 587 + rgba[j + 2] * 114) / 1000;
      }
      const source = new zx.RGBLuminanceSource(grey, image.width, image.height);
      const bitmap = new zx.BinaryBitmap(new zx.HybridBinarizer(source));
      try {
        return digitsOnly(reader.decodeWithState(bitmap).getText());
      } catch {
        /* NotFoundException, ChecksumException, FormatException: all mean
           "no readable barcode in this frame", which is most frames. */
        return null;
      } finally {
        reader.reset();
      }
    },
  };
}

/**
 * The part of a frame worth decoding, scaled to a width the decoder handles
 * quickly. Decoding a full 1920-pixel frame ten times a second would make a
 * phone hot and find nothing more, since a barcode is held in the middle,
 * horizontally, or not at all.
 *
 * The preview is a 4:3 box with object-cover, so on a phone held upright (a
 * portrait stream) the person sees only the middle of the frame. The band is
 * taken out of what they see, where the guide is drawn -- the same reasoning
 * as the meal photo's crop. fullFrame is for an uploaded photo, where there
 * is no guide and the barcode can be anywhere.
 *
 * rotate turns the region a quarter turn. zxing reads bars that run top to
 * bottom, and a packet photographed upright often has its barcode running the
 * other way; its own rotate-and-retry was measured to find nothing on such a
 * photo, so the turn is done here.
 */
export function frameBand(
  source: HTMLVideoElement | HTMLImageElement,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  {
    fullFrame = false,
    maxWidth = 960,
    rotate = false,
  }: { fullFrame?: boolean; maxWidth?: number; rotate?: boolean } = {},
): ImageData | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || width === 0 || height === 0) return null;
  const shownW = Math.min(width, (height * 4) / 3);
  const shownH = Math.min(height, (width * 3) / 4);
  const sw = fullFrame ? width : shownW * BAND_WIDTH;
  const sh = fullFrame ? height : shownH * BAND_HEIGHT;
  const sx = (width - sw) / 2;
  const sy = (height - sh) / 2;
  /* maxWidth is the width of what the DECODER gets, so after a turn it
     bounds the region's height. Bounding the pre-turn width instead handed
     the decoder a portrait photo at a different scale from the same photo
     upright, and zxing is scale-sensitive: that frame failed at 1600 wide
     and read at 1280. */
  const scale = Math.min(1, maxWidth / (rotate ? sh : sw));
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));
  /* Resizing a canvas also resets its transform, so each call starts clean. */
  canvas.width = rotate ? outH : outW;
  canvas.height = rotate ? outW : outH;
  if (rotate) {
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/* ------------------------------ the reader ------------------------------- */

let loading: Promise<BarcodeReader> | null = null;

export function loadBarcodeReader(): Promise<BarcodeReader> {
  if (loading) return loading;
  loading = (async () => {
    const native = await nativeDetector();
    const canvas = document.createElement("canvas");
    let fallback: Promise<ZxingDecoder> | null = null;
    const zxing = () => (fallback ??= zxingDecoder());

    /* On a device with a working detector, zxing is never downloaded for live
       scanning; it is only fetched as a second opinion on a photo the
       detector found nothing in. */
    if (!native) await zxing();

    return {
      native: native !== null,

      async readFrame(video) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h || video.readyState < 2) return null;
        if (native) return nativeRead(native, video, w, h);
        const frame = frameBand(video, canvas, w, h);
        return frame ? (await zxing()).decode(frame) : null;
      },

      async readPhoto(image) {
        const w = image.naturalWidth;
        const h = image.naturalHeight;
        if (native) {
          const hit = await nativeRead(native, image, w, h);
          if (hit) return hit;
        }
        /* Sizes: a middling one first; a smaller one, which smooths out blur
           and is cheap; then a larger one for a small barcode in a big photo,
           only when the photo is that big. Each both as taken and turned a
           quarter. */
        const decoder = await zxing();
        const longest = Math.max(w, h);
        for (const maxWidth of [1280, 800, 2048]) {
          if (maxWidth > 1280 && longest <= 1280) continue;
          for (const rotate of [false, true]) {
            const frame = frameBand(image, canvas, w, h, { fullFrame: true, maxWidth, rotate });
            const hit = frame ? decoder.decode(frame) : null;
            if (hit) return hit;
          }
        }
        return null;
      },
    } satisfies BarcodeReader;
  })();
  /* A failed download must not stay cached as a rejected promise, or the
     scanner stays broken until the page is reloaded. */
  loading.catch(() => {
    loading = null;
  });
  return loading;
}
