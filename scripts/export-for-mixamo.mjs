/**
 * Prepare the coach model for Mixamo auto-rigging.
 *
 *   node scripts/export-for-mixamo.mjs --inspect        # structure report only
 *   node scripts/export-for-mixamo.mjs                  # inspect + write OBJ
 *
 * Source is public/models/coach.glb — the STATIC A-pose scan. (The fighting
 * poses are generated at runtime by Coach3D; they are never baked into the
 * file, so the export is already a clean neutral pose.)
 *
 * Output: public/models/coach-mixamo.obj — Y-up, facing +Z, 1.75 units tall,
 * feet on y=0, centred on X/Z. Upload that straight to mixamo.com.
 */
import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const INSPECT_ONLY = process.argv.includes("--inspect");
const SRC = path.join(process.cwd(), "public", "models", "coach.glb");
const OUT = path.join(process.cwd(), "public", "models", "coach-mixamo.obj");
const TARGET_HEIGHT = 1.75; // metres — a normal adult, what Mixamo expects

await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

const doc = await io.read(SRC);
const root = doc.getRoot();

/* ------------------------------ STEP 1: structure ------------------------ */
const meshes = root.listMeshes();
const prims = meshes.flatMap((m) => m.listPrimitives());
console.log("=== STEP 1 — mesh structure ===");
console.log(`file            : public/models/coach.glb`);
console.log(`nodes           : ${root.listNodes().length}`);
console.log(`meshes (objects): ${meshes.length}`);
console.log(`primitives      : ${prims.length}   ${prims.length > 1 ? "<- would need merging" : "(single draw group)"}`);
console.log(`skins/skeletons : ${root.listSkins().length}`);
console.log(`animations      : ${doc.getRoot().listAnimations().length}`);

if (prims.length === 0) {
  console.error("No geometry found.");
  process.exit(1);
}

// gather every primitive into one vertex/index pool (this IS the merge step)
let V = [];
let I = [];
let vertOffset = 0;
let hasNormals = false;
let hasUV = false;
let hasColor = false;
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION");
  const idx = prim.getIndices();
  hasNormals ||= !!prim.getAttribute("NORMAL");
  hasUV ||= !!prim.getAttribute("TEXCOORD_0");
  hasColor ||= !!prim.getAttribute("COLOR_0");
  const n = pos.getCount();
  const p = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    pos.getElement(i, p);
    V.push(p[0], p[1], p[2]);
  }
  if (idx) {
    const c = idx.getCount();
    for (let i = 0; i < c; i++) I.push(idx.getScalar(i) + vertOffset);
  } else {
    for (let i = 0; i < n; i++) I.push(i + vertOffset);
  }
  vertOffset += n;
}
const vertCount = V.length / 3;
const triCount = I.length / 3;
console.log(`vertices        : ${vertCount}`);
console.log(`triangles       : ${triCount}`);
console.log(`normals / UVs / vertex-colours : ${hasNormals} / ${hasUV} / ${hasColor}`);

/* connected components — Mixamo rigs a single connected body best. Floating
   islands (loose hair, shoes, eyes) usually still work, but it's the #1 thing
   that trips the auto-rigger, so count them explicitly. */
const parent = new Int32Array(vertCount);
for (let i = 0; i < vertCount; i++) parent[i] = i;
const find = (a) => {
  while (parent[a] !== a) {
    parent[a] = parent[parent[a]];
    a = parent[a];
  }
  return a;
};
const union = (a, b) => {
  const ra = find(a), rb = find(b);
  if (ra !== rb) parent[ra] = rb;
};
for (let t = 0; t < I.length; t += 3) {
  union(I[t], I[t + 1]);
  union(I[t + 1], I[t + 2]);
}
const sizes = new Map();
for (let i = 0; i < vertCount; i++) {
  const r = find(i);
  sizes.set(r, (sizes.get(r) ?? 0) + 1);
}
const comps = [...sizes.values()].sort((a, b) => b - a);
console.log(`connected pieces: ${comps.length}`);
console.log(
  `  largest holds : ${((100 * comps[0]) / vertCount).toFixed(1)}% of vertices` +
    (comps.length > 1 ? `  (others: ${comps.slice(1, 6).join(", ")} verts)` : ""),
);

/* bounds, scale, facing */
let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let i = 0; i < vertCount; i++)
  for (let k = 0; k < 3; k++) {
    const v = V[i * 3 + k];
    if (v < min[k]) min[k] = v;
    if (v > max[k]) max[k] = v;
  }
const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
const upAxis = size.indexOf(Math.max(...size)) === 1 ? "Y (correct)" : "NOT Y — needs rotating";
console.log(
  `bounds  W×H×D  : ${size[0].toFixed(2)} × ${size[1].toFixed(2)} × ${size[2].toFixed(2)}  → tallest axis = ${upAxis}`,
);

// facing: the toes are the furthest-forward geometry near the floor
let toeZ = 0;
for (let i = 0; i < vertCount; i++) {
  const y = (V[i * 3 + 1] - min[1]) / size[1];
  const z = V[i * 3 + 2];
  if (y < 0.06 && Math.abs(z) > Math.abs(toeZ)) toeZ = z;
}
const facing = toeZ >= 0 ? "+Z" : "-Z";
console.log(`facing (toes)   : ${facing} ${facing === "+Z" ? "(what Mixamo expects)" : "(needs 180° flip)"}`);

/* pose check: arm angle below horizontal tells T-pose from A-pose */
const shoulderY = min[1] + size[1] * 0.83;
let handIdx = -1, handX = 0;
for (let i = 0; i < vertCount; i++) {
  const x = V[i * 3];
  if (Math.abs(x) > Math.abs(handX)) {
    handX = x;
    handIdx = i;
  }
}
const handY = V[handIdx * 3 + 1];
const armDrop = Math.atan2(shoulderY - handY, Math.abs(handX) - size[0] * 0.1) * (180 / Math.PI);
console.log(
  `arm angle       : ~${armDrop.toFixed(0)}° below horizontal → ` +
    (armDrop < 15 ? "T-pose" : armDrop < 60 ? "A-pose" : "arms too low/vertical — Mixamo may struggle"),
);
console.log(
  `verdict         : ${comps.length === 1 ? "single connected mesh" : comps.length + " pieces"}, ` +
    `${armDrop < 60 ? "pose OK" : "POSE NEEDS FIXING"} for auto-rigging`,
);

if (INSPECT_ONLY) {
  console.log("\n(inspect only — no file written)");
  process.exit(0);
}

/* ---------------------- STEPS 3+4: normalise and export ------------------ */
const scale = TARGET_HEIGHT / size[1];
const cx = (min[0] + max[0]) / 2;
const cz = (min[2] + max[2]) / 2;
const P = new Float32Array(vertCount * 3);
for (let i = 0; i < vertCount; i++) {
  P[i * 3] = (V[i * 3] - cx) * scale;
  P[i * 3 + 1] = (V[i * 3 + 1] - min[1]) * scale; // feet land on y = 0
  P[i * 3 + 2] = (V[i * 3 + 2] - cz) * scale;
}

// smooth vertex normals (area-weighted) so the OBJ shades correctly
const N = new Float32Array(vertCount * 3);
for (let t = 0; t < I.length; t += 3) {
  const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
  const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
  const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  for (const o of [a, b, c]) {
    N[o] += nx;
    N[o + 1] += ny;
    N[o + 2] += nz;
  }
}
for (let i = 0; i < vertCount; i++) {
  const o = i * 3;
  const l = Math.hypot(N[o], N[o + 1], N[o + 2]) || 1;
  N[o] /= l;
  N[o + 1] /= l;
  N[o + 2] /= l;
}

const out = [];
out.push("# RingBornn coach — Mixamo auto-rig upload");
out.push(`# ${vertCount} verts, ${triCount} tris, Y-up, facing +Z, ${TARGET_HEIGHT}m tall`);
out.push("o CoachBody");
const f = (v) => (Math.abs(v) < 1e-6 ? "0" : v.toFixed(5));
for (let i = 0; i < vertCount; i++)
  out.push(`v ${f(P[i * 3])} ${f(P[i * 3 + 1])} ${f(P[i * 3 + 2])}`);
for (let i = 0; i < vertCount; i++)
  out.push(`vn ${f(N[i * 3])} ${f(N[i * 3 + 1])} ${f(N[i * 3 + 2])}`);
for (let t = 0; t < I.length; t += 3) {
  const a = I[t] + 1, b = I[t + 1] + 1, c = I[t + 2] + 1;
  out.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
}
fs.writeFileSync(OUT, out.join("\n") + "\n");

const mb = fs.statSync(OUT).size / 1048576;
console.log("\n=== STEPS 3+4 — export ===");
console.log(`scaled ×${scale.toFixed(4)} → height ${(size[1] * scale).toFixed(3)} m, feet at y=0, centred X/Z`);
console.log(`wrote: ${OUT}  (${mb.toFixed(1)} MB)`);
