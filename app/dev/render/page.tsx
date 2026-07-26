"use client";

/* Internal renderer — not linked from anywhere.
   /dev/render — steps the Mixamo clips frame by frame and POSTs each PNG to
   /api/dev-frames, so scripts/encode-lesson-videos.mjs can turn them into
   looping animated WebPs for the lessons.

   Frames are stepped DETERMINISTICALLY (mixer.setTime per frame) rather than
   captured in real time: the loop is then perfectly seamless and the output is
   identical regardless of machine speed or whether rAF is throttled. */

import { useEffect, useRef, useState } from "react";

const W = 900;
const H = 600;
const FPS = 30;

export default function RenderBench() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [...l, s]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    (async () => {
      const THREE = await import("three");
      const [{ GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/libs/meshopt_decoder.module.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // transparent background -> alpha in the WebP
        preserveDrawingBuffer: true, // required to read pixels back
      });
      renderer.setPixelRatio(1);
      renderer.setSize(W, H);
      renderer.setClearAlpha(0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.domElement.style.cssText = "width:100%;height:auto;display:block";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x241f1a, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 1.7);
      key.position.set(2.5, 4, 2.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9db8ff, 0.6);
      rim.position.set(-2.2, 1.6, -2.4);
      scene.add(rim);

      const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 100);

      interface GLTFLike {
        scene: import("three").Group;
        animations: import("three").AnimationClip[];
      }
      const gltf = await new Promise<GLTFLike>((res, rej) => {
        const l = new GLTFLoader();
        l.setMeshoptDecoder(MeshoptDecoder);
        l.load("/models/coach-mocap.glb", res as never, undefined, rej);
      });
      if (disposed) return;

      const model = gltf.scene;
      model.traverse((o: import("three").Object3D) => {
        const m = o as import("three").Mesh;
        if (m.isMesh) m.frustumCulled = false;
      });
      const b0 = new THREE.Box3().setFromObject(model);
      const s0 = b0.getSize(new THREE.Vector3());
      model.scale.setScalar(1.75 / (s0.y || 1));
      const b1 = new THREE.Box3().setFromObject(model);
      const c1 = b1.getCenter(new THREE.Vector3());
      model.position.x -= c1.x;
      model.position.z -= c1.z;
      model.position.y -= b1.min.y;
      scene.add(model);

      // 3/4 view, figure filling most of the frame height
      camera.position.set(1.85, 1.15, 2.75);
      camera.lookAt(0, 0.95, 0);

      const mixer = new THREE.AnimationMixer(model);
      const clips = gltf.animations;
      say(`loaded ${clips.length} clips: ${clips.map((c: import("three").AnimationClip) => c.name).join(", ")}`);

      const capture = (): Promise<Blob> =>
        new Promise((res, rej) =>
          renderer.domElement.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"),
        );

      const renderClip = async (clip: import("three").AnimationClip) => {
        const action = mixer.clipAction(clip);
        mixer.stopAllAction();
        action.reset().play();
        const frames = Math.max(2, Math.round(clip.duration * FPS));
        say(`${clip.name}: ${frames} frames @ ${FPS}fps…`);
        for (let i = 0; i < frames; i++) {
          // exclusive of the end point so frame N wraps cleanly onto frame 0
          mixer.setTime((i / frames) * clip.duration);
          model.updateMatrixWorld(true);
          renderer.render(scene, camera);
          const blob = await capture();
          await fetch(`/api/dev-frames?clip=${clip.name}&frame=${i}`, {
            method: "POST",
            body: blob,
          });
        }
        say(`${clip.name}: done`);
      };

      (window as unknown as Record<string, unknown>).__render = {
        clips: clips.map((c: import("three").AnimationClip) => c.name),
        renderAll: async () => {
          for (const c of clips) await renderClip(c);
          say("ALL DONE — now run: node scripts/encode-lesson-videos.mjs");
          return "ok";
        },
        renderOne: async (name: string) => {
          const c = clips.find((x: import("three").AnimationClip) => x.name === name);
          if (!c) return "no such clip";
          await renderClip(c);
          return "ok";
        },
      };
      say("ready — run window.__render.renderAll() in the console");
    })();

    return () => {
      disposed = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="font-display text-2xl uppercase">
        Frame renderer — <span className="text-blood">lesson clips</span>
      </h1>
      <p className="mt-2 text-sm text-ash">
        <code className="text-bone">window.__render.renderAll()</code> → frames land in{" "}
        <code className="text-bone">.tmp-frames/</code>, then encode with the script.
      </p>
      <div className="mt-4 overflow-hidden rounded-[20px] border border-line/70 bg-void/40" ref={hostRef} />
      <pre className="mt-4 max-h-56 overflow-auto rounded-lg border border-line/70 bg-void/60 p-3 text-xs text-ash">
        {log.join("\n")}
      </pre>
    </div>
  );
}
