/**
 * Bake the Mixamo-rigged coach into a web-ready animated GLB.
 *
 *   node scripts/prepare-mocap-model.mjs
 *
 * Input : public/models/coach-anim.glb   (raw bake from /dev/fbx, ~17 MB)
 * Output: public/models/coach-mocap.glb  (simplified, painted, meshopt)
 *
 * To regenerate from new Mixamo downloads:
 *   1. copy the FBX files into public/models/ as coach-rigged.fbx (the "with
 *      skin" one) plus anim-*.fbx, and list them in CoachFBX.tsx
 *   2. open /dev/fbx and run `await window.__fbx.exportGlb()` in the console
 *   3. run this script
 * The FBX files and the raw bake are gitignored — only the finished
 * coach-mocap.glb ships.
 *
 * The rigged mesh comes back from Mixamo untextured, so we re-apply the same
 * position-based outfit paint used for the static model (yellow tee, black
 * shorts). Skin weights are preserved throughout.
 */
import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, simplify, weld, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder } from "meshoptimizer";

const SRC = path.join(process.cwd(), "public", "models", "coach-anim.glb");
const OUT = path.join(process.cwd(), "public", "models", "coach-mocap.glb");
const RATIO = 0.3; // keep ~30% of triangles — plenty at lesson-card size

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });

const doc = await io.read(SRC);
const root = doc.getRoot();

const stats = () => {
  let verts = 0, tris = 0;
  for (const m of root.listMeshes())
    for (const p of m.listPrimitives()) {
      const c = p.getAttribute("POSITION")?.getCount() ?? 0;
      verts += c;
      tris += (p.getIndices()?.getCount() ?? c) / 3;
    }
  return { verts, tris: Math.round(tris) };
};

const before = stats();
console.log(`in : ${(fs.statSync(SRC).size / 1048576).toFixed(1)} MB — ${before.verts} verts, ${before.tris} tris`);
console.log(`     skins: ${root.listSkins().length}, animations: ${root.listAnimations().map((a) => a.getName()).join(", ")}`);

await doc.transform(
  prune(),
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.004, lockBorder: true }),
);

/* ------------------------- outfit paint (yellow tee / black shorts) ------ */
function paint() {
  const srgb = (r, g, b) => [r, g, b].map((v) => Math.pow(v / 255, 2.2));
  const C = {
    shirt: srgb(247, 200, 24),
    shorts: srgb(24, 25, 29),
    skin: srgb(216, 158, 122),
    hair: srgb(43, 31, 22),
    shoe: srgb(28, 29, 33),
    sole: srgb(232, 232, 236),
  };
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      if (!pos) continue;
      const n = pos.getCount();
      const P = [0, 0, 0];
      let minY = 1e9, maxY = -1e9;
      for (let i = 0; i < n; i++) {
        pos.getElement(i, P);
        if (P[1] < minY) minY = P[1];
        if (P[1] > maxY) maxY = P[1];
      }
      const H = maxY - minY;
      // toes mark the front
      let toeZ = 0;
      for (let i = 0; i < n; i++) {
        pos.getElement(i, P);
        if ((P[1] - minY) / H < 0.06 && Math.abs(P[2]) > Math.abs(toeZ)) toeZ = P[2];
      }
      const front = Math.sign(toeZ) || 1;
      // hairline sits above the nose (front-most point of the head)
      let noseY = 0.9, maxZf = -1e9;
      for (let i = 0; i < n; i++) {
        pos.getElement(i, P);
        const y = (P[1] - minY) / H;
        if (y < 0.86) continue;
        const zf = P[2] * front;
        if (zf > maxZf) { maxZf = zf; noseY = y; }
      }
      const hairline = noseY + (1 - noseY) * 0.42;
      // sleeve boundary along the A-pose arm axis
      const SX = 0.17, SY = 0.83, HX = 0.66, HY = 0.55;
      const dx = HX - SX, dy = HY - SY, len2 = dx * dx + dy * dy;

      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos.getElement(i, P);
        const halfW = Math.max(0.001, H * 0.36); // normalise x the same way
        const x = Math.abs(P[0]) / halfW;
        const y = (P[1] - minY) / H;
        const zf = P[2] * front;
        const armT = ((x - SX) * dx + (y - SY) * dy) / len2;
        let c;
        if (y < 0.025) c = C.sole;
        else if (y < 0.075) c = C.shoe;
        else if (y < 0.315) c = C.skin;
        else if (y < 0.5 && x < 0.3) c = C.shorts;
        else if (y > 0.86) c = y > hairline || (y > 0.885 && zf < -0.02) ? C.hair : C.skin;
        else c = x > 0.2 && armT > 0.26 ? C.skin : C.shirt;
        col[i * 3] = c[0];
        col[i * 3 + 1] = c[1];
        col[i * 3 + 2] = c[2];
      }
      const acc = doc
        .createAccessor("COLOR_0")
        .setType("VEC3")
        .setArray(col)
        .setBuffer(root.listBuffers()[0]);
      prim.setAttribute("COLOR_0", acc);
      const mat = prim.getMaterial() ?? doc.createMaterial("coach");
      mat.setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.62).setMetallicFactor(0);
      prim.setMaterial(mat);
    }
}
paint();

await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write(OUT, doc);

const after = stats();
console.log(`out: ${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB — ${after.verts} verts, ${after.tris} tris`);
console.log(`     skins: ${doc.getRoot().listSkins().length}, clips: ${doc.getRoot().listAnimations().map((a) => a.getName()).join(", ")}`);
