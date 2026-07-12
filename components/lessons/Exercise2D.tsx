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
      { t: 0, body: 88, y: 0.36, torso: 0, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
      { t: 0.5, body: 88, y: 0.22, shF: 48, elF: 96, shB: 48, elB: 96, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
      { t: 1, body: 88, y: 0.36, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
    ],
  },
  kneepushup: {
    dur: 2.2,
    frames: [
      { t: 0, body: 72, y: 0.34, shF: 88, elF: 10, shB: 88, elB: 10, hipF: 10, knF: 96, hipB: 10, knB: 96, head: -12 },
      { t: 0.5, body: 78, y: 0.24, shF: 50, elF: 92, shB: 50, elB: 92, hipF: 10, knF: 96, hipB: 10, knB: 96, head: -12 },
      { t: 1, body: 72, y: 0.34, shF: 88, elF: 10, shB: 88, elB: 10, hipF: 10, knF: 96, hipB: 10, knB: 96, head: -12 },
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
      { t: 0, body: 58, y: 0.44, shF: 86, elF: 8, shB: 86, elB: 8, hipF: -4, hipB: -4, head: -10 },
      { t: 0.5, body: 64, y: 0.36, shF: 56, elF: 78, shB: 56, elB: 78, hipF: -4, hipB: -4, head: -10 },
      { t: 1, body: 58, y: 0.44, shF: 86, elF: 8, shB: 86, elB: 8, hipF: -4, hipB: -4, head: -10 },
    ],
  },
  declinepushup: {
    dur: 2.2, props: { box: [-0.62, 0.38] },
    frames: [
      { t: 0, body: 94, y: 0.42, shF: 92, elF: 8, shB: 92, elB: 8, hipF: -20, hipB: -20, head: -14 },
      { t: 0.5, body: 96, y: 0.28, shF: 52, elF: 96, shB: 52, elB: 96, hipF: -22, hipB: -22, head: -14 },
      { t: 1, body: 94, y: 0.42, shF: 92, elF: 8, shB: 92, elB: 8, hipF: -20, hipB: -20, head: -14 },
    ],
  },
  archerpushup: {
    dur: 4.4,
    frames: [
      { t: 0, body: 88, y: 0.34, shF: 90, elF: 8, shB: 95, elB: 4, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
      { t: 0.25, body: 88, y: 0.24, x: 0.07, shF: 52, elF: 98, shB: 108, elB: 4, hipF: -3, hipB: -3, head: -14 },
      { t: 0.5, body: 88, y: 0.34, shF: 90, elF: 8, shB: 95, elB: 4, hipF: -3, hipB: -3, head: -14 },
      { t: 0.75, body: 88, y: 0.24, x: -0.07, shF: 108, elF: 4, shB: 52, elB: 98, hipF: -3, hipB: -3, head: -14 },
      { t: 1, body: 88, y: 0.34, shF: 90, elF: 8, shB: 95, elB: 4, hipF: -3, hipB: -3, head: -14 },
    ],
  },
  pikepushup: {
    dur: 2.4,
    frames: [
      { t: 0, body: 128, y: 0.6, shF: 95, elF: 8, shB: 95, elB: 8, hipF: -108, hipB: -108, knF: 4, knB: 4, head: -10 },
      { t: 0.5, body: 134, y: 0.54, shF: 70, elF: 62, shB: 70, elB: 62, hipF: -112, hipB: -112, head: -10 },
      { t: 1, body: 128, y: 0.6, shF: 95, elF: 8, shB: 95, elB: 8, hipF: -108, hipB: -108, head: -10 },
    ],
  },
  handstand: {
    dur: 2.6, props: { wall: -0.34 },
    frames: [
      { t: 0, body: 176, y: 1.02, shF: 176, elF: 4, shB: 176, elB: 4, hipF: -4, hipB: -2, head: 18 },
      { t: 0.5, body: 178, y: 1.02, shF: 178, elF: 4, shB: 178, elB: 4, hipF: -7, hipB: -4, head: 18 },
      { t: 1, body: 176, y: 1.02, shF: 176, elF: 4, shB: 176, elB: 4, hipF: -4, hipB: -2, head: 18 },
    ],
  },
  shouldertap: {
    dur: 1.8,
    frames: [
      { t: 0, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
      { t: 0.25, body: 88, y: 0.35, shF: 128, elF: 118, shB: 92, elB: 8, hipF: -3, hipB: -3, head: -14 },
      { t: 0.5, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
      { t: 0.75, body: 88, y: 0.35, shF: 92, elF: 8, shB: 128, elB: 118, hipF: -3, hipB: -3, head: -14 },
      { t: 1, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
    ],
  },
  plankup: {
    dur: 2.6,
    frames: [
      { t: 0, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
      { t: 0.45, body: 88, y: 0.3, shF: 66, elF: 112, shB: 66, elB: 112, hipF: -3, hipB: -3, head: -14 },
      { t: 0.55, body: 88, y: 0.3, shF: 66, elF: 112, shB: 66, elB: 112, hipF: -3, hipB: -3, head: -14 },
      { t: 1, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
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
      { t: 0, body: 87, y: 0.3, shF: 64, elF: 116, shB: 64, elB: 116, hipF: -3, hipB: -3, head: -14 },
      { t: 0.5, body: 87, y: 0.31, shF: 64, elF: 116, shB: 64, elB: 116, hipF: -3, hipB: -3, head: -14 },
      { t: 1, body: 87, y: 0.3, shF: 64, elF: 116, shB: 64, elB: 116, hipF: -3, hipB: -3, head: -14 },
    ],
  },
  sideplank: {
    dur: 2.4,
    frames: [
      { t: 0, body: 82, y: 0.33, shF: 64, elF: 116, shB: 262, elB: 6, hipF: -4, hipB: -4, head: -10 },
      { t: 0.5, body: 82, y: 0.29, shF: 64, elF: 116, shB: 262, elB: 6, hipF: -4, hipB: -4, head: -10 },
      { t: 1, body: 82, y: 0.33, shF: 64, elF: 116, shB: 262, elB: 6, hipF: -4, hipB: -4, head: -10 },
    ],
  },
  plankjack: {
    dur: 0.9,
    frames: [
      { t: 0, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
      { t: 0.5, body: 88, y: 0.37, shF: 90, elF: 8, shB: 90, elB: 8, hipF: 8, hipB: -16, head: -14 },
      { t: 1, body: 88, y: 0.35, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, hipB: -3, head: -14 },
    ],
  },
  climber: {
    dur: 0.9,
    frames: [
      { t: 0, body: 82, y: 0.36, shF: 92, elF: 8, shB: 92, elB: 8, hipF: 76, knF: 100, hipB: -6, knB: 4, head: -14 },
      { t: 0.5, body: 82, y: 0.36, shF: 92, elF: 8, shB: 92, elB: 8, hipF: -6, knF: 4, hipB: 76, knB: 100, head: -14 },
      { t: 1, body: 82, y: 0.36, shF: 92, elF: 8, shB: 92, elB: 8, hipF: 76, knF: 100, hipB: -6, knB: 4, head: -14 },
    ],
  },
  situp: {
    dur: 2.4,
    frames: [
      { t: 0, body: -85, y: 0.13, torso: 0, shF: 142, elF: 138, shB: 142, elB: 138, hipF: 72, knF: 102, hipB: 72, knB: 102, head: 6 },
      { t: 0.45, body: -85, y: 0.13, torso: 80, shF: 142, elF: 138, shB: 142, elB: 138, hipF: 72, knF: 102, hipB: 72, knB: 102, head: 14 },
      { t: 1, body: -85, y: 0.13, torso: 0, shF: 142, elF: 138, shB: 142, elB: 138, hipF: 72, knF: 102, hipB: 72, knB: 102, head: 6 },
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
      { t: 0, body: 90, y: 0.11, torso: -12, shF: 120, elF: 6, shB: 120, elB: 6, hipF: -6, hipB: -6, head: -12 },
      { t: 0.5, body: 90, y: 0.11, torso: -14, shF: 186, elF: 4, shB: 186, elB: 4, hipF: -6, hipB: -6, head: -12 },
      { t: 1, body: 90, y: 0.11, torso: -12, shF: 120, elF: 6, shB: 120, elB: 6, hipF: -6, hipB: -6, head: -12 },
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
    dur: 2.6,
    frames: [
      { t: 0, y: 0.5, torso: 4, shF: 148, elF: 138, shB: 148, elB: 138, knF: 6, knB: 6 },
      { t: 0.5, y: 0.46, torso: 82, shF: 148, elF: 138, shB: 148, elB: 138, knF: 16, knB: 16, hipF: 8, hipB: 8, head: -18 },
      { t: 1, y: 0.5, torso: 4, shF: 148, elF: 138, shB: 148, elB: 138, knF: 6, knB: 6 },
    ],
  },

  /* -------------------------------- legs ------------------------------- */
  squat: {
    dur: 2.4,
    frames: [
      { t: 0, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
      { t: 0.5, y: 0.3, torso: 34, hipF: 104, knF: 116, hipB: 104, knB: 116, shF: 88, elF: 8, shB: 88, elB: 8, head: -8 },
      { t: 1, y: 0.5, shF: 30, elF: 10, shB: 30, elB: 10 },
    ],
  },
  sumosquat: {
    dur: 2.4,
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
    dur: 3.2,
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
    dur: 2.4, props: { box: [-0.5, 0.38] },
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
    dur: 2.6, props: { wall: -0.3 },
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
    dur: 2.8,
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
      { t: 0.38, body: 88, y: 0.34, torso: 0, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
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
      { t: 0.3, body: 88, y: 0.3, torso: -8, shF: 88, elF: 10, shB: 88, elB: 10, hipF: -8, knF: 8, hipB: -8, knB: 8, head: -16 },
      { t: 0.5, body: 88, y: 0.3, torso: -10, shF: 88, elF: 10, shB: 88, elB: 10, hipF: -8, knF: 8, hipB: -8, knB: 8, head: -16 },
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
      { t: 0.42, body: 88, y: 0.34, torso: 0, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
      { t: 0.58, body: 88, y: 0.34, torso: 0, shF: 90, elF: 8, shB: 90, elB: 8, hipF: -3, knF: 2, hipB: -3, knB: 2, head: -14 },
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
      { t: 0, body: -88, y: 0.5, shF: 95, elF: 6, shB: 95, elB: 6, hipF: 64, knF: 96, hipB: 64, knB: 96 },
      { t: 0.5, body: -88, y: 0.5, shF: 62, elF: 88, shB: 62, elB: 88, hipF: 64, knF: 96, hipB: 64, knB: 96 },
      { t: 1, body: -88, y: 0.5, shF: 95, elF: 6, shB: 95, elB: 6, hipF: 64, knF: 96, hipB: 64, knB: 96 },
    ],
  },
  barbellsquat: {
    dur: 2.6, props: { barbell: true },
    frames: [
      { t: 0, y: 0.5, shF: 24, elF: 152, shB: 24, elB: 152 },
      { t: 0.5, y: 0.31, torso: 30, hipF: 100, knF: 112, hipB: 100, knB: 112, shF: 40, elF: 150, shB: 40, elB: 150, head: -6 },
      { t: 1, y: 0.5, shF: 24, elF: 152, shB: 24, elB: 152 },
    ],
  },
  deadlift: {
    dur: 2.6, props: { barbell: true },
    frames: [
      { t: 0, y: 0.38, torso: 66, knF: 52, knB: 52, hipF: 12, hipB: 12, shF: 70, elF: 4, shB: 70, elB: 4, head: -14 },
      { t: 0.5, y: 0.5, torso: 2, knF: 4, knB: 4, shF: 10, elF: 4, shB: 10, elB: 4 },
      { t: 1, y: 0.38, torso: 66, knF: 52, knB: 52, hipF: 12, hipB: 12, shF: 70, elF: 4, shB: 70, elB: 4, head: -14 },
    ],
  },
  overheadpress: {
    dur: 2.2, props: { barbell: true },
    frames: [
      { t: 0, y: 0.5, shF: 34, elF: 138, shB: 34, elB: 138 },
      { t: 0.5, y: 0.51, shF: 176, elF: 4, shB: 176, elB: 4 },
      { t: 1, y: 0.5, shF: 34, elF: 138, shB: 34, elB: 138 },
    ],
  },
  barbellrow: {
    dur: 1.8, props: { barbell: true },
    frames: [
      { t: 0, y: 0.44, torso: 56, knF: 26, knB: 26, shF: 62, elF: 6, shB: 62, elB: 6, head: -12 },
      { t: 0.5, y: 0.44, torso: 56, knF: 26, knB: 26, shF: 34, elF: 96, shB: 34, elB: 96, head: -12 },
      { t: 1, y: 0.44, torso: 56, knF: 26, knB: 26, shF: 62, elF: 6, shB: 62, elB: 6, head: -12 },
    ],
  },
  pullup: {
    dur: 2.6, props: { pullbar: true },
    frames: [
      { t: 0, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 10, knF: 28, hipB: 10, knB: 28 },
      { t: 0.5, y: 0.88, shF: 150, elF: 120, shB: 150, elB: 120, hipF: 12, knF: 32, hipB: 12, knB: 32 },
      { t: 1, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 10, knF: 28, hipB: 10, knB: 28 },
    ],
  },
  kneeraise: {
    dur: 2.2, props: { pullbar: true },
    frames: [
      { t: 0, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 6, knF: 8, hipB: 6, knB: 8 },
      { t: 0.5, y: 0.62, shF: 176, elF: 6, shB: 176, elB: 6, hipF: 96, knF: 104, hipB: 96, knB: 104 },
      { t: 1, y: 0.62, shF: 178, elF: 6, shB: 178, elB: 6, hipF: 6, knF: 8, hipB: 6, knB: 8 },
    ],
  },
  dbpress: {
    dur: 2.2, props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, shF: 40, elF: 128, shB: 40, elB: 128 },
      { t: 0.5, y: 0.51, shF: 174, elF: 6, shB: 174, elB: 6 },
      { t: 1, y: 0.5, shF: 40, elF: 128, shB: 40, elB: 128 },
    ],
  },
  curl: {
    dur: 2, props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, shF: 8, elF: 8, shB: 8, elB: 8 },
      { t: 0.5, y: 0.5, shF: 12, elF: 136, shB: 12, elB: 136 },
      { t: 1, y: 0.5, shF: 8, elF: 8, shB: 8, elB: 8 },
    ],
  },
  latraise: {
    dur: 2, props: { dumbbells: true },
    frames: [
      { t: 0, y: 0.5, shF: 12, elF: 14, shB: 12, elB: 14 },
      { t: 0.5, y: 0.5, shF: 92, elF: 10, shB: 92, elB: 10 },
      { t: 1, y: 0.5, shF: 12, elF: 14, shB: 12, elB: 14 },
    ],
  },
  dbrow: {
    dur: 1.8, props: { bench: [0.32, 0.55], dumbbells: true },
    frames: [
      { t: 0, y: 0.46, torso: 62, knF: 20, knB: 34, hipF: 10, hipB: 30, shF: 96, elF: 8, shB: 64, elB: 6, head: -12 },
      { t: 0.5, y: 0.46, torso: 62, knF: 20, knB: 34, hipF: 10, hipB: 30, shF: 96, elF: 8, shB: 30, elB: 102, head: -12 },
      { t: 1, y: 0.46, torso: 62, knF: 20, knB: 34, hipF: 10, hipB: 30, shF: 96, elF: 8, shB: 64, elB: 6, head: -12 },
    ],
  },
  gobletsquat: {
    dur: 2.4, props: { kettlebell: true },
    frames: [
      { t: 0, y: 0.5, shF: 46, elF: 118, shB: 46, elB: 118 },
      { t: 0.5, y: 0.32, torso: 22, hipF: 98, knF: 110, hipB: 98, knB: 110, shF: 52, elF: 116, shB: 52, elB: 116 },
      { t: 1, y: 0.5, shF: 46, elF: 118, shB: 46, elB: 118 },
    ],
  },
  kbswing: {
    dur: 1.9, props: { kettlebell: true },
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

    /* theme colours, re-read periodically so a theme flip updates the figure */
    let cNear = "#1f242e", cFar = "rgba(31,36,46,0.35)", cAccent = "#e30f2a", cProp = "#8a93a3";
    let paletteTick = 0;
    const readPalette = () => {
      const cs = getComputedStyle(host);
      const bone = cs.getPropertyValue("--color-bone").trim();
      const blood = cs.getPropertyValue("--color-blood").trim();
      const ash = cs.getPropertyValue("--color-ash").trim();
      if (bone) { cNear = bone; cFar = bone; }
      if (blood) cAccent = blood;
      if (ash) cProp = ash;
    };
    readPalette();

    /* world→screen: figure area ~2.3 units wide, floor near the bottom */
    const toPx = (pt: [number, number]): [number, number] => {
      const scale = Math.min(w / 2.5, h / 2.1);
      return [w / 2 + pt[0] * scale, h * 0.86 - pt[1] * scale];
    };
    const S = () => Math.min(w / 2.5, h / 2.1);

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

    const drawLimbArm = (sh: [number, number], el: [number, number], hd: [number, number], near: boolean, gloves?: boolean) => {
      const color = cNear;
      const alpha = near ? 1 : 0.38;
      line(sh, el, 0.075, color, alpha);
      line(el, hd, 0.065, color, alpha);
      circle(hd, gloves ? 0.055 : 0.034, gloves ? cAccent : color, alpha);
    };
    const drawLimbLeg = (hip: [number, number], kn: [number, number], an: [number, number], toe: [number, number], near: boolean) => {
      const alpha = near ? 1 : 0.38;
      line(hip, kn, 0.085, cNear, alpha);
      line(kn, an, 0.07, cNear, alpha);
      line(an, toe, 0.06, cNear, alpha);
    };

    const drawProps = (props: Props | undefined, j: Joints, t: number, behind: boolean) => {
      if (!props) return;
      if (behind) {
        if (props.wall !== undefined) line([props.wall, 0], [props.wall, 1.95], 0.03, cProp, 0.45);
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
          line([-0.6, 1.92], [0.6, 1.92], 0.035, cProp, 0.6);
          line([-0.6, 1.92], [-0.6, 2.05], 0.03, cProp, 0.4);
          line([0.6, 1.92], [0.6, 2.05], 0.03, cProp, 0.4);
        }
        if (props.bag) {
          line([0.62, 1.98], [0.62, 1.62], 0.015, cProp, 0.6);
          const [bx, by] = toPx([0.62, 1.13]);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = cAccent;
          ctx.beginPath();
          const rw = 0.15 * S(), rh = 0.5 * S();
          ctx.roundRect(bx - rw, by - rh, rw * 2, rh * 2, rw);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (props.speedbag) {
          line([0.18, 1.66], [0.52, 1.66], 0.03, cProp, 0.6);
          circle([0.36, 1.52], 0.085, cAccent, 0.9);
          line([0.36, 1.66], [0.36, 1.6], 0.02, cProp, 0.7);
        }
        if (props.rope) {
          /* rope swings around the body through the hands */
          const phase = (t / 0.55) * Math.PI * 2;
          const swing = Math.sin(phase);
          const mid: [number, number] = [(j.handF[0] + j.handB[0]) / 2, (j.handF[1] + j.handB[1]) / 2];
          const [hx, hy] = toPx(j.handF);
          const [, cyTop] = toPx([mid[0], swing > 0 ? -0.12 : 2.0]);
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = cProp;
          ctx.lineWidth = 0.016 * S();
          ctx.beginPath();
          ctx.moveTo(hx - 0.06 * S(), hy);
          ctx.quadraticCurveTo(toPx(mid)[0] - 0.9 * S() * Math.abs(swing) * 0 + (toPx(mid)[0] - toPx(mid)[0]), cyTop, hx + 0.12 * S(), hy);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else {
        if (props.barbell) {
          const c = j.handF;
          line([c[0] - 0.3, c[1]], [c[0] + 0.3, c[1]], 0.03, cProp, 0.9);
          circle([c[0], c[1]], 0.115, cNear, 0.9, false);
          circle([c[0], c[1]], 0.115, cProp, 0.25);
        }
        if (props.dumbbells) {
          for (const hnd of [j.handB, j.handF]) {
            line([hnd[0] - 0.09, hnd[1]], [hnd[0] + 0.09, hnd[1]], 0.026, cProp, 0.95);
            circle([hnd[0] - 0.09, hnd[1]], 0.045, cNear, 0.9);
            circle([hnd[0] + 0.09, hnd[1]], 0.045, cNear, 0.9);
          }
        }
        if (props.kettlebell) {
          const c: [number, number] = [(j.handF[0] + j.handB[0]) / 2, (j.handF[1] + j.handB[1]) / 2];
          circle([c[0], c[1] - 0.11], 0.085, cNear, 0.95);
          const [x, y] = toPx(c);
          ctx.strokeStyle = cNear;
          ctx.lineWidth = 0.022 * S();
          ctx.beginPath();
          ctx.arc(x, y - 0.02 * S(), 0.06 * S(), Math.PI, 0, false);
          ctx.stroke();
        }
      }
    };

    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (++paletteTick % 60 === 0) readPalette();
      const def = PRESETS[presetRef.current] ?? PRESETS.squat;
      const pose = poseAt(def, t);
      const j = fk(pose);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      /* floor + soft ground shadow */
      line([-1.15, 0], [1.15, 0], 0.018, cProp, 0.5);
      const [sx, sy] = toPx([pose.x, 0]);
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = cNear;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 0.42 * S(), 0.05 * S(), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      drawProps(def.props, j, t, true);

      /* far limbs */
      drawLimbArm(j.shoulder, j.elbowB, j.handB, false, def.props?.gloves);
      drawLimbLeg(j.hip, j.kneeB, j.ankleB, j.toeB, false);

      /* torso + head */
      line(j.hip, j.shoulder, 0.115, cNear);
      circle(j.hip, 0.055, cNear);
      circle(j.headC, L.headR, cNear);

      /* near limbs */
      drawLimbLeg(j.hip, j.kneeF, j.ankleF, j.toeF, true);
      drawLimbArm(j.shoulder, j.elbowF, j.handF, true, def.props?.gloves);

      drawProps(def.props, j, t, false);

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
