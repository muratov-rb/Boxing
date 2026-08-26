/* ===========================================================================
   Round signals.

   Synthesised rather than shipped as audio files: three short tones would be
   a few hundred KB of assets to download, cache and version, and a bell is
   two decaying sine partials — cheaper to generate than to fetch.

   Browsers refuse to start audio before a user gesture, so the context is
   created by prime(), which the Start button calls. Everything here fails
   silently: a workout must never break because audio is unavailable.
   =========================================================================== */

export type ChimeKind = "work" | "rest" | "done";

const MUTE_KEY = "pressure.sound";

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Call from a click. Creates (or resumes) the context while the browser is
    still willing, so the first real chime is not swallowed. */
export function primeAudio(): void {
  const c = audioContext();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MUTE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, on ? "on" : "off");
  } catch {
    /* storage blocked — sound just resets next visit */
  }
  if (on) primeAudio();
}

/* One struck bell: a fundamental plus a quiet upper partial, both decaying.
   The partial is what stops it sounding like a test tone. */
function strike(c: AudioContext, freq: number, at: number, gain: number, dur: number): void {
  for (const [mult, level] of [
    [1, gain],
    [2.76, gain * 0.35], // inharmonic ratio, the way real bells behave
  ] as const) {
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    /* Fast attack, exponential decay. Ramping to a tiny value rather than 0
       because exponentialRampToValueAtTime rejects zero. */
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(level, at + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(amp).connect(c.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

/** The signal that a phase changed. Work is the bright one you react to, rest
    is lower and softer, done is the three-hit finish. */
export function chime(kind: ChimeKind): void {
  if (!soundEnabled()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => {});

  const now = c.currentTime + 0.01;
  try {
    if (kind === "work") {
      strike(c, 880, now, 0.28, 0.9);
    } else if (kind === "rest") {
      strike(c, 523.25, now, 0.2, 1.1);
    } else {
      strike(c, 659.25, now, 0.26, 0.7);
      strike(c, 830.61, now + 0.16, 0.26, 0.7);
      strike(c, 1046.5, now + 0.32, 0.3, 1.4);
    }
  } catch {
    /* never let a missing audio path stop the workout */
  }
}
