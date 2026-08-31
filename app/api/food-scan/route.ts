import { guardAiRoute, isDenied, quotaDenied } from "@/lib/api-guard";
import { refundQuota, spendQuota } from "@/lib/usage-server";
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
  /* Sign-in and plan are settled before we look at the image — this call costs
     money, so the cheapest possible rejection comes first.

     The quota is NOT spent here any more. It used to be, which meant every
     rejection below this line still cost the user a scan: a photo we refused
     for being too large, a missing API key, a provider outage. They were
     charged an allowance for a call that never reached the model, and on a
     2-a-day trial two bad photos ended the day.

     It is spent further down instead, once a model call is certain. The plan
     check stays here, because "your plan has no scanner" is knowable now and
     there is no reason to read a body to answer it. */
  const guard = await guardAiRoute(null);
  if (isDenied(guard)) return guard.response;

  if (guard.entitlements.calorieScansPerDay <= 0) {
    return quotaDenied(guard, { allowed: false, used: 0, limit: 0, locked: true });
  }

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
  /* Upper bound as well as lower. Vercel caps a request body around 4.5 MB, so
     this is a second line rather than the only one, but the cap belongs next to
     the code that builds an upstream request out of the value: a caller with
     quota left should not be able to hand Anthropic an arbitrarily large image
     on our account. ~7 MB of base64 is ~5 MB of picture, far above any phone
     photo the scanner actually sends. */
  if (data.length > 7_000_000) {
    return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }
  if (!ALLOWED_MEDIA.includes(mediaType as MediaType)) {
    return NextResponse.json({ error: "bad_media" }, { status: 400 });
  }

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  /* Everything that could reject this request has now passed, so the call is
     going to happen: spend the allowance. Still before the call rather than
     after it, because spending first is what makes the limit hold under
     concurrency — consume_usage takes a row lock, so twenty requests fired at
     once cannot all pass a 2/day limit. Counting on success instead would be
     a check-then-act race, and the limit would be a suggestion. */
  const spend = await spendQuota(guard, "calorieScan");
  if (!spend.allowed) return quotaDenied(guard, spend);

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
    /* The call was made and produced nothing usable — a provider outage, a
       photo the model would not answer on, malformed output. The user got no
       scan, so they should not have paid a scan for it. */
    await refundQuota(guard, "calorieScan");
    return NextResponse.json({ error: "scan_failed" }, { status: 502 });
  }
}
