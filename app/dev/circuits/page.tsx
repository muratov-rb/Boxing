"use client";

import { useState } from "react";
import { CircuitRunner } from "@/components/circuits/CircuitRunner";
import { CIRCUITS, circuitMinutes } from "@/lib/circuits";

/* Bench for the circuit runner — /circuits is behind the login wall.

   One circuit at a time: the preview pane runs hidden, which throttles React
   hydration on trees past roughly 200 nodes, and a page rendering eight
   runners would never become interactive. */

export default function CircuitBench() {
  const [id, setId] = useState(CIRCUITS[0].id);
  const circuit = CIRCUITS.find((c) => c.id === id)!;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="font-display text-xl uppercase">Circuit bench</h1>
      <select
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="mt-3 w-full rounded-md border border-line bg-void px-3 py-2 text-base text-bone"
      >
        {CIRCUITS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name[0]} — {c.timer.mode} — {circuitMinutes(c)} min
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-ash-dim">
        mode {circuit.timer.mode} · {JSON.stringify(circuit.timer)}
      </p>
      <div className="mt-5">
        <CircuitRunner key={circuit.id} circuit={circuit} />
      </div>
    </main>
  );
}
