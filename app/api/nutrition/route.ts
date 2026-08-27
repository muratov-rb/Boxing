import { guardAiRoute, isDenied } from "@/lib/api-guard";
import { spendQuota } from "@/lib/usage-server";
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

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SYSTEM = `You are the fuelling guide at RingBornn, a no-nonsense boxing gym.
Suggest a practical day of meals for a fighter, built around their training load,
stats and food budget. These are example meals to fuel training, not a prescribed
diet and not medical or dietary advice — never frame them as either.

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

/* What the reader can change about a plan without editing their profile.
   Budget and diet live on the profile too, but those are permanent settings —
   these are "today I want something different", which is the actual reason
   someone asks for another plan. */
export interface NutritionPrefs {
  budget?: "tight" | "normal" | "comfortable";
  diet?: "any" | "vegetarian" | "halal" | "nodairy";
  prep?: "quick" | "any";
  avoid?: string;
}

const BUDGET_LINE: Record<string, string> = {
  tight: "Budget is tight today — cheap staples only: eggs, oats, rice, beans, frozen veg, whatever cut of meat is cheapest.",
  normal: "Ordinary supermarket budget.",
  comfortable: "Budget is comfortable — better cuts, fish, fresh produce are fine.",
};
const DIET_LINE: Record<string, string> = {
  vegetarian: "Vegetarian: no meat and no fish at all.",
  halal: "Halal: no pork and no alcohol in any form.",
  nodairy: "No dairy: no milk, cheese, yoghurt, whey or butter.",
};

function prefLines(prefs?: NutritionPrefs): string {
  if (!prefs) return "";
  const out = [
    prefs.budget ? BUDGET_LINE[prefs.budget] : null,
    prefs.diet && prefs.diet !== "any" ? DIET_LINE[prefs.diet] : null,
    prefs.prep === "quick"
      ? "Every meal must take under 15 minutes and use no more than five ingredients."
      : null,
    /* Free text, so it is capped and quoted rather than pasted into the
       instructions as if it were one of ours. */
    prefs.avoid?.trim()
      ? `They do not want to eat: "${prefs.avoid.trim().slice(0, 120)}". Respect this.`
      : null,
  ].filter(Boolean);
  return out.length ? `\n\nToday's requests:\n${out.join("\n")}` : "";
}

function buildPrompt(p: Profile, prefs?: NutritionPrefs): string {
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
  return `Fighter profile:\n\n${lines.join("\n")}${prefLines(prefs)}\n\nSuggest the day's meals.`;
}

export async function POST(req: Request) {
  /* Metered now. This route used to check only the entitlement, so a plan
     that included AI nutrition could generate one on every page mount — and
     the page did exactly that, spending on every visit rather than on every
     request for a plan. The quota is spent below, after we know a Claude call
     is actually going to happen.

     Running out is not an error: the caller falls through to the local engine
     and still gets a usable day of meals, just not a generated one. */
  const guard = await guardAiRoute(null);
  if (isDenied(guard)) return guard.response;
  const aiAllowed = guard.entitlements.aiNutrition;

  let body: Profile & { prefs?: NutritionPrefs };
  try {
    body = (await req.json()) as Profile & { prefs?: NutritionPrefs };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const profile = body;
  const prefs = body.prefs;

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  // impossible stats, no key, or a plan without AI nutrition → local plan,
  // which costs nothing and still gives the user something usable
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !aiAllowed || statIssues(profile).length > 0) {
    return NextResponse.json(localNutrition(profile, locale));
  }

  /* Spend the day's allowance only now that a Claude call is certain. Out of
     allowance falls back to the local plan rather than an error — a day of
     meals either way, and the client says which one it got. */
  const spend = await spendQuota(guard, "nutritionPlan");
  if (!spend.allowed) {
    return NextResponse.json({ ...localNutrition(profile, locale), quotaSpent: true });
  }

  const langLine =
    locale === "ru" ? "\n\nWrite every string value in your response in Russian." : "";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(profile, prefs) + langLine }],
      output_config: {
        effort: "medium",
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
