"use client";

import type { DemoPreset } from "@/lib/exercises";
import { Coach3D } from "./Coach3D";

/* ===========================================================================
   LessonAnimation — pre-rendered coach animation, with the live 3D as fallback.

   Lessons that have a rendered clip show an animated WebP instead of running a
   WebGL scene: identical on every device, no skinning artifacts, no GPU cost,
   and it plays in a plain <img> with no JavaScript. Anything without a clip
   still falls back to the interactive 3D coach.
   =========================================================================== */

/** preset → file in public/lessons. Add a row as each clip is rendered. */
const CLIPS: Partial<Record<DemoPreset, string>> = {
  shadowbox: "boxing",
  heavybag: "boxing",
  combo123: "boxing2",
  footwork: "idle",
  stepdrag: "idle",
};

export function lessonClipFor(preset: DemoPreset): string | undefined {
  return CLIPS[preset];
}

export function LessonAnimation({
  preset,
  className = "",
  unavailableText = "",
  alt = "",
}: {
  preset: DemoPreset;
  className?: string;
  unavailableText?: string;
  alt?: string;
}) {
  const clip = CLIPS[preset];
  if (!clip) {
    return (
      <Coach3D preset={preset} className={className} unavailableText={unavailableText} />
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
