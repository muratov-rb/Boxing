/* Shown the moment a navigation starts, for every route that doesn't define
   its own. Every page here is server-rendered per request, so a tap used to
   sit on the old screen doing nothing until the new one arrived — which reads
   as the app having frozen rather than as it working.

   Deliberately a shape, not a spinner: it matches the header-plus-content
   frame every page shares, so the layout doesn't jump when the real content
   lands on top of it. */
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true">
      <div className="h-16 border-b border-line/70" />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-52 rounded-xl bg-line/60" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-line/40" />
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            <div className="h-28 rounded-2xl bg-line/40" />
            <div className="h-28 rounded-2xl bg-line/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
