"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoPreset } from "@/lib/exercises";
import {
  demoJoints,
  demoDuration,
  PRESETS,
  type Joints,
} from "./poses";

export const COACH_MODEL_URL = "/models/coach.glb";
/** Mixamo-rigged coach carrying real motion-capture clips. */
export const MOCAP_MODEL_URL = "/models/coach-mocap.glb";

/* Lessons backed by real mocap. Only mapped where the capture genuinely shows
   that lesson — a generic boxing combo standing in for a "hook" lesson would
   teach the wrong movement, which defeats the point of the library. Add a row
   here as each matching Mixamo clip is downloaded. */
const MOCAP: Partial<Record<DemoPreset, string>> = {
  shadowbox: "boxing",
  heavybag: "boxing",
  combo123: "boxing2",
};

let probe: Promise<boolean> | null = null;

/** True when the compressed coach model is deployed at /models/coach.glb. */
export function coachModelAvailable(): Promise<boolean> {
  if (!probe) {
    probe = fetch(COACH_MODEL_URL, { method: "HEAD" })
      .then((r) => r.ok)
      .catch(() => false);
  }
  return probe;
}

/* ------------------------------- rig layout -------------------------------
 * The scan has no skeleton, so we rig it at load time. Bind landmarks are in
 * the model's local space (height 2, floor y=-1, faces +z, A-pose) and match
 * the proportions verified while painting the vertex colors. Each bone is a
 * segment (a→b); vertices are skinned to their nearest segments.
 * At runtime the bones are driven by the exercise keyframe library (poses.ts),
 * mapped sagittal-plane → 3D (2D forward x → 3D z, F chain → right side).
 */

type V3 = [number, number, number];
interface BoneDef {
  name: string;
  a: V3; // bind head
  b: V3; // bind tail
  ja: keyof Joints; // runtime joint for head
  jb: keyof Joints; // runtime joint for tail
  lata: number; // lateral (x) offset applied to the mapped 2D joint
  latb: number;
  /** distance penalty for torso-zone verts, keeps chest off the arm bones */
  armPenalty?: boolean;
}

const BONE_DEFS: BoneDef[] = [
  { name: "spine", a: [0, 0.04, 0], b: [0, 0.66, 0], ja: "hip", jb: "shoulder", lata: 0, latb: 0 },
  { name: "head", a: [0, 0.66, 0], b: [0, 0.9, 0], ja: "shoulder", jb: "headC", lata: 0, latb: 0 },
  { name: "uArmR", a: [0.17, 0.66, 0], b: [0.43, 0.38, 0], ja: "shoulder", jb: "elbowF", lata: 0.17, latb: 0.21, armPenalty: true },
  { name: "fArmR", a: [0.43, 0.38, 0], b: [0.66, 0.1, 0], ja: "elbowF", jb: "handF", lata: 0.21, latb: 0.23, armPenalty: true },
  { name: "uArmL", a: [-0.17, 0.66, 0], b: [-0.43, 0.38, 0], ja: "shoulder", jb: "elbowB", lata: -0.17, latb: -0.21, armPenalty: true },
  { name: "fArmL", a: [-0.43, 0.38, 0], b: [-0.66, 0.1, 0], ja: "elbowB", jb: "handB", lata: -0.21, latb: -0.23, armPenalty: true },
  { name: "thighR", a: [0.09, 0.02, 0], b: [0.09, -0.44, 0], ja: "hip", jb: "kneeF", lata: 0.09, latb: 0.09 },
  { name: "shinR", a: [0.09, -0.44, 0], b: [0.09, -0.9, 0], ja: "kneeF", jb: "ankleF", lata: 0.09, latb: 0.09 },
  { name: "footR", a: [0.09, -0.9, 0], b: [0.09, -0.97, 0.16], ja: "ankleF", jb: "toeF", lata: 0.09, latb: 0.09 },
  { name: "thighL", a: [-0.09, 0.02, 0], b: [-0.09, -0.44, 0], ja: "hip", jb: "kneeB", lata: -0.09, latb: -0.09 },
  { name: "shinL", a: [-0.09, -0.44, 0], b: [-0.09, -0.9, 0], ja: "kneeB", jb: "ankleB", lata: -0.09, latb: -0.09 },
  { name: "footL", a: [-0.09, -0.9, 0], b: [-0.09, -0.97, 0.16], ja: "ankleB", jb: "toeB", lata: -0.09, latb: -0.09 },
];

/** 2D figure is ~1.04 units tall, model local space is 2 units tall. */
const K2D = 2 / 1.04;

/* ---- torso rotation for punches ----
 * The keyframes live in the sagittal plane; real punches rotate the whole
 * upper body through the shot. Each entry maps loop phase → yaw in degrees
 * (gaussian pulses centred on each punch; negative = lead side drives). */
const pulse = (p: number, c: number, w: number, amp: number) =>
  amp * Math.exp(-(((p - c) / w) ** 2));

const TWIST: Partial<Record<DemoPreset, (p: number) => number>> = {
  jab: (p) => pulse(p, 0.16, 0.07, -10) + pulse(p, 0.54, 0.09, 22),
  cross: (p) => pulse(p, 0.4, 0.1, 24),
  hook: (p) => pulse(p, 0.55, 0.11, -30),
  uppercut: (p) => pulse(p, 0.36, 0.09, 24) + pulse(p, 0.86, 0.08, -20),
  doublejab: (p) =>
    pulse(p, 0.12, 0.06, -9) + pulse(p, 0.36, 0.06, -9) + pulse(p, 0.66, 0.09, 22),
  combo123: (p) =>
    pulse(p, 0.12, 0.06, -9) + pulse(p, 0.38, 0.08, 22) + pulse(p, 0.74, 0.09, -30),
  shadowbox: (p) =>
    pulse(p, 0.14, 0.06, -9) + pulse(p, 0.42, 0.08, 22) + pulse(p, 0.84, 0.08, -24),
  heavybag: (p) => pulse(p, 0.16, 0.07, -10) + pulse(p, 0.54, 0.09, 24),
};

/** bones that rotate with the torso when a punch twists the body */
/* How much of the punch's rotation each bone inherits. Power in boxing starts
   at the floor: the rear heel pivots, the hips turn, the chest follows, the arm
   arrives last. Rotating only the torso (as this used to) reads as a swivelling
   upper body bolted to frozen legs. */
const LEGS = new Set(["thighR", "shinR", "footR", "thighL", "shinL", "footL"]);

const YAW_SHARE: Record<string, number> = {
  footR: 0.16,
  footL: 0.16,
  shinR: 0.32,
  shinL: 0.32,
  thighR: 0.6,
  thighL: 0.6,
  spine: 1,
  head: 0.85, // eyes stay on the target
  uArmR: 1,
  fArmR: 1,
  uArmL: 1,
  fArmL: 1,
};

function segDist(px: number, py: number, pz: number, a: V3, b: V3): number {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const apx = px - a[0], apy = py - a[1], apz = pz - a[2];
  const len2 = abx * abx + aby * aby + abz * abz;
  let t = len2 > 0 ? (apx * abx + apy * aby + apz * abz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 3D coach — the user's scan, auto-rigged and driven by the exercise keyframe
 * library — pure animation, with real props (jump rope) where the move needs them.
 * Without a `preset` it is a static rotate/inspect view.
 */
export function Coach3D({
  preset,
  className,
  unavailableText = "",
}: {
  preset?: DemoPreset;
  className?: string;
  unavailableText?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const [{ GLTFLoader }, { OrbitControls }, { MeshoptDecoder }, { RoomEnvironment }] =
        await Promise.all([
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("three/examples/jsm/libs/meshopt_decoder.module.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ]);
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      // studio IBL so PBR skin/cloth colors read like the Tripo viewer
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x241f1a, 0.35));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(2.5, 4, 2.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9db8ff, 0.5);
      rim.position.set(-2, 1.5, -2.5);
      scene.add(rim);

      const camera = new THREE.PerspectiveCamera(
        38,
        host.clientWidth / Math.max(1, host.clientHeight),
        0.05,
        50,
      );
      // animated demos read best from a steady 3/4 view; static gets a slow orbit
      if (preset) camera.position.set(1.55, 1.05, 2.15);
      else camera.position.set(0, 0.95, 2.7);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.8, 0);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 1.1;
      controls.maxDistance = 5;
      controls.autoRotate = !preset;
      controls.autoRotateSpeed = 1.1;
      // drag/zoom stays responsive even where rAF is throttled
      controls.addEventListener("change", () => renderer.render(scene, camera));

      // platform: soft contact shadow + tick ring (matches the reference look)
      const discCanvas = document.createElement("canvas");
      discCanvas.width = discCanvas.height = 256;
      const dc = discCanvas.getContext("2d")!;
      const grad = dc.createRadialGradient(128, 128, 12, 128, 128, 104);
      grad.addColorStop(0, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      dc.fillStyle = grad;
      dc.fillRect(0, 0, 256, 256);
      dc.strokeStyle = "rgba(255,255,255,0.6)";
      dc.lineCap = "round";
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const long = i % 4 === 0;
        const r0 = long ? 104 : 112;
        dc.lineWidth = long ? 3 : 2;
        dc.beginPath();
        dc.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
        dc.lineTo(128 + Math.cos(a) * 122, 128 + Math.sin(a) * 122);
        dc.stroke();
      }
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(1.0, 64),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(discCanvas),
          transparent: true,
          depthWrite: false,
        }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.002;
      scene.add(disc);

      const clock = new THREE.Clock();

      // debug/verification handle (read-only scene refs; harmless in prod)
      const dbg: Record<string, unknown> = { scene, camera, renderer };
      (window as unknown as Record<string, unknown>).__coach3d = dbg;

      /* ------------------- rig + animation driver ------------------- */
      let bones: import("three").Bone[] = [];
      const bindDirs = BONE_DEFS.map((def) =>
        new THREE.Vector3(def.b[0] - def.a[0], def.b[1] - def.a[1], def.b[2] - def.a[2]).normalize(),
      );
      let modelRoot: import("three").Object3D | null = null;
      let driver: ((time: number) => void) | null = null;
      let mocapMixer: import("three").AnimationMixer | null = null;

      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const dirV = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const qRoll = new THREE.Quaternion();
      const t1 = new THREE.Vector3();
      const t2 = new THREE.Vector3();
      const t3 = new THREE.Vector3();
      const FRONT = new THREE.Vector3(0, 0, 1);
      const ONE = new THREE.Vector3(1, 1, 1);

      /* Roll reference per bone. Arms use the MEDIAL axis (pointing at the
         body's centreline) so the inside of the forearm — and the palm — keeps
         facing inward like a real guard. Using world-front here is what rolled
         the hands open so they faced outward and looked broken. */
      const MED_R = new THREE.Vector3(-1, 0, 0); // right arm: medial = -x
      const MED_L = new THREE.Vector3(1, 0, 0); // left arm: medial = +x
      const refFor = (name: string) =>
        name === "uArmR" || name === "fArmR"
          ? MED_R
          : name === "uArmL" || name === "fArmL"
            ? MED_L
            : FRONT;

      /* Bone orientation with a CONTROLLED ROLL.
         setFromUnitVectors alone gives the minimal rotation, which leaves the
         twist around the bone axis undefined — that's what made hands flip and
         look broken on big swings (uppercuts). Here we take that rotation and
         then roll the bone about its own axis so its reference direction stays
         as close to world-front as possible: limbs keep a natural, consistent
         orientation through the whole range of motion. */
      const boneQuat = (
        bind: import("three").Vector3,
        dir: import("three").Vector3,
        ref: import("three").Vector3,
        out: import("three").Quaternion,
      ) => {
        const d = bind.dot(dir);
        if (d < -0.9995) {
          // exactly opposite — any perpendicular axis gives a stable 180° flip
          t1.set(1, 0, 0).cross(bind);
          if (t1.lengthSq() < 1e-6) t1.set(0, 0, 1).cross(bind);
          return out.setFromAxisAngle(t1.normalize(), Math.PI);
        }
        out.setFromUnitVectors(bind, dir);
        // where the reference should sit (perpendicular to the bone) vs where
        // it landed after the minimal rotation
        t1.copy(ref).projectOnPlane(dir);
        if (t1.lengthSq() < 1e-5) return out; // bone points along ref: roll is moot
        t1.normalize();
        t2.copy(ref).applyQuaternion(out).projectOnPlane(dir);
        if (t2.lengthSq() < 1e-5) return out;
        t2.normalize();
        let ang = Math.acos(Math.max(-1, Math.min(1, t2.dot(t1))));
        t3.crossVectors(t2, t1);
        if (t3.dot(dir) < 0) ang = -ang;
        qRoll.setFromAxisAngle(dir, ang);
        return out.premultiply(qRoll);
      };

      /* ---------------------------- boxing arms ----------------------------
         The keyframes are a flat SIDE view, so mapping them straight to 3D
         swings both arms in one plane — elbows never tuck, punches never
         travel down the centreline, and it reads as flapping. For fighting
         presets we place the HANDS in real 3D and solve the elbow with
         two-bone IK, so the arm bends the way an arm actually bends. */
      const UA = 0.382; // upper-arm length (bind)
      const FA = 0.362; // forearm length (bind)
      const ikDir = new THREE.Vector3();
      const ikPole = new THREE.Vector3();

      /** smooth out-and-back envelope: 0 outside [t0,t1], peaks 1 in the middle */
      const env = (u: number, t0: number, t1: number) =>
        u < t0 || u > t1 ? 0 : Math.sin(((u - t0) / (t1 - t0)) * Math.PI);

      /** hand target per arm: [x, y above shoulder, z in front of shoulder].
          s = +1 lead (near) arm, -1 rear arm. Guard is hands by the chin. */
      const GX = 0.135, GY = 0.02, GZ = 0.25;
      /* IMPORTANT: every envelope below is timed to the preset's own keyframes
         (env peaks at the midpoint), so the hand lands exactly when the legs
         drive and the hips turn. Mistimed hands are what made the punches look
         disconnected and floppy. */
      const oneTwo = (u: number, s: number): [number, number, number] => {
        // lead jab at 0.16, rear cross at 0.54
        const e = s > 0 ? env(u, 0.02, 0.3) : env(u, 0.4, 0.68);
        return [s * (GX - 0.1 * e), GY, GZ + 0.55 * e];
      };
      const HAND: Partial<Record<DemoPreset, (u: number, s: number) => [number, number, number]>> = {
        jab: oneTwo, // the "jab" lesson is the one-two
        heavybag: oneTwo,
        cross: (u, s) => {
          const e = s < 0 ? env(u, 0.26, 0.54) : 0; // rear straight at 0.40
          return [s * (GX - 0.11 * e), GY - 0.01 * e, GZ + 0.58 * e];
        },
        doublejab: (u, s) => {
          const e =
            s > 0
              ? Math.max(env(u, 0.02, 0.22), env(u, 0.26, 0.46)) // jabs at 0.12 / 0.36
              : env(u, 0.5, 0.82); // cross at 0.66
          return [s * (GX - 0.1 * e), GY, GZ + 0.55 * e];
        },
        hook: (u, s) => {
          if (s < 0) return [s * GX, GY, GZ];
          const wind = env(u, 0.14, 0.42); // draws back at 0.30…
          const e = env(u, 0.38, 0.72); // …then swings across at 0.55
          return [
            s * (GX + 0.1 * wind - 0.3 * e), // travels across the centreline
            GY + 0.05 * e,
            GZ - 0.06 * wind + 0.32 * e,
          ];
        },
        uppercut: (u, s) => {
          // rear at 0.36, lead at 0.86 — each preceded by a dip on the legs
          const dip = s < 0 ? env(u, 0.02, 0.26) : env(u, 0.52, 0.76);
          const rise = s < 0 ? env(u, 0.22, 0.5) : env(u, 0.72, 1.0);
          return [
            s * (GX - 0.06 * rise),
            GY - 0.18 * dip + 0.3 * rise, // drops, then drives up past the chin
            GZ + 0.05 * dip + 0.2 * rise,
          ];
        },
        combo123: (u, s) => {
          const jab = s > 0 ? env(u, 0.02, 0.22) : 0; // 0.12
          const crs = s < 0 ? env(u, 0.26, 0.5) : 0; // 0.38
          const hk = s > 0 ? env(u, 0.56, 0.84) : 0; // 0.70
          const fwd = Math.max(jab, crs);
          return [
            s * (GX - 0.1 * fwd - 0.3 * hk),
            GY + 0.05 * hk,
            GZ + 0.55 * fwd + 0.32 * hk,
          ];
        },
      };

      /* ---------------------------- boxing legs ----------------------------
         The keyframed legs are a bladed side-view stance, and they buckled the
         moment the torso turned. For punching drills we plant BOTH feet in an
         even, square stance and solve the knees with IK: the legs stay clean,
         and when the hips drop the knees simply bend — he sits into the shot,
         which is the actual technique. */
      const TH = 0.46; // thigh
      const SH = 0.46; // shin
      const ANKLE_Y = -0.9; // planted ankle height (floor is -1)
      const STANCE_X = 0.15; // half the distance between the feet
      const oHip = [new THREE.Vector3(), new THREE.Vector3()];
      const oKnee = [new THREE.Vector3(), new THREE.Vector3()];
      const oAnk = [new THREE.Vector3(), new THREE.Vector3()];
      const oToe = [new THREE.Vector3(), new THREE.Vector3()];

      /** knee from hip+ankle: two-bone IK, knee poled forward */
      const solveKnee = (
        H: import("three").Vector3,
        A: import("three").Vector3,
        out: import("three").Vector3,
      ) => {
        const d = Math.min(TH + SH - 0.02, Math.max(0.12, H.distanceTo(A)));
        const cosA = (d * d + TH * TH - SH * SH) / (2 * TH * d);
        const ang = Math.acos(Math.max(-1, Math.min(1, cosA)));
        ikDir.subVectors(A, H).normalize();
        ikPole.set(0, 0, 1).projectOnPlane(ikDir); // knees bend forward
        if (ikPole.lengthSq() < 1e-6) ikPole.set(0, 0, 1);
        ikPole.normalize();
        out
          .copy(H)
          .addScaledVector(ikDir, TH * Math.cos(ang))
          .addScaledVector(ikPole, TH * Math.sin(ang));
      };

      /** elbow from shoulder+hand: classic two-bone IK, elbow poled down/out */
      const solveElbow = (
        S: import("three").Vector3,
        H: import("three").Vector3,
        s: number,
        out: import("three").Vector3,
      ) => {
        const d = Math.min(UA + FA - 0.01, Math.max(0.09, S.distanceTo(H)));
        const cosA = (d * d + UA * UA - FA * FA) / (2 * UA * d);
        const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
        ikDir.subVectors(H, S).normalize();
        ikPole.set(s * 0.5, -1, -0.3).projectOnPlane(ikDir);
        if (ikPole.lengthSq() < 1e-6) ikPole.set(0, -1, 0).projectOnPlane(ikDir);
        ikPole.normalize();
        out
          .copy(S)
          .addScaledVector(ikDir, UA * Math.cos(A))
          .addScaledVector(ikPole, UA * Math.sin(A));
      };

      const buildRig = (src: import("three").Mesh): import("three").SkinnedMesh => {
        const geo = src.geometry;
        const pos = geo.attributes.position;
        const n = pos.count;

        // --- skin weights: nearest 3 bone segments, sharp falloff ---
        const idx = new Uint16Array(n * 4);
        const wgt = new Float32Array(n * 4);
        const dists = new Float32Array(BONE_DEFS.length);
        for (let i = 0; i < n; i++) {
          const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
          const torsoZone = Math.abs(px) < 0.2 && py > -0.05;
          for (let b = 0; b < BONE_DEFS.length; b++) {
            const def = BONE_DEFS[b];
            let d = segDist(px, py, pz, def.a, def.b);
            if (def.armPenalty && torsoZone) d *= 2.2;
            dists[b] = Math.max(d, 0.02);
          }
          /* Four influences with a gentle 1/d² falloff. A sharper falloff makes
             each vertex follow a single bone, so the shoulder and hip creases
             tear apart the moment a limb swings — this blends them instead. */
          const order = [...dists.keys()].sort((x, y) => dists[x] - dists[y]).slice(0, 4);
          let sum = 0;
          const w = order.map((b) => {
            const v = 1 / (dists[b] * dists[b]);
            sum += v;
            return v;
          });
          for (let k4 = 0; k4 < 4; k4++) {
            idx[i * 4 + k4] = order[k4] ?? 0;
            wgt[i * 4 + k4] = order[k4] === undefined ? 0 : w[k4] / sum;
          }
        }
        geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(idx, 4));
        geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(wgt, 4));

        const smesh = new THREE.SkinnedMesh(geo, src.material);
        smesh.frustumCulled = false;

        bones = BONE_DEFS.map(() => new THREE.Bone());
        const inverses = BONE_DEFS.map((def, i) => {
          const bone = bones[i];
          bone.matrixAutoUpdate = false;
          bone.matrix.makeTranslation(def.a[0], def.a[1], def.a[2]);
          smesh.add(bone);
          return new THREE.Matrix4().makeTranslation(-def.a[0], -def.a[1], -def.a[2]);
        });
        smesh.bind(new THREE.Skeleton(bones, inverses));
        return smesh;
      };

      /* jump-rope prop: a thin tube swung around the hands' axis, rebuilt each
         frame. The hands ride a small parametric circle in perfect sync, so
         the whole thing reads as one smooth, continuous motion. */
      let rope: import("three").Mesh | null = null;
      const ropeMat = new THREE.MeshStandardMaterial({
        color: 0x23262d,
        roughness: 0.5,
        metalness: 0.15,
      });
      const armOverride: Record<string, [import("three").Vector3, import("three").Vector3]> = {};
      const oSho = [new THREE.Vector3(), new THREE.Vector3()];
      const oElb = [new THREE.Vector3(), new THREE.Vector3()];
      const oHan = [new THREE.Vector3(), new THREE.Vector3()];
      const ropePts = [
        new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
        new THREE.Vector3(), new THREE.Vector3(),
      ];
      /* fresh curve per rebuild — Curve3 caches arc lengths internally, so
         reusing one instance with mutated points collapses the tube */
      const ropeGeo = () =>
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePts), 32, 0.01, 6);

      /* static training props (heavy bag, pull-up bar) per preset */
      let propGroup: import("three").Group | null = null;
      const buildProps = (p: DemoPreset, centerX: number) => {
        if (propGroup) {
          modelRoot?.remove(propGroup);
          propGroup.traverse((o) => {
            const m = o as import("three").Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              (m.material as import("three").Material)?.dispose();
            }
          });
          propGroup = null;
        }
        const pr = PRESETS[p]?.props;
        if (!modelRoot || !pr || (!pr.bag && !pr.pullbar)) return;
        propGroup = new THREE.Group();
        if (pr.bag) {
          const leather = new THREE.MeshStandardMaterial({ color: 0x7e1620, roughness: 0.62 });
          const strapM = new THREE.MeshStandardMaterial({ color: 0x272a31, roughness: 0.45, metalness: 0.3 });
          const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.6, 8, 20), leather);
          body.position.set(0, 0.52, 0.84);
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.196, 0.196, 0.1, 20), strapM);
          band.position.set(0, 0.84, 0.84);
          const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), strapM);
          strap.position.set(0, 1.5, 0.84);
          propGroup.add(body, band, strap);
        }
        if (pr.pullbar) {
          const j0 = demoJoints(p, 0);
          const hy = (j0.handF[1] + j0.handB[1]) / 2;
          const hx = (j0.handF[0] + j0.handB[0]) / 2;
          const by = hy * K2D - 1;
          const bz = (hx - centerX) * K2D;
          const metal = new THREE.MeshStandardMaterial({ color: 0x8a93a2, roughness: 0.35, metalness: 0.7 });
          const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 12), metal);
          bar.rotation.z = Math.PI / 2;
          bar.position.set(0, by, bz);
          propGroup.add(bar);
          for (const sx of [-0.55, 0.55]) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, by + 1, 10), metal);
            post.position.set(sx, (by - 1) / 2, bz);
            propGroup.add(post);
          }
        }
        propGroup.traverse((o) => {
          if ((o as import("three").Mesh).isMesh) o.frustumCulled = false;
        });
        modelRoot.add(propGroup);
      };

      const makeDriver = (p: DemoPreset) => {
        const dur = demoDuration(p);
        const centerX = demoJoints(p, 0).hip[0];
        const hasRope = !!PRESETS[p]?.props?.rope;
        const twistFn = TWIST[p];

        if (rope) {
          modelRoot?.remove(rope);
          rope.geometry.dispose();
          rope = null;
        }
        if (hasRope && modelRoot) {
          rope = new THREE.Mesh(ropeGeo(), ropeMat);
          rope.frustumCulled = false;
          modelRoot.add(rope);
        }
        const handFn = HAND[p];
        for (const k of Object.keys(armOverride)) delete armOverride[k];
        buildProps(p, centerX);
        /* hanging work happens high — lift the camera to frame the bar */
        if (PRESETS[p]?.props?.pullbar) {
          controls.target.set(0, 1.15, 0);
          camera.position.set(1.5, 1.35, 2.45);
        }

        driver = (time: number) => {
          const j = demoJoints(p, time % dur);

          if (hasRope) {
            /* rope spins twice per loop; θ = π (straight down) at each hop apex */
            const theta = ((time % dur) / dur) * Math.PI * 4;
            const shY = j.shoulder[1] * K2D - 1;
            const shZ = (j.shoulder[0] - centerX) * K2D;
            for (let s = 0; s < 2; s++) {
              const side = s === 0 ? 1 : -1; // R, L
              oSho[s].set(side * 0.17, shY, shZ);
              oHan[s].set(
                side * 0.3,
                shY - 0.46 + 0.05 * Math.cos(theta),
                shZ + 0.2 + 0.07 * Math.sin(theta),
              );
              oElb[s].lerpVectors(oSho[s], oHan[s], 0.5);
              oElb[s].x += side * 0.05;
              oElb[s].z -= 0.06;
            }
            armOverride.uArmR = [oSho[0], oElb[0]];
            armOverride.fArmR = [oElb[0], oHan[0]];
            armOverride.uArmL = [oSho[1], oElb[1]];
            armOverride.fArmL = [oElb[1], oHan[1]];

            if (rope) {
              /* arc from hand to hand, bulging along u(θ); slightly longer
                 below (under the feet) than above (over the head) */
              const uy = Math.cos(theta);
              const uz = Math.sin(theta);
              const R = 0.99 - 0.05 * uy;
              const mx = 0, my = (oHan[0].y + oHan[1].y) / 2, mz = (oHan[0].z + oHan[1].z) / 2;
              ropePts[0].copy(oHan[1]);
              ropePts[1].set(-0.4, my + uy * R * 0.72, mz + uz * R * 0.72);
              ropePts[2].set(mx, my + uy * R, mz + uz * R);
              ropePts[3].set(0.4, my + uy * R * 0.72, mz + uz * R * 0.72);
              ropePts[4].copy(oHan[0]);
              rope.geometry.dispose();
              rope.geometry = ropeGeo();
            }
          }

          if (handFn) {
            /* fighting arms: real 3D hand targets + IK elbows (see HAND) */
            const shY = j.shoulder[1] * K2D - 1;
            const shZ = (j.shoulder[0] - centerX) * K2D;
            const u = (time % dur) / dur;
            for (let s = 0; s < 2; s++) {
              const side = s === 0 ? 1 : -1; // R = lead, L = rear
              const [hx, hy, hz] = handFn(u, side);
              oSho[s].set(side * 0.17, shY, shZ);
              oHan[s].set(hx, shY + hy, shZ + hz);
              solveElbow(oSho[s], oHan[s], side, oElb[s]);
            }
            armOverride.uArmR = [oSho[0], oElb[0]];
            armOverride.fArmR = [oElb[0], oHan[0]];
            armOverride.uArmL = [oSho[1], oElb[1]];
            armOverride.fArmL = [oElb[1], oHan[1]];

            /* legs: feet planted square, knees bend as the hips drop */
            const hipY = j.hip[1] * K2D - 1;
            const hipZc = (j.hip[0] - centerX) * K2D;
            for (let s = 0; s < 2; s++) {
              const side = s === 0 ? 1 : -1;
              oHip[s].set(side * 0.09, hipY, hipZc);
              oAnk[s].set(side * STANCE_X, ANKLE_Y, 0);
              solveKnee(oHip[s], oAnk[s], oKnee[s]);
              oToe[s].set(side * STANCE_X, ANKLE_Y - 0.07, 0.16);
            }
            armOverride.thighR = [oHip[0], oKnee[0]];
            armOverride.shinR = [oKnee[0], oAnk[0]];
            armOverride.footR = [oAnk[0], oToe[0]];
            armOverride.thighL = [oHip[1], oKnee[1]];
            armOverride.shinL = [oKnee[1], oAnk[1]];
            armOverride.footL = [oAnk[1], oToe[1]];
          }

          /* torso yaw for punches: rotate every upper-body target around a
             vertical axis through the hips, so chest, head and both arms turn
             into the shot together */
          const yaw = twistFn ? (twistFn((time % dur) / dur) * Math.PI) / 180 : 0;
          const yCos = Math.cos(yaw);
          const ySin = Math.sin(yaw);
          const hipZ = (j.hip[0] - centerX) * K2D;

          for (let b = 0; b < BONE_DEFS.length; b++) {
            const def = BONE_DEFS[b];
            const ov = armOverride[def.name];
            if (ov) {
              vA.copy(ov[0]);
              vB.copy(ov[1]);
            } else {
              const ja = j[def.ja];
              const jb = j[def.jb];
              vA.set(def.lata, ja[1] * K2D - 1, (ja[0] - centerX) * K2D);
              vB.set(def.latb, jb[1] * K2D - 1, (jb[0] - centerX) * K2D);
            }
            /* planted legs never inherit the twist — otherwise the feet swing
               off their spot and the whole stance collapses */
            const share = handFn && LEGS.has(def.name) ? 0 : (YAW_SHARE[def.name] ?? 0);
            if (yaw !== 0 && share > 0) {
              const a = yaw * share;
              const c = Math.cos(a);
              const sn = Math.sin(a);
              for (const v of [vA, vB]) {
                const dx = v.x;
                const dz = v.z - hipZ;
                v.x = dx * c + dz * sn;
                v.z = hipZ + (-dx * sn + dz * c);
              }
            }
            dirV.subVectors(vB, vA).normalize();
            boneQuat(bindDirs[b], dirV, refFor(def.name), q);
            bones[b].matrix.compose(vA, q, ONE);
          }
        };
        driver(0);
      };

      /* render loop is armed BEFORE the loaders so both paths (mocap and
         procedural) share it — whichever finishes loading simply starts
         contributing on the next frame */
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        controls.update();
        if (mocapMixer) mocapMixer.update(clock.getDelta());
        else if (driver) driver(clock.getElapsedTime());
        renderer.render(scene, camera);
      };
      tick();

      const ro = new ResizeObserver(() => {
        const w = host.clientWidth;
        const h = Math.max(1, host.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      ro.observe(host);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
        scene.traverse((o) => {
          const mesh = o as import("three").SkinnedMesh;
          if (mesh.isMesh) {
            mesh.skeleton?.dispose();
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m?.dispose());
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      };

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      /* ---- motion-capture path: a real Mixamo clip drives the whole rig,
         so none of the procedural bone work below runs for these lessons ---- */
      const mocapName = preset ? MOCAP[preset] : undefined;
      if (mocapName) {
        loader.load(
          MOCAP_MODEL_URL,
          (gltf) => {
            if (disposed) return;
            const root = gltf.scene;
            root.traverse((o) => {
              const m = o as import("three").SkinnedMesh;
              if (m.isMesh) m.frustumCulled = false;
            });
            // stand on the floor, centred, ~1.75 units tall
            const box = new THREE.Box3().setFromObject(root);
            const size = box.getSize(new THREE.Vector3());
            root.scale.setScalar(1.75 / (size.y || 1));
            const b2 = new THREE.Box3().setFromObject(root);
            const c2 = b2.getCenter(new THREE.Vector3());
            root.position.x -= c2.x;
            root.position.z -= c2.z;
            root.position.y -= b2.min.y;
            scene.add(root);
            modelRoot = root;

            const mixer = new THREE.AnimationMixer(root);
            const clip =
              gltf.animations.find((a) => a.name === mocapName) ?? gltf.animations[0];
            if (clip) mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
            mocapMixer = mixer;

            const h = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
            controls.target.set(0, h * 0.55, 0);
            controls.update();
            dbg.root = root;
            dbg.mixer = mixer;
            dbg.mocapClip = clip?.name ?? null;
            dbg.setTime = (t: number) => {
              mixer.setTime(t);
              renderer.render(scene, camera);
            };
            renderer.render(scene, camera);
          },
          undefined,
          () => {
            if (!disposed) setFailed(true);
          },
        );
        return;
      }

      loader.load(
        COACH_MODEL_URL,
        (gltf) => {
          if (disposed) return;
          const root = gltf.scene;
          const clay = new THREE.MeshStandardMaterial({
            color: 0x67748c,
            roughness: 0.6,
            metalness: 0.05,
          });
          const swaps: { src: import("three").Mesh; out: import("three").SkinnedMesh }[] = [];
          root.traverse((o) => {
            const mesh = o as import("three").Mesh;
            if (mesh.isMesh) {
              // model ships without normals (smaller file) — indexed geometry
              // gives smooth vertex normals here
              if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
              const m = mesh.material as import("three").MeshStandardMaterial;
              if (!m || !("map" in m) || (!m.map && m.name === "")) mesh.material = clay;
              swaps.push({ src: mesh, out: buildRig(mesh) });
            }
          });
          for (const { src, out } of swaps) {
            out.position.copy(src.position);
            out.quaternion.copy(src.quaternion);
            out.scale.copy(src.scale);
            src.parent?.add(out);
            src.parent?.remove(src);
          }
          // normalize: stand on floor, ~1.7 units tall, centered (bind pose)
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const scale = 1.7 / Math.max(size.x, size.y, size.z, 1e-6);
          root.scale.setScalar(scale);
          const box2 = new THREE.Box3().setFromObject(root);
          const c = box2.getCenter(new THREE.Vector3());
          root.position.x -= c.x;
          root.position.z -= c.z;
          root.position.y -= box2.min.y;
          scene.add(root);
          modelRoot = root;
          if (preset) makeDriver(preset);
          dbg.root = root;
          dbg.setTime = (t: number) => {
            driver?.(t);
            renderer.render(scene, camera);
          };
          dbg.setPreset = (p: DemoPreset) => makeDriver(p);
          controls.target.set(0, (box2.max.y - box2.min.y) / 2, 0);
          // present the loaded model immediately — rAF can be throttled in
          // background/occluded tabs, and the first impression matters
          controls.update();
          renderer.render(scene, camera);
        },
        undefined,
        () => {
          if (!disposed) setFailed(true);
        },
      );

    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <p className="px-4 text-center text-xs text-ash-dim">{unavailableText}</p>
      </div>
    );
  }
  return <div ref={hostRef} className={className} />;
}
