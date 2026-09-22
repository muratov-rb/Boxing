"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { Micros } from "@/lib/nutrients";
import { MAX_GRAMS, macrosAt, type Per100g } from "@/lib/scan-result";
import { hasValidCheckDigit, isBarcodeFormat } from "@/lib/barcode";
import { BAND_HEIGHT, BAND_WIDTH, loadBarcodeReader } from "@/lib/barcode-decode";

/* ===========================================================================
   FoodScanner — photo → Claude vision → calories.
   Privacy-first: an explicit consent screen is shown BEFORE the camera is
   ever requested; uploading a file never touches the camera at all.

   Three things here exist because the estimate was coming back wrong, and all
   three were the app's fault rather than the model's:

   1. The corner brackets used to be decoration. capture() drew the WHOLE
      video frame, so framing one piece of fish inside them and expecting only
      the fish to be counted did exactly nothing — everything else on the
      table went to the model too. The crop is now real.
   2. There was no way to say what the food was. A fried fillet and a slice of
      bread are genuinely similar in a photo; one word from the person who
      cooked it settles it, and there was nowhere to put that word.
   3. An uploaded photo was sent at full size — several megabytes of phone
      camera, occasionally large enough to be rejected outright.

   Packaged food has two better routes than a photo of the food, because the
   exact numbers are printed on it:
   - Barcode: decoded on the phone, and only the number leaves it. Looked up
     in Open Food Facts, which costs no AI and no daily scan.
   - Label: a photo of the nutrition table, which the model reads rather than
     estimates. Where a barcode lookup misses (local products often do), this
     is where it sends people.
   All three land on the same result screen with the same weight controls.
   =========================================================================== */

/* grams, per100g and confidence are optional only so a response from a server
   one deploy behind still renders. The current route always sends them. */
interface ScanItem {
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  grams?: number;
  per100g?: Per100g;
  confidence?: "high" | "medium" | "low";
}
export interface ScanResult {
  items: ScanItem[];
  total_kcal: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  micros?: Micros;
  scale_reference?: string;
  scale_found?: boolean;
  /** Where the numbers came from. Absent from a server one deploy behind,
      which only ever did photos. */
  source?: Mode;
  /** For a barcode: Open Food Facts, or a label another user read here. */
  origin?: "off" | "learned";
  /** For a label read from a barcode miss: now known by that barcode. */
  saved?: boolean;
  note: string;
}

export interface ScanMacros {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  micros?: Micros;
}

type Stage =
  | "consent"
  | "camera"
  | "barcode"
  | "preview"
  | "scanning"
  | "looking"
  | "notFound"
  | "result"
  | "error";

type Mode = "photo" | "barcode" | "label";

const MODES: Mode[] = ["photo", "barcode", "label"];

/* How often the live camera is decoded. Each attempt takes tens of
   milliseconds on a phone; eight a second finds a code as soon as it is steady
   without keeping the processor busy the whole time. */
const DECODE_EVERY_MS = 120;

/* The fraction of the frame the corner brackets enclose, and therefore the
   fraction that is actually sent. One constant so the guide people aim with
   and the crop they get can never drift apart again. */
const FRAME_FRACTION = 0.8;

/* Long edge of what gets uploaded. Claude downsizes large images before
   looking at them, so there is a ceiling past which pixels cost upload time
   and buy nothing — but the old 1280 was under it, and now that the crop
   throws away a fifth of each edge, the food needs the detail back. */
const MAX_EDGE = 1536;

/* A nutrition table is small print, and a digit read wrong is a wrong number,
   not a rough one. Sonnet 5 reads images up to 2576 px on the long edge
   (anything bigger it shrinks), so a label goes up near that limit. The
   slightly lower JPEG quality keeps a full label photo well inside the 4.5 MB
   a serverless request can carry. */
const LABEL_EDGE = 2560;
const LABEL_QUALITY = 0.85;

const HINT_MAX = 120;

/* Step for the weight buttons, sized to the portion. A fixed 10 g would take
   thirty taps to correct a bowl of plov; a fixed 50 g would overshoot a
   spoonful of sauce. */
function stepFor(grams: number): number {
  if (grams < 100) return 10;
  if (grams < 300) return 25;
  return 50;
}

/** Draw a source region onto a canvas no bigger than maxEdge and return JPEG. */
function toScaledJpeg(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  maxEdge = MAX_EDGE,
  quality = 0.9,
): string {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (ctx) {
    /* Default smoothing on a big downscale loses the fine texture that tells
       a grilled fillet from a crumbed one, which is the exact distinction
       that was going wrong. */
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL("image/jpeg", quality);
}

export function FoodScanner({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, kcal: number, macros: ScanMacros) => void;
  onClose: () => void;
}) {
  const t = useTranslations("scan");
  const [stage, setStage] = useState<Stage>("consent");
  const [error, setError] = useState<string>("");
  const [photo, setPhoto] = useState<string>(""); // dataURL
  const [hint, setHint] = useState<string>("");
  const [result, setResult] = useState<ScanResult | null>(null);
  /* Which detected items the person actually ate. Everything the model is
     confident about starts ticked; anything it marked low-confidence starts
     unticked, because "it may see something that wasn't even there" was the
     complaint and an item nobody is sure exists should not be counted by
     default. Unticking is still how you throw out the bread roll the model
     spotted in the background of a photo of your fish. */
  const [picked, setPicked] = useState<boolean[]>([]);
  /* The weight of each item, starting at the model's estimate and editable.
     This is the correction the old scanner had no room for: when it guessed a
     big bowl and you had a small plate, the only option was to retake the same
     photo and get the same answer. */
  const [grams, setGrams] = useState<number[]>([]);
  const [mode, setMode] = useState<Mode>("photo");
  /* The barcode typed by hand, for a code the camera cannot read (a creased
     wrapper, a phone that will not focus close) or a camera that was refused. */
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState("");
  /* The last code looked up, shown when it is not found so the person can
     see it was read correctly and it is the database that does not know it. */
  const [code, setCode] = useState("");
  /* The phone's flashlight, when the camera has one it will let a web page
     switch. A barcode under a kitchen light is often too dim to read. */
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /* The phone's own camera app, for a label. It takes a full-resolution,
     properly focused still -- a frame grabbed from the live preview is video
     quality, and the small print on a nutrition table is exactly what video
     quality loses. */
  const captureRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setTorchAvailable(false);
    setTorchOn(false);
  };

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  }
  useEffect(() => stopCamera, []);

  /* A code seen by the live decoder. An effect event so the loop below keeps
     running across renders without restarting, yet always calls the current
     lookup(). */
  const onDetected = useEffectEvent((found: string) => {
    stopCamera();
    lookup(found);
  });
  /* The decoder failed to download. Typing the number still works, and the
     screen already offers it, so say so rather than failing silently. */
  const onReaderFailed = useEffectEvent(() => setTypedError(t("readerFailed")));

  /* The live barcode reader: runs only while the barcode camera is on screen,
     and stops the moment it is not — including when the dialog closes. */
  useEffect(() => {
    if (stage !== "barcode") return;
    let cancelled = false;
    let timer = 0;
    /* A code is accepted once it has been read twice in a row. Both engines
       check each barcode's own check digit, but a code half out of view can
       still decode as a shorter, valid, wrong one; the same answer twice is
       cheap insurance at eight reads a second. */
    let previous = "";
    loadBarcodeReader()
      .then((reader) => {
        const tick = async () => {
          if (cancelled) return;
          const video = videoRef.current;
          const read = video ? await reader.readFrame(video) : null;
          if (cancelled) return;
          if (read && read === previous) {
            onDetected(read);
            return;
          }
          if (read) previous = read;
          timer = window.setTimeout(tick, DECODE_EVERY_MS);
        };
        tick();
      })
      .catch(() => {
        if (!cancelled) onReaderFailed();
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [stage]);

  /* -- consent accepted → NOW we may ask the browser for the camera -- */
  async function allowCamera(next: Mode = mode) {
    setMode(next);
    /* A label goes to the phone's camera app instead (see captureRef). This
       must stay synchronous, before any await: a file chooser only opens
       from inside the tap that asked for it. */
    if (next === "label") {
      captureRef.current?.click();
      return;
    }
    try {
      /* Ask for the rear camera at a decent resolution and continuous
         autofocus. The default stream on many phones is 640x480 and
         fixed-focus, which is where blurry, unreadable plates come from —
         and the estimate is only as good as the photo. `advanced` entries
         are ignored by devices that do not support them, so this degrades
         quietly rather than failing the whole request. */
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1440 },
          advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
        },
        audio: false,
      });
      streamRef.current = stream;
      setTypedError("");
      const caps = stream.getVideoTracks()[0]?.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      setTorchAvailable(next === "barcode" && caps?.torch === true);
      setStage(next === "barcode" ? "barcode" : "camera");
      // attach after render
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError(t("cameraDenied"));
      setStage("error");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 540;

    /* Work out what the brackets are actually over.

       The preview is a 4:3 box with object-cover, so the camera frame is
       already being cropped to fill it — the person never sees the edges of
       a 16:9 stream. Cropping the raw frame by 80% would therefore cut
       somewhere quite different from where the brackets appear to be. Start
       from the region object-cover shows, then take the brackets out of
       that. Both are centred, so the maths stays this short. */
    const shownW = Math.min(w, (h * 4) / 3);
    const shownH = Math.min(h, (w * 3) / 4);
    const cropW = shownW * FRAME_FRACTION;
    const cropH = shownH * FRAME_FRACTION;

    setPhoto(toScaledJpeg(video, (w - cropW) / 2, (h - cropH) / 2, cropW, cropH));
    stopCamera();
    setStage("preview");
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    /* Cleared so that choosing the same photo again, after a retake, still
       counts as a change. */
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result);
      /* An upload is not cropped — there are no brackets to crop to, and the
         person chose the framing themselves. It is still resized: a modern
         phone photo is several megabytes, which is slow on mobile data and
         big enough to be refused. */
      const img = new window.Image();
      img.onload = () => {
        if (mode === "barcode") {
          decodeUpload(img);
          return;
        }
        setPhoto(
          mode === "label"
            ? toScaledJpeg(img, 0, 0, img.naturalWidth, img.naturalHeight, LABEL_EDGE, LABEL_QUALITY)
            : toScaledJpeg(img, 0, 0, img.naturalWidth, img.naturalHeight),
        );
        setStage("preview");
      };
      img.onerror = () => {
        if (mode === "barcode") {
          setError(t("noBarcodeInPhoto"));
          setStage("error");
          return;
        }
        /* Not something the canvas can read — send it as it came and let the
           server decide, rather than refusing a photo that might be fine. */
        setPhoto(raw);
        setStage("preview");
      };
      img.src = raw;
    };
    reader.readAsDataURL(f);
  }

  /* A barcode in an uploaded photo, searched everywhere in it (see
     readPhoto). Decoded here on the phone; the photo is never sent anywhere. */
  async function decodeUpload(img: HTMLImageElement) {
    setStage("looking");
    try {
      const reader = await loadBarcodeReader();
      const read = await reader.readPhoto(img);
      if (read) {
        lookup(read);
        return;
      }
      setError(t("noBarcodeInPhoto"));
    } catch {
      setError(t("readerFailed"));
    }
    setStage("error");
  }

  /* A barcode, from the camera, a photo or the keyboard, to a result. */
  async function lookup(found: string) {
    setCode(found);
    setStage("looking");
    try {
      const res = await fetch("/api/food-barcode?code=" + encodeURIComponent(found));
      if (res.status === 429) {
        setError(t("tooManyLookups"));
        setStage("error");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as ScanResult & { found?: boolean };
      if (!data.found) {
        setStage("notFound");
        return;
      }
      showResult({ ...data, source: "barcode" });
    } catch {
      setError(t("lookupFailed"));
      setStage("error");
    }
  }

  function submitTyped(e: React.FormEvent) {
    e.preventDefault();
    /* Digits only: people copy the number with its spaces, as printed. */
    const digits = [...typed].filter((ch) => ch >= "0" && ch <= "9").join("");
    if (!isBarcodeFormat(digits)) {
      setTypedError(t("typedBadLength"));
      return;
    }
    /* An 8-digit code may be UPC-E, whose check digit is worked out on a
       longer form, so only the longer codes are checked here. A failed check
       on those is almost always one mistyped digit. */
    if (digits.length !== 8 && !hasValidCheckDigit(digits)) {
      setTypedError(t("typedBadDigits"));
      return;
    }
    setTypedError("");
    stopCamera();
    lookup(digits);
  }

  /* Printed numbers are not a guess, so nothing from a pack starts unticked;
     a low confidence there means a blurred table, which the note explains. */
  function showResult(data: ScanResult) {
    const fromPack = data.source === "barcode" || data.source === "label";
    setResult(data);
    setPicked(data.items.map((item) => fromPack || item.confidence !== "low"));
    setGrams(data.items.map((item) => item.grams ?? 0));
    setStage("result");
  }

  async function scan() {
    setStage("scanning");
    try {
      const res = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: photo,
          hint: hint.trim().slice(0, HINT_MAX),
          mode: mode === "label" ? "label" : "photo",
          /* The barcode that was not found, so a good read of its label is
             remembered for the next person who scans it. Only set on the way
             here from "not found"; a label photographed from the start
             screen belongs to no barcode. */
          barcode: mode === "label" && code ? code : undefined,
        }),
      });
      if (res.status === 503) {
        setError(t("noAi"));
        setStage("error");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as ScanResult;
      showResult({ ...data, source: data.source ?? "photo" });
    } catch {
      setError(t("scanFailed"));
      setStage("error");
    }
  }

  /* One item at the weight it has now — the model's estimate or the person's
     correction.

     Computed from the composition per 100 g with macrosAt(), the same
     function the server used, so a weight nobody has touched shows exactly
     the number the server sent, and a doubled weight is exactly double. */
  function itemAt(index: number) {
    const item = result!.items[index];
    const g = grams[index] ?? item.grams ?? 0;
    if (item.per100g && g > 0) {
      return { name: item.name, grams: g, ...macrosAt(item.per100g, g) };
    }
    /* A response from before composition per 100 g existed: scale its
       absolute figures by the change in weight, or use them as they came. */
    const ratio = item.grams && g > 0 ? g / item.grams : 1;
    const r = (v?: number) => Math.round((v ?? 0) * ratio);
    return {
      name: item.name,
      grams: g,
      kcal: r(item.kcal),
      protein: r(item.protein),
      carbs: r(item.carbs),
      fat: r(item.fat),
      fiber: r(item.fiber),
    };
  }

  /* What the ticked items come to, at their current weights.

     Always a sum of the items now. It used to prefer the model's own totals
     when everything was ticked, on the grounds that they were
     self-consistent — but the model no longer produces totals at all; the
     server sums the items, so re-adding them here is the same arithmetic.

     The minerals have no per-item breakdown (see the route for why), so they
     scale with the calories kept: untick half the plate or halve the weight,
     and they halve too. */
  function selected() {
    const empty = { items: [] as ReturnType<typeof itemAt>[], kcal: 0, macros: {} as ScanMacros };
    if (!result) return empty;

    const items = result.items.map((_, i) => i).filter((i) => picked[i]).map(itemAt);
    if (items.length === 0) return empty;

    const sum = (key: "kcal" | "protein" | "carbs" | "fat" | "fiber") =>
      items.reduce((n, item) => n + item[key], 0);
    const kcal = sum("kcal");

    /* Can exceed 1 now: correcting a small estimate upward is as legitimate as
       unticking. Bounded so a typo of 50000 g cannot multiply the minerals
       into nonsense. */
    const share = result.total_kcal > 0 ? Math.min(20, Math.max(0, kcal / result.total_kcal)) : 1;
    const scale = (v: number | undefined) => (v == null ? undefined : Math.round(v * share));
    const hasItemFiber = result.items.some((item) => item.fiber != null);

    return {
      items,
      kcal,
      macros: {
        protein: sum("protein"),
        carbs: sum("carbs"),
        fat: sum("fat"),
        fiber: hasItemFiber ? sum("fiber") : scale(result.total_fiber),
        micros: result.micros
          ? {
              iron: scale(result.micros.iron) ?? 0,
              calcium: scale(result.micros.calcium) ?? 0,
              potassium: scale(result.micros.potassium) ?? 0,
              sodium: scale(result.micros.sodium) ?? 0,
              vitaminC: scale(result.micros.vitaminC) ?? 0,
            }
          : undefined,
      } satisfies ScanMacros,
    };
  }

  /* Clamped to what one visible item could weigh. Zero is allowed — it is how
     an emptied field reads while someone types a new number, and it counts as
     nothing, the same as unticking. */
  const setGram = (index: number, value: number) =>
    setGrams((prev) =>
      prev.map((v, j) => (j === index ? Math.min(MAX_GRAMS, Math.max(0, Math.round(value))) : v)),
    );

  function addAll() {
    const chosen = selected();
    if (chosen.items.length === 0) return onClose();
    onAdd(chosen.items.map((i) => i.name).join(", "), chosen.kcal, chosen.macros);
    onClose();
  }

  /* Back to the start, but keep the hint: the commonest reason to retake is
     that the model got the food wrong, and that is precisely when someone has
     just typed what it was. */
  function retake() {
    setResult(null);
    setPicked([]);
    setGrams([]);
    setTypedError("");
    setCode("");
    setStage("consent");
  }

  const chosen = selected();
  const source: Mode = result?.source ?? "photo";

  /* Typing the barcode: on the start screen for someone who refused the
     camera, and under the live camera for a code it cannot read. */
  const typedForm = (
    <form onSubmit={submitTyped} className="mt-4">
      <label
        htmlFor="scan-barcode"
        className="block font-condensed text-xs uppercase tracking-widest text-ash"
      >
        {t("typedLabel")}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="scan-barcode"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value.slice(0, 20));
            setTypedError("");
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="4600000000000"
          className="min-h-[45px] min-w-0 flex-1 rounded-md border border-line bg-void px-3 py-2 text-base tracking-wider text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
        />
        <button type="submit" className="btn btn-ghost shrink-0">
          {t("typedSubmit")}
        </button>
      </div>
      {typedError && (
        <p role="alert" className="mt-1.5 text-xs text-blood-bright">
          {typedError}
        </p>
      )}
    </form>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="panel max-h-[90dvh] w-full max-w-md overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="font-condensed text-xs uppercase tracking-widest text-ash hover:text-blood"
          >
            {t("close")}
          </button>
        </div>

        {/* -------- consent: shown BEFORE any camera access -------- */}
        {stage === "consent" && (
          <div>
            {/* Three ways in. A meal photo is an estimate; a barcode or a
                label is the pack's own printed numbers, and for packaged food
                that beats any estimate. */}
            <div className="mb-5 grid grid-cols-3 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m);
                    setTypedError("");
                    setCode("");
                  }}
                  className={
                    "min-h-[44px] rounded-xl border px-1 font-condensed text-xs uppercase tracking-widest transition-colors " +
                    (mode === m
                      ? "border-blood bg-blood/10 text-bone"
                      : "border-line text-ash hover:border-blood/50")
                  }
                >
                  {t(m === "photo" ? "modePhoto" : m === "barcode" ? "modeBarcode" : "modeLabel")}
                </button>
              ))}
            </div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="calorie" size={26} />
            </div>
            <p className="mt-4 text-center text-sm text-ash">
              {t(
                mode === "photo"
                  ? "consentBody"
                  : mode === "barcode"
                    ? "consentBarcode"
                    : "consentLabel",
              )}
            </p>
            <p className="mt-2 text-center text-xs text-ash-dim">{t("consentPrivacy")}</p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => allowCamera()}
                className="btn btn-primary w-full"
              >
                {t(mode === "label" ? "scanLabelInstead" : "allowCamera")}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn btn-ghost w-full"
              >
                {t("uploadInstead")}
              </button>
            </div>
            {mode === "barcode" && typedForm}
          </div>
        )}

        {/* -------- live barcode reader -------- */}
        {stage === "barcode" && (
          <div>
            <div className="relative">
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-[4/3] w-full rounded-lg border border-line/70 bg-black object-cover"
              />
              {/* The band the decoder reads, drawn from the same fractions
                  frameBand() crops with. Clipped for the same reason as the
                  meal guide: an unclipped shadow ring greys out the dialog. */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-lg">
                <div
                  className="relative"
                  style={{ height: `${BAND_HEIGHT * 100}%`, width: `${BAND_WIDTH * 100}%` }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg border-2 border-blood/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                  />
                  {/* The scan line: tells people it is reading, not waiting
                      for a shutter press that does not exist here. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-blood/80"
                  />
                </div>
              </div>
              <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                {t("barcodeHint")}
              </p>
              {torchAvailable && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  aria-pressed={torchOn}
                  aria-label={t("torch")}
                  className={
                    "absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full border text-white backdrop-blur-sm transition-colors " +
                    (torchOn ? "border-blood bg-blood/70" : "border-white/40 bg-black/40")
                  }
                >
                  <Icon name="bolt" size={18} />
                </button>
              )}
            </div>
            {typedForm}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setStage("consent");
              }}
              className="btn btn-ghost mt-4 w-full"
            >
              {t("back")}
            </button>
          </div>
        )}

        {/* -------- live camera -------- */}
        {stage === "camera" && (
          <div>
            {/* The framing guide, and now also the crop. Everything outside
                the corners is discarded before the photo is sent, which is
                what makes "point it at the fish" work. The dimmed surround
                says so without a caption. */}
            <div className="relative">
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-[4/3] w-full rounded-lg border border-line/70 bg-black object-cover"
              />
              {/* overflow-hidden is load-bearing, not tidiness. The dimming
                  below is drawn as a 9999px box-shadow spread, which without
                  a clip does not stop at the preview — it covers the whole
                  dialog, and the red Take photo button underneath it comes
                  out looking greyed out and disabled. */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-lg">
                <div
                  className="relative"
                  style={{ height: `${FRAME_FRACTION * 100}%`, width: `${FRAME_FRACTION * 100}%` }}
                >
                  {/* A ring of shadow rather than four overlay boxes: one
                      element, and it cannot leave a seam. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                  />
                  {[
                    "left-0 top-0 border-l-2 border-t-2 rounded-tl-lg",
                    "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg",
                    "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg",
                    "right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg",
                  ].map((pos) => (
                    <span key={pos} className={`absolute h-8 w-8 border-blood/90 ${pos}`} />
                  ))}
                </div>
              </div>
              <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                {t("frameHint")}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={capture} className="btn btn-primary">
                {t("capture")}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setStage("consent");
                }}
                className="btn btn-ghost"
              >
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {/* -------- preview + name it + scan -------- */}
        {stage === "preview" && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Meal preview"
              className={
                "aspect-[4/3] w-full rounded-lg border border-line/70 " +
                /* A label is usually shot upright and must be checkable in
                   full -- cropping it to fill the box would hide the very
                   rows someone wants to see were in the photo. */
                (mode === "label" ? "bg-black object-contain" : "object-cover")
              }
            />

            {/* One word here is worth more than anything else on this screen.
                A photo cannot always separate a fried fillet from a slice of
                bread; the person who cooked it can. */}
            <label
              htmlFor="scan-hint"
              className="mt-4 block font-condensed text-xs uppercase tracking-widest text-ash"
            >
              {t(mode === "label" ? "labelNameLabel" : "hintLabel")}
            </label>
            {/* In label mode the same field names the product: a photo of a
                nutrition table rarely shows what the product is called. */}
            <input
              id="scan-hint"
              value={hint}
              onChange={(e) => setHint(e.target.value.slice(0, HINT_MAX))}
              maxLength={HINT_MAX}
              placeholder={t(mode === "label" ? "labelNamePlaceholder" : "hintPlaceholder")}
              className="mt-2 min-h-[45px] w-full rounded-md border border-line bg-void px-3 py-2 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
            />
            {mode !== "label" && (
              <p className="mt-1.5 text-xs leading-relaxed text-ash-dim">{t("hintHelp")}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={scan} className="btn btn-primary">
                {t("analyze")}
              </button>
              {/* Retaking a label goes straight back to the camera, keeping the
                  barcode it belongs to; a meal goes back to the start. */}
              <button
                type="button"
                onClick={mode === "label" ? () => allowCamera("label") : retake}
                className="btn btn-ghost"
              >
                {t("retake")}
              </button>
            </div>
          </div>
        )}

        {stage === "scanning" && (
          <div className="py-10 text-center">
            <div className="animate-glow mx-auto grid h-14 w-14 place-items-center rounded-full text-blood">
              <Icon name="bolt" size={28} />
            </div>
            <p className="mt-4 font-condensed text-sm uppercase tracking-[0.25em] text-ash">
              {t(mode === "label" ? "readingLabel" : "scanning")}
            </p>
          </div>
        )}

        {stage === "looking" && (
          <div className="py-10 text-center">
            <div className="animate-glow mx-auto grid h-14 w-14 place-items-center rounded-full text-blood">
              <Icon name="bolt" size={28} />
            </div>
            <p className="mt-4 font-condensed text-sm uppercase tracking-[0.25em] text-ash">
              {t("lookingUp")}
            </p>
          </div>
        )}

        {/* -------- barcode read, product unknown -------- */}
        {stage === "notFound" && (
          <div className="py-2 text-center">
            <p className="font-condensed text-lg tracking-widest text-bone">{code}</p>
            <p className="mt-3 text-sm leading-relaxed text-ash">{t("notFoundBody")}</p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => allowCamera("label")}
                className="btn btn-primary w-full"
              >
                {t("scanLabelInstead")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("label");
                  fileRef.current?.click();
                }}
                className="btn btn-ghost w-full"
              >
                {t("uploadLabel")}
              </button>
              <button type="button" onClick={retake} className="btn btn-ghost w-full">
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {/* -------- result -------- */}
        {stage === "result" && result && (
          <div>
            {result.items.length > 0 && (
              <p className="mb-2 text-xs leading-relaxed text-ash-dim">
                {t(source === "photo" ? "itemsHint" : "portionHint")}
              </p>
            )}
            <ul className="divide-y divide-line/70">
              {result.items.length === 0 && (
                <li className="py-3 text-sm text-ash">{t("nothingFound")}</li>
              )}
              {result.items.map((it, i) => {
                const row = itemAt(i);
                const g = grams[i] ?? 0;
                /* A response from before weights existed has nothing to edit. */
                const editable = (it.grams ?? 0) > 0;
                return (
                  <li key={i} className="py-2.5">
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={picked[i] ?? true}
                        onChange={() =>
                          setPicked((prev) => prev.map((v, j) => (j === i ? !v : v)))
                        }
                        className="h-4 w-4 shrink-0 accent-blood"
                      />
                      <span
                        className={
                          picked[i] ? "flex-1 text-bone/90" : "flex-1 text-ash-dim line-through"
                        }
                      >
                        {it.name}
                      </span>
                      <span className="font-condensed text-ash">{row.kcal} kcal</span>
                    </label>

                    {editable && (
                      /* The correction the old scanner had no room for. The
                         field can be typed into, so someone who weighed their
                         food can enter the real number; the buttons step in
                         sizes that suit the portion. */
                      <div className="mt-2 flex items-center gap-2 pl-7">
                        <button
                          type="button"
                          onClick={() => setGram(i, g - stepFor(g))}
                          aria-label={t("lessGrams")}
                          className="grid h-8 w-8 place-items-center rounded-md border border-line text-ash transition-colors hover:border-blood/50 hover:text-bone"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MAX_GRAMS}
                          value={g > 0 ? g : ""}
                          onChange={(e) => setGram(i, Number(e.target.value) || 0)}
                          aria-label={t("gramsAria", { name: it.name })}
                          className="h-8 w-16 rounded-md border border-line bg-void px-1 text-center text-sm text-bone focus:border-blood focus:outline-none"
                        />
                        <span className="text-xs text-ash-dim">g</span>
                        <button
                          type="button"
                          onClick={() => setGram(i, g + stepFor(g))}
                          aria-label={t("moreGrams")}
                          className="grid h-8 w-8 place-items-center rounded-md border border-line text-ash transition-colors hover:border-blood/50 hover:text-bone"
                        >
                          +
                        </button>
                        {/* From a pack, the printed density is the useful
                            thing to see: it is what the weight multiplies. */}
                        {source !== "photo" && it.per100g ? (
                          <span className="ml-1 text-xs text-ash-dim">
                            {t("per100", { kcal: Math.round(it.per100g.kcal) })}
                          </span>
                        ) : (
                          it.confidence === "low" && (
                            <span className="ml-1 text-xs text-ash-dim">{t("lowConfidence")}</span>
                          )
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* What the weights were measured against. When the answer is
                "nothing", the weights are an assumption and the person should
                know that before trusting the total — it is exactly the photo
                (food filling the frame, no plate edge) that gives the same
                number for a small plate and a large bowl. */}
            {result.items.length > 0 && source !== "photo" && (
              <p className="mt-2 text-xs leading-relaxed text-ash-dim">
                {t(
                  source === "label"
                    ? "fromLabel"
                    : result.origin === "learned"
                      ? "fromCommunity"
                      : "fromDatabase",
                )}
              </p>
            )}
            {result.saved && (
              <p className="mt-1 text-xs leading-relaxed text-ash">{t("savedForNext")}</p>
            )}
            {result.items.length > 0 &&
              source === "photo" &&
              (result.scale_found === false ? (
                <p className="mt-2 text-xs leading-relaxed text-ash">{t("noScale")}</p>
              ) : result.scale_reference ? (
                <p className="mt-2 text-xs leading-relaxed text-ash-dim">
                  {t("measuredAgainst", { ref: result.scale_reference })}
                </p>
              ) : null)}
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
              <span className="font-condensed text-sm font-bold uppercase tracking-wide">
                {t("total")}
              </span>
              <span className="font-display text-2xl">{chosen.kcal} kcal</span>
            </div>
            {/* macro breakdown */}
            {chosen.items.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: t("protein"), value: chosen.macros.protein },
                  { label: t("carbs"), value: chosen.macros.carbs },
                  { label: t("fat"), value: chosen.macros.fat },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-line/70 bg-void/40 py-2 text-center"
                  >
                    <p className="font-display text-xl leading-none">
                      {m.value ?? 0}
                      <span className="text-xs text-ash-dim">g</span>
                    </p>
                    <p className="mt-1 font-condensed text-[0.6rem] uppercase tracking-widest text-ash-dim">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {result.note && <p className="mt-3 text-xs text-ash-dim">{result.note}</p>}
            {/* Got it wrong? Naming the food and going again is the fix, and
                it is worth saying so rather than leaving people to re-shoot
                the same photo and get the same answer. */}
            {source === "photo" && (
              <p className="mt-3 text-xs leading-relaxed text-ash-dim">{t("wrongHint")}</p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={addAll}
                disabled={chosen.items.length === 0}
                className="btn btn-primary"
              >
                {t("addMeal")}
              </button>
              {/* A meal goes back to its photo to be named and read again.
                  A pack's numbers will not change on a second read, so the
                  useful next step is the next product. */}
              <button
                type="button"
                onClick={source === "photo" ? () => setStage("preview") : retake}
                className="btn btn-ghost"
              >
                {t(source === "photo" ? "tryAgain" : "scanAnother")}
              </button>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="py-6 text-center">
            <p className="text-sm text-blood-bright">{error}</p>
            <button type="button" onClick={retake} className="btn btn-ghost mt-5">
              {t("back")}
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pickFile}
          className="hidden"
        />
        {/* capture opens the camera app itself on a phone; a desktop without
            one simply shows the file chooser. */}
        <input
          ref={captureRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pickFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
