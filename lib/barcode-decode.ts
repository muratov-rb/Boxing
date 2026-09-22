"use client";

/* ===========================================================================
   Reading a product barcode from camera frames or an uploaded photo.

   Why a library at all: the browser's own BarcodeDetector exists in Chrome on
   Android but not in Safari on iPhone or in Firefox. One decoder for every
   browser means one code path to test, and it is the one exercised here.

   Why @zxing/library: pure JavaScript. The WebAssembly decoders are faster but
   need 'wasm-unsafe-eval' added to the site's Content-Security-Policy, and
   loosening the CSP for a snack scanner is the wrong trade. The package was
   checked for eval / new Function before it was added: none.

   Loaded on demand. Several hundred kilobytes that nobody needs until they
   tap Barcode, so it is not in any page bundle -- the first scan of a session
   downloads it, and every later one reuses the same reader.
   =========================================================================== */

export interface BarcodeReader {
  /** The digits of a product barcode in this image, or null if none is found. */
  decode(image: ImageData): string | null;
}

let loading: Promise<BarcodeReader> | null = null;

export function loadBarcodeReader(): Promise<BarcodeReader> {
  if (loading) return loading;
  loading = (async () => {
    const zx = await import("@zxing/library");

    /* Product barcodes only. Leaving QR codes and the rest enabled makes every
       frame slower to reject, and a QR code on a packet is a web link, not a
       product number. TRY_HARDER spends more effort per frame, which is the
       right way round for a code someone is holding still in front of it. */
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
          return reader.decodeWithState(bitmap).getText();
        } catch {
          /* NotFoundException, ChecksumException, FormatException: all mean
             "no readable barcode in this frame", which is most frames. */
          return null;
        } finally {
          reader.reset();
        }
      },
    };
  })();
  /* A failed download must not stay cached as a rejected promise, or the
     scanner stays broken until the page is reloaded. */
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

/** The guide band, as fractions of what the preview shows. The scanner draws
    its overlay from these same numbers, so the band people aim with and the
    band that is decoded cannot drift apart. */
export const BAND_WIDTH = 0.9;
export const BAND_HEIGHT = 0.5;

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
 * rotate turns the region a quarter turn. The decoder reads bars that run
 * top to bottom, and a packet photographed upright often has its barcode
 * running the other way; its own rotate-and-retry was measured to find
 * nothing on such a photo, so the turn is done here.
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
     upright, and this decoder is scale-sensitive: that frame failed at 1600
     wide and read at 1280. */
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
