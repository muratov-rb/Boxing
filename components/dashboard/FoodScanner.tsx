"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import type { Micros } from "@/lib/nutrients";

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
   =========================================================================== */

interface ScanItem {
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}
export interface ScanResult {
  items: ScanItem[];
  total_kcal: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  micros?: Micros;
  note: string;
}

export interface ScanMacros {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  micros?: Micros;
}

type Stage = "consent" | "camera" | "preview" | "scanning" | "result" | "error";

/* The fraction of the frame the corner brackets enclose, and therefore the
   fraction that is actually sent. One constant so the guide people aim with
   and the crop they get can never drift apart again. */
const FRAME_FRACTION = 0.8;

/* Long edge of what gets uploaded. Claude downsizes large images before
   looking at them, so there is a ceiling past which pixels cost upload time
   and buy nothing — but the old 1280 was under it, and now that the crop
   throws away a fifth of each edge, the food needs the detail back. */
const MAX_EDGE = 1536;

const HINT_MAX = 120;

/** Draw a source region onto a canvas no bigger than MAX_EDGE and return JPEG. */
function toScaledJpeg(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
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
  return canvas.toDataURL("image/jpeg", 0.9);
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
  /* Which detected items the person actually ate. Everything starts ticked;
     unticking is how you throw out the bread roll the model spotted in the
     background of a photo of your fish. */
  const [picked, setPicked] = useState<boolean[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCamera, []);

  /* -- consent accepted → NOW we may ask the browser for the camera -- */
  async function allowCamera() {
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
      setStage("camera");
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
        setPhoto(toScaledJpeg(img, 0, 0, img.naturalWidth, img.naturalHeight));
        setStage("preview");
      };
      img.onerror = () => {
        /* Not something the canvas can read — send it as it came and let the
           server decide, rather than refusing a photo that might be fine. */
        setPhoto(raw);
        setStage("preview");
      };
      img.src = raw;
    };
    reader.readAsDataURL(f);
  }

  async function scan() {
    setStage("scanning");
    try {
      const res = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: photo, hint: hint.trim().slice(0, HINT_MAX) }),
      });
      if (res.status === 503) {
        setError(t("noAi"));
        setStage("error");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as ScanResult;
      setResult(data);
      setPicked(data.items.map(() => true));
      setStage("result");
    } catch {
      setError(t("scanFailed"));
      setStage("error");
    }
  }

  /* What the ticked items come to.

     With everything ticked the model's own totals are used rather than a sum
     of the parts: it estimated them together and they are self-consistent,
     where re-adding rounded per-item grams introduces drift. Once something
     is unticked there is no choice but to re-add, and the whole-meal figures
     that have no per-item breakdown — fibre and the minerals — are scaled by
     the share of calories kept. Approximate, but far closer than charging
     someone for a plate they did not eat. */
  function selected() {
    const empty = { items: [] as ScanItem[], kcal: 0, macros: {} as ScanMacros };
    if (!result) return empty;

    const items = result.items.filter((_, i) => picked[i]);
    if (items.length === 0) return empty;

    const all = items.length === result.items.length;
    const sum = (key: "kcal" | "protein" | "carbs" | "fat") =>
      items.reduce((n, item) => n + (item[key] ?? 0), 0);

    const kcal = all ? result.total_kcal : sum("kcal");
    const share =
      all || !result.total_kcal ? 1 : Math.min(1, Math.max(0, kcal / result.total_kcal));
    const scale = (v: number | undefined) => (v == null ? undefined : Math.round(v * share));

    return {
      items,
      kcal,
      macros: {
        protein: all ? result.total_protein : sum("protein"),
        carbs: all ? result.total_carbs : sum("carbs"),
        fat: all ? result.total_fat : sum("fat"),
        fiber: scale(result.total_fiber),
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
    setStage("consent");
  }

  const chosen = selected();

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
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="calorie" size={26} />
            </div>
            <p className="mt-4 text-center text-sm text-ash">{t("consentBody")}</p>
            <p className="mt-2 text-center text-xs text-ash-dim">{t("consentPrivacy")}</p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={allowCamera} className="btn btn-primary w-full">
                {t("allowCamera")}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn btn-ghost w-full"
              >
                {t("uploadInstead")}
              </button>
            </div>
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
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
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
              className="aspect-[4/3] w-full rounded-lg border border-line/70 object-cover"
            />

            {/* One word here is worth more than anything else on this screen.
                A photo cannot always separate a fried fillet from a slice of
                bread; the person who cooked it can. */}
            <label
              htmlFor="scan-hint"
              className="mt-4 block font-condensed text-xs uppercase tracking-widest text-ash"
            >
              {t("hintLabel")}
            </label>
            <input
              id="scan-hint"
              value={hint}
              onChange={(e) => setHint(e.target.value.slice(0, HINT_MAX))}
              maxLength={HINT_MAX}
              placeholder={t("hintPlaceholder")}
              className="mt-2 min-h-[45px] w-full rounded-md border border-line bg-void px-3 py-2 text-base text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-ash-dim">{t("hintHelp")}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={scan} className="btn btn-primary">
                {t("analyze")}
              </button>
              <button type="button" onClick={retake} className="btn btn-ghost">
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
              {t("scanning")}
            </p>
          </div>
        )}

        {/* -------- result -------- */}
        {stage === "result" && result && (
          <div>
            {result.items.length > 0 && (
              <p className="mb-2 text-xs leading-relaxed text-ash-dim">{t("itemsHint")}</p>
            )}
            <ul className="divide-y divide-line/70">
              {result.items.length === 0 && (
                <li className="py-3 text-sm text-ash">{t("nothingFound")}</li>
              )}
              {result.items.map((it, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={picked[i] ?? true}
                      onChange={() =>
                        setPicked((prev) => prev.map((v, j) => (j === i ? !v : v)))
                      }
                      className="h-4 w-4 shrink-0 accent-blood"
                    />
                    <span className={picked[i] ? "flex-1 text-bone/90" : "flex-1 text-ash-dim line-through"}>
                      {it.name}
                    </span>
                    <span className="font-condensed text-ash">{it.kcal} kcal</span>
                  </label>
                </li>
              ))}
            </ul>
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
            <p className="mt-3 text-xs leading-relaxed text-ash-dim">{t("wrongHint")}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={addAll}
                disabled={chosen.items.length === 0}
                className="btn btn-primary"
              >
                {t("addMeal")}
              </button>
              <button type="button" onClick={() => setStage("preview")} className="btn btn-ghost">
                {t("tryAgain")}
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
      </div>
    </div>
  );
}
