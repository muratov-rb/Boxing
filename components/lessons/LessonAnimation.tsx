"use client";

import type { DemoPreset } from "@/lib/exercises";

/* ===========================================================================
   LessonAnimation — the coach demo.

   Pre-rendered only: no WebGL, no live 3D. Every clip was rendered once from
   the Mixamo rig, so what one person sees is what everyone sees, on every
   device, with no skinning artefacts and no GPU cost. It plays in a plain
   <img>, so there is no JavaScript in the playback path at all.

   A movement with no clip yet shows a quiet placeholder rather than an empty
   box — the lesson still carries its muscle map and written cues.
   =========================================================================== */

/** preset → file in public/lessons. Add a row as each clip is rendered.
    Only mapped where the capture genuinely shows that lesson — a stand-in
    that teaches the wrong movement defeats the point of the library. */
const CLIPS: Partial<Record<DemoPreset, string>> = {
  jab: "jabcross", // the "Jab – Cross" lesson is the one-two
  cross: "jabcross2",
  hook: "hook",
  doublejab: "jabcross2",
  combo123: "punchcombo",
  slip: "dodging",
  roll: "dodging",
  parry: "dodging",
  shadowbox: "boxing2",
  heavybag: "boxing2",
  speedbag: "speedbag",
  footwork: "warmup",
  stepdrag: "warmup",
};

export function lessonClipFor(preset: DemoPreset): string | undefined {
  return CLIPS[preset];
}

export function LessonAnimation({
  preset,
  className = "",
  soonText = "",
  alt = "",
}: {
  preset: DemoPreset;
  className?: string;
  /** shown when this movement has no rendered clip yet */
  soonText?: string;
  alt?: string;
}) {
  const clip = CLIPS[preset];
  if (!clip) {
    return (
      <div
        className={`flex items-center justify-center bg-void/30 ${className}`}
        role="img"
        aria-label={soonText || alt}
      >
        <p className="px-6 text-center text-xs text-ash-dim">{soonText}</p>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- animated WebP: next/image would re-encode and drop the animation
    <img
      src={`/lessons/${clip}.webp`}
      alt={alt}
      className={`${className} object-contain`}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
