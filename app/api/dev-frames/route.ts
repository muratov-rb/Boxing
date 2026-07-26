import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

/* Dev-only sink for pre-rendered animation frames. The browser renders the
   rigged coach frame by frame (deterministically, not in real time) and POSTs
   each PNG here; scripts/encode-lesson-videos.mjs then turns each folder into
   a looping animated WebP. Writes to the repo, so development only. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }
  const url = new URL(req.url);
  const clip = (url.searchParams.get("clip") ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
  const frame = Number(url.searchParams.get("frame") ?? "-1");
  if (!clip || !Number.isInteger(frame) || frame < 0) {
    return NextResponse.json({ error: "need clip + frame" }, { status: 400 });
  }
  const dir = path.join(process.cwd(), ".tmp-frames", clip);
  if (frame === 0) await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await req.arrayBuffer());
  await fs.writeFile(path.join(dir, `f_${String(frame).padStart(4, "0")}.png`), buf);
  return NextResponse.json({ ok: true, clip, frame, bytes: buf.length });
}
