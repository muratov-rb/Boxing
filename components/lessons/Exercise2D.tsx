"use client";

import { useEffect, useRef } from "react";
import type { DemoPreset } from "@/lib/exercises";

/* ===========================================================================
   Exercise2D — precise 2D exercise demos.
   A side-view figure drawn on canvas, animated through keyframed joint
   angles (the classic exercise-illustration style). Clearer than a 3D scene:
   one canonical viewing angle, exact joint articulation, equipment props
   (barbell, bench, bag, rope…) drawn in-plane. No assets — everything is
   procedural.

   Conventions (author-side, degrees):
   - Figure faces +x (right). Floor at y = 0. Units ≈ metres.
   - body  : whole-figure pitch from vertical. +90 = face-down horizontal
             (head right), -90 = lying on the back (head left).
   - torso : bend at the waist relative to the pelvis. + folds toward belly.
   - sh/el : shoulder flexion (+ toward belly/front) and elbow flexion.
   - hip/kn: hip flexion (+ toward belly) and knee flexion (+ heel to butt).
   - F = near-side limb (drawn dark), B = far side (drawn faded).
   =========================================================================== */

/* ------------------------------ pose model ------------------------------- */

interface Pose {
  x: number; y: number; // pelvis position
  body: number; torso: number; head: number;
  shF: number; elF: number; shB: number; elB: number;
  hipF: number; knF: number; hipB: number; knB: number;
  ankF: number; ankB: number;
}

type Frame = Partial<Pose> & { t: number };

interface Props {
  bag?: boolean;
  speedbag?: boolean;
  rope?: boolean;
  barbell?: boolean;
  dumbbells?: boolean;
  kettlebell?: boolean;
  gloves?: boolean;
  pullbar?: boolean;
  bench?: [cx: number, w: number]; // flat bench / box seat
  box?: [cx: number, h: number];
  wall?: number; // x position
}

interface PresetDef {
  dur: number; // seconds per loop
  frames: Frame[];
  props?: Props;
  /** Pin these effectors to their phase-0 position (feet stay glued to the
      floor in squats/hinges, hands stay on the pull-up bar). Fixes the
      "sliding feet" artifact of pure joint-angle animation. */
  plant?: "both" | "F" | "B" | "hands";
}

const BASE: Pose = {
  x: 0, y: 0.5, body: 0, torso: 0, head: 0,
  shF: 8, elF: 12, shB: 8, elB: 12,
  hipF: 0, knF: 0, hipB: 0, knB: 0, ankF: 0, ankB: 0,
};

/* segment lengths */
const L = {
  torso: 0.3, neck: 0.05, headR: 0.095,
  arm: 0.19, fore: 0.17,
  thigh: 0.24, shin: 0.23, foot: 0.11,
};

const rad = (d: number) => (d * Math.PI) / 180;
/* direction measured from vertical-up, positive toward +x */
const dir = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))];

const smooth = (k: number) => k * k * (3 - 2 * k);

/* guard-stance shorthand for the boxing presets */
const GUARD: Partial<Pose> = {
  shF: 55, elF: 140, shB: 55, elB: 140,
  hipF: 14, knF: 6, hipB: -12, knB: 10, y: 0.49, body: 4,
};

/* ------------------------- the animation library ------------------------- */

const PRESETS: Record<DemoPreset, PresetDef> = {
  /* ------------------------------ boxing ------------------------------- */
  jab: {
    dur: 2, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.16, ...GUARD, shF: 96, elF: 4, body: 6 },
      { t: 0.34, ...GUARD },
      { t: 0.54, ...GUARD, shB: 98, elB: 4, body: 10, torso: 6, x: 0.05 },
      { t: 0.74, ...GUARD },
      { t: 1, ...GUARD },
    ],
  },
  hook: {
    dur: 1.6, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.3, ...GUARD, shF: 40, elF: 120, torso: -4 },
      { t: 0.55, ...GUARD, shF: 100, elF: 80, torso: 8, body: 8, x: 0.04 },
      { t: 0.8, ...GUARD },
      { t: 1, ...GUARD },
    ],
  },
  uppercut: {
    dur: 1.6, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.3, ...GUARD, y: 0.43, hipF: 30, knF: 30, hipB: 0, knB: 26, torso: 12 },
      { t: 0.58, ...GUARD, y: 0.5, shF: 38, elF: 130, torso: -4 },
      { t: 0.85, ...GUARD },
      { t: 1, ...GUARD },
    ],
  },
  slip: {
    dur: 2.4, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.25, ...GUARD, torso: 26, y: 0.45, knF: 22, knB: 24, head: 6 },
      { t: 0.5, ...GUARD },
      { t: 0.75, ...GUARD, torso: -8, y: 0.47, knF: 14, knB: 16 },
      { t: 1, ...GUARD },
    ],
  },
  footwork: {
    dur: 1.4, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD, x: -0.08 },
      { t: 0.25, ...GUARD, y: 0.52, x: 0, hipF: 22, knF: 20 },
      { t: 0.5, ...GUARD, x: 0.08 },
      { t: 0.75, ...GUARD, y: 0.52, x: 0, hipB: -20, knB: 22 },
      { t: 1, ...GUARD, x: -0.08 },
    ],
  },
  shadowbox: {
    dur: 3.2, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.14, ...GUARD, shF: 96, elF: 4, body: 6 },
      { t: 0.26, ...GUARD },
      { t: 0.42, ...GUARD, shB: 98, elB: 4, body: 10, torso: 6, x: 0.05 },
      { t: 0.56, ...GUARD },
      { t: 0.7, ...GUARD, torso: 22, y: 0.45, knF: 20, knB: 20 },
      { t: 0.84, ...GUARD, shF: 100, elF: 80, torso: 8, body: 8 },
      { t: 1, ...GUARD },
    ],
  },

  /* ---------------------------- push family ---------------------------- */
  pushup: {
    dur: 2.2,
    frames: [
      { t: 0, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.5, body: 84, y: 0.19, shF: 46, elF: 98, shB: 46, elB: 98, hipF: 16, knF: 4, hipB: 16, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 1, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
    ],
  },
  kneepushup: {
    dur: 2.2,
    frames: [
      { t: 0, body: 75, y: 0.3, shF: 92, elF: 8, shB: 92, elB: 8, hipF: 38, knF: 122, hipB: 38, knB: 122, head: -8 },
      { t: 0.5, body: 78, y: 0.21, shF: 50, elF: 96, shB: 50, elB: 96, hipF: 34, knF: 122, hipB: 34, knB: 122, head: -8 },
      { t: 1, body: 75, y: 0.3, shF: 92, elF: 8, shB: 92, elB: 8, hipF: 38, knF: 122, hipB: 38, knB: 122, head: -8 },
    ],
  },
  wallpushup: {
    dur: 2.2, props: { wall: 0.62 },
    frames: [
      { t: 0, body: 16, y: 0.49, shF: 78, elF: 12, shB: 78, elB: 12, hipF: -6, hipB: -6 },
      { t: 0.5, body: 25, y: 0.48, x: 0.05, shF: 62, elF: 62, shB: 62, elB: 62, hipF: -9, hipB: -9 },
      { t: 1, body: 16, y: 0.49, shF: 78, elF: 12, shB: 78, elB: 12, hipF: -6, hipB: -6 },
    ],
  },
  inclinepushup: {
    dur: 2.2, props: { box: [0.48, 0.38] },
    frames: [
      { t: 0, body: 55, y: 0.38, shF: 107, elF: 55, shB: 107, elB: 55, hipF: 13, knF: 3, hipB: 13, knB: 3, ankF: -40, ankB: -40, head: -8 },
      { t: 0.5, body: 60, y: 0.33, shF: 82, elF: 95, shB: 82, elB: 95, hipF: 11, knF: 3, hipB: 11, knB: 3, ankF: -40, ankB: -40, head: -8 },
      { t: 1, body: 55, y: 0.38, shF: 107, elF: 55, shB: 107, elB: 55, hipF: 13, knF: 3, hipB: 13, knB: 3, ankF: -40, ankB: -40, head: -8 },
    ],
  },
  declinepushup: {
    dur: 2.2, props: { box: [-0.62, 0.38] },
    frames: [
      { t: 0, body: 92, y: 0.34, shF: 88, elF: 8, shB: 88, elB: 8, hipF: -12, knF: 4, hipB: -12, knB: 4, head: -10 },
      { t: 0.5, body: 94, y: 0.26, shF: 48, elF: 96, shB: 48, elB: 96, hipF: -14, knF: 4, hipB: -14, knB: 4, head: -10 },
      { t: 1, body: 92, y: 0.34, shF: 88, elF: 8, shB: 88, elB: 8, hipF: -12, knF: 4, hipB: -12, knB: 4, head: -10 },
    ],
  },
  archerpushup: {
    dur: 4.4,
    frames: [
      { t: 0, body: 80, y: 0.3, shF: 88, elF: 6, shB: 96, elB: 4, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.25, body: 82, y: 0.21, x: 0.07, shF: 50, elF: 100, shB: 112, elB: 4, hipF: 18, knF: 4, hipB: 18, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.5, body: 80, y: 0.3, shF: 88, elF: 6, shB: 96, elB: 4, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.75, body: 82, y: 0.21, x: -0.07, shF: 112, elF: 4, shB: 50, elB: 100, hipF: 18, knF: 4, hipB: 18, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 1, body: 80, y: 0.3, shF: 88, elF: 6, shB: 96, elB: 4, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
    ],
  },
  pikepushup: {
    dur: 2.4,
    frames: [
      { t: 0, body: 126, y: 0.42, shF: 145, elF: 35, shB: 145, elB: 35, hipF: 94, knF: 4, hipB: 94, knB: 4, ankF: -20, ankB: -20, head: 0 },
      { t: 0.5, body: 128, y: 0.38, shF: 122, elF: 80, shB: 122, elB: 80, hipF: 94, knF: 4, hipB: 94, knB: 4, ankF: -20, ankB: -20, head: 0 },
      { t: 1, body: 126, y: 0.42, shF: 145, elF: 35, shB: 145, elB: 35, hipF: 94, knF: 4, hipB: 94, knB: 4, ankF: -20, ankB: -20, head: 0 },
    ],
  },
  handstand: {
    dur: 2.6, props: { wall: -0.34 },
    frames: [
      { t: 0, body: 176, y: 0.66, shF: 176, elF: 4, shB: 176, elB: 4, hipF: -4, hipB: -2, head: 18 },
      { t: 0.5, body: 178, y: 0.66, shF: 178, elF: 4, shB: 178, elB: 4, hipF: -7, hipB: -4, head: 18 },
      { t: 1, body: 176, y: 0.66, shF: 176, elF: 4, shB: 176, elB: 4, hipF: -4, hipB: -2, head: 18 },
    ],
  },
  shouldertap: {
    dur: 1.8,
    frames: [
      { t: 0, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.25, body: 80, y: 0.3, shF: 128, elF: 118, shB: 90, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.5, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.75, body: 80, y: 0.3, shF: 90, elF: 6, shB: 128, elB: 118, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 1, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
    ],
  },
  plankup: {
    dur: 2.6,
    frames: [
      { t: 0, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.45, body: 84, y: 0.21, shF: 78, elF: 95, shB: 78, elB: 95, hipF: 15, knF: 3, hipB: 15, knB: 3, ankF: -48, ankB: -48, head: -6 },
      { t: 0.55, body: 84, y: 0.21, shF: 78, elF: 95, shB: 78, elB: 95, hipF: 15, knF: 3, hipB: 15, knB: 3, ankF: -48, ankB: -48, head: -6 },
      { t: 1, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
    ],
  },
  dip: {
    dur: 2, props: { box: [-0.34, 0.38] },
    frames: [
      { t: 0, body: 4, y: 0.36, shF: -32, elF: 18, shB: -32, elB: 18, hipF: 68, knF: 22, hipB: 68, knB: 22, ankF: -18, ankB: -18 },
      { t: 0.5, body: 8, y: 0.27, shF: -38, elF: 74, shB: -38, elB: 74, hipF: 74, knF: 26, hipB: 74, knB: 26, ankF: -18, ankB: -18 },
      { t: 1, body: 4, y: 0.36, shF: -32, elF: 18, shB: -32, elB: 18, hipF: 68, knF: 22, hipB: 68, knB: 22, ankF: -18, ankB: -18 },
    ],
  },

  /* ------------------------------- core -------------------------------- */
  plank: {
    dur: 2.4,
    frames: [
      { t: 0, body: 84, y: 0.21, shF: 78, elF: 95, shB: 78, elB: 95, hipF: 15, knF: 3, hipB: 15, knB: 3, ankF: -48, ankB: -48, head: -6 },
      { t: 0.5, body: 84, y: 0.22, shF: 78, elF: 95, shB: 78, elB: 95, hipF: 15, knF: 3, hipB: 15, knB: 3, ankF: -48, ankB: -48, head: -6 },
      { t: 1, body: 84, y: 0.21, shF: 78, elF: 95, shB: 78, elB: 95, hipF: 15, knF: 3, hipB: 15, knB: 3, ankF: -48, ankB: -48, head: -6 },
    ],
  },
  sideplank: {
    dur: 2.4,
    frames: [
      { t: 0, body: 78, y: 0.24, shF: 76, elF: 95, shB: 258, elB: 6, hipF: 8, knF: 2, hipB: 8, knB: 2, ankF: -20, ankB: -20, head: -6 },
      { t: 0.5, body: 78, y: 0.2, shF: 76, elF: 95, shB: 258, elB: 6, hipF: 8, knF: 2, hipB: 8, knB: 2, ankF: -20, ankB: -20, head: -6 },
      { t: 1, body: 78, y: 0.24, shF: 76, elF: 95, shB: 258, elB: 6, hipF: 8, knF: 2, hipB: 8, knB: 2, ankF: -20, ankB: -20, head: -6 },
    ],
  },
  plankjack: {
    dur: 0.9,
    frames: [
      { t: 0, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 20, knF: 4, hipB: 20, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.5, body: 80, y: 0.32, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 32, knF: 4, hipB: 8, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 1, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 20, knF: 4, hipB: 20, knB: 4, ankF: -45, ankB: -45, head: -6 },
    ],
  },
  climber: {
    dur: 0.9,
    frames: [
      { t: 0, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 85, knF: 105, hipB: 18, knB: 4, ankB: -45, head: -6 },
      { t: 0.5, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 18, knF: 4, hipB: 85, knB: 105, ankF: -45, head: -6 },
      { t: 1, body: 80, y: 0.3, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 85, knF: 105, hipB: 18, knB: 4, ankB: -45, head: -6 },
    ],
  },
  situp: {
    dur: 2.4,
    frames: [
      { t: 0, body: -85, y: 0.13, torso: 0, shF: 142, elF: 138, shB: 142, elB: 138, hipF: 55, knF: 125, hipB: 55, knB: 125, head: 6 },
      { t: 0.45, body: -85, y: 0.13, torso: 80, shF: 142, elF: 138, shB: 142, elB: 138, hipF: 55, knF: 125, hipB: 55, knB: 125, head: 14 },
      { t: 1, body: -85, y: 0.13, torso: 0, shF: 142, elF: 138, shB: 142, elB: 138, hipF: 55, knF: 125, hipB: 55, knB: 125, head: 6 },
    ],
  },
  bicycle: {
    dur: 1.6,
    frames: [
      { t: 0, body: -82, y: 0.16, torso: 28, shF: 142, elF: 140, shB: 142, elB: 140, hipF: 102, knF: 112, hipB: 55, knB: 8, head: 12 },
      { t: 0.5, body: -82, y: 0.16, torso: 28, shF: 142, elF: 140, shB: 142, elB: 140, hipF: 55, knF: 8, hipB: 102, knB: 112, head: 12 },
      { t: 1, body: -82, y: 0.16, torso: 28, shF: 142, elF: 140, shB: 142, elB: 140, hipF: 102, knF: 112, hipB: 55, knB: 8, head: 12 },
    ],
  },
  legraise: {
    dur: 2.6,
    frames: [
      { t: 0, body: -85, y: 0.13, shF: 14, elF: 4, shB: 14, elB: 4, hipF: 6, knF: 0, hipB: 6, knB: 0 },
      { t: 0.5, body: -85, y: 0.13, shF: 14, elF: 4, shB: 14, elB: 4, hipF: 88, knF: 0, hipB: 88, knB: 0 },
      { t: 1, body: -85, y: 0.13, shF: 14, elF: 4, shB: 14, elB: 4, hipF: 6, knF: 0, hipB: 6, knB: 0 },
    ],
  },
  flutter: {
    dur: 0.8,
    frames: [
      { t: 0, body: -85, y: 0.13, torso: 12, shF: 14, elF: 4, shB: 14, elB: 4, hipF: 34, knF: 0, hipB: 18, knB: 0 },
      { t: 0.5, body: -85, y: 0.13, torso: 12, shF: 14, elF: 4, shB: 14, elB: 4, hipF: 18, knF: 0, hipB: 34, knB: 0 },
      { t: 1, body: -85, y: 0.13, torso: 12, shF: 14, elF: 4, shB: 14, elB: 4, hipF: 34, knF: 0, hipB: 18, knB: 0 },
    ],
  },
  vup: {
    dur: 2.6,
    frames: [
      { t: 0, body: -85, y: 0.13, torso: 2, shF: 172, elF: 4, shB: 172, elB: 4, hipF: 6, knF: 0, hipB: 6, knB: 0 },
      { t: 0.5, body: -85, y: 0.15, torso: 68, shF: 96, elF: 4, shB: 96, elB: 4, hipF: 86, knF: 2, hipB: 86, knB: 2, head: 12 },
      { t: 1, body: -85, y: 0.13, torso: 2, shF: 172, elF: 4, shB: 172, elB: 4, hipF: 6, knF: 0, hipB: 6, knB: 0 },
    ],
  },
  hollow: {
    dur: 2.4,
    frames: [
      { t: 0, body: -85, y: 0.14, torso: 20, shF: 166, elF: 4, shB: 166, elB: 4, hipF: 24, knF: 0, hipB: 24, knB: 0, head: 10 },
      { t: 0.5, body: -85, y: 0.14, torso: 25, shF: 168, elF: 4, shB: 168, elB: 4, hipF: 28, knF: 0, hipB: 28, knB: 0, head: 10 },
      { t: 1, body: -85, y: 0.14, torso: 20, shF: 166, elF: 4, shB: 166, elB: 4, hipF: 24, knF: 0, hipB: 24, knB: 0, head: 10 },
    ],
  },
  deadbug: {
    dur: 3.2,
    frames: [
      { t: 0, body: -85, y: 0.14, shF: 96, elF: 4, shB: 96, elB: 4, hipF: 86, knF: 96, hipB: 86, knB: 96 },
      { t: 0.25, body: -85, y: 0.14, shF: 168, elF: 4, shB: 96, elB: 4, hipF: 86, knF: 96, hipB: 22, knB: 8 },
      { t: 0.5, body: -85, y: 0.14, shF: 96, elF: 4, shB: 96, elB: 4, hipF: 86, knF: 96, hipB: 86, knB: 96 },
      { t: 0.75, body: -85, y: 0.14, shF: 96, elF: 4, shB: 168, elB: 4, hipF: 22, knF: 8, hipB: 86, knB: 96 },
      { t: 1, body: -85, y: 0.14, shF: 96, elF: 4, shB: 96, elB: 4, hipF: 86, knF: 96, hipB: 86, knB: 96 },
    ],
  },
  twist: {
    dur: 1.8,
    frames: [
      { t: 0, body: -55, y: 0.19, torso: 12, shF: 92, elF: 30, shB: 92, elB: 30, hipF: 78, knF: 62, hipB: 78, knB: 62, head: 8 },
      { t: 0.5, body: -55, y: 0.19, torso: 26, shF: 112, elF: 30, shB: 76, elB: 30, hipF: 78, knF: 62, hipB: 78, knB: 62, head: 8 },
      { t: 1, body: -55, y: 0.19, torso: 12, shF: 92, elF: 30, shB: 92, elB: 30, hipF: 78, knF: 62, hipB: 78, knB: 62, head: 8 },
    ],
  },

  /* -------------------------------- back ------------------------------- */
  superman: {
    dur: 2.4,
    frames: [
      { t: 0, body: 90, y: 0.1, torso: -2, shF: 162, elF: 4, shB: 162, elB: 4, hipF: -4, hipB: -4, head: -8 },
      { t: 0.5, body: 90, y: 0.11, torso: -20, shF: 182, elF: 4, shB: 182, elB: 4, hipF: -26, hipB: -26, head: -16 },
      { t: 1, body: 90, y: 0.1, torso: -2, shF: 162, elF: 4, shB: 162, elB: 4, hipF: -4, hipB: -4, head: -8 },
    ],
  },
  swimmer: {
    dur: 1.6,
    frames: [
      { t: 0, body: 90, y: 0.11, torso: -12, shF: 185, elF: 4, shB: 155, elB: 4, hipF: -6, hipB: -24, head: -12 },
      { t: 0.5, body: 90, y: 0.11, torso: -12, shF: 155, elF: 4, shB: 185, elB: 4, hipF: -24, hipB: -6, head: -12 },
      { t: 1, body: 90, y: 0.11, torso: -12, shF: 185, elF: 4, shB: 155, elB: 4, hipF: -6, hipB: -24, head: -12 },
    ],
  },
  snowangel: {
    dur: 3,
    frames: [
      { t: 0, body: 90, y: 0.11, torso: -12, shF: 148, elF: 6, shB: 148, elB: 6, hipF: -6, hipB: -6, head: -12 },
      { t: 0.5, body: 90, y: 0.11, torso: -14, shF: 186, elF: 4, shB: 186, elB: 4, hipF: -6, hipB: -6, head: -12 },
      { t: 1, body: 90, y: 0.11, torso: -12, shF: 148, elF: 6, shB: 148, elB: 6, hipF: -6, hipB: -6, head: -12 },
    ],
  },
  birddog: {
    dur: 3.6,
    frames: [
      { t: 0, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
      { t: 0.22, body: 0, torso: 88, y: 0.42, shF: 176, elF: 4, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: -86, knB: 4, head: -16 },
      { t: 0.44, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
      { t: 0.72, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 176, elB: 4, hipF: -86, knF: 4, hipB: 4, knB: 94, head: -16 },
      { t: 1, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
    ],
  },
  goodmorning: {
    dur: 2.6, plant: "both",
    frames: [
      { t: 0, y: 0.5, torso: 4, shF: 148, elF: 138, shB: 148, elB: 138, knF: 6, knB: 6 },
      { t: 0.5, y: 0.46, torso: 82, shF: 148, elF: 138, shB: 148, elB: 138, knF: 16, knB: 16, hipF: 8, hipB: 8, head: -18 },
      { t: 1, y: 0.5, torso: 4, shF: 148, elF: 138, shB: 148, elB: 138, knF: 6, knB: 6 },
    ],
  },

  /* -------------------------------- legs ------------------------------- */
  squat: {
    dur: 2.4, plant: "both",
    frames: [
      { t: 0, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
      { t: 0.5, y: 0.3, torso: 34, hipF: 104, knF: 116, hipB: 104, knB: 116, shF: 88, elF: 8, shB: 88, elB: 8, head: -8 },
      { t: 1, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
    ],
  },
  sumosquat: {
    dur: 2.4, plant: "both",
    frames: [
      { t: 0, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
      { t: 0.5, y: 0.33, torso: 18, hipF: 94, knF: 104, hipB: 94, knB: 104, shF: 78, elF: 8, shB: 78, elB: 8 },
      { t: 1, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
    ],
  },
  squatjump: {
    dur: 1.6,
    frames: [
      { t: 0, y: 0.5 },
      { t: 0.3, y: 0.31, torso: 32, hipF: 100, knF: 112, hipB: 100, knB: 112, shF: -28, elF: 10, shB: -28, elB: 10 },
      { t: 0.52, y: 0.74, torso: -4, hipF: 4, knF: 6, hipB: 4, knB: 6, shF: 172, elF: 4, shB: 172, elB: 4, ankF: -24, ankB: -24 },
      { t: 0.7, y: 0.42, torso: 18, hipF: 58, knF: 66, hipB: 58, knB: 66, shF: 20, elF: 10, shB: 20, elB: 10 },
      { t: 1, y: 0.5 },
    ],
  },
  pistol: {
    dur: 3.2, plant: "B",
    frames: [
      { t: 0, y: 0.5, shF: 60, elF: 8, shB: 60, elB: 8, hipF: 30, knF: 2 },
      { t: 0.5, y: 0.26, torso: 42, hipF: 92, knF: 4, hipB: 118, knB: 136, shF: 92, elF: 6, shB: 92, elB: 6, head: -8 },
      { t: 1, y: 0.5, shF: 60, elF: 8, shB: 60, elB: 8, hipF: 30, knF: 2 },
    ],
  },
  lunge: {
    dur: 2.6, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD, y: 0.5, hipF: 0, knF: 0, hipB: 0, knB: 0, body: 0 },
      { t: 0.5, ...GUARD, y: 0.33, body: 2, hipF: 58, knF: 88, hipB: -38, knB: 66, ankB: 22 },
      { t: 1, ...GUARD, y: 0.5, hipF: 0, knF: 0, hipB: 0, knB: 0, body: 0 },
    ],
  },
  reverselunge: {
    dur: 2.6,
    frames: [
      { t: 0, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
      { t: 0.5, y: 0.34, x: -0.06, hipF: 56, knF: 86, hipB: -40, knB: 70, ankB: 24, torso: 10, shF: 46, elF: 10, shB: 46, elB: 10 },
      { t: 1, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
    ],
  },
  sidelunge: {
    dur: 2.4,
    frames: [
      { t: 0, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
      { t: 0.25, y: 0.36, x: 0.12, torso: 24, hipF: 78, knF: 98, hipB: -14, knB: 4, shF: 62, elF: 8, shB: 62, elB: 8 },
      { t: 0.5, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
      { t: 0.75, y: 0.36, x: -0.12, torso: 24, hipF: -14, knF: 4, hipB: 78, knB: 98, shF: 62, elF: 8, shB: 62, elB: 8 },
      { t: 1, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
    ],
  },
  jumplunge: {
    dur: 1.4, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD, y: 0.34, body: 2, hipF: 58, knF: 88, hipB: -38, knB: 66, ankB: 22 },
      { t: 0.25, ...GUARD, y: 0.62, body: 0, hipF: 12, knF: 20, hipB: -10, knB: 24 },
      { t: 0.5, ...GUARD, y: 0.34, body: 2, hipF: -38, knF: 66, hipB: 58, knB: 88, ankF: 22 },
      { t: 0.75, ...GUARD, y: 0.62, body: 0, hipF: -10, knF: 24, hipB: 12, knB: 20 },
      { t: 1, ...GUARD, y: 0.34, body: 2, hipF: 58, knF: 88, hipB: -38, knB: 66, ankB: 22 },
    ],
  },
  bulgarian: {
    dur: 2.4, plant: "F", props: { box: [-0.5, 0.38] },
    frames: [
      { t: 0, y: 0.46, hipF: 12, knF: 8, hipB: -38, knB: 92, shF: 40, elF: 110, shB: 40, elB: 110 },
      { t: 0.5, y: 0.32, torso: 16, hipF: 74, knF: 96, hipB: -42, knB: 102, shF: 52, elF: 104, shB: 52, elB: 104 },
      { t: 1, y: 0.46, hipF: 12, knF: 8, hipB: -38, knB: 92, shF: 40, elF: 110, shB: 40, elB: 110 },
    ],
  },
  stepup: {
    dur: 2.8, props: { box: [0.42, 0.38] },
    frames: [
      { t: 0, y: 0.5, x: -0.18, hipF: 74, knF: 92, hipB: 0, knB: 0, shF: 34, elF: 60, shB: 12, elB: 12 },
      { t: 0.42, y: 0.86, x: 0.32, hipF: 6, knF: 4, hipB: 22, knB: 44, shF: 22, elF: 30, shB: 30, elB: 30 },
      { t: 0.58, y: 0.86, x: 0.32, hipF: 6, knF: 4, hipB: 22, knB: 44, shF: 22, elF: 30, shB: 30, elB: 30 },
      { t: 1, y: 0.5, x: -0.18, hipF: 74, knF: 92, hipB: 0, knB: 0, shF: 34, elF: 60, shB: 12, elB: 12 },
    ],
  },
  wallsit: {
    dur: 2.6, plant: "both", props: { wall: -0.3 },
    frames: [
      { t: 0, y: 0.33, body: -2, hipF: 90, knF: 92, hipB: 90, knB: 92, shF: 16, elF: 8, shB: 16, elB: 8 },
      { t: 0.5, y: 0.335, body: -2, hipF: 90, knF: 92, hipB: 90, knB: 92, shF: 16, elF: 8, shB: 16, elB: 8 },
      { t: 1, y: 0.33, body: -2, hipF: 90, knF: 92, hipB: 90, knB: 92, shF: 16, elF: 8, shB: 16, elB: 8 },
    ],
  },
  calfraise: {
    dur: 1.8,
    frames: [
      { t: 0, y: 0.5 },
      { t: 0.5, y: 0.55, ankF: -26, ankB: -26 },
      { t: 1, y: 0.5 },
    ],
  },
  bridge: {
    dur: 2.2,
    frames: [
      { t: 0, body: -85, y: 0.12, torso: 4, shF: 16, elF: 4, shB: 16, elB: 4, hipF: 62, knF: 98, hipB: 62, knB: 98 },
      { t: 0.5, body: -85, y: 0.24, torso: -22, shF: 16, elF: 4, shB: 16, elB: 4, hipF: 34, knF: 96, hipB: 34, knB: 96 },
      { t: 1, body: -85, y: 0.12, torso: 4, shF: 16, elF: 4, shB: 16, elB: 4, hipF: 62, knF: 98, hipB: 62, knB: 98 },
    ],
  },
  singlebridge: {
    dur: 2.2,
    frames: [
      { t: 0, body: -85, y: 0.12, torso: 4, shF: 16, elF: 4, shB: 16, elB: 4, hipF: 60, knF: 4, hipB: 62, knB: 98 },
      { t: 0.5, body: -85, y: 0.24, torso: -22, shF: 16, elF: 4, shB: 16, elB: 4, hipF: 44, knF: 4, hipB: 34, knB: 96 },
      { t: 1, body: -85, y: 0.12, torso: 4, shF: 16, elF: 4, shB: 16, elB: 4, hipF: 60, knF: 4, hipB: 62, knB: 98 },
    ],
  },
  donkeykick: {
    dur: 1.8,
    frames: [
      { t: 0, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
      { t: 0.5, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: -64, knB: 98, head: -16 },
      { t: 1, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
    ],
  },
  firehydrant: {
    dur: 1.8,
    frames: [
      { t: 0, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
      { t: 0.5, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: -34, knB: 104, head: -16 },
      { t: 1, body: 0, torso: 88, y: 0.42, shF: 88, elF: 6, shB: 88, elB: 6, hipF: 4, knF: 94, hipB: 4, knB: 94, head: -16 },
    ],
  },
  singledeadlift: {
    dur: 2.8, plant: "F",
    frames: [
      { t: 0, y: 0.5, shF: 20, elF: 6, shB: 20, elB: 6 },
      { t: 0.5, y: 0.47, torso: 78, hipF: 6, knF: 12, hipB: -82, knB: 6, shF: 78, elF: 4, shB: 78, elB: 4, head: -16 },
      { t: 1, y: 0.5, shF: 20, elF: 6, shB: 20, elB: 6 },
    ],
  },

  /* ---------------------------- conditioning ---------------------------- */
  jack: {
    dur: 0.9,
    frames: [
      { t: 0, y: 0.5, shF: 6, elF: 8, shB: 6, elB: 8 },
      { t: 0.5, y: 0.53, shF: 172, elF: 6, shB: 172, elB: 6, hipF: 20, hipB: -20 },
      { t: 1, y: 0.5, shF: 6, elF: 8, shB: 6, elB: 8 },
    ],
  },
  highknees: {
    dur: 0.75,
    frames: [
      { t: 0, y: 0.52, torso: 4, hipF: 96, knF: 112, hipB: -12, knB: 10, shF: -22, elF: 92, shB: 44, elB: 92 },
      { t: 0.5, y: 0.52, torso: 4, hipF: -12, knF: 10, hipB: 96, knB: 112, shF: 44, elF: 92, shB: -22, elB: 92 },
      { t: 1, y: 0.52, torso: 4, hipF: 96, knF: 112, hipB: -12, knB: 10, shF: -22, elF: 92, shB: 44, elB: 92 },
    ],
  },
  buttkick: {
    dur: 0.75,
    frames: [
      { t: 0, y: 0.51, torso: 2, hipF: -8, knF: 132, hipB: 12, knB: 12, shF: -18, elF: 80, shB: 36, elB: 80 },
      { t: 0.5, y: 0.51, torso: 2, hipF: 12, knF: 12, hipB: -8, knB: 132, shF: 36, elF: 80, shB: -18, elB: 80 },
      { t: 1, y: 0.51, torso: 2, hipF: -8, knF: 132, hipB: 12, knB: 12, shF: -18, elF: 80, shB: 36, elB: 80 },
    ],
  },
  fastfeet: {
    dur: 0.5, props: { gloves: true },
    frames: [
      { t: 0, y: 0.42, torso: 16, hipF: 56, knF: 62, hipB: 40, knB: 56, shF: 55, elF: 130, shB: 55, elB: 130 },
      { t: 0.5, y: 0.42, torso: 16, hipF: 40, knF: 56, hipB: 56, knB: 62, shF: 55, elF: 130, shB: 55, elB: 130 },
      { t: 1, y: 0.42, torso: 16, hipF: 56, knF: 62, hipB: 40, knB: 56, shF: 55, elF: 130, shB: 55, elB: 130 },
    ],
  },
  burpee: {
    dur: 3,
    frames: [
      { t: 0, y: 0.5 },
      { t: 0.18, y: 0.26, torso: 55, hipF: 118, knF: 132, hipB: 118, knB: 132, shF: 118, elF: 10, shB: 118, elB: 10, head: -10 },
      { t: 0.38, body: 80, y: 0.3, torso: 0, shF: 88, elF: 8, shB: 88, elB: 8, hipF: 20, knF: 4, hipB: 20, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.58, y: 0.26, body: 0, torso: 55, hipF: 118, knF: 132, hipB: 118, knB: 132, shF: 118, elF: 10, shB: 118, elB: 10, head: -10 },
      { t: 0.74, y: 0.76, torso: -6, hipF: 4, knF: 6, hipB: 4, knB: 6, shF: 174, elF: 4, shB: 174, elB: 4, ankF: -22, ankB: -22 },
      { t: 0.88, y: 0.44, torso: 14, hipF: 48, knF: 58, hipB: 48, knB: 58, shF: 16, elF: 10, shB: 16, elB: 10 },
      { t: 1, y: 0.5 },
    ],
  },
  sprawl: {
    dur: 2.2, props: { gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.3, body: 80, y: 0.3, torso: -6, shF: 88, elF: 10, shB: 88, elB: 10, hipF: 18, knF: 6, hipB: 18, knB: 6, ankF: -45, ankB: -45, head: -8 },
      { t: 0.5, body: 80, y: 0.3, torso: -8, shF: 88, elF: 10, shB: 88, elB: 10, hipF: 18, knF: 6, hipB: 18, knB: 6, ankF: -45, ankB: -45, head: -8 },
      { t: 0.78, ...GUARD, y: 0.46, knF: 22, knB: 22 },
      { t: 1, ...GUARD },
    ],
  },
  skater: {
    dur: 1.6,
    frames: [
      { t: 0, y: 0.4, x: 0.22, torso: 24, hipF: 62, knF: 74, hipB: -34, knB: 68, shF: -24, elF: 40, shB: 62, elB: 40 },
      { t: 0.25, y: 0.58, x: 0, torso: 8, hipF: 22, knF: 30, hipB: 8, knB: 40, shF: 30, elF: 40, shB: 20, elB: 40 },
      { t: 0.5, y: 0.4, x: -0.22, torso: 24, hipF: -34, knF: 68, hipB: 62, knB: 74, shF: 62, elF: 40, shB: -24, elB: 40 },
      { t: 0.75, y: 0.58, x: 0, torso: 8, hipF: 8, knF: 40, hipB: 22, knB: 30, shF: 20, elF: 40, shB: 30, elB: 40 },
      { t: 1, y: 0.4, x: 0.22, torso: 24, hipF: 62, knF: 74, hipB: -34, knB: 68, shF: -24, elF: 40, shB: 62, elB: 40 },
    ],
  },
  tuckjump: {
    dur: 1.5,
    frames: [
      { t: 0, y: 0.5 },
      { t: 0.28, y: 0.33, torso: 28, hipF: 92, knF: 104, hipB: 92, knB: 104, shF: -26, elF: 10, shB: -26, elB: 10 },
      { t: 0.52, y: 0.78, torso: 10, hipF: 112, knF: 122, hipB: 112, knB: 122, shF: 94, elF: 30, shB: 94, elB: 30 },
      { t: 0.72, y: 0.42, torso: 16, hipF: 52, knF: 62, hipB: 52, knB: 62, shF: 14, elF: 10, shB: 14, elB: 10 },
      { t: 1, y: 0.5 },
    ],
  },
  bearcrawl: {
    dur: 1.2,
    frames: [
      { t: 0, body: 0, torso: 84, y: 0.4, x: -0.04, shF: 68, elF: 8, shB: 104, elB: 8, hipF: 38, knF: 74, hipB: 16, knB: 68, head: -16, ankF: -20, ankB: -20 },
      { t: 0.5, body: 0, torso: 84, y: 0.4, x: 0.04, shF: 104, elF: 8, shB: 68, elB: 8, hipF: 16, knF: 68, hipB: 38, knB: 74, head: -16, ankF: -20, ankB: -20 },
      { t: 1, body: 0, torso: 84, y: 0.4, x: -0.04, shF: 68, elF: 8, shB: 104, elB: 8, hipF: 38, knF: 74, hipB: 16, knB: 68, head: -16, ankF: -20, ankB: -20 },
    ],
  },
  inchworm: {
    dur: 4.4,
    frames: [
      { t: 0, y: 0.5 },
      { t: 0.16, y: 0.47, torso: 94, shF: 120, elF: 8, shB: 120, elB: 8, knF: 14, knB: 14, head: -14 },
      { t: 0.42, body: 80, y: 0.3, torso: 0, shF: 88, elF: 8, shB: 88, elB: 8, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.58, body: 80, y: 0.3, torso: 0, shF: 88, elF: 8, shB: 88, elB: 8, hipF: 22, knF: 4, hipB: 22, knB: 4, ankF: -45, ankB: -45, head: -6 },
      { t: 0.84, body: 0, y: 0.47, torso: 94, shF: 120, elF: 8, shB: 120, elB: 8, knF: 14, knB: 14, head: -14 },
      { t: 1, y: 0.5 },
    ],
  },
  armcircle: {
    dur: 2.4,
    frames: [
      { t: 0, y: 0.5, shF: 95, elF: 4, shB: 95, elB: 4 },
      { t: 0.25, y: 0.5, shF: 185, elF: 4, shB: 185, elB: 4 },
      { t: 0.5, y: 0.5, shF: 275, elF: 4, shB: 275, elB: 4 },
      { t: 0.75, y: 0.5, shF: 365, elF: 4, shB: 365, elB: 4 },
      { t: 1, y: 0.5, shF: 455, elF: 4, shB: 455, elB: 4 },
    ],
  },

  /* --------------------------------- gym -------------------------------- */
  benchpress: {
    dur: 2.2, props: { bench: [0, 1.1], barbell: true },
    frames: [
      { t: 0, body: -88, y: 0.45, shF: 95, elF: 6, shB: 95, elB: 6, hipF: -35, knF: 62, hipB: -35, knB: 62 },
      { t: 0.5, body: -88, y: 0.45, shF: 62, elF: 88, shB: 62, elB: 88, hipF: -35, knF: 62, hipB: -35, knB: 62 },
      { t: 1, body: -88, y: 0.45, shF: 95, elF: 6, shB: 95, elB: 6, hipF: -35, knF: 62, hipB: -35, knB: 62 },
    ],
  },
  barbellsquat: {
    dur: 2.6, plant: "both", props: { barbell: true },
    frames: [
      { t: 0, y: 0.5, shF: 24, elF: 152, shB: 24, elB: 152 },
      { t: 0.5, y: 0.31, torso: 30, hipF: 100, knF: 112, hipB: 100, knB: 112, shF: 40, elF: 150, shB: 40, elB: 150, head: -6 },
      { t: 1, y: 0.5, shF: 24, elF: 152, shB: 24, elB: 152 },
    ],
  },
  deadlift: {
    dur: 2.6, plant: "both", props: { barbell: true },
    frames: [
      { t: 0, y: 0.38, torso: 66, knF: 52, knB: 52, hipF: 12, hipB: 12, shF: 70, elF: 4, shB: 70, elB: 4, head: -14 },
      { t: 0.5, y: 0.5, torso: 2, knF: 4, knB: 4, shF: 10, elF: 4, shB: 10, elB: 4 },
      { t: 1, y: 0.38, torso: 66, knF: 52, knB: 52, hipF: 12, hipB: 12, shF: 70, elF: 4, shB: 70, elB: 4, head: -14 },
    ],
  },
  overheadpress: {
    dur: 2.2, plant: "both", props: { barbell: true },
    frames: [
      { t: 0, y: 0.5, shF: 34, elF: 138, shB: 34, elB: 138 },
      { t: 0.5, y: 0.51, shF: 176, elF: 4, shB: 176, elB: 4 },
      { t: 1, y: 0.5, shF: 34, elF: 138, shB: 34, elB: 138 },
    ],
  },
  barbellrow: {
    dur: 1.8, plant: "both", props: { barbell: true },
    frames: [
      { t: 0, y: 0.44, torso: 56, knF: 26, knB: 26, shF: 62, elF: 6, shB: 62, elB: 6, head: -12 },
      { t: 0.5, y: 0.44, torso: 56, knF: 26, knB: 26, shF: 34, elF: 96, shB: 34, elB: 96, head: -12 },
      { t: 1, y: 0.44, torso: 56, knF: 26, knB: 26, shF: 62, elF: 6, shB: 62, elB: 6, head: -12 },
    ],
  },
  pullup: {
    dur: 2.6, plant: "hands", props: { pullbar: true },
    frames: [
      { t: 0, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 10, knF: 28, hipB: 10, knB: 28 },
      { t: 0.5, y: 0.88, shF: 150, elF: 120, shB: 150, elB: 120, hipF: 12, knF: 32, hipB: 12, knB: 32 },
      { t: 1, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 10, knF: 28, hipB: 10, knB: 28 },
    ],
  },
  kneeraise: {
    dur: 2.2, plant: "hands", props: { pullbar: true },
    frames: [
      { t: 0, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 6, knF: 8, hipB: 6, knB: 8 },
      { t: 0.5, y: 0.62, shF: 176, elF: 6, shB: 176, elB: 6, hipF: 96, knF: 104, hipB: 96, knB: 104 },
      { t: 1, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 6, knF: 8, hipB: 6, knB: 8 },
    ],
  },
  dbpress: {
    dur: 2.2, plant: "both", props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, shF: 40, elF: 128, shB: 40, elB: 128 },
      { t: 0.5, y: 0.51, shF: 174, elF: 6, shB: 174, elB: 6 },
      { t: 1, y: 0.5, shF: 40, elF: 128, shB: 40, elB: 128 },
    ],
  },
  curl: {
    dur: 2, plant: "both", props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, shF: 8, elF: 8, shB: 8, elB: 8 },
      { t: 0.5, y: 0.5, shF: 12, elF: 136, shB: 12, elB: 136 },
      { t: 1, y: 0.5, shF: 8, elF: 8, shB: 8, elB: 8 },
    ],
  },
  latraise: {
    dur: 2, plant: "both", props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, shF: 12, elF: 14, shB: 12, elB: 14 },
      { t: 0.5, y: 0.5, shF: 92, elF: 10, shB: 92, elB: 10 },
      { t: 1, y: 0.5, shF: 12, elF: 14, shB: 12, elB: 14 },
    ],
  },
  dbrow: {
    dur: 1.8, plant: "both", props: { bench: [0.32, 0.55], dumbbells: true },
    frames: [
      { t: 0, y: 0.46, torso: 62, knF: 20, knB: 34, hipF: 10, hipB: 30, shF: 96, elF: 8, shB: 64, elB: 6, head: -12 },
      { t: 0.5, y: 0.46, torso: 62, knF: 20, knB: 34, hipF: 10, hipB: 30, shF: 96, elF: 8, shB: 30, elB: 102, head: -12 },
      { t: 1, y: 0.46, torso: 62, knF: 20, knB: 34, hipF: 10, hipB: 30, shF: 96, elF: 8, shB: 64, elB: 6, head: -12 },
    ],
  },
  gobletsquat: {
    dur: 2.4, plant: "both", props: { kettlebell: true },
    frames: [
      { t: 0, y: 0.5, shF: 46, elF: 118, shB: 46, elB: 118 },
      { t: 0.5, y: 0.32, torso: 22, hipF: 98, knF: 110, hipB: 98, knB: 110, shF: 52, elF: 116, shB: 52, elB: 116 },
      { t: 1, y: 0.5, shF: 46, elF: 118, shB: 46, elB: 118 },
    ],
  },
  kbswing: {
    dur: 1.9, plant: "both", props: { kettlebell: true },
    frames: [
      { t: 0, y: 0.42, torso: 58, knF: 36, knB: 36, hipF: 10, hipB: 10, shF: -18, elF: 4, shB: -18, elB: 4, head: -12 },
      { t: 0.5, y: 0.51, torso: 2, knF: 4, knB: 4, shF: 92, elF: 4, shB: 92, elB: 4 },
      { t: 1, y: 0.42, torso: 58, knF: 36, knB: 36, hipF: 10, hipB: 10, shF: -18, elF: 4, shB: -18, elB: 4, head: -12 },
    ],
  },
  heavybag: {
    dur: 2, props: { bag: true, gloves: true },
    frames: [
      { t: 0, ...GUARD },
      { t: 0.16, ...GUARD, shF: 96, elF: 8, body: 8 },
      { t: 0.34, ...GUARD },
      { t: 0.54, ...GUARD, shB: 98, elB: 8, body: 12, torso: 6, x: 0.05 },
      { t: 0.74, ...GUARD },
      { t: 1, ...GUARD },
    ],
  },
  speedbag: {
    dur: 0.6, props: { speedbag: true, gloves: true },
    frames: [
      { t: 0, y: 0.5, body: 4, shF: 118, elF: 128, shB: 122, elB: 112 },
      { t: 0.5, y: 0.5, body: 4, shF: 122, elF: 112, shB: 118, elB: 128 },
      { t: 1, y: 0.5, body: 4, shF: 118, elF: 128, shB: 122, elB: 112 },
    ],
  },
  jumprope: {
    dur: 0.55, props: { rope: true },
    frames: [
      { t: 0, y: 0.5, shF: 24, elF: 96, shB: 24, elB: 96, knF: 8, knB: 8 },
      { t: 0.5, y: 0.56, shF: 26, elF: 92, shB: 26, elB: 92, knF: 20, knB: 20, ankF: -14, ankB: -14 },
      { t: 1, y: 0.5, shF: 24, elF: 96, shB: 24, elB: 96, knF: 8, knB: 8 },
    ],
  },
  farmercarry: {
    dur: 1.3, props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, torso: 3, shF: 4, elF: 4, shB: 4, elB: 4, hipF: 26, knF: 14, hipB: -22, knB: 34 },
      { t: 0.5, y: 0.51, torso: 3, shF: 4, elF: 4, shB: 4, elB: 4, hipF: -22, knF: 34, hipB: 26, knB: 14 },
      { t: 1, y: 0.5, torso: 3, shF: 4, elF: 4, shB: 4, elB: 4, hipF: 26, knF: 14, hipB: -22, knB: 34 },
    ],
  },
};

/* ------------------------------ interpolation ---------------------------- */

function poseAt(def: PresetDef, time: number): Pose {
  const p = ((time % def.dur) + def.dur) % def.dur / def.dur;
  const frames = def.frames;
  let a = frames[0];
  let b = frames[frames.length - 1];
  for (let i = 0; i < frames.length - 1; i++) {
    if (p >= frames[i].t && p <= frames[i + 1].t) {
      a = frames[i];
      b = frames[i + 1];
      break;
    }
  }
  const span = Math.max(1e-6, b.t - a.t);
  const k = smooth(Math.min(1, Math.max(0, (p - a.t) / span)));
  const out = { ...BASE } as Pose;
  (Object.keys(BASE) as (keyof Pose)[]).forEach((key) => {
    const va = a[key] ?? BASE[key];
    const vb = b[key] ?? BASE[key];
    out[key] = va + (vb - va) * k;
  });
  return out;
}

/* --------------------------------- skeleton ------------------------------ */

interface Joints {
  hip: [number, number];
  shoulder: [number, number];
  headC: [number, number];
  elbowF: [number, number]; handF: [number, number];
  elbowB: [number, number]; handB: [number, number];
  kneeF: [number, number]; ankleF: [number, number]; toeF: [number, number];
  kneeB: [number, number]; ankleB: [number, number]; toeB: [number, number];
}

function fk(p: Pose): Joints {
  const add = (o: [number, number], ang: number, len: number): [number, number] => {
    const [dx, dy] = dir(ang);
    return [o[0] + dx * len, o[1] + dy * len];
  };
  const hip: [number, number] = [p.x, p.y];
  const torsoUp = p.body + p.torso;
  const shoulder = add(hip, torsoUp, L.torso);
  const headC = add(shoulder, torsoUp + p.head, L.neck + L.headR);

  const arm = (sh: number, el: number) => {
    const aAng = torsoUp + 180 - sh;
    const elbow = add(shoulder, aAng, L.arm);
    const hand = add(elbow, aAng - el, L.fore);
    return { elbow, hand };
  };
  const leg = (hipA: number, kn: number, ank: number) => {
    const lAng = p.body + 180 - hipA;
    const knee = add(hip, lAng, L.thigh);
    const sAng = lAng + kn;
    const ankle = add(knee, sAng, L.shin);
    const toe = add(ankle, sAng - 90 + ank, L.foot);
    return { knee, ankle, toe };
  };

  const aF = arm(p.shF, p.elF);
  const aB = arm(p.shB, p.elB);
  const lF = leg(p.hipF, p.knF, p.ankF);
  const lB = leg(p.hipB, p.knB, p.ankB);
  return {
    hip, shoulder, headC,
    elbowF: aF.elbow, handF: aF.hand, elbowB: aB.elbow, handB: aB.hand,
    kneeF: lF.knee, ankleF: lF.ankle, toeF: lF.toe,
    kneeB: lB.knee, ankleB: lB.ankle, toeB: lB.toe,
  };
}

/* planting: translate the whole figure so the planted effector(s) stay at
   their phase-0 spot — feet don't slide or float during squats and hinges */
function plantTarget(j: Joints, mode: NonNullable<PresetDef["plant"]>): [number, number] {
  if (mode === "hands") {
    return [(j.handF[0] + j.handB[0]) / 2, (j.handF[1] + j.handB[1]) / 2];
  }
  if (mode === "F") return [j.ankleF[0], j.ankleF[1]];
  if (mode === "B") return [j.ankleB[0], j.ankleB[1]];
  return [
    (j.ankleF[0] + j.ankleB[0]) / 2,
    (j.ankleF[1] + j.ankleB[1]) / 2,
  ];
}

function translateJoints(j: Joints, dx: number, dy: number): Joints {
  const mv = (p: [number, number]): [number, number] => [p[0] + dx, p[1] + dy];
  return {
    hip: mv(j.hip), shoulder: mv(j.shoulder), headC: mv(j.headC),
    elbowF: mv(j.elbowF), handF: mv(j.handF), elbowB: mv(j.elbowB), handB: mv(j.handB),
    kneeF: mv(j.kneeF), ankleF: mv(j.ankleF), toeF: mv(j.toeF),
    kneeB: mv(j.kneeB), ankleB: mv(j.ankleB), toeB: mv(j.toeB),
  };
}

/** Full pose → joints pipeline: planting + a floor clamp so no foot ever
    sinks through the ground, whatever the authored angles say. */
function jointsFor(def: PresetDef, time: number): Joints {
  let j = fk(poseAt(def, time));
  if (def.plant) {
    const anchor = plantTarget(fk(poseAt(def, 0)), def.plant);
    if (def.plant !== "hands") anchor[1] = Math.max(anchor[1], 0.03);
    const cur = plantTarget(j, def.plant);
    j = translateJoints(j, anchor[0] - cur[0], anchor[1] - cur[1]);
  }
  const minFoot = Math.min(j.ankleF[1], j.toeF[1], j.ankleB[1], j.toeB[1]);
  if (minFoot < 0.015) j = translateJoints(j, 0, 0.015 - minFoot);
  return j;
}

/* ------------------------- motion-path precompute ------------------------ */
/* The single biggest readability aid: show the trajectory of the part that
   moves the most (hand, foot or hip) as a dashed path with a direction
   arrow — exactly how classic exercise diagrams communicate a movement. */

type EffectorKey = "handF" | "toeF" | "hip" | "headC" | "shoulder";

interface MotionPath {
  pts: [number, number][]; // sampled loop of the chosen effector
  key: EffectorKey | null;
}

const PATH_SAMPLES = 56;

function computeMotionPath(def: PresetDef): MotionPath {
  const keys: EffectorKey[] = ["handF", "toeF", "hip", "headC", "shoulder"];
  const tracks: Record<EffectorKey, [number, number][]> = {
    handF: [], toeF: [], hip: [], headC: [], shoulder: [],
  };
  for (let i = 0; i <= PATH_SAMPLES; i++) {
    const j = jointsFor(def, (i / PATH_SAMPLES) * def.dur);
    keys.forEach((k) => tracks[k].push(j[k]));
  }
  let best: EffectorKey | null = null;
  let bestTravel = 0;
  keys.forEach((k) => {
    let travel = 0;
    const pts = tracks[k];
    for (let i = 1; i < pts.length; i++) {
      travel += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    /* prefer hands/feet over trunk points when travel is comparable */
    const weighted = k === "hip" || k === "headC" || k === "shoulder" ? travel * 0.6 : travel;
    if (weighted > bestTravel) {
      bestTravel = weighted;
      best = k;
    }
  });
  /* static holds (plank, wall sit…) don't need an arrow */
  if (bestTravel < 0.15) return { pts: [], key: null };
  return { pts: best ? tracks[best] : [], key: best };
}

/* Debug hook for numeric pose checks from the browser console / dev tools. */
function __sampleJoints(preset: DemoPreset, phase: number) {
  const def = PRESETS[preset] ?? PRESETS.squat;
  return jointsFor(def, phase * def.dur);
}
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__samplePose = __sampleJoints;
}

/* --------------------------------- component ----------------------------- */

export function Exercise2D({
  preset,
  className = "",
}: {
  preset: DemoPreset;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const presetRef = useRef(preset);
  presetRef.current = preset;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth || 300;
      h = host.clientHeight || 300;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* flat-vector palette, matched to the classic workout-app illustration
       style: blue tank, dark shorts, faceless dark head, skin limbs, blue
       shoes. Fixed colours — reads on light & dark themes alike; only the
       floor/prop grey follows the theme. */
    const P = {
      tank: "#3f9fe8", tankFar: "#2c77b4",
      dark: "#262a33", darkFar: "#15181e",
      skin: "#e8b48c", skinFar: "#c8976c",
      shoe: "#3b74d9", shoeFar: "#28509c",
      glove: "#c11f1f", gloveFar: "#871411",
      metal: "#6e7787", plate: "#39404f",
    };
    let cAccent = "#e30f2a", cProp = "#8a93a3";
    let paletteTick = 0;
    const readPalette = () => {
      const cs = getComputedStyle(host);
      const blood = cs.getPropertyValue("--color-blood").trim();
      const ash = cs.getPropertyValue("--color-ash").trim();
      if (blood) cAccent = blood;
      if (ash) cProp = ash;
    };
    readPalette();

    /* world→screen. The figure is ~1.05 units tall, so frame ~1.5 units of
       height and ~2 of width — the athlete fills the canvas instead of
       floating in empty space. */
    const S = () => Math.min(w / 2.05, h / 1.5);
    const toPx = (pt: [number, number]): [number, number] => {
      const s = S();
      return [w / 2 + pt[0] * s, h * 0.9 - pt[1] * s];
    };

    const line = (a: [number, number], b: [number, number], width: number, color: string, alpha = 1) => {
      const [x1, y1] = toPx(a);
      const [x2, y2] = toPx(b);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width * S();
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    const circle = (c: [number, number], r: number, color: string, alpha = 1, fill = true) => {
      const [x, y] = toPx(c);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, r * S(), 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = color; ctx.fill(); }
      else { ctx.strokeStyle = color; ctx.lineWidth = 0.02 * S(); ctx.stroke(); }
      ctx.globalAlpha = 1;
    };

    /* tapered filled limb — the "between 2D and 3D" volume of the reference
       illustrations comes from limbs that thin toward the extremity */
    const tapered = (a: [number, number], b: [number, number], wa: number, wb: number, color: string, alpha = 1) => {
      const [x1, y1] = toPx(a);
      const [x2, y2] = toPx(b);
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const r1 = (wa * S()) / 2, r2 = (wb * S()) / 2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
      ctx.lineTo(x2 + nx * r2, y2 + ny * r2);
      ctx.lineTo(x2 - nx * r2, y2 - ny * r2);
      ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); ctx.arc(x1, y1, r1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x2, y2, r2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    /* arms are bare skin (tank top); hands get gloves on boxing moves */
    const drawLimbArm = (sh: [number, number], el: [number, number], hd: [number, number], near: boolean, gloves?: boolean) => {
      const skin = near ? P.skin : P.skinFar;
      const glove = near ? P.glove : P.gloveFar;
      tapered(sh, el, near ? 0.088 : 0.074, near ? 0.064 : 0.054, skin);
      tapered(el, hd, near ? 0.062 : 0.052, near ? 0.044 : 0.038, skin);
      circle(hd, gloves ? 0.062 : 0.036, gloves ? glove : skin);
    };
    /* legs: dark shorts over the upper thigh, skin below, blue shoe */
    const mix = (a: [number, number], b: [number, number], k: number): [number, number] =>
      [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const drawLimbLeg = (hip: [number, number], kn: [number, number], an: [number, number], toe: [number, number], near: boolean) => {
      const skin = near ? P.skin : P.skinFar;
      const dark = near ? P.dark : P.darkFar;
      const shoe = near ? P.shoe : P.shoeFar;
      tapered(hip, kn, near ? 0.1 : 0.085, near ? 0.07 : 0.06, skin);
      tapered(kn, an, near ? 0.068 : 0.058, near ? 0.046 : 0.04, skin);
      /* shorts leg covers the upper 45% of the thigh */
      tapered(hip, mix(hip, kn, 0.45), near ? 0.115 : 0.098, near ? 0.095 : 0.082, dark);
      /* shoe: chunky capsule from ankle past the toe */
      tapered(an, toe, near ? 0.075 : 0.064, near ? 0.085 : 0.072, shoe);
    };

    /* tank-top torso (widens waist→chest), dark shorts block at the hips,
       skin neck and the reference's faceless dark head */
    const drawTorso = (jj: Joints, upAngle: number, headAngle: number) => {
      const [hx, hy] = toPx(jj.hip);
      const [sx2, sy2] = toPx(jj.shoulder);
      const dx = sx2 - hx, dy = sy2 - hy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const wWaist = 0.082 * S(), wChest = 0.112 * S();
      ctx.fillStyle = P.tank;
      ctx.beginPath();
      ctx.moveTo(hx + nx * wWaist, hy + ny * wWaist);
      ctx.lineTo(sx2 + nx * wChest, sy2 + ny * wChest);
      ctx.lineTo(sx2 - nx * wChest, sy2 - ny * wChest);
      ctx.lineTo(hx - nx * wWaist, hy - ny * wWaist);
      ctx.closePath();
      ctx.fill();
      circle(jj.shoulder, 0.098, P.tank); // rounded chest cap
      circle(jj.hip, 0.088, P.dark); // shorts hip block
      const [ux, uy] = dir(upAngle);
      const neckTop: [number, number] = [
        jj.headC[0] - ux * L.headR * 0.55,
        jj.headC[1] - uy * L.headR * 0.55,
      ];
      tapered(jj.shoulder, neckTop, 0.06, 0.048, P.skin);
      const [cxp, cyp] = toPx(jj.headC);
      ctx.fillStyle = P.dark;
      ctx.beginPath();
      ctx.ellipse(cxp, cyp, 0.08 * S(), 0.099 * S(), rad(headAngle), 0, Math.PI * 2);
      ctx.fill();
    };

    /* ghost of the movement's far pose (the "B" position in classic A→B
       exercise diagrams), drawn as a faint silhouette behind the live figure */
    const drawGhost = (g: Joints | null) => {
      if (!g) return;
      const c = cProp;
      const A = 0.16;
      tapered(g.shoulder, g.elbowB, 0.078, 0.056, c, A);
      tapered(g.elbowB, g.handB, 0.054, 0.04, c, A);
      tapered(g.hip, g.kneeB, 0.09, 0.062, c, A);
      tapered(g.kneeB, g.ankleB, 0.06, 0.042, c, A);
      tapered(g.ankleB, g.toeB, 0.066, 0.074, c, A);
      tapered(g.hip, g.shoulder, 0.17, 0.21, c, A);
      circle(g.headC, L.headR, c, A);
      tapered(g.hip, g.kneeF, 0.09, 0.062, c, A);
      tapered(g.kneeF, g.ankleF, 0.06, 0.042, c, A);
      tapered(g.ankleF, g.toeF, 0.066, 0.074, c, A);
      tapered(g.shoulder, g.elbowF, 0.078, 0.056, c, A);
      tapered(g.elbowF, g.handF, 0.054, 0.04, c, A);
    };

    const drawProps = (props: Props | undefined, j: Joints, t: number, dur: number, behind: boolean) => {
      if (!props) return;
      if (behind) {
        if (props.wall !== undefined) line([props.wall, 0], [props.wall, 1.2], 0.032, cProp, 0.45);
        if (props.box) {
          const [cx, bh] = props.box;
          const [x1, y1] = toPx([cx - 0.19, bh]);
          const [x2, y2] = toPx([cx + 0.19, 0]);
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = cProp;
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
          ctx.globalAlpha = 1;
        }
        if (props.bench) {
          const [cx, bw] = props.bench;
          line([cx - bw / 2, 0.38], [cx + bw / 2, 0.38], 0.05, cProp, 0.5);
          line([cx - bw / 2 + 0.08, 0.38], [cx - bw / 2 + 0.08, 0], 0.035, cProp, 0.5);
          line([cx + bw / 2 - 0.08, 0.38], [cx + bw / 2 - 0.08, 0], 0.035, cProp, 0.5);
        }
        if (props.pullbar) {
          /* within reach of the hanging figure (hands hang at ~1.28) */
          line([-0.55, 1.3], [0.55, 1.3], 0.035, cProp, 0.65);
          line([-0.55, 1.3], [-0.55, 1.42], 0.03, cProp, 0.4);
          line([0.55, 1.3], [0.55, 1.42], 0.03, cProp, 0.4);
        }
        if (props.bag) {
          line([0.6, 1.34], [0.6, 1.06], 0.015, cProp, 0.6);
          const [bx, by] = toPx([0.6, 0.78]);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = cAccent;
          ctx.beginPath();
          const rw = 0.13 * S(), rh = 0.3 * S();
          ctx.roundRect(bx - rw, by - rh, rw * 2, rh * 2, rw);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (props.speedbag) {
          line([0.2, 1.06], [0.54, 1.06], 0.03, cProp, 0.6);
          line([0.37, 1.06], [0.37, 1.0], 0.02, cProp, 0.7);
          circle([0.37, 0.93], 0.075, cAccent, 0.9);
        }
      }

      /* the rope alternates: behind the body going overhead, in front when
         it passes under the feet */
      if (props.rope) {
        const phase = (t / dur) * Math.PI * 2;
        const swing = Math.sin(phase);
        const inFront = swing > 0;
        if (inFront !== behind) {
          const midX = (j.handF[0] + j.handB[0]) / 2;
          const midY = (j.handF[1] + j.handB[1]) / 2;
          const ctrlY = midY + (inFront ? -1 : 1) * (0.55 + 0.75 * Math.abs(swing));
          const [ax, ay] = toPx([j.handB[0] - 0.02, j.handB[1]]);
          const [bx2, by2] = toPx([j.handF[0] + 0.02, j.handF[1]]);
          const [cx2, cy2] = toPx([midX, ctrlY]);
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = cProp;
          ctx.lineWidth = 0.016 * S();
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(cx2, cy2, bx2, by2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      if (!behind) {
        if (props.barbell) {
          const c = j.handF;
          line([c[0] - 0.3, c[1]], [c[0] + 0.3, c[1]], 0.03, P.metal, 0.95);
          circle([c[0], c[1]], 0.105, P.plate);
          circle([c[0], c[1]], 0.045, P.metal);
        }
        if (props.dumbbells) {
          for (const hnd of [j.handB, j.handF]) {
            line([hnd[0] - 0.08, hnd[1]], [hnd[0] + 0.08, hnd[1]], 0.026, P.metal, 0.95);
            circle([hnd[0] - 0.08, hnd[1]], 0.042, P.plate);
            circle([hnd[0] + 0.08, hnd[1]], 0.042, P.plate);
          }
        }
        if (props.kettlebell) {
          const c: [number, number] = [(j.handF[0] + j.handB[0]) / 2, (j.handF[1] + j.handB[1]) / 2];
          circle([c[0], c[1] - 0.1], 0.08, P.plate);
          const [x, y] = toPx(c);
          ctx.strokeStyle = P.metal;
          ctx.lineWidth = 0.022 * S();
          ctx.beginPath();
          ctx.arc(x, y - 0.02 * S(), 0.055 * S(), Math.PI, 0, false);
          ctx.stroke();
        }
      }
    };

    /* dashed movement path + travelling arrowhead for the busiest effector */
    let pathCacheKey: DemoPreset | null = null;
    let path: MotionPath = { pts: [], key: null };
    let ghostJ: Joints | null = null;

    const refreshPathCache = (def: PresetDef) => {
      if (pathCacheKey === presetRef.current) return;
      pathCacheKey = presetRef.current;
      path = computeMotionPath(def);
      /* ghost = the pose farthest from the start (the "B" position) */
      ghostJ = null;
      if (path.key && path.pts.length > 0) {
        let bi = 0, bd = 0;
        for (let i = 0; i < path.pts.length; i++) {
          const d = Math.hypot(path.pts[i][0] - path.pts[0][0], path.pts[i][1] - path.pts[0][1]);
          if (d > bd) { bd = d; bi = i; }
        }
        if (bd > 0.12) ghostJ = jointsFor(def, (bi / PATH_SAMPLES) * def.dur);
      }
    };

    const drawMotionPath = (def: PresetDef, t: number, j: Joints, layer: "trail" | "arrow") => {
      refreshPathCache(def);
      if (!path.key || path.pts.length === 0) return;

      if (layer === "arrow") {
        /* arrowhead at the effector, pointing along its velocity — drawn in
           front of the figure so it's always visible */
        const cur = j[path.key];
        const ahead = jointsFor(def, t + def.dur * 0.03)[path.key];
        const vx = ahead[0] - cur[0];
        const vy = ahead[1] - cur[1];
        if (Math.hypot(vx, vy) > 0.004) {
          const ang = Math.atan2(-vy, vx); // screen-space angle (y flipped)
          const [px, py] = toPx(cur);
          const r = 0.085 * S();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = cAccent;
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(ang) * r * 1.7, py + Math.sin(ang) * r * 1.7);
          ctx.lineTo(px + Math.cos(ang + 2.6) * r, py + Math.sin(ang + 2.6) * r);
          ctx.lineTo(px + Math.cos(ang - 2.6) * r, py + Math.sin(ang - 2.6) * r);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        return;
      }

      /* the loop trajectory — bold enough to read as the guidance line */
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = cAccent;
      ctx.lineWidth = Math.max(2, 0.02 * S());
      ctx.setLineDash([0.05 * S(), 0.05 * S()]);
      ctx.beginPath();
      const [mx, my] = toPx(path.pts[0]);
      ctx.moveTo(mx, my);
      for (let i = 1; i < path.pts.length; i++) {
        const [x, y] = toPx(path.pts[i]);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (++paletteTick % 60 === 0) readPalette();
      const def = PRESETS[presetRef.current] ?? PRESETS.squat;
      const pose = poseAt(def, t);
      const j = jointsFor(def, t);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      /* floor + soft ground shadow */
      line([-1.02, 0], [1.02, 0], 0.016, cProp, 0.55);
      const [sx, sy] = toPx([j.hip[0], 0]);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#20242c";
      ctx.beginPath();
      ctx.ellipse(sx, sy, 0.4 * S(), 0.045 * S(), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      drawProps(def.props, j, t, def.dur, true);

      /* movement trajectory behind the figure */
      drawMotionPath(def, t, j, "trail");

      /* faint "B-position" silhouette so both ends of the movement are
         visible at once, like classic A→B exercise diagrams */
      drawGhost(ghostJ);

      /* far limbs */
      drawLimbArm(j.shoulder, j.elbowB, j.handB, false, def.props?.gloves);
      drawLimbLeg(j.hip, j.kneeB, j.ankleB, j.toeB, false);

      /* torso + faceless head, reference style */
      drawTorso(j, pose.body + pose.torso, pose.body + pose.torso + pose.head);

      /* near limbs */
      drawLimbLeg(j.hip, j.kneeF, j.ankleF, j.toeF, true);
      drawLimbArm(j.shoulder, j.elbowF, j.handF, true, def.props?.gloves);

      drawProps(def.props, j, t, def.dur, false);

      /* direction arrow on top so it never hides behind a limb */
      drawMotionPath(def, t, j, "arrow");

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeChild(canvas);
    };
  }, []);

  return <div ref={hostRef} className={className} aria-label="Exercise technique demo" />;
}
