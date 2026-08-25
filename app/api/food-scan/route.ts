import { guardAiRoute, isDenied } from "@/lib/api-guard";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/* Claude-vision meal scan: photo in → items + calorie estimate out.
   Returns { error: "no_ai" } (503) when no key is set, so the client can
   fall back to manual entry without breaking. */

/* Micronutrients are asked for at the TOTAL level only, never per item.
   Estimating five minerals for every component of a plate multiplies the
   model's uncertainty without telling the user anything they act on, and the
   UI only ever shows a daily total anyway. */
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "items",
    "total_kcal",
    "total_protein",
    "total_carbs",
    "total_fat",
    "total_fiber",
    "micros",
    "note",
  ],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "kcal", "protein", "carbs", "fat"],
        properties: {
          name: { type: "string" },
          kcal: { type: "integer" },
          protein: { type: "integer" },
          carbs: { type: "integer" },
          fat: { type: "integer" },
        },
      },
    },
    total_kcal: { type: "integer" },
    total_protein: { type: "integer" },
    total_carbs: { type: "integer" },
    total_fat: { type: "integer" },
    total_fiber: { type: "integer" },
    micros: {
      type: "object",
      additionalProperties: false,
      required: ["iron", "calcium", "potassium", "sodium", "vitaminC"],
      properties: {
        iron: { type: "integer", description: "milligrams" },
        calcium: { type: "integer", description: "milligrams" },
        potassium: { type: "integer", description: "milligrams" },
        sodium: { type: "integer", description: "milligrams" },
        vitaminC: { type: "integer", description: "milligrams" },
      },
    },
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
  /* Sign-in, plan and quota are settled before we look at the image — this
     call costs money, so the cheapest possible rejection comes first. */
  const guard = await guardAiRoute("calorieScan");
  if (isDenied(guard)) return guard.response;

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
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system:
        "You estimate nutrition from a photo of food for a boxing training app. " +
        "For each distinct food item you can identify, give a realistic estimate for the VISIBLE PORTION: " +
        "kcal, plus protein, carbs and fat in whole grams. Judge the portion size from the plate/hand/utensils for realism — " +
        "don't over- or under-shoot. Sum the items into total_kcal, total_protein, total_carbs and total_fat, " +
        "and estimate total_fiber in whole grams. " +
        "Then estimate the meal's iron, calcium, potassium, sodium and vitamin C in whole MILLIGRAMS, as a total for the whole meal. " +
        "Base these on standard composition values for the foods you identified at the portion size you judged. " +
        "Use 0 for a nutrient the meal genuinely has almost none of — do not invent a spread of plausible-looking numbers. " +
        "add one short practical note (a portion caveat or a coach tip). " +
        "If the photo clearly contains no food, return an empty items array with all totals and micros 0 and say so in the note." +
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
            { type: "text", text: "Estimate the calories and macros in this meal." },
          ],
        },
      ],
      output_config: {
        effort: "medium",
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
