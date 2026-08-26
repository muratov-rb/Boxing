"use client";

import { useState } from "react";
import { CircuitTeaser } from "@/components/circuits/CircuitTeaser";

/* Bench for the circuit teaser's gating. It lives on /lessons and /train,
   both far past the node count the hidden preview pane will hydrate, so it
   can only be exercised on a page this small. */

export default function TeaserBench() {
  const [n, setN] = useState(0);

  const seed = (path: string, xp: number) => {
    localStorage.setItem(
      "pressure.profile",
      JSON.stringify({
        path, weight: "78", weightUnit: "kg", height: "180", heightUnit: "cm",
        age: "27", sex: "male", goals: ["get_fit"], targetWeight: "", timeframe: "6m",
        customTimeframe: "", environment: "home_bodyweight", equipment: [],
        customEquipment: [], equipmentNotes: "", nutritionAccess: "full",
        supplements: false, dietNotes: "", customGoal: "",
      }),
    );
    if (xp > 0) {
      localStorage.setItem("pressure.xp", JSON.stringify({ xp, lastActive: "2026-08-26" }));
    } else {
      localStorage.removeItem("pressure.xp");
    }
    setN((v) => v + 1);
  };

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="font-display text-xl uppercase">Teaser bench</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <button id="beginner" onClick={() => seed("beginner", 0)} className="btn btn-ghost !py-2 text-xs">
          beginner / 0xp
        </button>
        <button id="earned" onClick={() => seed("beginner", 600)} className="btn btn-ghost !py-2 text-xs">
          beginner / 600xp
        </button>
        <button id="experienced" onClick={() => seed("experienced", 0)} className="btn btn-ghost !py-2 text-xs">
          experienced
        </button>
      </div>
      <div className="mt-6" id="slot">
        <CircuitTeaser key={n} />
      </div>
    </main>
  );
}
