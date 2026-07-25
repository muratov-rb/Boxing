/**
 * Skin-weight diagnostics for the rigged coach.
 *
 *   node scripts/inspect-skin.mjs [path.glb]
 *
 * Reports mesh/skin structure, weight normalisation, influence counts, and —
 * the useful part — how far apart the bones influencing a single vertex are.
 * A vertex pulled by bones at opposite ends of the body is exactly what makes
 * a shoulder balloon during animation.
 */
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const SRC = process.argv[2] ?? path.join(process.cwd(), "public", "models", "coach-mocap.glb");
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(SRC);
const root = doc.getRoot();

/* ---------------------------- STEP 1: structure -------------------------- */
console.log(`=== STEP 1 — structure (${path.basename(SRC)}) ===`);
const meshes = root.listMeshes();
const skins = root.listSkins();
console.log(`meshes            : ${meshes.length}`);
console.log(`skins (skeletons) : ${skins.length}`);
let primCount = 0;
for (const m of meshes) {
  for (const p of m.listPrimitives()) {
    primCount++;
    const sem = p.listSemantics().join(", ");
    console.log(`  prim "${m.getName() || "(unnamed)"}" : ${p.getAttribute("POSITION").getCount()} verts | ${sem}`);
  }
}
// which nodes carry a skin vs are plain children (rigid-parented)
const skinnedNodes = root.listNodes().filter((n) => n.getSkin());
const meshNodesNoSkin = root.listNodes().filter((n) => n.getMesh() && !n.getSkin());
console.log(`nodes WITH skin   : ${skinnedNodes.length}  ${skinnedNodes.map((n) => n.getName()).join(", ")}`);
console.log(`mesh nodes WITHOUT skin (rigid-parented): ${meshNodesNoSkin.length} ${meshNodesNoSkin.map((n) => n.getName()).join(", ") || "(none)"}`);
console.log(
  primCount === 1
    ? "→ ONE primitive: clothing is not separate geometry (it is painted onto the body mesh)"
    : `→ ${primCount} primitives: clothing may be separate — check each is skinned`,
);

/* -------------------------- STEP 2: weight quality ----------------------- */
console.log(`\n=== STEP 2 — skin weights ===`);
for (const skin of skins) {
  const joints = skin.listJoints();
  const ibm = skin.getInverseBindMatrices();
  // bone bind position = translation of inverse(inverseBindMatrix)
  const bonePos = [];
  const M = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < joints.length; j++) {
    ibm.getElement(j, M);
    // column-major rigid transform: R = m0..m10, t = m12,m13,m14 → pos = -Rᵀ·t
    const t = [M[12], M[13], M[14]];
    bonePos.push([
      -(M[0] * t[0] + M[1] * t[1] + M[2] * t[2]),
      -(M[4] * t[0] + M[5] * t[1] + M[6] * t[2]),
      -(M[8] * t[0] + M[9] * t[1] + M[10] * t[2]),
    ]);
  }

  for (const mesh of meshes)
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      const J = prim.getAttribute("JOINTS_0");
      const W = prim.getAttribute("WEIGHTS_0");
      const J1 = prim.getAttribute("JOINTS_1");
      if (!J || !W) {
        console.log("  primitive has NO skin attributes — it would not deform at all");
        continue;
      }
      console.log(`  extra influence sets (JOINTS_1): ${J1 ? "yes (>4 bones/vertex)" : "no (max 4)"}`);
      const n = pos.getCount();
      const jj = [0, 0, 0, 0], ww = [0, 0, 0, 0], pp = [0, 0, 0];

      let badSum = 0, worstSum = 0, zeroW = 0;
      const infl = [0, 0, 0, 0, 0];
      let minY = 1e9, maxY = -1e9;
      for (let i = 0; i < n; i++) {
        pos.getElement(i, pp);
        if (pp[1] < minY) minY = pp[1];
        if (pp[1] > maxY) maxY = pp[1];
      }
      const H = maxY - minY;

      // spread = distance between the two furthest-apart bones on one vertex
      let worstSpread = 0, worstAt = null;
      const spreadHist = { "<0.15": 0, "0.15-0.35": 0, "0.35-0.6": 0, ">0.6": 0 };
      const shoulderBad = [];

      for (let i = 0; i < n; i++) {
        J.getElement(i, jj);
        W.getElement(i, ww);
        pos.getElement(i, pp);
        const s = ww[0] + ww[1] + ww[2] + ww[3];
        if (Math.abs(s - 1) > 0.01) badSum++;
        worstSum = Math.max(worstSum, Math.abs(s - 1));
        if (s < 1e-4) zeroW++;
        const k = [ww[0], ww[1], ww[2], ww[3]].filter((w) => w > 0.001).length;
        infl[k]++;

        let sp = 0;
        for (let a = 0; a < 4; a++)
          for (let b = a + 1; b < 4; b++) {
            if (ww[a] < 0.08 || ww[b] < 0.08) continue;
            const pa = bonePos[jj[a]], pb = bonePos[jj[b]];
            if (!pa || !pb) continue;
            const d = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
            if (d > sp) sp = d;
          }
        if (sp < 0.15) spreadHist["<0.15"]++;
        else if (sp < 0.35) spreadHist["0.15-0.35"]++;
        else if (sp < 0.6) spreadHist["0.35-0.6"]++;
        else spreadHist[">0.6"]++;
        if (sp > worstSpread) {
          worstSpread = sp;
          worstAt = [+pp[0].toFixed(2), +pp[1].toFixed(2), +pp[2].toFixed(2)];
        }
        // shoulder band: upper chest height, out toward the arm
        const yN = (pp[1] - minY) / H;
        if (yN > 0.72 && yN < 0.85 && Math.abs(pp[0]) > H * 0.06 && sp > 0.45)
          shoulderBad.push({
            at: [+pp[0].toFixed(2), +pp[1].toFixed(2)],
            spread: +sp.toFixed(2),
            bones: [0, 1, 2, 3]
              .filter((q) => ww[q] > 0.08)
              .map((q) => `${joints[jj[q]]?.getName() ?? jj[q]}:${ww[q].toFixed(2)}`),
          });
      }

      console.log(`  vertices                : ${n}`);
      console.log(`  weights NOT summing to 1: ${badSum} (worst off by ${worstSum.toFixed(4)})`);
      console.log(`  vertices with zero weight: ${zeroW}`);
      console.log(`  influences per vertex   : 1→${infl[1]}  2→${infl[2]}  3→${infl[3]}  4→${infl[4]}`);
      console.log(`  bone-spread histogram   : ${JSON.stringify(spreadHist)}`);
      console.log(`  worst spread            : ${worstSpread.toFixed(2)} at ${JSON.stringify(worstAt)}`);
      console.log(`  suspect shoulder verts  : ${shoulderBad.length}`);
      shoulderBad.slice(0, 5).forEach((s) => console.log(`     ${JSON.stringify(s)}`));
    }
}
