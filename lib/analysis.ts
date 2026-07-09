/* ===========================================================================
   PRESSURE — feasibility & roadmap engine (locale-aware)
   `localAnalysis` is a rules-based coach that runs client-side with no key,
   so the flow is fully functional today in EN and RU. The Claude route
   (/api/analyze) returns this exact `Analysis` shape, so the UI is
   engine-agnostic.
   =========================================================================== */

import {
  type Profile,
  type GoalId,
  type StatIssue,
  timeframeWeeks,
  hasBag,
  hasWeights,
  statIssues,
  kgFrom,
} from "./onboarding";

export type Locale = "en" | "ru";

export interface RoadmapPhase {
  label: string;
  title: string;
  focus: string[];
}

export interface Analysis {
  feasibility: number; // 0–100
  verdict: string;
  headline: string;
  summary: string;
  roadmap: RoadmapPhase[];
  nutrition: string[];
  cautions: string[];
  source: "local" | "ai";
}

const GOAL_DIFFICULTY: Record<GoalId, number> = {
  confidence: 0,
  get_fit: 1,
  self_defense: 1,
  technique: 2,
  endurance: 2,
  lose_fat: 2,
  strength: 2,
  build: 3,
  compete: 3,
};

/* ---- reality check: impossible stats never get a motivational score ---- */

const ISSUE_LINES: Record<Locale, Record<StatIssue, string>> = {
  en: {
    weight: "Weight: no human weighs that. Real range is roughly 25–350 kg (55–770 lb).",
    height: "Height: enter a real height — roughly 90–250 cm (3–8 ft).",
    age: "Age: the plan works for ages 8–100. Enter your real age.",
    targetWeight: "Target weight: that's not a weight a human body can reach. Keep it within 25–350 kg (55–770 lb).",
  },
  ru: {
    weight: "Вес: столько не весит ни один человек. Реальный диапазон — примерно 25–350 кг.",
    height: "Рост: укажи настоящий рост — примерно 90–250 см.",
    age: "Возраст: план рассчитан на 8–100 лет. Укажи реальный возраст.",
    targetWeight: "Целевой вес: тело человека не может столько весить. Держись в пределах 25–350 кг.",
  },
};

function realityCheck(issues: StatIssue[], L: Locale): Analysis {
  const en = L !== "ru";
  return {
    feasibility: 0,
    verdict: en ? "Not possible" : "Нереально",
    headline: en
      ? "0% — these numbers aren't real."
      : "0% — эти цифры не настоящие.",
    summary: en
      ? "A coach can't build a plan from stats no human has. Fix the numbers below and run the analysis again — then we'll talk about what's actually achievable."
      : "Тренер не может построить план по данным, которых не бывает у людей. Исправь цифры ниже и запусти анализ заново — тогда поговорим о том, что реально достижимо.",
    roadmap: [
      {
        label: en ? "Step 0" : "Шаг 0",
        title: en ? "Fix your profile" : "Исправь профиль",
        focus: en
          ? ["Enter your real weight, height and age", "Re-run the analysis"]
          : ["Укажи настоящий вес, рост и возраст", "Запусти анализ заново"],
      },
    ],
    nutrition: [],
    cautions: issues.map((i) => ISSUE_LINES[L][i] ?? ISSUE_LINES.en[i]),
    source: "local",
  };
}

function toKg(value: number, unit: "kg" | "lb"): number {
  return kgFrom(value, unit);
}

const VERDICTS: Record<Locale, string[]> = {
  en: [
    "Very achievable",
    "Realistic with consistency",
    "Ambitious — lock in",
    "Aggressive — more time helps",
  ],
  ru: [
    "Вполне достижимо",
    "Реально при стабильности",
    "Амбициозно — соберись",
    "Агрессивно — больше времени поможет",
  ],
};

export function verdictFromScore(n: number, locale: Locale = "en"): string {
  const v = VERDICTS[locale] ?? VERDICTS.en;
  if (n >= 82) return v[0];
  if (n >= 68) return v[1];
  if (n >= 54) return v[2];
  return v[3];
}

function phaseRanges(
  weeks: number,
  locale: Locale,
): { label: string; span: [number, number] }[] {
  const n = weeks <= 6 ? 3 : 4;
  const size = Math.max(1, Math.round(weeks / n));
  const ranges: { label: string; span: [number, number] }[] = [];
  let start = 1;
  for (let i = 0; i < n; i++) {
    const end = i === n - 1 ? weeks : Math.min(weeks, start + size - 1);
    const label =
      locale === "ru"
        ? start === end
          ? `Неделя ${start}`
          : `Недели ${start}–${end}`
        : start === end
          ? `Week ${start}`
          : `Weeks ${start}–${end}`;
    ranges.push({ label, span: [start, end] });
    start = end + 1;
    if (start > weeks) break;
  }
  return ranges;
}

const PHASE_TITLES: Record<Locale, string[]> = {
  en: ["Foundation", "Skill Build", "Sharpen", "Peak & Test"],
  ru: ["Фундамент", "Навык", "Заточка", "Пик и проверка"],
};

export function localAnalysis(
  profile: Profile,
  locale: Locale = "en",
): Analysis {
  const L = locale === "ru" ? "ru" : "en";

  /* impossible stats → no plan, no score, just the truth */
  const issues = statIssues(profile);
  if (issues.length > 0) return realityCheck(issues, L);

  const weeks = timeframeWeeks(profile);
  const goals = profile.goals;
  const cautions: string[] = [];

  /* ---- feasibility score ---- */
  let score = 72;

  if (weeks <= 6) score -= 12;
  else if (weeks <= 13) score -= 2;
  else if (weeks <= 26) score += 6;
  else score += 10;

  const sumDiff = goals.reduce((s, g) => s + (GOAL_DIFFICULTY[g] ?? 1), 0);
  score -= sumDiff * 2;
  if (goals.length >= 4) score -= 6;

  const w = Number(profile.weight);
  const tw = Number(profile.targetWeight);
  let impossibleRate = false;
  if (goals.includes("lose_fat") && w > 0 && tw > 0 && weeks > 0) {
    const deltaKg = Math.abs(
      toKg(w, profile.weightUnit) - toKg(tw, profile.weightUnit),
    );
    const rate = deltaKg / weeks;
    if (rate > 2.5) {
      /* beyond any safe or physically plausible pace */
      impossibleRate = true;
      cautions.push(
        L === "ru"
          ? `Менять около ${rate.toFixed(1)} кг в неделю физически невозможно без вреда. Либо продли срок, либо приблизь целевой вес — иначе этот план обречён.`
          : `Changing about ${rate.toFixed(1)} kg per week is physically impossible to do safely. Extend the timeframe or bring the target closer — otherwise this plan is dead on arrival.`,
      );
    } else if (rate > 1) {
      score -= Math.min(16, Math.round((rate - 1) * 14));
      cautions.push(
        L === "ru"
          ? `Терять около ${rate.toFixed(1)} кг в неделю быстрее устойчивого — нацелимся на безопасный темп ~0,5–0,75 кг и при необходимости скорректируем цель.`
          : `Losing about ${rate.toFixed(1)} kg per week is faster than what's sustainable — we'll aim for a safe ~0.5–0.75 kg pace and adjust the target if needed.`,
      );
    } else if (rate <= 0.5) {
      score += 4;
    }
  }

  if (profile.environment === "gym") score += 6;
  else if (profile.environment === "home_equipped") score += 2;
  else if (profile.environment === "home_bodyweight") {
    const powerGoal = goals.some((g) =>
      ["build", "strength", "compete"].includes(g),
    );
    score += powerGoal ? -6 : -1;
    if (powerGoal)
      cautions.push(
        L === "ru"
          ? "Только со своим весом жди роста силовой выносливости — позже добавь сопротивление (петли, веса или мешок), чтобы качать чистую мощь."
          : "With bodyweight only, expect strength-endurance gains — add resistance (bands, weights or a bag) later to keep building raw power.",
      );
  }

  const age = Number(profile.age);
  if (age >= 16 && age <= 35) score += 2;
  else if (age > 50) score -= 4;
  else if (age > 0 && age < 16) {
    score -= 2;
    cautions.push(
      L === "ru"
        ? "До 16 — план держится на навыке, координации и мобильности, без тяжёлых нагрузок."
        : "Under 16 — the plan stays on skill, coordination and mobility rather than heavy loading.",
    );
  }

  if (profile.path === "experienced") score += 4;

  score = Math.max(35, Math.min(96, Math.round(score)));
  if (impossibleRate) score = Math.min(score, 12); // honesty beats motivation

  if (weeks <= 6 && goals.some((g) => ["compete", "build"].includes(g))) {
    cautions.push(
      L === "ru"
        ? "Шесть недель — серьёзный задел, но считай это первым раундом: настоящие соревнования и большой набор массы придут дальше."
        : "Six weeks is enough for a serious head start, but treat it as round one — real competition and big muscle gains keep coming after.",
    );
  }

  const verdict = verdictFromScore(score, L);
  const headline = `${score}% — ${verdict.toLowerCase()}.`;
  const summary =
    L === "ru"
      ? `Примерно за ${weeks} недель это ${verdict.toLowerCase()}. Тренируйся 4–5 осознанных раз в неделю и держи стабильность — кондиция и техника растут вместе. Дорожная карта ниже разбита на понятные этапы, чтобы ты всегда знал следующий шаг.`
      : `Over about ${weeks} weeks, this is ${verdict.toLowerCase()}. Train 4–5 focused sessions a week and stay consistent — conditioning and technique climb together. The roadmap below breaks it into clear phases so you always know the next move.`;

  /* ---- roadmap ---- */
  const bag = hasBag(profile);
  const weights = hasWeights(profile);
  const strike =
    L === "ru"
      ? bag
        ? "мешок"
        : "бой с тенью"
      : bag
        ? "heavy-bag"
        : "shadow-boxing";
  const resist =
    L === "ru"
      ? weights
        ? "силовая с весами"
        : "силовая со своим весом"
      : weights
        ? "weighted strength"
        : "bodyweight strength";

  const ranges = phaseRanges(weeks, L);
  const titles = PHASE_TITLES[L];

  const roadmap: RoadmapPhase[] = ranges.map((r, i) => {
    const idx = Math.min(i, titles.length - 1);
    let focus: string[];
    if (idx === 0) {
      focus =
        L === "ru"
          ? [
              "Стойка, защита и работа ног каждый день",
              `Базовое кондиционирование + круги (${resist})`,
              "Скакалка / бег для движка",
            ]
          : [
              "Stance, guard & footwork drilled daily",
              `Base conditioning + ${resist} circuits`,
              "Jump rope / running for your engine",
            ];
    } else if (idx === 1) {
      focus =
        L === "ru"
          ? [
              `Базовые комбинации (${strike}): джеб–кросс–хук`,
              "Защита: уклоны, нырки, блоки",
              "Кор и мобильность",
            ]
          : [
              `Core combos on the ${strike} (jab–cross–hook)`,
              "Defense: slips, rolls, blocks",
              "Core & mobility work",
            ];
    } else if (idx === 2) {
      const g = profile.goals;
      const first =
        L === "ru"
          ? g.includes("lose_fat")
            ? "Жиросжигающие раунды высокой интенсивности"
            : g.includes("build") || g.includes("strength")
              ? `Развитие мощности + прогрессия (${resist})`
              : `Скорость и точность (${strike})`
          : g.includes("lose_fat")
            ? "High-output fat-burning conditioning rounds"
            : g.includes("build") || g.includes("strength")
              ? `Power development + ${resist} progression`
              : `Speed & accuracy on the ${strike}`;
      focus =
        L === "ru"
          ? [first, "Поток комбинаций на усталости", "Углы работы ног и контры"]
          : [
              first,
              "Combination flow under fatigue",
              "Footwork angles & counters",
            ];
    } else {
      const compete = profile.goals.includes("compete");
      focus =
        L === "ru"
          ? [
              compete
                ? "Симуляция спарринга и ринг-IQ"
                : "Тестовая неделя: замер прогресса к цели",
              "Пиковые раунды кондиционирования",
              "Разгрузка и восстановление для закрепления",
            ]
          : [
              compete
                ? "Sparring simulation & fight IQ"
                : "Test week: measure progress vs your goal",
              "Peak conditioning rounds",
              "Deload + recovery to lock in gains",
            ];
    }
    return { label: r.label, title: titles[idx], focus };
  });

  return {
    feasibility: score,
    verdict,
    headline,
    summary,
    roadmap,
    nutrition: buildNutrition(profile, L),
    cautions,
    source: "local",
  };
}

function buildNutrition(profile: Profile, L: Locale): string[] {
  const out: string[] = [];
  const cutting = profile.goals.includes("lose_fat");
  const building =
    profile.goals.includes("build") || profile.goals.includes("strength");

  if (L === "ru") {
    if (cutting)
      out.push("Небольшой дефицит калорий — питай работу и сгоняй жир постепенно.");
    else if (building)
      out.push("Небольшой профицит в дни тренировок для роста и восстановления.");
    else
      out.push("Питайся около поддержки — хватит, чтобы жёстко тренироваться и восстанавливаться.");

    switch (profile.nutritionAccess) {
      case "full":
        out.push("Постный белок в каждый приём; протеин/креатин допустимы.");
        break;
      case "moderate":
        out.push("Ставь на дешёвый белок (яйца, курица, молочка); добавки — если под рукой.");
        break;
      case "tight":
        out.push("Бюджетный белок: яйца, консервированная рыба, чечевица, овсянка, молоко — добавки не нужны.");
        break;
      case "minimal":
        out.push("Что доступно — яйца, фасоль, рис, картофель. Стабильность важнее модной еды.");
        break;
      default:
        out.push("Строй приёмы вокруг белка, цельных углеводов и овощей.");
    }
    out.push("Пей много воды и спи 7–9 часов — рост происходит в восстановлении.");
    if (profile.dietNotes.trim())
      out.push(`Учтём твои заметки: ${profile.dietNotes.trim()}.`);
    return out;
  }

  if (cutting)
    out.push("Slight calorie deficit — fuel the work, strip the fat gradually.");
  else if (building)
    out.push("Small calorie surplus on training days to build and recover.");
  else out.push("Eat around maintenance — enough to train hard and recover.");

  switch (profile.nutritionAccess) {
    case "full":
      out.push("Lean protein each meal; whey/creatine are fair game.");
      break;
    case "moderate":
      out.push("Prioritise cheap protein (eggs, chicken, dairy); supplement only if handy.");
      break;
    case "tight":
      out.push("Budget protein: eggs, tinned fish, lentils, oats, milk — no supplements needed.");
      break;
    case "minimal":
      out.push("Whatever's available — eggs, beans, rice, potatoes. Consistency beats fancy food.");
      break;
    default:
      out.push("Build meals around a protein source, whole carbs and veg.");
  }
  out.push("Hydrate hard and keep sleep at 7–9 hours — recovery is where you grow.");
  if (profile.dietNotes.trim())
    out.push(`We'll work around your notes: ${profile.dietNotes.trim()}.`);
  return out;
}

/* Client helper: try the Claude-backed route, fall back to the local engine.
   Works today (route 404s → local); wiring the real API needs no UI change. */
export async function requestAnalysis(
  profile: Profile,
  locale: Locale = "en",
): Promise<Analysis> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const data = (await res.json()) as Partial<Analysis>;
      if (data && typeof data.feasibility === "number") return data as Analysis;
    }
  } catch {
    /* offline / no route yet — fall through to local */
  }
  return localAnalysis(profile, locale);
}
