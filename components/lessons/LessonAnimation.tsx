/* ===========================================================================
   LessonAnimation — the demo picture for a movement.

   One still image per exercise, named for the exercise's own id, showing the
   movement as numbered panels. It replaced a set of rendered 3D clips: those
   were 19 MB of animation backed by 123 MB of source models, covered 16 of 89
   movements, and several lessons had to share a clip that showed a different
   movement from the one being taught. A panel strip costs ~67 KB, covers
   nearly everything, and can be checked by eye.

   A movement with no picture yet shows a quiet placeholder rather than an
   empty box — the lesson still carries its muscle map and written cues.
   =========================================================================== */

/** Exercises that have no picture. Empty today -- the two that had none were
    removed from the library rather than shipped behind a placeholder -- but
    the check stays, so a movement added without art degrades quietly instead
    of rendering a broken image. */
const MISSING = new Set<string>();

export function hasLessonImage(exerciseId: string): boolean {
  return !MISSING.has(exerciseId);
}

export function LessonAnimation({
  exerciseId,
  className = "",
  soonText = "",
  alt = "",
}: {
  /** The exercise's id — the image is named for it. */
  exerciseId: string;
  className?: string;
  /** shown when this movement has no picture yet */
  soonText?: string;
  alt?: string;
}) {
  if (!hasLessonImage(exerciseId)) {
    return (
      <div
        className={`flex items-center justify-center bg-void/30 ${className}`}
        role="img"
        aria-label={soonText || alt}
      >
        <p className="px-6 text-center text-xs text-ash-dim">{soonText}</p>
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- a wide panel strip
       whose intrinsic size is already right; next/image would add a layout
       wrapper and a resize step for no gain at ~67 KB. */
    <img
      src={`/exercises/${exerciseId}.jpg`}
      alt={alt}
      /* Sized by its own aspect ratio rather than dropped into a fixed-height
         box. The strips are all 1280 wide but vary from 605 to 853 tall, so a
         single fixed height letterboxed the short ones and cropped the tall
         ones — this way each fills the width exactly and takes the height it
         actually needs. */
      className={`${className} h-auto w-full`}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
