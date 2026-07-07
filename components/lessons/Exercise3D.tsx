"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { DemoPreset } from "@/lib/exercises";

/* ===========================================================================
   Exercise3D — procedural 3D coach.
   A low-poly humanoid built from primitives performs the exercise on loop;
   the user can drag to orbit and inspect the technique from any angle.
   No external model assets — the rig and every animation are generated here.
   =========================================================================== */

interface Rig {
  root: THREE.Group; // at hip height
  torso: THREE.Group; // pivot at hips
  head: THREE.Mesh;
  armL: THREE.Group; // pivot at shoulder
  armR: THREE.Group;
  foreL: THREE.Group; // pivot at elbow
  foreR: THREE.Group;
  legL: THREE.Group; // pivot at hip joint
  legR: THREE.Group;
  shinL: THREE.Group; // pivot at knee
  shinR: THREE.Group;
}

const BODY = 0x9aa3b2;
const DARK = 0x3a4150;
const GLOVE = 0xe30f2a;

function limb(
  len: number,
  radius: number,
  color: number,
  tip?: { r: number; color: number },
): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.CapsuleGeometry(radius, len - radius * 2, 4, 8);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  mesh.position.y = -len / 2;
  g.add(mesh);
  if (tip) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(tip.r, 12, 12),
      new THREE.MeshStandardMaterial({ color: tip.color, roughness: 0.5 }),
    );
    ball.position.y = -len;
    g.add(ball);
  }
  return g;
}

function buildRig(): Rig {
  const root = new THREE.Group();
  root.position.y = 0.95;

  /* pelvis */
  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.16, 0.18),
    new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.8 }),
  );
  root.add(pelvis);

  /* torso group pivots at the hips */
  const torso = new THREE.Group();
  root.add(torso);
  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.5, 0.2),
    new THREE.MeshStandardMaterial({ color: BODY, roughness: 0.7 }),
  );
  chest.position.y = 0.35;
  torso.add(chest);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({ color: BODY, roughness: 0.6 }),
  );
  head.position.y = 0.74;
  torso.add(head);

  /* arms — gloves on the ends */
  const armL = limb(0.3, 0.05, BODY);
  armL.position.set(-0.22, 0.58, 0);
  torso.add(armL);
  const foreL = limb(0.28, 0.045, BODY, { r: 0.07, color: GLOVE });
  foreL.position.y = -0.3;
  armL.add(foreL);

  const armR = limb(0.3, 0.05, BODY);
  armR.position.set(0.22, 0.58, 0);
  torso.add(armR);
  const foreR = limb(0.28, 0.045, BODY, { r: 0.07, color: GLOVE });
  foreR.position.y = -0.3;
  armR.add(foreR);

  /* legs */
  const legL = limb(0.45, 0.065, DARK);
  legL.position.set(-0.1, -0.05, 0);
  root.add(legL);
  const shinL = limb(0.45, 0.055, BODY, { r: 0.06, color: DARK });
  shinL.position.y = -0.45;
  legL.add(shinL);

  const legR = limb(0.45, 0.065, DARK);
  legR.position.set(0.1, -0.05, 0);
  root.add(legR);
  const shinR = limb(0.45, 0.055, BODY, { r: 0.06, color: DARK });
  shinR.position.y = -0.45;
  legR.add(shinR);

  return { root, torso, head, armL, armR, foreL, foreR, legL, legR, shinL, shinR };
}

/* reset all joints, guard stance arms */
function resetPose(r: Rig) {
  r.root.position.set(0, 0.95, 0);
  r.root.rotation.set(0, 0, 0);
  for (const g of [
    r.torso, r.armL, r.armR, r.foreL, r.foreR, r.legL, r.legR, r.shinL, r.shinR,
  ]) {
    g.rotation.set(0, 0, 0);
  }
}

/* boxing guard: elbows tucked, gloves at chin */
function guard(r: Rig) {
  r.armL.rotation.x = -0.5;
  r.armR.rotation.x = -0.5;
  r.foreL.rotation.x = -1.9;
  r.foreR.rotation.x = -1.9;
}

const wave = (t: number, period: number) =>
  (1 - Math.cos((2 * Math.PI * t) / period)) / 2; // 0→1→0 smooth

/* --------------------------------------------------------------------------
   the animation library — one function per movement family
   -------------------------------------------------------------------------- */
type Anim = (t: number, r: Rig) => void;

const ANIMS: Record<DemoPreset, Anim> = {
  pushup(t, r) {
    const k = wave(t, 2.2); // 0 top → 1 bottom
    r.root.rotation.x = -Math.PI / 2 + 0.15; // facing floor
    r.root.position.y = 0.42 - 0.18 * k;
    r.legL.rotation.x = 0.12;
    r.legR.rotation.x = 0.12;
    const bend = 0.25 + 1.5 * k;
    r.armL.rotation.x = -0.9 + 0.55 * k;
    r.armR.rotation.x = -0.9 + 0.55 * k;
    r.foreL.rotation.x = -bend * 0.4;
    r.foreR.rotation.x = -bend * 0.4;
  },
  plank(t, r) {
    const breathe = 0.02 * Math.sin(t * 2);
    r.root.rotation.x = -Math.PI / 2 + 0.14;
    r.root.position.y = 0.4 + breathe;
    r.armL.rotation.x = -1.35;
    r.armR.rotation.x = -1.35;
    r.foreL.rotation.x = -0.5;
    r.foreR.rotation.x = -0.5;
  },
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
  lunge(t, r) {
    const k = wave(t, 2.6);
    r.root.position.y = 0.95 - 0.3 * k;
    r.legL.rotation.x = -1.2 * k; // front leg
    r.shinL.rotation.x = 1.3 * k;
    r.legR.rotation.x = 0.7 * k; // rear leg extends back
    r.shinR.rotation.x = 0.9 * k;
    r.torso.rotation.x = 0.08 * k;
    guard(r);
  },
  situp(t, r) {
    const k = wave(t, 2.4);
    r.root.rotation.x = Math.PI / 2 - 0.05; // on the back
    r.root.position.y = 0.22;
    r.legL.rotation.x = -1.0;
    r.legR.rotation.x = -1.0;
    r.shinL.rotation.x = 1.6;
    r.shinR.rotation.x = 1.6;
    r.torso.rotation.x = -1.25 * k; // curl up
    r.armL.rotation.x = -1.4 - 0.4 * k;
    r.armR.rotation.x = -1.4 - 0.4 * k;
    r.foreL.rotation.x = -1.2;
    r.foreR.rotation.x = -1.2;
  },
  burpee(t, r) {
    const p = (t % 3) / 3; // 3-phase cycle
    if (p < 0.33) {
      const k = p / 0.33; // crouch down
      r.root.position.y = 0.95 - 0.5 * k;
      r.legL.rotation.x = -1.9 * k;
      r.legR.rotation.x = -1.9 * k;
      r.shinL.rotation.x = 2.1 * k;
      r.shinR.rotation.x = 2.1 * k;
      r.torso.rotation.x = 0.6 * k;
      r.armL.rotation.x = -0.5 - 1.2 * k;
      r.armR.rotation.x = -0.5 - 1.2 * k;
    } else if (p < 0.66) {
      const k = (p - 0.33) / 0.33; // kick to plank
      r.root.rotation.x = (-Math.PI / 2 + 0.14) * k;
      r.root.position.y = 0.45 - 0.05 * k;
      r.armL.rotation.x = -1.7 + 0.35 * k;
      r.armR.rotation.x = -1.7 + 0.35 * k;
      r.legL.rotation.x = -1.9 * (1 - k) + 0.12 * k;
      r.legR.rotation.x = -1.9 * (1 - k) + 0.12 * k;
      r.shinL.rotation.x = 2.1 * (1 - k);
      r.shinR.rotation.x = 2.1 * (1 - k);
    } else {
      const k = (p - 0.66) / 0.34; // jump!
      const jump = Math.sin(Math.PI * k);
      r.root.position.y = 0.95 + 0.35 * jump;
      r.armL.rotation.x = -0.5 - 2.4 * jump; // arms overhead
      r.armR.rotation.x = -0.5 - 2.4 * jump;
      r.legL.rotation.x = -0.2 * (1 - k);
      r.legR.rotation.x = -0.2 * (1 - k);
    }
  },
  climber(t, r) {
    r.root.rotation.x = -Math.PI / 2 + 0.35;
    r.root.position.y = 0.5;
    r.armL.rotation.x = -1.35;
    r.armR.rotation.x = -1.35;
    const s = Math.sin(t * 6);
    r.legL.rotation.x = 0.9 * Math.max(0, s); // alternating knee drives
    r.shinL.rotation.x = 1.1 * Math.max(0, s);
    r.legR.rotation.x = 0.9 * Math.max(0, -s);
    r.shinR.rotation.x = 1.1 * Math.max(0, -s);
  },
  bridge(t, r) {
    const k = wave(t, 2.2);
    r.root.rotation.x = Math.PI / 2 - 0.05;
    r.root.position.y = 0.2 + 0.16 * k; // hips drive up
    r.legL.rotation.x = -1.1;
    r.legR.rotation.x = -1.1;
    r.shinL.rotation.x = 1.7 - 0.3 * k;
    r.shinR.rotation.x = 1.7 - 0.3 * k;
    r.torso.rotation.x = 0.28 * k;
    r.armL.rotation.x = 0.2;
    r.armR.rotation.x = 0.2;
  },
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
  slip(t, r) {
    guard(r);
    const s = Math.sin(t * 2.4);
    r.root.rotation.y = -0.25;
    r.torso.rotation.z = 0.42 * s; // head off the centre line
    r.torso.rotation.x = 0.25 * Math.abs(s);
    r.root.position.y = 0.95 - 0.1 * Math.abs(s);
    r.legL.rotation.x = -0.3 * Math.abs(s);
    r.legR.rotation.x = -0.3 * Math.abs(s);
    r.shinL.rotation.x = 0.4 * Math.abs(s);
    r.shinR.rotation.x = 0.4 * Math.abs(s);
  },
  jumprope(t, r) {
    const hop = Math.abs(Math.sin(t * 5.5));
    r.root.position.y = 0.95 + 0.09 * hop;
    r.armL.rotation.x = -0.25;
    r.armR.rotation.x = -0.25;
    r.armL.rotation.z = -0.5;
    r.armR.rotation.z = 0.5;
    r.foreL.rotation.x = -0.8 + 0.35 * Math.sin(t * 11); // wrists spin
    r.foreR.rotation.x = -0.8 + 0.35 * Math.sin(t * 11);
    r.shinL.rotation.x = 0.35 * hop;
    r.shinR.rotation.x = 0.35 * hop;
  },
  press(t, r) {
    const k = wave(t, 2.2);
    r.armL.rotation.x = Math.PI - 0.15; // arms up
    r.armR.rotation.x = Math.PI - 0.15;
    r.foreL.rotation.x = -1.4 * (1 - k); // from rack to lockout
    r.foreR.rotation.x = -1.4 * (1 - k);
    r.root.position.y = 0.95 + 0.02 * k;
  },
  row(t, r) {
    const k = wave(t, 1.8);
    r.torso.rotation.x = 0.85; // hinged over
    r.legL.rotation.x = -0.35;
    r.legR.rotation.x = -0.35;
    r.shinL.rotation.x = 0.4;
    r.shinR.rotation.x = 0.4;
    r.root.position.y = 0.8;
    r.armR.rotation.x = -0.6 - 0.9 * k; // pulling arm
    r.foreR.rotation.x = -0.7 * k;
    r.armL.rotation.x = -1.1; // support arm
  },
  swing(t, r) {
    const k = wave(t, 1.9); // 0 = hinge, 1 = tall
    r.torso.rotation.x = 0.75 * (1 - k);
    r.root.position.y = 0.82 + 0.13 * k;
    r.legL.rotation.x = -0.6 * (1 - k);
    r.legR.rotation.x = -0.6 * (1 - k);
    r.shinL.rotation.x = 0.5 * (1 - k);
    r.shinR.rotation.x = 0.5 * (1 - k);
    const arm = 0.55 - 2.0 * k; // both arms swing to chest height
    r.armL.rotation.x = arm;
    r.armR.rotation.x = arm;
  },
  pullup(t, r) {
    const k = wave(t, 2.6); // 0 = dead hang, 1 = chin over
    r.root.position.y = 1.05 + 0.3 * k;
    r.armL.rotation.x = Math.PI - 0.1;
    r.armR.rotation.x = Math.PI - 0.1;
    r.foreL.rotation.x = -2.2 * k;
    r.foreR.rotation.x = -2.2 * k;
    r.legL.rotation.x = -0.15;
    r.legR.rotation.x = -0.15;
    r.shinL.rotation.x = 0.5;
    r.shinR.rotation.x = 0.5;
  },
  curl(t, r) {
    const k = wave(t, 2.0);
    r.armL.rotation.x = -0.1;
    r.armR.rotation.x = -0.1;
    r.foreL.rotation.x = -2.3 * k;
    r.foreR.rotation.x = -2.3 * k;
  },
  benchpress(t, r) {
    const k = wave(t, 2.2); // 0 = lockout, 1 = bar at chest
    r.root.rotation.x = Math.PI / 2 - 0.02; // on the bench (back)
    r.root.position.y = 0.45;
    r.legL.rotation.x = -1.2;
    r.legR.rotation.x = -1.2;
    r.shinL.rotation.x = 1.5;
    r.shinR.rotation.x = 1.5;
    r.armL.rotation.x = -1.55 + 0.5 * k;
    r.armR.rotation.x = -1.55 + 0.5 * k;
    r.foreL.rotation.x = -1.6 * k;
    r.foreR.rotation.x = -1.6 * k;
  },
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
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(1.6, 1.35, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x2f6bff, 0.5);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    /* ring "mat" for orientation */
    const mat = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.6, 48),
      new THREE.MeshBasicMaterial({
        color: 0xe30f2a,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.y = 0.01;
    scene.add(mat);

    const rig = buildRig();
    scene.add(rig.root);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.enablePan = false;
    controls.minDistance = 1.4;
    controls.maxDistance = 5;
    controls.enableDamping = true;

    const resize = () => {
      const w = host.clientWidth || 300;
      const h = host.clientHeight || 300;
      renderer.setSize(w, h);
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
      resetPose(rig);
      (ANIMS[presetRef.current] ?? ANIMS.squat)(t, rig);
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
