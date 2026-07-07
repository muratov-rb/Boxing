import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/* Claude-vision meal scan: photo in → items + calorie estimate out.
   Returns { error: "no_ai" } (503) when no key is set, so the client can
   fall back to manual entry without breaking. */

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items", "total_kcal", "note"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "kcal"],
        properties: {
          name: { type: "string" },
          kcal: { type: "integer" },
        },
      },
    },
    total_kcal: { type: "integer" },
    note: { type: "string" },
  },
} as const;

const ALLOWED_MEDIA = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
type MediaType = (typeof ALLOWED_MEDIA)[number];

export async function POST(req: Request) {
  let body: { image?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no_ai" }, { status: 503 });

  // accept "data:image/jpeg;base64,..." or raw base64 + mediaType
  let data = body.image ?? "";
  let mediaType = (body.mediaType ?? "image/jpeg") as string;
  const m = data.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (m) {
    mediaType = m[1].toLowerCase();
    data = m[2];
  }
  if (!data || data.length < 100) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!ALLOWED_MEDIA.includes(mediaType as MediaType)) {
    return NextResponse.json({ error: "bad_media" }, { status: 400 });
  }

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system:
        "You estimate calories from a photo of food for a boxing training app. " +
        "List each distinct food item you can identify with a realistic kcal estimate for the visible portion, " +
        "sum them into total_kcal, and add one short practical note (portion caveat or a coach tip). " +
        "If the photo clearly contains no food, return an empty items array, total_kcal 0, and say so in the note." +
        (locale === "ru" ? " Write item names and the note in Russian." : ""),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as MediaType,
                data,
              },
            },
            { type: "text", text: "Estimate the calories in this meal." },
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
