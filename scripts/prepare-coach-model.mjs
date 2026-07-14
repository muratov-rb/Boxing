/**
 * Compress a raw (Tripo3D / Blender) GLB into a web-ready coach model.
 *
 *   node scripts/prepare-coach-model.mjs "D:/Practise/3D model/modelToUsed.glb"
 *
 * Pipeline: weld duplicate vertices → simplify to ~5% of triangles →
 * meshopt-compress → public/models/coach.glb (target well under 10 MB).
 * The site auto-detects the file and shows the "3D model" tab in lessons.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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
const tmp1 = path.join(os.tmpdir(), "coach_weld.glb");
const tmp2 = path.join(os.tmpdir(), "coach_simplify.glb");

function run(args) {
  console.log("> gltf-transform", args.join(" "));
  const r = spawnSync("npx", ["--yes", "@gltf-transform/cli", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(["weld", input, tmp1]);
run(["simplify", tmp1, tmp2, "--ratio", "0.05", "--error", "0.001"]);
run(["meshopt", tmp2, out, "--level", "medium"]);

const mb = (p) => (fs.statSync(p).size / 1048576).toFixed(1) + " MB";
console.log(`\nDone: ${input} (${mb(input)}) -> public/models/coach.glb (${mb(out)})`);
if (fs.statSync(out).size > 12 * 1048576) {
  console.warn("Still heavy — consider --ratio 0.02 or texture downscaling.");
}
fs.rmSync(tmp1, { force: true });
fs.rmSync(tmp2, { force: true });
