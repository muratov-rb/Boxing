import { guardAiRoute, isDenied } from "@/lib/api-guard";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { localAnalysis, verdictFromScore, type Analysis } from "@/lib/analysis";
import {
  goalLabels,
  timeframeText,
  timeframeWeeks,
  environmentLabel,
  equipmentLabels,
  nutritionAccessLabel,
  statIssues,
  type Profile,
} from "@/lib/onboarding";

export const runtime = "nodejs";

/* Sonnet is the default: it handles coaching, nutrition and form feedback well
   at roughly a fifth of Opus's price, and these routes run on every user's
   daily allowance. Override with ANTHROPIC_MODEL to try something else. */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SYSTEM = `You are the head coach at RingBornn, a gritty, no-nonsense boxing gym.
A new fighter has filled out their profile. Give them an honest, motivating read on their goal.

Rules:
- Be realistic about feasibility (0-100). Don't inflate it. Weigh their timeframe against their goals, stats, training setup and nutrition access.
- IMPORTANT: the program is home bodyweight training only for now. Every training recommendation must be doable in a room with no equipment (a wall or a chair at most): shadow boxing, footwork, push-up variations, squats, lunges, planks, core work, jump conditioning. Do NOT prescribe bags, ropes, weights, bars or machines even if the fighter owns them — treat gear as "coming later".
- Food plan must fit their budget/access (don't tell a tight-budget fighter to buy supplements).
- Roadmap: 3-4 phases that fit their timeframe, each with a week range label, a punchy title, and 2-4 concrete focus points.
- Nutrition: 3-5 short, practical fuelling pointers matched to their access tier and goals. These fuel training; they are not a diet, and never medical or dietary advice.
- Cautions: 0-3 honest "straight talk" notes only if warranted (e.g. an unrealistic pace for a weight-class target, or bodyweight-only for a power goal). Empty array if none.
- Voice: a real coach welcoming a fighter — bold and direct, never clinical or corporate. Keep each string tight.
- If any stat is physically impossible or obviously fake (absurd weight/height/age, a weight-change pace no body survives), do NOT play along: set feasibility to 0-5, say plainly the numbers aren't real, and make the only roadmap step "fix your profile and re-run".`;

function buildPrompt(p: Profile): string {
  const lines = [
    `Path: ${p.path === "experienced" ? "Experienced / has background" : "Complete beginner"}`,
    `Weight: ${p.weight || "?"} ${p.weightUnit}`,
    `Height: ${p.height || "?"} ${p.heightUnit}`,
    `Age: ${p.age || "?"}${p.sex ? `, ${p.sex}` : ""}`,
    `Goals: ${goalLabels(p).join(", ") || "general fitness"}`,
    p.targetWeight ? `Target weight: ${p.targetWeight} ${p.weightUnit}` : null,
    `Timeframe: ${timeframeText(p) || "open"} (~${timeframeWeeks(p)} weeks)`,
    `Training environment: ${environmentLabel(p.environment) || "unspecified"}`,
    p.equipment.length ? `Equipment: ${equipmentLabels(p).join(", ")}` : null,
    /* Kit the preset list has no tile for. Worth naming to the model even
       though it cannot unlock catalogue exercises: a plan that ignores the
       tyre in someone's yard is a worse plan. */
    p.customEquipment?.length
      ? `Also owns (their own words): ${p.customEquipment.join(", ")}`
      : null,
    p.equipmentNotes ? `Equipment notes: ${p.equipmentNotes}` : null,
    `Nutrition access: ${nutritionAccessLabel(p.nutritionAccess) || "unspecified"}`,
    `Can buy supplements/protein: ${p.supplements ? "yes" : "no"}`,
    p.dietNotes ? `Diet notes: ${p.dietNotes}` : null,
  ].filter(Boolean);

  return `Here is the fighter's profile:\n\n${lines.join("\n")}\n\nGive your coaching read.`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["feasibility", "verdict", "headline", "summary", "roadmap", "nutrition", "cautions"],
  properties: {
    feasibility: { type: "integer" },
    verdict: { type: "string" },
    headline: { type: "string" },
    summary: { type: "string" },
    roadmap: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "title", "focus"],
        properties: {
          label: { type: "string" },
          title: { type: "string" },
          focus: { type: "array", items: { type: "string" } },
        },
      },
    },
    nutrition: { type: "array", items: { type: "string" } },
    cautions: { type: "array", items: { type: "string" } },
  },
} as const;

export async function POST(req: Request) {
  /* Sign-in required, like every other route that can reach Anthropic. This
     one was missed: it took a profile from anyone on the internet and spent a
     model call on it, so the bill was open to whoever found the URL. No quota
     key — the analysis runs once at the end of onboarding, and metering the
     one call that produces a person's plan would be the wrong thing to ration.
     Onboarding itself already requires an account, so nothing legitimate
     reaches here signed out. */
  const guard = await guardAiRoute(null);
  if (isDenied(guard)) return guard.response;

  let profile: Profile;
  try {
    profile = (await req.json()) as Profile;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  // Impossible stats: skip the model entirely — the local engine returns
  // the 0% reality check and there's nothing worth an API call.
  if (statIssues(profile).length > 0) {
    return NextResponse.json(localAnalysis(profile, locale));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key yet — hand back the local engine so the flow still works.
    return NextResponse.json(localAnalysis(profile, locale));
  }

  const langLine =
    locale === "ru"
      ? "\n\nWrite every string value in your response in Russian."
      : "";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(profile) + langLine }],
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text output");

    const data = JSON.parse(textBlock.text) as Partial<Analysis>;
    if (typeof data.feasibility !== "number") throw new Error("Malformed output");

    const feasibility = Math.max(0, Math.min(100, Math.round(data.feasibility)));
    const analysis: Analysis = {
      feasibility,
      verdict: data.verdict || verdictFromScore(feasibility, locale),
      headline:
        data.headline ||
        `${feasibility}% — ${verdictFromScore(feasibility, locale).toLowerCase()}.`,
      summary: data.summary || "",
      roadmap: Array.isArray(data.roadmap) ? data.roadmap : [],
      nutrition: Array.isArray(data.nutrition) ? data.nutrition : [],
      cautions: Array.isArray(data.cautions) ? data.cautions : [],
      source: "ai",
    };
    return NextResponse.json(analysis);
  } catch {
    // Any API/parse failure → graceful fallback, never break the flow.
    return NextResponse.json(localAnalysis(profile, locale));
  }
}
