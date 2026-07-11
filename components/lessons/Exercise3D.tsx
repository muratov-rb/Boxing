"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { DemoPreset } from "@/lib/exercises";

/* ===========================================================================
   Exercise3D — procedural 3D coach, clay-render style.
   A smooth mannequin built from capsules and spheres performs the exercise
   on loop under soft studio light with real shadows; the user can drag to
   orbit and inspect the technique from any angle. Simple props (a bench box,
   a wall slab) appear for the moves that use them.
   No external model assets — the rig and every animation are generated here.
   =========================================================================== */

interface Rig {
  root: THREE.Group; // at hip height
  torso: THREE.Group; // pivot at hips
  headG: THREE.Group; // pivot at neck base (in torso space)
  armL: THREE.Group; // pivot at shoulder
  armR: THREE.Group;
  foreL: THREE.Group; // pivot at elbow
  foreR: THREE.Group;
  legL: THREE.Group; // pivot at hip joint
  legR: THREE.Group;
  shinL: THREE.Group; // pivot at knee
  shinR: THREE.Group;
  footL: THREE.Group; // pivot at ankle
  footR: THREE.Group;
}

/* clay palette — light mannequin, darker shorts, brand-red wrist wraps */
const CLAY = 0xd4d9e1;
const CLAY_DARK = 0x939cab;
const ACCENT = 0xe30f2a;

const clayMat = (color: number) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });

function shadowed(mesh: THREE.Mesh) {
  mesh.castShadow = true;
  return mesh;
}

/* a limb segment: capsule hanging down from the pivot + a joint ball on top */
function limb(len: number, radius: number, color: number): THREE.Group {
  const g = new THREE.Group();
  const mesh = shadowed(
    new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, len - radius * 2, 6, 16),
      clayMat(color),
    ),
  );
  mesh.position.y = -len / 2;
  g.add(mesh);
  const joint = shadowed(
    new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 16, 16), clayMat(color)),
  );
  g.add(joint);
  return g;
}

function buildRig(): Rig {
  const root = new THREE.Group();
  root.position.y = 0.95;

  /* pelvis — squashed sphere reads as shorts */
  const pelvis = shadowed(
    new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), clayMat(CLAY_DARK)),
  );
  pelvis.scale.set(1.45, 0.8, 1.0);
  root.add(pelvis);

  /* torso group pivots at the hips */
  const torso = new THREE.Group();
  root.add(torso);

  const belly = shadowed(
    new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 16), clayMat(CLAY)),
  );
  belly.scale.set(1.25, 1.1, 0.85);
  belly.position.y = 0.17;
  torso.add(belly);

  const chest = shadowed(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.2, 6, 18), clayMat(CLAY)),
  );
  chest.scale.set(1.25, 1, 0.8);
  chest.position.y = 0.4;
  torso.add(chest);

  for (const side of [-1, 1]) {
    const shoulder = shadowed(
      new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), clayMat(CLAY)),
    );
    shoulder.position.set(side * 0.19, 0.53, 0);
    torso.add(shoulder);
  }

  const neck = shadowed(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.07, 4, 12), clayMat(CLAY)),
  );
  neck.position.y = 0.6;
  torso.add(neck);

  const headG = new THREE.Group();
  headG.position.y = 0.63;
  torso.add(headG);
  const head = shadowed(
    new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 20), clayMat(CLAY)),
  );
  head.scale.set(0.95, 1.12, 1.0);
  head.position.y = 0.12;
  headG.add(head);

  /* arms — red wrist wraps at the ends */
  const wrap = () =>
    shadowed(
      new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), clayMat(ACCENT)),
    );

  const armL = limb(0.28, 0.05, CLAY);
  armL.position.set(-0.22, 0.53, 0);
  torso.add(armL);
  const foreL = limb(0.26, 0.045, CLAY);
  foreL.position.y = -0.28;
  armL.add(foreL);
  const handL = wrap();
  handL.position.y = -0.26;
  foreL.add(handL);

  const armR = limb(0.28, 0.05, CLAY);
  armR.position.set(0.22, 0.53, 0);
  torso.add(armR);
  const foreR = limb(0.26, 0.045, CLAY);
  foreR.position.y = -0.28;
  armR.add(foreR);
  const handR = wrap();
  handR.position.y = -0.26;
  foreR.add(handR);

  /* legs — dark thighs blend into the shorts, pill feet */
  const buildLeg = (side: -1 | 1) => {
    const leg = limb(0.45, 0.072, CLAY_DARK);
    leg.position.set(side * 0.1, -0.03, 0);
    root.add(leg);
    const shin = limb(0.45, 0.058, CLAY);
    shin.position.y = -0.45;
    leg.add(shin);
    const foot = new THREE.Group();
    foot.position.y = -0.45;
    shin.add(foot);
    const shoe = shadowed(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.12, 4, 12), clayMat(CLAY_DARK)),
    );
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(0, -0.02, 0.05);
    foot.add(shoe);
    return { leg, shin, foot };
  };
  const L = buildLeg(-1);
  const R = buildLeg(1);

  return {
    root,
    torso,
    headG,
    armL,
    armR,
    foreL,
    foreR,
    legL: L.leg,
    legR: R.leg,
    shinL: L.shin,
    shinR: R.shin,
    footL: L.foot,
    footR: R.foot,
  };
}

/* reset all joints to a neutral standing pose */
function resetPose(r: Rig) {
  r.root.position.set(0, 0.95, 0);
  r.root.rotation.set(0, 0, 0);
  for (const g of [
    r.torso, r.headG, r.armL, r.armR, r.foreL, r.foreR,
    r.legL, r.legR, r.shinL, r.shinR, r.footL, r.footR,
  ]) {
    g.rotation.set(0, 0, 0);
  }
  r.armL.rotation.z = -0.07; // relaxed A-pose so arms don't clip the body
  r.armR.rotation.z = 0.07;
}

/* boxing guard: elbows tucked, hands at chin */
function guard(r: Rig) {
  r.armL.rotation.x = -0.5;
  r.armR.rotation.x = -0.5;
  r.foreL.rotation.x = -1.9;
  r.foreR.rotation.x = -1.9;
}

/* smooth 0→1→0 loop with a soft dwell at both ends */
const smooth = (k: number) => k * k * (3 - 2 * k);
const wave = (t: number, period: number) =>
  smooth((1 - Math.cos((2 * Math.PI * t) / period)) / 2);
/* one-way eased ramp 0→1 inside [a,b] of a phase */
const ramp = (p: number, a: number, b: number) =>
  smooth(Math.min(1, Math.max(0, (p - a) / (b - a))));

/* --------------------------------------------------------------------------
   shared pose families
   -------------------------------------------------------------------------- */

/* straight-arm plank (push-up top), face down. k bends the elbows 0→1. */
function plankBase(r: Rig, k = 0) {
  r.root.rotation.x = Math.PI / 2 - 0.1;
  r.root.position.y = 0.45 - 0.17 * k;
  r.legL.rotation.x = -0.18; // body one straight line, feet trailing
  r.legR.rotation.x = -0.18;
  r.footL.rotation.x = -0.3; // toes tucked
  r.footR.rotation.x = -0.3;
  r.armL.rotation.x = -1.42 + 0.8 * k; // elbows travel up-back as chest drops
  r.armR.rotation.x = -1.42 + 0.8 * k;
  r.foreL.rotation.x = -0.85 * k;
  r.foreR.rotation.x = -0.85 * k;
  r.headG.rotation.x = 0.45; // eyes just ahead of the hands
}

/* lying on the back, knees bent, feet planted */
function supineBase(r: Rig) {
  r.root.rotation.x = -Math.PI / 2 + 0.05;
  r.root.position.y = 0.22;
  r.legL.rotation.x = -1.0;
  r.legR.rotation.x = -1.0;
  r.shinL.rotation.x = 1.6;
  r.shinR.rotation.x = 1.6;
}

/* face down on the floor */
function proneBase(r: Rig) {
  r.root.rotation.x = Math.PI / 2 - 0.04;
  r.root.position.y = 0.16;
  r.footL.rotation.x = 0.5;
  r.footR.rotation.x = 0.5;
}

/* on all fours: torso horizontal, thighs vertical, shins on the floor */
function quadrupedBase(r: Rig) {
  r.root.position.y = 0.47;
  r.torso.rotation.x = 1.42;
  r.legL.rotation.x = 0.05;
  r.legR.rotation.x = 0.05;
  r.shinL.rotation.x = 1.5;
  r.shinR.rotation.x = 1.5;
  r.footL.rotation.x = 0.6; // tops of the feet lie flat
  r.footR.rotation.x = 0.6;
  r.armL.rotation.x = -1.5;
  r.armR.rotation.x = -1.5;
  r.headG.rotation.x = 0.25; // look at the floor just ahead
}

/* --------------------------------------------------------------------------
   the animation library — one function per demo preset
   -------------------------------------------------------------------------- */
type Anim = (t: number, r: Rig) => void;

const ANIMS: Record<DemoPreset, Anim> = {
  /* ------------------------------ technique ----------------------------- */
  jab(t, r) {
    guard(r);
    const cycle = t % 2;
    r.root.rotation.y = -0.35; // bladed stance
    r.legL.rotation.x = -0.15;
    r.legR.rotation.x = 0.15;
    if (cycle < 1) {
      const k = Math.sin(Math.PI * Math.min(cycle / 0.45, 1)); // lead jab
      r.armL.rotation.x = -0.5 - 1.05 * k;
      r.foreL.rotation.x = -1.9 + 1.85 * k;
      r.root.rotation.y = -0.35 + 0.12 * k;
    } else {
      const k = Math.sin(Math.PI * Math.min((cycle - 1) / 0.45, 1)); // rear cross
      r.armR.rotation.x = -0.5 - 1.05 * k;
      r.foreR.rotation.x = -1.9 + 1.85 * k;
      r.root.rotation.y = -0.35 + 0.45 * k; // hips rotate through
      r.torso.rotation.y = 0.25 * k;
    }
  },
  hook(t, r) {
    guard(r);
    const k = Math.sin(Math.PI * ((t % 1.6) / 1.6));
    r.root.rotation.y = -0.2 + 0.8 * k; // whole body turns
    r.torso.rotation.y = 0.4 * k;
    r.armL.rotation.x = -1.35;
    r.armL.rotation.z = -0.4 - 0.9 * k; // horizontal arc
    r.foreL.rotation.x = -1.5;
    r.legL.rotation.y = 0.4 * k; // pivot the lead foot
  },
  uppercut(t, r) {
    guard(r);
    const cycle = t % 1.6;
    const lead = cycle < 0.8;
    const k = Math.sin(Math.PI * ((cycle % 0.8) / 0.8));
    r.root.rotation.y = -0.3;
    r.root.position.y = 0.95 - 0.12 * k; // dip from the legs...
    r.legL.rotation.x = -0.5 * k;
    r.legR.rotation.x = -0.5 * k;
    r.shinL.rotation.x = 0.6 * k;
    r.shinR.rotation.x = 0.6 * k;
    const arm = lead ? r.armL : r.armR; // ...then dig up
    const fore = lead ? r.foreL : r.foreR;
    arm.rotation.x = -0.5 - 0.5 * k;
    fore.rotation.x = -1.9 - 0.45 * k;
    r.torso.rotation.y = (lead ? 0.25 : -0.25) * k;
  },
  slip(t, r) {
    guard(r);
    const s = Math.sin(t * 2.4);
    r.root.rotation.y = -0.25;
    r.torso.rotation.z = 0.42 * s; // head off the centre line
    r.torso.rotation.x = 0.25 * Math.abs(s);
    r.headG.rotation.z = 0.15 * s;
    r.root.position.y = 0.95 - 0.1 * Math.abs(s);
    r.legL.rotation.x = -0.3 * Math.abs(s);
    r.legR.rotation.x = -0.3 * Math.abs(s);
    r.shinL.rotation.x = 0.4 * Math.abs(s);
    r.shinR.rotation.x = 0.4 * Math.abs(s);
  },
  footwork(t, r) {
    guard(r);
    const bounce = Math.abs(Math.sin(t * 4));
    const side = Math.sin(t * 1.3);
    r.root.rotation.y = -0.3;
    r.root.position.y = 0.93 + 0.05 * bounce;
    r.root.position.x = 0.3 * side; // gliding side to side
    r.legL.rotation.x = -0.18 - 0.2 * bounce;
    r.legR.rotation.x = 0.12 + 0.2 * bounce;
    r.shinL.rotation.x = 0.3 * bounce;
    r.shinR.rotation.x = 0.3 * bounce;
  },
  shadowbox(t, r) {
    guard(r);
    const bounce = Math.abs(Math.sin(t * 3.4));
    r.root.rotation.y = -0.3;
    r.root.position.y = 0.93 + 0.04 * bounce;
    r.legL.rotation.x = -0.15;
    r.legR.rotation.x = 0.15;
    const p = t % 4; // jab → cross → slip → hook, on repeat
    if (p < 1) {
      const k = Math.sin(Math.PI * Math.min(p / 0.4, 1));
      r.armL.rotation.x = -0.5 - 1.05 * k;
      r.foreL.rotation.x = -1.9 + 1.85 * k;
    } else if (p < 2) {
      const k = Math.sin(Math.PI * Math.min((p - 1) / 0.4, 1));
      r.armR.rotation.x = -0.5 - 1.05 * k;
      r.foreR.rotation.x = -1.9 + 1.85 * k;
      r.root.rotation.y = -0.3 + 0.4 * k;
      r.torso.rotation.y = 0.25 * k;
    } else if (p < 3) {
      const k = Math.sin(Math.PI * (p - 2));
      r.torso.rotation.z = 0.4 * k;
      r.torso.rotation.x = 0.2 * k;
      r.root.position.y = 0.93 - 0.08 * k;
    } else {
      const k = Math.sin(Math.PI * Math.min((p - 3) / 0.5, 1));
      r.root.rotation.y = -0.3 + 0.7 * k;
      r.torso.rotation.y = 0.35 * k;
      r.armL.rotation.x = -1.35 * Math.max(k, 0.37);
      r.armL.rotation.z = -0.4 - 0.9 * k;
      r.foreL.rotation.x = -1.5;
    }
  },

  /* ----------------------------- push family ----------------------------- */
  wallpushup(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = 0.3 + 0.1 * k; // straight body leaning to the wall
    r.root.position.y = 0.93;
    r.root.position.z = 0.05 + 0.06 * k;
    r.armL.rotation.x = -1.35 + 0.45 * k;
    r.armR.rotation.x = -1.35 + 0.45 * k;
    r.foreL.rotation.x = -0.9 * k;
    r.foreR.rotation.x = -0.9 * k;
    r.headG.rotation.x = 0.2;
  },
  kneepushup(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = Math.PI / 2 - 0.42;
    r.root.position.y = 0.44 - 0.13 * k;
    r.legL.rotation.x = -0.55; // kneeling, shins folded up behind
    r.legR.rotation.x = -0.55;
    r.shinL.rotation.x = 1.45;
    r.shinR.rotation.x = 1.45;
    r.armL.rotation.x = -1.35 + 0.7 * k;
    r.armR.rotation.x = -1.35 + 0.7 * k;
    r.foreL.rotation.x = -0.75 * k;
    r.foreR.rotation.x = -0.75 * k;
    r.headG.rotation.x = 0.45;
  },
  pushup(t, r) {
    plankBase(r, wave(t, 2.2));
  },
  inclinepushup(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = Math.PI / 2 - 0.55; // hands on the bench ahead
    r.root.position.y = 0.6 - 0.12 * k;
    r.legL.rotation.x = -0.18;
    r.legR.rotation.x = -0.18;
    r.footL.rotation.x = -0.3;
    r.footR.rotation.x = -0.3;
    r.armL.rotation.x = -1.35 + 0.65 * k;
    r.armR.rotation.x = -1.35 + 0.65 * k;
    r.foreL.rotation.x = -0.7 * k;
    r.foreR.rotation.x = -0.7 * k;
    r.headG.rotation.x = 0.35;
  },
  declinepushup(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = Math.PI / 2 - 0.02; // feet up on the bench behind
    r.root.position.y = 0.52 - 0.16 * k;
    r.legL.rotation.x = 0.12;
    r.legR.rotation.x = 0.12;
    r.armL.rotation.x = -1.5 + 0.85 * k;
    r.armR.rotation.x = -1.5 + 0.85 * k;
    r.foreL.rotation.x = -0.85 * k;
    r.foreR.rotation.x = -0.85 * k;
    r.headG.rotation.x = 0.5;
  },
  archerpushup(t, r) {
    const cycle = t % 4.4;
    const left = cycle < 2.2;
    const k = wave(cycle % 2.2, 2.2);
    plankBase(r, 0);
    const bendArm = left ? r.armL : r.armR;
    const bendFore = left ? r.foreL : r.foreR;
    const straight = left ? r.armR : r.armL;
    r.root.position.y = 0.42 - 0.14 * k;
    r.root.position.x = (left ? -0.14 : 0.14) * k; // slide over the working arm
    bendArm.rotation.x = -1.42 + 0.75 * k;
    bendFore.rotation.x = -0.8 * k;
    straight.rotation.x = -1.35;
    straight.rotation.z = (left ? -0.9 : 0.9) * k; // other arm stays long
  },
  pikepushup(t, r) {
    const k = wave(t, 2.4);
    r.root.rotation.x = Math.PI / 2 + 0.55; // inverted V, hips are the apex
    r.root.position.y = 0.76 - 0.08 * k;
    r.legL.rotation.x = -1.6; // sharp fold at the hips, feet planted behind
    r.legR.rotation.x = -1.6;
    r.armL.rotation.x = -2.35 + 0.25 * k; // arms continue the torso line down
    r.armR.rotation.x = -2.35 + 0.25 * k;
    r.foreL.rotation.x = -0.5 * k;
    r.foreR.rotation.x = -0.5 * k;
    r.headG.rotation.x = 0.3;
  },
  handstand(t, r) {
    const sway = 0.03 * Math.sin(t * 1.8);
    r.root.rotation.x = Math.PI + 0.05; // fully inverted, heels on the wall
    r.root.position.y = 1.14;
    r.root.position.z = -0.28;
    r.armL.rotation.x = Math.PI - 0.12 + sway;
    r.armR.rotation.x = Math.PI - 0.12 - sway;
    r.legL.rotation.x = -0.08;
    r.legR.rotation.x = -0.08;
    r.torso.rotation.x = 0.05;
    r.headG.rotation.x = -0.5; // look at the floor
  },
  shouldertap(t, r) {
    plankBase(r, 0);
    const cycle = t % 1.8;
    const left = cycle < 0.9;
    const k = Math.sin(Math.PI * ((cycle % 0.9) / 0.9));
    const arm = left ? r.armL : r.armR;
    const fore = left ? r.foreL : r.foreR;
    arm.rotation.x = -1.42 + 0.6 * k;
    fore.rotation.x = -1.9 * k; // hand to the opposite shoulder
    fore.rotation.z = (left ? 0.5 : -0.5) * k;
    r.torso.rotation.z = (left ? -0.06 : 0.06) * k;
  },
  plankup(t, r) {
    const k = wave(t, 2.6); // 0 = straight arms, 1 = forearms
    plankBase(r, 0);
    r.root.position.y = 0.42 - 0.07 * k;
    const stagger = 0.12 * Math.sin(t * 2.4); // arms move one after the other
    r.armL.rotation.x = -1.42 - 0.12 * (k + stagger * k);
    r.armR.rotation.x = -1.42 - 0.12 * (k - stagger * k);
    r.foreL.rotation.x = -1.35 * k; // forearms come flat to the floor
    r.foreR.rotation.x = -1.35 * k;
  },
  dip(t, r) {
    const k = wave(t, 2.0); // seated dip on the bench edge behind
    r.root.position.y = 0.48 - 0.11 * k;
    r.root.position.z = 0.06;
    r.legL.rotation.x = -1.2; // heels planted out front
    r.legR.rotation.x = -1.2;
    r.shinL.rotation.x = 0.75;
    r.shinR.rotation.x = 0.75;
    r.footL.rotation.x = -0.5; // heels down, toes up
    r.footR.rotation.x = -0.5;
    r.torso.rotation.x = 0.1;
    r.armL.rotation.x = 0.35 + 0.4 * k; // arms braced on the edge behind
    r.armR.rotation.x = 0.35 + 0.4 * k;
    r.foreL.rotation.x = -0.5 * k;
    r.foreR.rotation.x = -0.5 * k;
  },

  /* --------------------------------- core -------------------------------- */
  plank(t, r) {
    const breathe = 0.012 * Math.sin(t * 2);
    r.root.rotation.x = Math.PI / 2 - 0.13; // forearm plank
    r.root.position.y = 0.38 + breathe;
    r.legL.rotation.x = -0.24;
    r.legR.rotation.x = -0.24;
    r.footL.rotation.x = -0.3;
    r.footR.rotation.x = -0.3;
    r.armL.rotation.x = -1.5;
    r.armR.rotation.x = -1.5;
    r.foreL.rotation.x = -1.35; // forearms flat on the floor
    r.foreR.rotation.x = -1.35;
    r.headG.rotation.x = 0.45;
  },
  sideplank(t, r) {
    const k = 0.04 * Math.sin(t * 2); // steady hold, tiny hip motion
    r.root.rotation.z = -1.35; // body one line, right side down
    r.root.position.y = 0.27 + k;
    r.armR.rotation.z = 1.35; // support arm straight down to the floor
    r.foreR.rotation.x = -0.55; // forearm flat, bracing
    r.armL.rotation.z = -1.79; // top arm reaches to the ceiling
    r.legL.rotation.z = -0.06; // feet stacked
    r.headG.rotation.z = 0.4;
  },
  plankjack(t, r) {
    plankBase(r, 0);
    const k = wave(t, 0.9);
    const hop = Math.sin(Math.PI * ((t % 0.9) / 0.9));
    r.root.position.y = 0.42 + 0.03 * hop;
    r.legL.rotation.z = -0.42 * k; // feet hop wide and back
    r.legR.rotation.z = 0.42 * k;
  },
  climber(t, r) {
    r.root.rotation.x = Math.PI / 2 - 0.3;
    r.root.position.y = 0.5;
    r.footL.rotation.x = -0.3;
    r.footR.rotation.x = -0.3;
    r.armL.rotation.x = -1.5;
    r.armR.rotation.x = -1.5;
    const s = Math.sin(t * 6);
    r.legL.rotation.x = -0.25 - 0.95 * Math.max(0, s); // alternating knee drives
    r.shinL.rotation.x = 1.15 * Math.max(0, s);
    r.legR.rotation.x = -0.25 - 0.95 * Math.max(0, -s);
    r.shinR.rotation.x = 1.15 * Math.max(0, -s);
    r.headG.rotation.x = 0.45;
  },
  situp(t, r) {
    const k = wave(t, 2.4);
    supineBase(r);
    r.torso.rotation.x = -1.25 * k; // curl up
    r.armL.rotation.x = -1.4 - 0.4 * k;
    r.armR.rotation.x = -1.4 - 0.4 * k;
    r.foreL.rotation.x = -1.2;
    r.foreR.rotation.x = -1.2;
    r.headG.rotation.x = -0.3 * k;
  },
  bicycle(t, r) {
    supineBase(r);
    r.root.position.y = 0.26;
    r.torso.rotation.x = -0.55; // shoulders held off the floor
    r.armL.rotation.x = -1.6; // hands by the temples
    r.armR.rotation.x = -1.6;
    r.foreL.rotation.x = -1.6;
    r.foreR.rotation.x = -1.6;
    const s = Math.sin(t * 3);
    const kL = Math.max(0, s);
    const kR = Math.max(0, -s);
    r.legL.rotation.x = -0.5 - 0.9 * kL; // knee in ↔ leg long
    r.shinL.rotation.x = 0.4 + 1.2 * kL;
    r.legR.rotation.x = -0.5 - 0.9 * kR;
    r.shinR.rotation.x = 0.4 + 1.2 * kR;
    r.torso.rotation.y = 0.3 * s; // elbow chases the opposite knee
  },
  legraise(t, r) {
    const k = wave(t, 2.6);
    supineBase(r);
    r.legL.rotation.x = -0.08 - 1.35 * k; // straight legs to vertical
    r.legR.rotation.x = -0.08 - 1.35 * k;
    r.shinL.rotation.x = 0;
    r.shinR.rotation.x = 0;
    r.armL.rotation.x = -0.1; // hands under the hips
    r.armR.rotation.x = -0.1;
  },
  flutter(t, r) {
    supineBase(r);
    r.torso.rotation.x = -0.18;
    const s = Math.sin(t * 7);
    r.legL.rotation.x = -0.3 - 0.22 * Math.max(0, s);
    r.legR.rotation.x = -0.3 - 0.22 * Math.max(0, -s);
    r.shinL.rotation.x = 0;
    r.shinR.rotation.x = 0;
    r.armL.rotation.x = -0.1;
    r.armR.rotation.x = -0.1;
  },
  vup(t, r) {
    const k = wave(t, 2.6);
    supineBase(r);
    r.torso.rotation.x = -1.05 * k; // both halves fold together
    r.legL.rotation.x = -0.06 - 1.05 * k;
    r.legR.rotation.x = -0.06 - 1.05 * k;
    r.shinL.rotation.x = 0;
    r.shinR.rotation.x = 0;
    r.armL.rotation.x = -2.8 + 1.5 * k; // arms sweep from overhead to the feet
    r.armR.rotation.x = -2.8 + 1.5 * k;
  },
  hollow(t, r) {
    const rock = 0.05 * Math.sin(t * 2.2);
    supineBase(r);
    r.root.position.y = 0.24;
    r.torso.rotation.x = -0.42 + rock; // shoulders and legs hover
    r.legL.rotation.x = -0.3 - rock;
    r.legR.rotation.x = -0.3 - rock;
    r.shinL.rotation.x = 0;
    r.shinR.rotation.x = 0;
    r.armL.rotation.x = -2.75; // arms by the ears
    r.armR.rotation.x = -2.75;
  },
  deadbug(t, r) {
    supineBase(r);
    const cycle = t % 3.2;
    const left = cycle < 1.6;
    const k = wave(cycle % 1.6, 1.6);
    /* start: arms to the ceiling, knees over hips */
    r.armL.rotation.x = -1.55;
    r.armR.rotation.x = -1.55;
    r.legL.rotation.x = -1.5;
    r.legR.rotation.x = -1.5;
    r.shinL.rotation.x = 1.5;
    r.shinR.rotation.x = 1.5;
    /* opposite arm + leg reach away */
    const arm = left ? r.armL : r.armR;
    const leg = left ? r.legR : r.legL;
    const shin = left ? r.shinR : r.shinL;
    arm.rotation.x = -1.55 - 1.15 * k; // overhead
    leg.rotation.x = -1.5 + 1.2 * k; // leg extends long
    shin.rotation.x = 1.5 - 1.3 * k;
  },
  twist(t, r) {
    const s = Math.sin(t * 2.6);
    r.root.rotation.x = -Math.PI / 2 + 0.7; // leaned-back V-sit
    r.root.position.y = 0.33; // seat on the floor
    r.legL.rotation.x = -1.35;
    r.legR.rotation.x = -1.35;
    r.shinL.rotation.x = 1.2;
    r.shinR.rotation.x = 1.2;
    r.torso.rotation.y = 0.7 * s; // shoulders rotate side to side
    r.armL.rotation.x = -1.8; // hands held in front of the chest
    r.armR.rotation.x = -1.8;
    r.foreL.rotation.x = -0.6;
    r.foreR.rotation.x = -0.6;
    r.headG.rotation.y = -0.3 * s;
  },

  /* --------------------------------- back -------------------------------- */
  superman(t, r) {
    const k = wave(t, 2.4);
    proneBase(r);
    r.torso.rotation.x = 0.32 * k; // chest lifts
    r.armL.rotation.x = Math.PI - 0.3 - 0.25 * k; // arms reach forward/up
    r.armR.rotation.x = Math.PI - 0.3 - 0.25 * k;
    r.legL.rotation.x = 0.35 * k; // legs lift
    r.legR.rotation.x = 0.35 * k;
    r.headG.rotation.x = 0.35 * k;
  },
  swimmer(t, r) {
    proneBase(r);
    r.torso.rotation.x = 0.18;
    const s = Math.sin(t * 3.4);
    r.armL.rotation.x = Math.PI - 0.35 - 0.3 * Math.max(0, s);
    r.armR.rotation.x = Math.PI - 0.35 - 0.3 * Math.max(0, -s);
    r.legR.rotation.x = 0.4 * Math.max(0, s); // opposite leg answers
    r.legL.rotation.x = 0.4 * Math.max(0, -s);
    r.headG.rotation.x = 0.25;
  },
  snowangel(t, r) {
    const k = wave(t, 3);
    proneBase(r);
    r.torso.rotation.x = 0.2; // chest held up throughout
    r.armL.rotation.x = 0.3; // arms hover off the floor...
    r.armR.rotation.x = 0.3;
    r.armL.rotation.z = -0.25 - 2.4 * k; // ...and sweep hips → overhead
    r.armR.rotation.z = 0.25 + 2.4 * k;
    r.headG.rotation.x = 0.25;
  },
  birddog(t, r) {
    quadrupedBase(r);
    const cycle = t % 3.6;
    const left = cycle < 1.8;
    const k = wave(cycle % 1.8, 1.8);
    const arm = left ? r.armL : r.armR;
    const leg = left ? r.legR : r.legL;
    const shin = left ? r.shinR : r.shinL;
    arm.rotation.x = -1.5 - 1.65 * k; // arm reaches out level
    leg.rotation.x = 0.05 + 1.35 * k; // opposite leg extends back
    shin.rotation.x = 1.5 * (1 - k);
  },
  goodmorning(t, r) {
    const k = wave(t, 2.6);
    r.root.position.y = 0.95 - 0.07 * k;
    r.root.position.z = -0.08 * k; // hips ride back
    r.torso.rotation.x = 1.15 * k; // flat-back hinge
    r.legL.rotation.x = -0.22 * k;
    r.legR.rotation.x = -0.22 * k;
    r.shinL.rotation.x = 0.18 * k;
    r.shinR.rotation.x = 0.18 * k;
    r.armL.rotation.x = -1.55; // hands behind the head
    r.armR.rotation.x = -1.55;
    r.foreL.rotation.x = -1.9;
    r.foreR.rotation.x = -1.9;
    r.armL.rotation.z = -0.55;
    r.armR.rotation.z = 0.55;
    r.headG.rotation.x = 0.3 * k;
  },

  /* --------------------------------- legs -------------------------------- */
  squat(t, r) {
    const k = wave(t, 2.4);
    r.root.position.y = 0.95 - 0.34 * k;
    r.legL.rotation.x = -1.5 * k;
    r.legR.rotation.x = -1.5 * k;
    r.shinL.rotation.x = 1.7 * k;
    r.shinR.rotation.x = 1.7 * k;
    r.torso.rotation.x = 0.35 * k;
    r.armL.rotation.x = -0.5 - 0.9 * k; // arms reach forward for balance
    r.armR.rotation.x = -0.5 - 0.9 * k;
  },
  sumosquat(t, r) {
    const k = wave(t, 2.4);
    r.root.position.y = 0.95 - 0.3 * k;
    r.legL.rotation.z = -0.4; // wide stance, toes out
    r.legR.rotation.z = 0.4;
    r.legL.rotation.y = 0.5;
    r.legR.rotation.y = -0.5;
    r.legL.rotation.x = -1.35 * k;
    r.legR.rotation.x = -1.35 * k;
    r.shinL.rotation.x = 1.55 * k;
    r.shinR.rotation.x = 1.55 * k;
    r.torso.rotation.x = 0.15 * k;
    r.armL.rotation.x = -0.4 - 0.8 * k;
    r.armR.rotation.x = -0.4 - 0.8 * k;
  },
  squatjump(t, r) {
    const cycle = (t % 1.6) / 1.6;
    if (cycle < 0.5) {
      const k = Math.sin(Math.PI * (cycle / 0.5)); // load the squat
      r.root.position.y = 0.95 - 0.32 * k;
      r.legL.rotation.x = -1.4 * k;
      r.legR.rotation.x = -1.4 * k;
      r.shinL.rotation.x = 1.6 * k;
      r.shinR.rotation.x = 1.6 * k;
      r.torso.rotation.x = 0.3 * k;
      r.armL.rotation.x = 0.7 * k; // arms swing back
      r.armR.rotation.x = 0.7 * k;
    } else {
      const k = Math.sin(Math.PI * ((cycle - 0.5) / 0.5)); // fly
      r.root.position.y = 0.95 + 0.42 * k;
      r.armL.rotation.x = -2.6 * k; // arms drive overhead
      r.armR.rotation.x = -2.6 * k;
      r.legL.rotation.x = -0.15 * k;
      r.legR.rotation.x = -0.15 * k;
      r.footL.rotation.x = 0.5 * k; // toes point in the air
      r.footR.rotation.x = 0.5 * k;
    }
  },
  pistol(t, r) {
    const k = wave(t, 3.2);
    r.root.position.y = 0.95 - 0.5 * k;
    r.legR.rotation.x = -1.85 * k; // standing leg folds deep
    r.shinR.rotation.x = 2.15 * k;
    r.legL.rotation.x = -0.2 - 1.3 * k; // free leg reaches long
    r.shinL.rotation.x = 0.3 * (1 - k);
    r.torso.rotation.x = 0.5 * k;
    r.armL.rotation.x = -0.4 - 1.0 * k; // arms counterbalance
    r.armR.rotation.x = -0.4 - 1.0 * k;
  },
  lunge(t, r) {
    const k = wave(t, 2.6);
    r.root.position.y = 0.95 - 0.3 * k;
    r.legL.rotation.x = -1.2 * k; // front leg
    r.shinL.rotation.x = 1.3 * k;
    r.legR.rotation.x = 0.7 * k; // rear leg extends back
    r.shinR.rotation.x = 0.9 * k;
    r.footR.rotation.x = -0.7 * k; // rear toes tucked
    r.torso.rotation.x = 0.08 * k;
    guard(r);
  },
  reverselunge(t, r) {
    const k = wave(t, 2.6);
    r.root.position.y = 0.95 - 0.28 * k;
    r.root.position.z = -0.06 * k; // weight stays on the front foot
    r.legR.rotation.x = -1.05 * k; // front leg bends in place
    r.shinR.rotation.x = 1.2 * k;
    r.legL.rotation.x = 0.85 * k; // rear leg steps away back
    r.shinL.rotation.x = 1.0 * k;
    r.footL.rotation.x = -0.7 * k;
    r.torso.rotation.x = 0.1 * k;
    r.armL.rotation.x = -0.4 - 0.4 * k;
    r.armR.rotation.x = -0.4 - 0.4 * k;
  },
  sidelunge(t, r) {
    const cycle = t % 2.4;
    const left = cycle < 1.2;
    const k = Math.sin(Math.PI * ((cycle % 1.2) / 1.2));
    const bendLeg = left ? r.legL : r.legR;
    const bendShin = left ? r.shinL : r.shinR;
    const straight = left ? r.legR : r.legL;
    r.root.position.y = 0.95 - 0.24 * k;
    r.root.position.x = (left ? -0.22 : 0.22) * k;
    bendLeg.rotation.x = -1.1 * k;
    bendShin.rotation.x = 1.3 * k;
    straight.rotation.z = (left ? 0.55 : -0.55) * k; // other leg stays long
    r.torso.rotation.x = 0.25 * k;
    r.armL.rotation.x = -0.6 * k;
    r.armR.rotation.x = -0.6 * k;
  },
  jumplunge(t, r) {
    const cycle = t % 1.4;
    const leftFront = Math.floor(t / 1.4) % 2 === 0;
    const air = Math.sin(Math.PI * Math.min(cycle / 0.5, 1)) * (cycle < 0.5 ? 1 : 0);
    const k = cycle < 0.5 ? 1 - air : 1; // deep in the lunge between hops
    const front = leftFront ? r.legL : r.legR;
    const frontShin = leftFront ? r.shinL : r.shinR;
    const rear = leftFront ? r.legR : r.legL;
    const rearShin = leftFront ? r.shinR : r.shinL;
    r.root.position.y = 0.7 + 0.32 * air;
    front.rotation.x = -1.1 * k;
    frontShin.rotation.x = 1.25 * k;
    rear.rotation.x = 0.65 * k;
    rearShin.rotation.x = 0.95 * k;
    guard(r);
  },
  bulgarian(t, r) {
    const k = wave(t, 2.4);
    r.root.position.y = 0.88 - 0.26 * k;
    r.root.position.z = 0.08;
    r.legR.rotation.x = 0.6; // rear foot rests on the bench behind
    r.shinR.rotation.x = 1.3;
    r.legL.rotation.x = -1.05 * k; // front leg does the work
    r.shinL.rotation.x = 1.25 * k;
    r.torso.rotation.x = 0.18 * k;
    r.armL.rotation.x = -0.5 - 0.5 * k;
    r.armR.rotation.x = -0.5 - 0.5 * k;
  },
  stepup(t, r) {
    const k = wave(t, 2.8); // 0 = floor, 1 = standing tall on the box
    r.root.position.y = 0.95 + 0.3 * k;
    r.root.position.z = 0.16 * k;
    r.legL.rotation.x = -1.15 * (1 - k); // lead foot starts up on the box
    r.shinL.rotation.x = 1.35 * (1 - k);
    r.legR.rotation.x = 0.25 * k; // trailing leg leaves the floor
    r.shinR.rotation.x = 0.35 * k;
    r.torso.rotation.x = 0.15 * (1 - k);
    r.armL.rotation.x = -0.4 * k;
    r.armR.rotation.x = -0.3 * (1 - k);
  },
  wallsit(t, r) {
    const breathe = 0.012 * Math.sin(t * 2.2); // static hold
    r.root.position.y = 0.6 + breathe;
    r.root.position.z = -0.12;
    r.legL.rotation.x = -1.55;
    r.legR.rotation.x = -1.55;
    r.shinL.rotation.x = 1.55;
    r.shinR.rotation.x = 1.55;
    r.torso.rotation.x = -0.06;
    r.armL.rotation.x = -0.25;
    r.armR.rotation.x = -0.25;
  },
  calfraise(t, r) {
    const k = wave(t, 1.8);
    r.root.position.y = 0.95 + 0.08 * k; // rise to the toes
    r.footL.rotation.x = 0.55 * k;
    r.footR.rotation.x = 0.55 * k;
    r.armL.rotation.x = -0.15;
    r.armR.rotation.x = -0.15;
  },
  bridge(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = -Math.PI / 2 + 0.05;
    r.root.position.y = 0.2 + 0.16 * k; // hips drive up
    r.legL.rotation.x = -1.1;
    r.legR.rotation.x = -1.1;
    r.shinL.rotation.x = 1.7 - 0.3 * k;
    r.shinR.rotation.x = 1.7 - 0.3 * k;
    r.torso.rotation.x = 0.28 * k;
    r.armL.rotation.x = 0.2;
    r.armR.rotation.x = 0.2;
  },
  singlebridge(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = -Math.PI / 2 + 0.05;
    r.root.position.y = 0.2 + 0.16 * k;
    r.legL.rotation.x = -1.1; // planted leg drives
    r.shinL.rotation.x = 1.7 - 0.3 * k;
    r.legR.rotation.x = -1.15; // free leg points straight up-forward
    r.shinR.rotation.x = 0;
    r.torso.rotation.x = 0.28 * k;
    r.armL.rotation.x = 0.2;
    r.armR.rotation.x = 0.2;
  },
  donkeykick(t, r) {
    quadrupedBase(r);
    const k = wave(t, 1.8);
    r.legR.rotation.x = 0.05 + 1.4 * k; // heel drives to the ceiling
    r.shinR.rotation.x = 1.5 - 0.25 * k; // knee stays bent
  },
  firehydrant(t, r) {
    quadrupedBase(r);
    const k = wave(t, 1.8);
    r.legR.rotation.z = 1.05 * k; // bent knee lifts out to the side
  },
  singledeadlift(t, r) {
    const k = wave(t, 2.8);
    r.root.position.y = 0.95 - 0.1 * k;
    r.torso.rotation.x = 1.05 * k; // flat-back hinge...
    r.legL.rotation.x = 1.3 * k; // ...free leg counterweights back
    r.shinL.rotation.x = 0;
    r.footL.rotation.x = -0.5 * k;
    r.legR.rotation.x = -0.25 * k; // standing knee stays soft
    r.shinR.rotation.x = 0.2 * k;
    r.armL.rotation.x = -0.2 - 0.9 * k; // arms hang toward the floor
    r.armR.rotation.x = -0.2 - 0.9 * k;
    r.headG.rotation.x = 0.3 * k;
  },

  /* ----------------------------- conditioning ---------------------------- */
  jack(t, r) {
    const k = wave(t, 0.9); // 0 closed → 1 star
    const hop = Math.sin(Math.PI * ((t % 0.9) / 0.9));
    r.root.position.y = 0.95 + 0.07 * hop;
    r.armL.rotation.z = -0.07 - 2.6 * k; // arms sweep overhead
    r.armR.rotation.z = 0.07 + 2.6 * k;
    r.legL.rotation.z = -0.45 * k; // feet jump wide
    r.legR.rotation.z = 0.45 * k;
  },
  highknees(t, r) {
    const s = Math.sin(t * 7);
    r.root.position.y = 0.98 + 0.03 * Math.abs(s);
    r.legL.rotation.x = -1.5 * Math.max(0, s); // sprint knees
    r.shinL.rotation.x = 1.3 * Math.max(0, s);
    r.legR.rotation.x = -1.5 * Math.max(0, -s);
    r.shinR.rotation.x = 1.3 * Math.max(0, -s);
    r.armL.rotation.x = -0.4 + 0.9 * s; // sprinter arms
    r.armR.rotation.x = -0.4 - 0.9 * s;
    r.foreL.rotation.x = -1.4;
    r.foreR.rotation.x = -1.4;
  },
  buttkick(t, r) {
    const s = Math.sin(t * 7);
    r.root.position.y = 0.97 + 0.02 * Math.abs(s);
    r.legL.rotation.x = 0.15 * Math.max(0, s); // thighs stay down...
    r.legR.rotation.x = 0.15 * Math.max(0, -s);
    r.shinL.rotation.x = 2.1 * Math.max(0, s); // ...heels snap to the glutes
    r.shinR.rotation.x = 2.1 * Math.max(0, -s);
    r.armL.rotation.x = -0.3 + 0.5 * s;
    r.armR.rotation.x = -0.3 - 0.5 * s;
    r.foreL.rotation.x = -1.2;
    r.foreR.rotation.x = -1.2;
  },
  fastfeet(t, r) {
    const s = Math.sin(t * 14); // machine-gun steps
    r.root.position.y = 0.83 + 0.015 * Math.abs(s);
    r.torso.rotation.x = 0.25;
    r.legL.rotation.x = -0.5 - 0.25 * Math.max(0, s);
    r.legR.rotation.x = -0.5 - 0.25 * Math.max(0, -s);
    r.shinL.rotation.x = 0.65;
    r.shinR.rotation.x = 0.65;
    guard(r);
  },
  burpee(t, r) {
    const p = (t % 3) / 3; // 3-phase cycle
    if (p < 0.33) {
      const k = ramp(p, 0, 0.33); // crouch down
      r.root.position.y = 0.95 - 0.5 * k;
      r.legL.rotation.x = -1.9 * k;
      r.legR.rotation.x = -1.9 * k;
      r.shinL.rotation.x = 2.1 * k;
      r.shinR.rotation.x = 2.1 * k;
      r.torso.rotation.x = 0.6 * k;
      r.armL.rotation.x = -0.5 - 1.2 * k;
      r.armR.rotation.x = -0.5 - 1.2 * k;
    } else if (p < 0.66) {
      const k = ramp(p, 0.33, 0.66); // kick to plank
      r.root.rotation.x = (Math.PI / 2 - 0.15) * k;
      r.root.position.y = 0.45 - 0.05 * k;
      r.armL.rotation.x = -1.7 + 0.25 * k;
      r.armR.rotation.x = -1.7 + 0.25 * k;
      r.legL.rotation.x = -1.9 * (1 - k) - 0.28 * k;
      r.legR.rotation.x = -1.9 * (1 - k) - 0.28 * k;
      r.shinL.rotation.x = 2.1 * (1 - k);
      r.shinR.rotation.x = 2.1 * (1 - k);
      r.footL.rotation.x = -0.3 * k;
      r.footR.rotation.x = -0.3 * k;
    } else {
      const k = ramp(p, 0.66, 1); // jump!
      const jump = Math.sin(Math.PI * k);
      r.root.position.y = 0.95 + 0.35 * jump;
      r.armL.rotation.x = -0.5 - 2.4 * jump; // arms overhead
      r.armR.rotation.x = -0.5 - 2.4 * jump;
      r.legL.rotation.x = -0.2 * (1 - k);
      r.legR.rotation.x = -0.2 * (1 - k);
    }
  },
  sprawl(t, r) {
    const p = (t % 2.2) / 2.2; // drop → hips down → pop back up
    if (p < 0.4) {
      const k = ramp(p, 0, 0.4);
      r.root.rotation.x = (Math.PI / 2 - 0.2) * k;
      r.root.position.y = 0.95 - 0.55 * k;
      r.armL.rotation.x = -0.5 - 1.1 * k;
      r.armR.rotation.x = -0.5 - 1.1 * k;
      r.legL.rotation.x = -0.3 * k;
      r.legR.rotation.x = -0.3 * k;
      r.footL.rotation.x = -0.3 * k;
      r.footR.rotation.x = -0.3 * k;
    } else if (p < 0.6) {
      r.root.rotation.x = Math.PI / 2 - 0.2; // hips low, chest proud
      r.root.position.y = 0.4;
      r.armL.rotation.x = -1.6;
      r.armR.rotation.x = -1.6;
      r.legL.rotation.x = -0.3;
      r.legR.rotation.x = -0.3;
      r.footL.rotation.x = -0.3;
      r.footR.rotation.x = -0.3;
      r.torso.rotation.x = 0.25;
    } else {
      const k = ramp(p, 0.6, 0.85); // snap back to the stance
      r.root.rotation.x = (Math.PI / 2 - 0.2) * (1 - k);
      r.root.position.y = 0.4 + 0.55 * k;
      r.armL.rotation.x = -1.6 + 1.1 * k;
      r.armR.rotation.x = -1.6 + 1.1 * k;
      guard(r);
      r.legL.rotation.x = -0.6 * (1 - k);
      r.legR.rotation.x = -0.6 * (1 - k);
      r.shinL.rotation.x = 0.8 * (1 - k);
      r.shinR.rotation.x = 0.8 * (1 - k);
    }
  },
  skater(t, r) {
    const s = Math.sin(t * 2.6);
    const landLeft = s > 0;
    const k = Math.abs(s);
    const air = Math.abs(Math.cos(t * 2.6));
    r.root.position.x = 0.34 * s; // bounding side to side
    r.root.position.y = 0.82 + 0.14 * air;
    const stand = landLeft ? r.legL : r.legR;
    const standShin = landLeft ? r.shinL : r.shinR;
    const sweep = landLeft ? r.legR : r.legL;
    const sweepShin = landLeft ? r.shinR : r.shinL;
    stand.rotation.x = -0.55 * k;
    standShin.rotation.x = 0.75 * k;
    sweep.rotation.x = 0.3 * k; // free leg sweeps behind
    sweep.rotation.z = (landLeft ? -0.5 : 0.5) * k;
    sweepShin.rotation.x = 0.9 * k;
    r.torso.rotation.x = 0.35 * k;
    r.armL.rotation.x = (landLeft ? 0.6 : -0.8) * k; // arms counter-swing
    r.armR.rotation.x = (landLeft ? -0.8 : 0.6) * k;
  },
  tuckjump(t, r) {
    const cycle = (t % 1.5) / 1.5;
    if (cycle < 0.45) {
      const k = Math.sin(Math.PI * (cycle / 0.45)); // load
      r.root.position.y = 0.95 - 0.28 * k;
      r.legL.rotation.x = -1.25 * k;
      r.legR.rotation.x = -1.25 * k;
      r.shinL.rotation.x = 1.45 * k;
      r.shinR.rotation.x = 1.45 * k;
      r.torso.rotation.x = 0.3 * k;
      r.armL.rotation.x = 0.7 * k;
      r.armR.rotation.x = 0.7 * k;
    } else {
      const k = Math.sin(Math.PI * ((cycle - 0.45) / 0.55)); // knees to chest
      r.root.position.y = 0.95 + 0.5 * k;
      r.legL.rotation.x = -1.9 * k;
      r.legR.rotation.x = -1.9 * k;
      r.shinL.rotation.x = 2.1 * k;
      r.shinR.rotation.x = 2.1 * k;
      r.armL.rotation.x = -0.9 * k; // arms reach for the shins
      r.armR.rotation.x = -0.9 * k;
      r.torso.rotation.x = 0.2 * k;
    }
  },
  bearcrawl(t, r) {
    r.root.position.y = 0.52; // all fours, knees hovering
    r.torso.rotation.x = 1.3;
    r.headG.rotation.x = 0.3;
    const s = Math.sin(t * 4);
    r.root.position.z = 0.06 * Math.sin(t * 2); // creeping rhythm
    r.armL.rotation.x = -1.45 - 0.3 * Math.max(0, s); // diagonal pairs step
    r.armR.rotation.x = -1.45 - 0.3 * Math.max(0, -s);
    r.legL.rotation.x = -0.55 - 0.3 * Math.max(0, -s);
    r.legR.rotation.x = -0.55 - 0.3 * Math.max(0, s);
    r.shinL.rotation.x = 1.35;
    r.shinR.rotation.x = 1.35;
    r.footL.rotation.x = -0.3;
    r.footR.rotation.x = -0.3;
  },
  inchworm(t, r) {
    const p = (t % 4.4) / 4.4; // fold → walk out → plank → walk back
    r.footL.rotation.x = 0;
    r.footR.rotation.x = 0;
    if (p < 0.2) {
      const k = ramp(p, 0, 0.2); // fold forward, hands to the floor
      r.root.position.y = 0.95 - 0.18 * k;
      r.torso.rotation.x = 1.5 * k;
      r.armL.rotation.x = -0.2 - 1.2 * k;
      r.armR.rotation.x = -0.2 - 1.2 * k;
      r.legL.rotation.x = -0.25 * k;
      r.legR.rotation.x = -0.25 * k;
      r.shinL.rotation.x = 0.2 * k;
      r.shinR.rotation.x = 0.2 * k;
      r.headG.rotation.x = -0.6 * k;
    } else if (p < 0.45) {
      const k = ramp(p, 0.2, 0.45); // hands walk out to a plank
      r.root.rotation.x = (Math.PI / 2 - 0.15) * k;
      r.root.position.y = 0.77 - 0.35 * k;
      r.torso.rotation.x = 1.5 * (1 - k);
      r.armL.rotation.x = -1.4 + 0.12 * Math.sin(t * 9);
      r.armR.rotation.x = -1.4 - 0.12 * Math.sin(t * 9);
      r.legL.rotation.x = -0.25 * (1 - k) - 0.28 * k;
      r.legR.rotation.x = -0.25 * (1 - k) - 0.28 * k;
      r.footL.rotation.x = -0.3 * k;
      r.footR.rotation.x = -0.3 * k;
    } else if (p < 0.6) {
      plankBase(r, 0); // hold the plank a beat
    } else if (p < 0.85) {
      const k = 1 - ramp(p, 0.6, 0.85); // walk the hands home
      r.root.rotation.x = (Math.PI / 2 - 0.15) * k;
      r.root.position.y = 0.77 - 0.35 * k;
      r.torso.rotation.x = 1.5 * (1 - k);
      r.armL.rotation.x = -1.4 + 0.12 * Math.sin(t * 9);
      r.armR.rotation.x = -1.4 - 0.12 * Math.sin(t * 9);
      r.legL.rotation.x = -0.25 * (1 - k) - 0.28 * k;
      r.legR.rotation.x = -0.25 * (1 - k) - 0.28 * k;
      r.footL.rotation.x = -0.3 * k;
      r.footR.rotation.x = -0.3 * k;
      r.headG.rotation.x = -0.6 * (1 - k);
    } else {
      const k = 1 - ramp(p, 0.85, 1); // stand tall
      r.root.position.y = 0.95 - 0.18 * k;
      r.torso.rotation.x = 1.5 * k;
      r.armL.rotation.x = -0.2 - 1.2 * k;
      r.armR.rotation.x = -0.2 - 1.2 * k;
      r.legL.rotation.x = -0.25 * k;
      r.legR.rotation.x = -0.25 * k;
      r.shinL.rotation.x = 0.2 * k;
      r.shinR.rotation.x = 0.2 * k;
      r.headG.rotation.x = -0.6 * k;
    }
  },

  /* ------------------------------- mobility ------------------------------ */
  armcircle(t, r) {
    r.armL.rotation.z = -1.5 - 0.35 * Math.cos(t * 4); // straight arms out...
    r.armR.rotation.z = 1.5 + 0.35 * Math.cos(t * 4);
    r.armL.rotation.x = 0.35 * Math.sin(t * 4); // ...drawing circles
    r.armR.rotation.x = 0.35 * Math.sin(t * 4);
    r.root.position.y = 0.95 + 0.005 * Math.sin(t * 4);
  },
};

/* --------------------------------------------------------------------------
   props — a bench box and a wall slab, shown only where the move needs them
   -------------------------------------------------------------------------- */
type PropPose = { box?: [number, number, number]; wall?: [number, number, number] };

const PROPS: Partial<Record<DemoPreset, PropPose>> = {
  dip: { box: [0, 0.19, -0.32] },
  stepup: { box: [0, 0.19, 0.42] },
  bulgarian: { box: [0, 0.19, -0.55] },
  inclinepushup: { box: [0, 0.19, 0.62] },
  declinepushup: { box: [0, 0.19, -0.72] },
  wallpushup: { wall: [0, 1.05, 0.62] },
  wallsit: { wall: [0, 1.05, -0.34] },
  handstand: { wall: [0, 1.05, -0.5] },
};

export function Exercise3D({
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(1.9, 1.35, 2.9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    // let CSS own the canvas box so it always fits its container (never forces
    // its parent wider on mobile); we drive only the drawing-buffer size below
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    /* soft studio light — hemisphere fill + one shadow-casting key */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4150, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(2.2, 4.2, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -2;
    key.shadow.camera.right = 2;
    key.shadow.camera.top = 2.6;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9db8ff, 0.5);
    rim.position.set(-3, 2, -2.5);
    scene.add(rim);

    /* floor: shadow catcher + brand ring for orientation */
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 64),
      new THREE.ShadowMaterial({ opacity: 0.22 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.56, 0.595, 64),
      new THREE.MeshBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    /* props */
    const box = shadowed(
      new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.4), clayMat(0x6b7383)),
    );
    box.visible = false;
    scene.add(box);
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 2.1, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x8a93a3,
        roughness: 0.9,
        transparent: true,
        opacity: 0.22,
      }),
    );
    wall.visible = false;
    scene.add(wall);

    const rig = buildRig();
    scene.add(rig.root);
    // debug handle for the /dev/rig workbench
    (window as unknown as Record<string, unknown>).__rig3d = { rig, box, wall, THREE };

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.78, 0);
    controls.enablePan = false;
    controls.minDistance = 1.4;
    controls.maxDistance = 5;
    controls.enableDamping = true;

    const resize = () => {
      const w = host.clientWidth || 300;
      const h = host.clientHeight || 300;
      renderer.setSize(w, h, false); // updateStyle=false — CSS keeps it 100%
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      const preset = presetRef.current;
      resetPose(rig);
      (ANIMS[preset] ?? ANIMS.squat)(t, rig);

      const prop = PROPS[preset];
      box.visible = !!prop?.box;
      if (prop?.box) box.position.set(...prop.box);
      wall.visible = !!prop?.wall;
      if (prop?.wall) wall.position.set(...prop.wall);

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
    };
  }, []);

  return <div ref={hostRef} className={className} aria-label="3D technique demo" />;
}
