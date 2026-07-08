"use client";

/* Internal animation workbench — not linked from anywhere.
   /dev/rig            → grid of buttons, one canvas
   /dev/rig?p=pushup   → open straight on a preset */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EXERCISES, type DemoPreset } from "@/lib/exercises";
import { Exercise3D } from "@/components/lessons/Exercise3D";

const PRESETS = [...new Set(EXERCISES.map((e) => e.demo))];

function RigBench() {
  const params = useSearchParams();
  const initial = (params.get("p") as DemoPreset) || "pushup";
  const [preset, setPreset] = useState<DemoPreset>(
    PRESETS.includes(initial) ? initial : "pushup",
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="font-display text-2xl uppercase">
        Rig bench — <span className="text-blood">{preset}</span>
      </h1>
      <div className="mt-4 overflow-hidden rounded-[20px] border border-line/70 bg-void/40">
        <Exercise3D key={preset} preset={preset} className="h-[420px] w-full" />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`badge transition-colors ${p === preset ? "!border-blood !text-blood" : ""}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RigPage() {
  return (
    <Suspense>
      <RigBench />
    </Suspense>
  );
}
