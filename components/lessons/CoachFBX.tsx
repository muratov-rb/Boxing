"use client";

import { useEffect, useRef, useState } from "react";

/* ===========================================================================
   CoachFBX — the Mixamo-rigged coach with real mocap.

   Base file carries mesh + skeleton + its own clip; the other FBX files are
   loaded only to harvest their AnimationClips (they share the same Mixamo
   skeleton, so the clips retarget by track name).

   Units note: these exports measure 1.7 in file units — i.e. METRES, not the
   centimetres Mixamo usually emits. We measure and normalise instead of
   hard-coding 0.01, which would have shrunk the model to nothing.
   =========================================================================== */

export interface ClipSource {
  id: string;
  url: string;
  loop?: boolean;
}

/** base = mesh + skeleton (+ its own clip, registered under `id`) */
export const BASE_CLIP: ClipSource = {
  id: "idle",
  url: "/models/coach-rigged.fbx",
  loop: true,
};
export const EXTRA_CLIPS: ClipSource[] = [
  { id: "boxing", url: "/models/anim-boxing.fbx" },
  { id: "boxing2", url: "/models/anim-boxing2.fbx" },
];

const FADE = 0.25; // seconds — crossfade length between clips

export function CoachFBX({
  className,
  onReady,
}: {
  className?: string;
  /** called with (play, clipIds) once the rig and every clip are loaded */
  onReady?: (play: (id: string) => void, ids: string[]) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  /* held in a ref, not a dependency: a new callback identity from the parent
     must never tear down the scene and re-download the rig */
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const [{ FBXLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
        import("three/examples/jsm/loaders/FBXLoader.js"),
        import("three/examples/jsm/controls/OrbitControls.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;

      /* ------------------------------ scene ------------------------------ */
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x241f1a, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(2.5, 4, 2.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9db8ff, 0.55);
      rim.position.set(-2, 1.5, -2.5);
      scene.add(rim);

      const camera = new THREE.PerspectiveCamera(
        38,
        host.clientWidth / Math.max(1, host.clientHeight),
        0.05,
        100,
      );
      camera.position.set(1.5, 1.2, 2.7);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.95, 0);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 1;
      controls.maxDistance = 8;
      controls.addEventListener("change", () => renderer.render(scene, camera));

      // soft contact shadow so he isn't floating
      const cvs = document.createElement("canvas");
      cvs.width = cvs.height = 128;
      const cx2 = cvs.getContext("2d")!;
      const grd = cx2.createRadialGradient(64, 64, 6, 64, 64, 62);
      grd.addColorStop(0, "rgba(0,0,0,0.45)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      cx2.fillStyle = grd;
      cx2.fillRect(0, 0, 128, 128);
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.62, 48),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(cvs),
          transparent: true,
          depthWrite: false,
        }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.002;
      scene.add(disc);

      const clock = new THREE.Clock();
      const dbg: Record<string, unknown> = { scene, camera, renderer };
      (window as unknown as Record<string, unknown>).__fbx = dbg;

      const loader = new FBXLoader();
      const load = (url: string) =>
        new Promise<import("three").Group>((res, rej) =>
          loader.load(url, res as never, undefined, rej),
        );

      try {
        /* --------------- STEP 1: base rigged character --------------- */
        const model = await load(BASE_CLIP.url);
        if (disposed) return;

        const raw = new THREE.Box3().setFromObject(model);
        const rawSize = raw.getSize(new THREE.Vector3());
        const scale = 1.75 / (rawSize.y || 1);
        model.scale.setScalar(scale);
        const box = new THREE.Box3().setFromObject(model);
        const ctr = box.getCenter(new THREE.Vector3());
        model.position.x -= ctr.x;
        model.position.z -= ctr.z;
        model.position.y -= box.min.y;

        let skinned: import("three").SkinnedMesh | null = null;
        model.traverse((o) => {
          const m = o as import("three").SkinnedMesh;
          if (m.isSkinnedMesh) {
            skinned = m;
            m.frustumCulled = false;
            m.material = new THREE.MeshStandardMaterial({
              color: 0x9aa3b2,
              roughness: 0.62,
              metalness: 0.05,
            });
          }
        });
        scene.add(model);

        /* --------------- STEP 2: the AnimationMixer --------------- */
        const mixer = new THREE.AnimationMixer(model);
        const actions: Record<string, import("three").AnimationAction> = {};
        const boneNames = new Set(
          (skinned as import("three").SkinnedMesh | null)?.skeleton.bones.map((b) => b.name) ?? [],
        );

        /** register a clip, reporting any tracks whose bone isn't in the rig */
        const mismatches: Record<string, string[]> = {};
        const register = (id: string, clip: import("three").AnimationClip, loop?: boolean) => {
          const bad = clip.tracks
            .map((t) => t.name.split(".")[0])
            .filter((n) => !boneNames.has(n));
          if (bad.length) mismatches[id] = [...new Set(bad)].slice(0, 8);
          clip.name = id;
          const action = mixer.clipAction(clip);
          if (loop) {
            action.setLoop(THREE.LoopRepeat, Infinity);
          } else {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true; // hold the last frame until we fade
          }
          actions[id] = action;
          return action;
        };

        if (model.animations[0]) register(BASE_CLIP.id, model.animations[0], BASE_CLIP.loop);

        /* --------------- STEP 3: the other clips --------------- */
        const extras = await Promise.all(
          EXTRA_CLIPS.map(async (src) => {
            try {
              const g = await load(src.url);
              return { src, clip: g.animations[0] ?? null };
            } catch {
              return { src, clip: null };
            }
          }),
        );
        if (disposed) return;
        for (const { src, clip } of extras) if (clip) register(src.id, clip, src.loop);

        /* --------------- STEPS 4+5: play and blend --------------- */
        let current = actions[BASE_CLIP.id] ? BASE_CLIP.id : Object.keys(actions)[0];
        if (actions[current]) actions[current].reset().play();

        const play = (id: string) => {
          const next = actions[id];
          if (!next || id === current) return;
          const prev = actions[current];
          next.reset();
          next.setEffectiveWeight(1);
          next.play();
          if (prev) prev.crossFadeTo(next, FADE, false);
          current = id;
        };

        // when a one-shot punch ends, ease back to the idle stance
        mixer.addEventListener("finished", (e) => {
          const ended = (e as unknown as { action: import("three").AnimationAction }).action;
          const idle = actions[BASE_CLIP.id];
          if (!idle || ended === idle) return;
          idle.reset();
          idle.setEffectiveWeight(1);
          idle.play();
          ended.crossFadeTo(idle, FADE, false);
          current = BASE_CLIP.id;
        });

        const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        controls.target.set(0, size.y * 0.55, 0);
        controls.update();

        Object.assign(dbg, {
          model,
          mixer,
          actions,
          play,
          report: {
            units: rawSize.y > 50 ? "centimetres" : "metres",
            appliedScale: +scale.toFixed(4),
            height: +size.y.toFixed(3),
            feetY: +new THREE.Box3().setFromObject(model).min.y.toFixed(4),
            bones: boneNames.size,
            clips: Object.entries(actions).map(([id, a]) => ({
              id,
              duration: +a.getClip().duration.toFixed(2),
              tracks: a.getClip().tracks.length,
              loop: a.loop === THREE.LoopRepeat,
            })),
            boneNameMismatches: Object.keys(mismatches).length ? mismatches : "none",
          },
        });
        onReadyRef.current?.(play, Object.keys(actions));
        renderer.render(scene, camera);
      } catch (e) {
        if (!disposed) setErr(String((e as Error)?.message ?? e).slice(0, 140));
        return;
      }

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        controls.update();
        (dbg.mixer as import("three").AnimationMixer | undefined)?.update(clock.getDelta());
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
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  if (err)
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <p className="px-4 text-center text-xs text-blood-bright">{err}</p>
      </div>
    );
  return <div ref={hostRef} className={className} />;
}
