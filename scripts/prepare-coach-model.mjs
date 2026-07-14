/**
 * Compress a raw (Tripo3D / Blender) GLB into a web-ready coach model.
 *
 *   node scripts/prepare-coach-model.mjs "D:/path/to/model.glb"
 *
 * Scan exports are "vertex soup" (no shared vertices), so the pipeline is:
 * strip normals/UVs → weld positions into real topology → simplify to ~5%
 * of the triangles → recompute smooth normals → meshopt-compress →
 * public/models/coach.glb. The site auto-detects the file and shows the
 * "3D model" tab in lessons.
 */
import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  simplify,
  weld,
  meshopt,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const input = process.argv[2];
if (!input || !fs.existsSync(input)) {
  console.error('Usage: node scripts/prepare-coach-model.mjs "<path to model.glb>"');
  process.exit(1);
}

// --- sanity check: catch text-mode-corrupted GLBs before wasting time ------
const head = Buffer.alloc(20);
const fd = fs.openSync(input, "r");
fs.readSync(fd, head, 0, 20, 0);
fs.closeSync(fd);
const fileSize = fs.statSync(input).size;
const declared = head.readUInt32LE(8);
const chunkTag = head.toString("ascii", 16, 20);
if (head.toString("ascii", 0, 4) !== "glTF") {
  console.error("Not a GLB file (missing glTF magic).");
  process.exit(1);
}
if (chunkTag !== "JSON" || Math.abs(fileSize - declared) > 64) {
  console.error(
    `This GLB is corrupted (likely copied/saved in text mode: header says ${(declared / 1e6).toFixed(1)} MB, file is ${(fileSize / 1e6).toFixed(1)} MB).\n` +
      "Re-export it: Blender → File → Export → glTF 2.0 (.glb), or re-download the GLB from Tripo3D with a normal binary download.",
  );
  process.exit(1);
}

const outDir = path.join(process.cwd(), "public", "models");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "coach.glb");

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });

console.log("reading", input, `(${(fileSize / 1048576).toFixed(1)} MB)…`);
const doc = await io.read(input);

const stats = () => {
  let verts = 0, tris = 0, textured = false;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const vc = prim.getAttribute("POSITION")?.getCount() ?? 0;
      verts += vc;
      tris += (prim.getIndices()?.getCount() ?? vc) / 3;
      if (prim.getMaterial()?.getBaseColorTexture()) textured = true;
    }
  return { verts, tris, textured };
};
const before = stats();
console.log(`before: ${before.verts} verts, ${before.tris} tris, textured=${before.textured}`);

// Untextured scan: normals/UVs per-corner are what block welding — drop them
// (normals get recomputed after simplification). Textured models keep UVs.
if (!before.textured) {
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      for (const sem of prim.listSemantics())
        if (sem !== "POSITION") prim.setAttribute(sem, null);
}

await doc.transform(
  prune(),
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.05, error: 0.01 }),
  prune(),
);
// no normals written on purpose: three's GLTFLoader computes smooth vertex
// normals for indexed geometry, which looks better than flat normals here
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));

const after = stats();
await io.write(out, doc);
const outMB = fs.statSync(out).size / 1048576;
console.log(`after:  ${after.verts} verts, ${Math.round(after.tris)} tris`);
console.log(`Done: public/models/coach.glb (${outMB.toFixed(1)} MB)`);
if (outMB > 12) console.warn("Still heavy — try ratio 0.02 in this script.");
