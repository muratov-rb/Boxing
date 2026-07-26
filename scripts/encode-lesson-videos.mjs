/**
 * Turn rendered frames into looping lesson animations.
 *
 *   node scripts/encode-lesson-videos.mjs
 *
 * Input : .tmp-frames/<clip>/f_0000.png …   (from /dev/render)
 * Output: public/lessons/<clip>.webp        (animated, alpha, loops forever)
 *
 * Animated WebP rather than MP4/GIF: it keeps the transparent background (so
 * the coach sits on the lesson card in either theme), plays in a plain <img>
 * with no JS, and is a fraction of a GIF's size at full colour.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const FPS = 60;
const SRC = path.join(process.cwd(), ".tmp-frames");
const OUT = path.join(process.cwd(), "public", "lessons");

if (!fs.existsSync(SRC)) {
  console.error("No .tmp-frames/ — render them first at /dev/render");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const clips = fs.readdirSync(SRC).filter((d) => fs.statSync(path.join(SRC, d)).isDirectory());
if (!clips.length) {
  console.error("No clip folders in .tmp-frames/");
  process.exit(1);
}

for (const clip of clips) {
  const dir = path.join(SRC, clip);
  const frames = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
  if (!frames.length) {
    console.log(`${clip}: no frames, skipped`);
    continue;
  }
  const dest = path.join(OUT, `${clip}.webp`);
  /* Long clips (speed bag, warm-up) run 6+ seconds, which at 60fps is a heavy
     download for one lesson. Measured the options: dropping quality barely
     helps (q40 still 2.2 MB and looks worse) and downscaling actually made it
     BIGGER — resampling adds per-frame noise that defeats WebP's inter-frame
     compression. Capping the loop length is the real lever: 4 seconds cuts it
     ~44% at full resolution and full smoothness. */
  const CAP = 240; // 4 s at 60fps
  const cap = frames.length > CAP ? ["-frames:v", String(CAP)] : [];
  const q = frames.length > 150 ? "64" : "72";
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-framerate", String(FPS),
      "-i", path.join(dir, "f_%04d.png"),
      ...cap,
      "-c:v", "libwebp_anim",
      "-pix_fmt", "yuva420p", // keeps the alpha channel
      "-lossless", "0",
      "-q:v", q,
      "-compression_level", "5",
      "-loop", "0", // loop forever
      "-an",
      dest,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  const kb = fs.statSync(dest).size / 1024;
  console.log(`${clip}: ${frames.length} frames → public/lessons/${clip}.webp (${kb.toFixed(0)} KB)`);
}
console.log("\nDone. Reference them from the lesson demo by clip name.");
