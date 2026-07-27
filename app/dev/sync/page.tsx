"use client";

/* Internal check for the sync layer — not linked, 404s in production.

   Two things must hold or a user loses data:
     1. change plumbing — a tracking write notifies (so it gets pushed), while
        hydrating from the server does NOT (or a pull echoes into a push loop);
     2. the merge — opening a second device must never drop a workout, a meal
        or XP that the first device recorded. */

import { useEffect, useState } from "react";
import { addMeal, hydrateLocal, onTrackingChange, KEYS } from "@/lib/tracking";
import { computeMergePatch } from "@/lib/sync";

export default function SyncBench() {
  const [result, setResult] = useState("running…");

  useEffect(() => {
    const out: Record<string, unknown> = {};

    /* ---------------- 1. change plumbing ---------------- */
    const seen: string[] = [];
    const stop = onTrackingChange((k) => seen.push(k));
    addMeal("sync probe", 123, "manual");
    const afterWrite = seen.length;
    hydrateLocal({ [KEYS.rankSeen]: 0 });
    const afterHydrate = seen.length;
    stop();
    addMeal("post-unsubscribe", 50, "manual");
    out.plumbing = {
      writeNotified: afterWrite === 1 && seen[0] === KEYS.meals,
      hydrateStayedSilent: afterHydrate === afterWrite,
      unsubscribeWorked: seen.length === afterHydrate,
    };

    /* ---------------- 2. the merge ---------------- */
    // pretend THIS device trained Monday; the server knows about Tuesday
    const saved = {
      streak: localStorage.getItem(KEYS.streak),
      visits: localStorage.getItem(KEYS.visits),
      meals: localStorage.getItem(KEYS.meals),
      xp: localStorage.getItem(KEYS.xp),
      burn: localStorage.getItem(KEYS.burn),
      usage: localStorage.getItem(KEYS.usage),
    };
    localStorage.setItem(KEYS.streak, JSON.stringify(["2026-01-05"]));
    localStorage.setItem(KEYS.visits, JSON.stringify(["2026-01-05"]));
    localStorage.setItem(
      KEYS.meals,
      JSON.stringify({ "2026-01-05": [{ id: "local1", name: "eggs", kcal: 200, at: "T1" }] }),
    );
    localStorage.setItem(KEYS.xp, JSON.stringify({ xp: 40, lastActive: "2026-01-05" }));
    localStorage.setItem(KEYS.burn, JSON.stringify({ "2026-01-05": 100 }));
    localStorage.setItem(KEYS.usage, JSON.stringify({ "2026-01-05": { calorieScan: 1 } }));

    const patch = computeMergePatch({
      profile: null,
      progress: { xp: 90, xp_last_active: "2026-01-06", xp_day: null, xp_day_amount: 0, rank_seen: 2 },
      activity: [
        // the day only the server knows about
        {
          day: "2026-01-06",
          trained: true,
          visited: true,
          burned: 250,
          meals: [{ id: "srv1", name: "rice", kcal: 300, at: "T2", source: "manual" }],
          usage: { calorieScan: 2 },
        },
        // the same day both know about, with different details
        {
          day: "2026-01-05",
          trained: false,
          visited: true,
          burned: 60,
          meals: [{ id: "srv2", name: "milk", kcal: 90, at: "T3", source: "manual" }],
          usage: { techniqueVideo: 1 },
        },
      ],
    });

    const streak = patch[KEYS.streak] as string[];
    const meals = patch[KEYS.meals] as Record<string, { id: string }[]>;
    const burn = patch[KEYS.burn] as Record<string, number>;
    const usage = patch[KEYS.usage] as Record<string, Record<string, number>>;
    const xp = patch[KEYS.xp] as { xp: number };

    out.merge = {
      keptLocalTrainingDay: streak.includes("2026-01-05"),
      gainedServerTrainingDay: streak.includes("2026-01-06"),
      keptLocalMeal: meals["2026-01-05"].some((m) => m.id === "local1"),
      gainedServerMeal: meals["2026-01-05"].some((m) => m.id === "srv2"),
      noDuplicateMeals: meals["2026-01-05"].length === 2,
      burnTakesHigher: burn["2026-01-05"] === 100, // local 100 vs server 60
      usageUnioned:
        usage["2026-01-05"].calorieScan === 1 && usage["2026-01-05"].techniqueVideo === 1,
      xpTakesHigher: xp?.xp === 90, // server ahead
      rankSeenAdopted: patch[KEYS.rankSeen] === 2,
    };

    // put the real data back — the bench must leave no trace
    for (const [k, v] of Object.entries(saved)) {
      const key = KEYS[k as keyof typeof KEYS];
      if (v === null) localStorage.removeItem(key);
      else localStorage.setItem(key, v);
    }
    try {
      const raw = localStorage.getItem(KEYS.meals);
      if (raw) {
        const all = JSON.parse(raw) as Record<string, { name: string }[]>;
        for (const d of Object.keys(all)) {
          all[d] = all[d].filter(
            (m) => m.name !== "sync probe" && m.name !== "post-unsubscribe",
          );
        }
        localStorage.setItem(KEYS.meals, JSON.stringify(all));
      }
    } catch {
      /* ignore */
    }

    const flat = [
      ...Object.values(out.plumbing as Record<string, boolean>),
      ...Object.values(out.merge as Record<string, boolean>),
    ];
    out.ALL_PASS = flat.every(Boolean);
    setResult(JSON.stringify(out, null, 2));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="font-display text-2xl uppercase">
        Sync bench — <span className="text-blood">plumbing + merge</span>
      </h1>
      <pre className="mt-4 rounded-lg border border-line/70 bg-void/60 p-4 text-xs text-ash">
        {result}
      </pre>
    </div>
  );
}
