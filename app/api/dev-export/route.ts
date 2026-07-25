import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

/* Dev-only sink for the FBX→GLB conversion: the browser does the parsing
   (FBXLoader/GLTFExporter only run there) and POSTs the bytes here so they
   land on disk. Disabled outside development — it writes to the repo.

   Uploads arrive in chunks: a single ~18 MB body gets truncated by the dev
   server, which silently produces a corrupt GLB. `part=0` starts a fresh
   file, later parts append. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "").replace(/[^a-zA-Z0-9._-]/g, "");
  if (!name.endsWith(".glb")) {
    return NextResponse.json({ error: "name must end in .glb" }, { status: 400 });
  }
  const part = Number(url.searchParams.get("part") ?? "0");
  const buf = Buffer.from(await req.arrayBuffer());
  const dest = path.join(process.cwd(), "public", "models", name);

  if (part === 0) await fs.writeFile(dest, buf);
  else await fs.appendFile(dest, buf);

  const { size } = await fs.stat(dest);
  return NextResponse.json({ ok: true, part, received: buf.length, totalOnDisk: size });
}
