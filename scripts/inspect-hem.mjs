/**
 * Quantify the "jagged hem" — is it a texture/UV problem or geometry?
 *
 *   node scripts/inspect-hem.mjs public/models/coach-mocap.glb
 *
 * The outfit is vertex colour, so a garment edge can only ever follow triangle
 * edges. This measures how coarse that staircase is: how many triangles
 * straddle a colour boundary and how big they are.
 */
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const SRC = process.argv[2] ?? "public/models/coach-mocap.glb";
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(path.resolve(SRC));

for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    const col = prim.getAttribute("COLOR_0");
    const uv = prim.getAttribute("TEXCOORD_0");
    const idx = prim.getIndices();
    const mat = prim.getMaterial();
    console.log(`=== ${path.basename(SRC)} ===`);
    console.log(`UVs                : ${uv ? "yes" : "NO"}`);
    console.log(`base colour texture: ${mat?.getBaseColorTexture() ? "yes" : "NO"}`);
    console.log(`alpha mode         : ${mat?.getAlphaMode() ?? "n/a"}`);
    console.log(`vertex colours     : ${col ? "yes" : "no"}`);
    if (!col || !idx) {
      console.log("(no vertex colours / indices — nothing to measure)");
      continue;
    }
    // classify each vertex by dominant colour
    const c = [0, 0, 0];
    const cls = new Uint8Array(pos.getCount());
    for (let i = 0; i < pos.getCount(); i++) {
      col.getElement(i, c);
      const s = c.map((v) => Math.round(255 * Math.pow(Math.max(0, v), 1 / 2.2)));
      cls[i] =
        s[0] > 200 && s[1] > 150 && s[2] < 90 ? 1 // yellow tee
        : s[0] < 60 && s[1] < 60 && s[2] < 65 ? 2 // black shorts/shoe
        : s[0] > 180 && s[1] > 120 && s[2] > 90 ? 3 // skin/sole
        : 4; // hair etc.
    }
    const a = [0, 0, 0], b = [0, 0, 0], d = [0, 0, 0];
    let mixed = 0, tris = 0, mixedEdgeSum = 0, allEdgeSum = 0;
    for (let t = 0; t < idx.getCount(); t += 3) {
      const i0 = idx.getScalar(t), i1 = idx.getScalar(t + 1), i2 = idx.getScalar(t + 2);
      pos.getElement(i0, a); pos.getElement(i1, b); pos.getElement(i2, d);
      const e =
        (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) +
          Math.hypot(b[0] - d[0], b[1] - d[1], b[2] - d[2]) +
          Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2])) / 3;
      tris++; allEdgeSum += e;
      if (cls[i0] !== cls[i1] || cls[i1] !== cls[i2]) { mixed++; mixedEdgeSum += e; }
    }
    console.log(`triangles          : ${tris}`);
    console.log(`avg edge length    : ${(allEdgeSum / tris).toFixed(4)} m`);
    console.log(`boundary triangles : ${mixed} (${((100 * mixed) / tris).toFixed(1)}%)`);
    console.log(`avg edge at seam   : ${(mixedEdgeSum / Math.max(1, mixed)).toFixed(4)} m  ← staircase step size`);
    console.log(
      `verdict            : the garment edge is a VERTEX-COLOUR boundary; its raggedness is ~${((mixedEdgeSum / Math.max(1, mixed)) * 1000).toFixed(0)} mm, i.e. one triangle wide`,
    );
  }
