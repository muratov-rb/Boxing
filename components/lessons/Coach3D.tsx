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

      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const dirV = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const qa = new THREE.Quaternion();
      const qb = new THREE.Quaternion();
      const FRONT = new THREE.Vector3(0, 0, 1);
      const ONE = new THREE.Vector3(1, 1, 1);

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
          const order = [...dists.keys()].sort((x, y) => dists[x] - dists[y]).slice(0, 3);
          let sum = 0;
          const w = order.map((b) => {
            const v = 1 / Math.pow(dists[b], 4);
            sum += v;
            return v;
          });
          for (let k3 = 0; k3 < 4; k3++) {
            idx[i * 4 + k3] = k3 < 3 ? order[k3] : 0;
            wgt[i * 4 + k3] = k3 < 3 ? w[k3] / sum : 0;
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

      const makeDriver = (p: DemoPreset) => {
        const dur = demoDuration(p);
        const centerX = demoJoints(p, 0).hip[0];
        const hasRope = !!PRESETS[p]?.props?.rope;

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
        for (const k of Object.keys(armOverride)) delete armOverride[k];

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

          for (let b = 0; b < BONE_DEFS.length; b++) {
            const def = BONE_DEFS[b];
            const ov = hasRope ? armOverride[def.name] : undefined;
            if (ov) {
              vA.copy(ov[0]);
              vB.copy(ov[1]);
            } else {
              const ja = j[def.ja];
              const jb = j[def.jb];
              vA.set(def.lata, ja[1] * K2D - 1, (ja[0] - centerX) * K2D);
              vB.set(def.latb, jb[1] * K2D - 1, (jb[0] - centerX) * K2D);
            }
            dirV.subVectors(vB, vA).normalize();
            // near-antiparallel targets (legs straight up etc.) go through an
            // intermediate axis so the limb never pops to a flipped roll
            if (bindDirs[b].dot(dirV) < -0.9) {
              qa.setFromUnitVectors(bindDirs[b], FRONT);
              qb.setFromUnitVectors(FRONT, dirV);
              q.multiplyQuaternions(qb, qa);
            } else {
              q.setFromUnitVectors(bindDirs[b], dirV);
            }
            bones[b].matrix.compose(vA, q, ONE);
          }
        };
        driver(0);
      };

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
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

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        controls.update();
        if (driver) driver(clock.getElapsedTime());
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
