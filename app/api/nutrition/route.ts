import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { localNutrition, type NutritionPlan } from "@/lib/nutrition";
import { macroTargets } from "@/lib/tracking";
import {
  goalLabels,
  timeframeText,
  environmentLabel,
  nutritionAccessLabel,
  statIssues,
  type Profile,
} from "@/lib/onboarding";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const SYSTEM = `You are the nutrition coach at RingBornn, a no-nonsense boxing gym.
Build a practical one-day meal plan for a fighter from their stats, goal and food budget.

Rules:
- Respect the given calorie and macro targets — the day's meals should roughly add up to them.
- Give four meals: breakfast, lunch, dinner and one snack. Each has a short title, a concrete detail line (real foods and rough portions), and a kcal + protein estimate.
- Match the food to their budget tier: never tell a tight-budget fighter to buy salmon or supplements — lean on eggs, milk, tinned fish, legumes, oats, rice.
- 3-5 short, practical tips.
- Voice: a real coach — direct and useful, not clinical. Keep strings tight.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "meals", "tips"],
  properties: {
    headline: { type: "string" },
    meals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slot", "title", "detail", "kcal", "protein"],
        properties: {
          slot: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
          title: { type: "string" },
          detail: { type: "string" },
          kcal: { type: "integer" },
          protein: { type: "integer" },
        },
      },
    },
    tips: { type: "array", items: { type: "string" } },
  },
} as const;

function buildPrompt(p: Profile): string {
  const m = macroTargets(p);
  const lines = [
    `Weight: ${p.weight || "?"} ${p.weightUnit}`,
    `Height: ${p.height || "?"} ${p.heightUnit}`,
    `Age: ${p.age || "?"}${p.sex ? `, ${p.sex}` : ""}`,
    `Goals: ${goalLabels(p).join(", ") || "general fitness"}`,
    `Timeframe: ${timeframeText(p) || "open"}`,
    `Training: ${environmentLabel(p.environment) || "home bodyweight"} (4–5 sessions/week)`,
    `Food budget/access: ${nutritionAccessLabel(p.nutritionAccess) || "moderate"}`,
    `Can buy supplements: ${p.supplements ? "yes" : "no"}`,
    p.dietNotes ? `Diet notes: ${p.dietNotes}` : null,
    ``,
    `Daily targets: ${m.kcal} kcal, ${m.protein}g protein, ${m.carbs}g carbs, ${m.fat}g fat.`,
  ].filter(Boolean);
  return `Fighter profile:\n\n${lines.join("\n")}\n\nBuild the day's meal plan.`;
}

export async function POST(req: Request) {
  let profile: Profile;
  try {
    profile = (await req.json()) as Profile;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  // impossible stats → don't waste an API call, just return the local plan
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || statIssues(profile).length > 0) {
    return NextResponse.json(localNutrition(profile, locale));
  }

  const langLine =
    locale === "ru" ? "\n\nWrite every string value in your response in Russian." : "";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(profile) + langLine }],
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("no output");
    const data = JSON.parse(block.text) as Partial<NutritionPlan>;
    if (!Array.isArray(data.meals) || data.meals.length === 0) {
      throw new Error("malformed");
    }

    const plan: NutritionPlan = {
      macros: macroTargets(profile),
      headline: data.headline || "",
      meals: data.meals,
      tips: Array.isArray(data.tips) ? data.tips : [],
      source: "ai",
    };
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(localNutrition(profile, locale));
  }
}
