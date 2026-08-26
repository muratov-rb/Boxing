"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GuidesPanel } from "@/components/lessons/GuidesPanel";

/* Bench for the guides. /lessons is far past the node count the hidden preview
   pane will hydrate, so the reader view is opened via initialId rather than by
   clicking a card. `?id=` picks which one; omit it for the list. */

function Bench() {
  const id = useSearchParams().get("id") ?? undefined;
  return <GuidesPanel initialId={id} />;
}

export default function GuidesBench() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={null}>
        <Bench />
      </Suspense>
    </main>
  );
}
