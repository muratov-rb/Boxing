"use client";

import { useState } from "react";
import { MacroPanel } from "@/components/nutrition/MacroPanel";
import { MicroPanel } from "@/components/nutrition/MicroPanel";
import { WaterCard } from "@/components/nutrition/WaterCard";
import type { Meal } from "@/lib/tracking";
import type { Profile } from "@/lib/onboarding";

/* Bench for the nutrition panels — /calories is behind the login wall, so this
   is the only way to look at them while building.

   GOTCHA, measured rather than assumed: the preview pane runs with
   document.hidden === true, which throttles React's hydration scheduler. Trees
   past roughly 200 nodes never finish hydrating in it — the untouched landing
   page fails the same way. So the panels are shown one section at a time
   behind a switch rather than all at once; render them all together and
   nothing on the page will respond to a click, which looks exactly like a bug
   in the components and is not.

   Hidden in production by proxy.ts. */

const PROFILE = {
  weight: "78",
  weightUnit: "kg",
  height: "180",
  heightUnit: "cm",
  age: "27",
  sex: "male",
  goals: ["lose_fat"],
} as unknown as Profile;

/* A believable day: two scanned meals carrying full data, one typed by hand
   with calories only — so the coverage warning has something to report. */
const MEALS: Meal[] = [
  {
    id: "a",
    name: "Oats, banana, whey",
    kcal: 520,
    protein: 38,
    carbs: 62,
    fat: 11,
    fiber: 9,
    micros: { iron: 4, calcium: 420, potassium: 900, sodium: 220, vitaminC: 12 },
    at: "2026-08-26T07:30:00Z",
    source: "scan",
  },
  {
    id: "b",
    name: "Chicken, rice, broccoli",
    kcal: 680,
    protein: 52,
    carbs: 74,
    fat: 14,
    fiber: 7,
    micros: { iron: 3, calcium: 110, potassium: 1200, sodium: 1450, vitaminC: 68 },
    at: "2026-08-26T13:00:00Z",
    source: "scan",
  },
  { id: "c", name: "Handful of almonds", kcal: 180, at: "2026-08-26T16:00:00Z", source: "manual" },
];

const VIEWS = ["macros", "water", "micros", "empty"] as const;
type View = (typeof VIEWS)[number];

export default function NutritionBench() {
  const [view, setView] = useState<View>("macros");

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="font-display text-xl uppercase">Nutrition bench</h1>
      <p className="mt-2 text-xs text-ash-dim">
        One panel at a time — see the note in this file about hydration in the preview pane.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-lg border px-3 py-2 font-condensed text-xs uppercase tracking-wider ${
              view === v ? "border-blood text-bone" : "border-line text-ash"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {view === "macros" && <MacroPanel meals={MEALS} profile={PROFILE} />}
        {view === "water" && <WaterCard />}
        {view === "micros" && <MicroPanel meals={MEALS} profile={PROFILE} />}
        {view === "empty" && <MicroPanel meals={[]} profile={PROFILE} />}
      </div>
    </main>
  );
}
