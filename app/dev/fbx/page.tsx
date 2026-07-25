"use client";

/* Internal workbench for the Mixamo-rigged coach — not linked from anywhere.
   /dev/fbx — rigged model + real mocap clips, with buttons to trigger each
   punch and watch it blend back to the idle stance. */

import { useCallback, useState } from "react";
import { CoachFBX } from "@/components/lessons/CoachFBX";

export default function FbxBench() {
  const [ids, setIds] = useState<string[]>([]);
  const [playFn, setPlayFn] = useState<((id: string) => void) | null>(null);

  const onReady = useCallback((play: (id: string) => void, clipIds: string[]) => {
    setPlayFn(() => play);
    setIds(clipIds);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="font-display text-2xl uppercase">
        FBX bench — <span className="text-blood">Mixamo coach</span>
      </h1>
      <p className="mt-2 text-sm text-ash">
        Diagnostics on <code className="text-bone">window.__fbx.report</code>. Idle loops;
        a punch plays once then crossfades back.
      </p>
      <div className="mt-4 overflow-hidden rounded-[20px] border border-line/70 bg-void/40">
        <CoachFBX className="h-[520px] w-full" onReady={onReady} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ids.length === 0 && <span className="text-xs text-ash-dim">loading clips…</span>}
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => playFn?.(id)}
            className="badge transition-colors hover:!border-blood hover:!text-blood"
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
