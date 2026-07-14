"use client";

import { useEffect, useRef, useState } from "react";

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

/**
 * Realistic 3D coach viewer — renders the user-supplied scan model
 * (public/models/coach.glb, prepared by scripts/prepare-coach-model.mjs).
 * The model is a static scan (no rig), so this is an inspect/rotate view;
 * the 2D guide remains the movement reference.
 */
export function Coach3D({
  className,
  unavailableText = "",
}: {
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
      const [{ GLTFLoader }, { OrbitControls }, { MeshoptDecoder }] =
        await Promise.all([
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("three/examples/jsm/libs/meshopt_decoder.module.js"),
        ]);
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x241f1a, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 2.0);
      key.position.set(2.5, 4, 2.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9db8ff, 0.7);
      rim.position.set(-2, 1.5, -2.5);
      scene.add(rim);

      const camera = new THREE.PerspectiveCamera(
        38,
        host.clientWidth / Math.max(1, host.clientHeight),
        0.05,
        50,
      );
      camera.position.set(0, 0.95, 2.7);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.8, 0);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 1.1;
      controls.maxDistance = 5;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.1;

      // soft contact shadow (fake — cheap radial disc)
      const discCanvas = document.createElement("canvas");
      discCanvas.width = discCanvas.height = 128;
      const dc = discCanvas.getContext("2d")!;
      const grad = dc.createRadialGradient(64, 64, 8, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.42)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      dc.fillStyle = grad;
      dc.fillRect(0, 0, 128, 128);
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.8, 48),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(discCanvas),
          transparent: true,
          depthWrite: false,
        }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.002;
      scene.add(disc);

      let mixer: import("three").AnimationMixer | null = null;
      const clock = new THREE.Clock();

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        COACH_MODEL_URL,
        (gltf) => {
          if (disposed) return;
          const root = gltf.scene;
          // the scan ships without materials/textures — studio clay look
          const clay = new THREE.MeshStandardMaterial({
            color: 0x97a2b8,
            roughness: 0.55,
            metalness: 0.05,
          });
          root.traverse((o) => {
            const mesh = o as import("three").Mesh;
            if (mesh.isMesh) {
              const m = mesh.material as import("three").MeshStandardMaterial;
              if (!m || !("map" in m) || (!m.map && m.name === "")) mesh.material = clay;
            }
          });
          // normalize: stand on floor, ~1.7 units tall, centered
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
          controls.target.set(0, (box2.max.y - box2.min.y) / 2, 0);
          if (gltf.animations.length) {
            mixer = new THREE.AnimationMixer(root);
            mixer.clipAction(gltf.animations[0]).play();
          }
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
        if (mixer) mixer.update(clock.getDelta());
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
          const mesh = o as import("three").Mesh;
          if (mesh.isMesh) {
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
  }, []);

  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <p className="px-4 text-center text-xs text-ash-dim">{unavailableText}</p>
      </div>
    );
  }
  return <div ref={hostRef} className={className} />;
}
