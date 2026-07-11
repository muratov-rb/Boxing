import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { techniqueById } from "@/lib/technique";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/* Technique review: a handful of frames sampled from the user's video, plus
   the chosen technique's checklist as the rubric → Claude vision → structured
   coaching feedback. Returns { error: "no_ai" } (503) with no key so the
   client can fall back to the manual checklist. */

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "verdict", "summary", "strengths", "fixes", "drills"],
  properties: {
    score: { type: "integer" }, // 0–100 technique quality
    verdict: { type: "string" }, // short one-liner
    summary: { type: "string" }, // 1–2 sentences
    strengths: { type: "array", items: { type: "string" } },
    fixes: { type: "array", items: { type: "string" } },
    drills: { type: "array", items: { type: "string" } },
  },
} as const;

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
type Media = (typeof ALLOWED)[number];

export async function POST(req: Request) {
  let body: { frames?: string[]; techniqueId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no_ai" }, { status: 503 });

  const tech = techniqueById(body.techniqueId ?? "");
  const frames = (body.frames ?? []).slice(0, 6);
  if (!tech || frames.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  // build image blocks from the sampled frames
  const images: Anthropic.ImageBlockParam[] = [];
  for (const f of frames) {
    const m = f.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
    if (!m) continue;
    const mediaType = m[1].toLowerCase();
    if (!ALLOWED.includes(mediaType as Media)) continue;
    images.push({
      type: "image",
      source: { type: "base64", media_type: mediaType as Media, data: m[2] },
    });
  }
  if (images.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const rubric = tech.checklist.map((c) => `- ${c.en}`).join("\n");

  const system =
    "You are a sharp, encouraging boxing coach reviewing a fighter's technique. " +
    `The frames below are sampled in order from a short video of the fighter performing: ${tech.name.en}. ` +
    "Read the movement across the frames as a sequence. Judge it against this checklist:\n" +
    rubric +
    "\n\nReturn: score (0-100 for overall technique quality on THIS attempt — be honest, " +
    "most amateurs land 40-70), a short verdict, a 1-2 sentence summary, 1-3 genuine strengths, " +
    "1-4 specific fixes (name the exact flaw and the correction), and 1-3 drills that fix them. " +
    "If the frames don't actually show a person doing the technique (no person, wrong movement, unusable), " +
    "set score 0, say so in the verdict, and leave strengths empty." +
    (locale === "ru"
      ? " Write every string value in Russian."
      : "");

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      thinking: { type: "adaptive" },
      system,
      messages: [
        {
          role: "user",
          content: [
            ...images,
            {
              type: "text",
              text: `Review these ${images.length} frames of my ${tech.name.en} and coach me.`,
            },
          ],
        },
      ],
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("no output");
    const parsed = JSON.parse(block.text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "scan_failed" }, { status: 502 });
  }
}
