"use client";

import { localAnalysis } from "@/lib/analysis";
import { buildDailyPlan } from "@/lib/session";
import { filterExercises } from "@/lib/exercises";
import type { Profile } from "@/lib/onboarding";

/* Bench for the feasibility engine — the numbers it prints are shown to every
   user on the reveal screen, so the awkward combinations are worth being able
   to read at a glance. Hidden in production by proxy.ts. */

const mk = (o: Record<string, unknown>) =>
  ({
    path: "beginner", weight: "60", weightUnit: "kg", height: "170", heightUnit: "cm",
    age: "27", sex: "male", goals: ["lose_fat"], targetWeight: "", timeframe: "6m",
    customTimeframe: "", environment: "home", equipment: [], nutritionAccess: "full",
    supplements: false, dietNotes: "", customGoal: "", ...o,
  }) as unknown as Profile;

const CASES: [string, Profile][] = [
  ["REPORTED BUG — 16 kg / 26 wk = 0.6 kg/wk, 27% of a 60 kg body",
    mk({ weight: "60", targetWeight: "44", timeframe: "6m" })],
  ["truly impossible — 30 kg / 6 wk = 5 kg/wk",
    mk({ weight: "90", targetWeight: "60", timeframe: "6w" })],
  ["extreme — 20 kg / 12 wk = 1.7 kg/wk",
    mk({ weight: "95", targetWeight: "75", timeframe: "3m" })],
  ["fast — 12 kg / 12 wk = 1.0 kg/wk",
    mk({ weight: "90", targetWeight: "78", timeframe: "3m" })],
  ["modest — 6 kg / 26 wk",
    mk({ weight: "80", targetWeight: "74", timeframe: "6m" })],
];

function SessionLevels() {
  const rows = (["beginner", "experienced"] as const).map((path) => {
    const p = mk({ path });
    /* Tuesday — Sundays are full rest and Thursdays active recovery, neither
       of which exercises the difficulty selection. */
    const plan = buildDailyPlan(filterExercises(p), p, new Date(2026, 7, 25));
    return {
      path,
      level: plan.level,
      kind: plan.kind,
      items: plan.items.map((e) => `${e.id} (L${e.level})`),
      avg:
        plan.items.length > 0
          ? (plan.items.reduce((s, e) => s + e.level, 0) / plan.items.length).toFixed(2)
          : "—",
    };
  });

  return (
    <section className="panel mt-8 p-5">
      <p className="font-condensed text-xs uppercase tracking-widest text-ash">
        Session difficulty by path
      </p>
      {rows.map((r) => (
        <div key={r.path} className="mt-3">
          <p className="text-sm text-bone">
            {r.path} — kind {r.kind}, level {r.level}, avg exercise level{" "}
            <strong>{r.avg}</strong>
          </p>
          <p className="mt-1 text-xs text-ash-dim">{r.items.join(", ")}</p>
        </div>
      ))}
    </section>
  );
}

export default function AnalysisBench() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-xl uppercase">Feasibility bench</h1>
      <SessionLevels />
      {CASES.map(([label, p]) => {
        const a = localAnalysis(p, "en");
        return (
          <section key={label} className="panel mt-4 p-5">
            <p className="font-condensed text-xs uppercase tracking-widest text-ash">{label}</p>
            <p className="mt-2 font-display text-2xl">
              {a.feasibility}% — {a.verdict}
            </p>
            <ul className="mt-3 space-y-2">
              {a.cautions.map((c) => (
                <li key={c} className="text-sm leading-relaxed text-ash">• {c}</li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
