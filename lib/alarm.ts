/* ===========================================================================
   The noise a reminder makes.

   A notification on its own is silent far more often than people expect: the
   OS decides, the tab may be in the background, and on a phone a web
   notification frequently arrives with no sound at all. If the app is open,
   the app should make the sound itself rather than hoping.

   The tone is synthesised rather than loaded from a file. A boxing bell is
   three struck tones with a long decay, which is a few oscillators — so there
   is no asset to download, nothing to 404 after a deploy, and it rings
   instantly instead of after a fetch.

   THE AUTOPLAY RULE: a browser will not let a page make noise until the
   visitor has interacted with it. That is why primeAlarm() exists and why it
   must be called from inside a real click or keypress. Without it the first
   reminder of the session is silent and nothing reports an error.
   =========================================================================== */

let ctx: AudioContext | null = null;
let primed = false;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Call from a user gesture — a tap on the toggle, the test button, or the
    first touch anywhere on the page. Safe to call repeatedly. */
export function primeAlarm(): void {
  const ac = context();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  if (primed) return;
  primed = true;
  /* iOS wants a buffer actually played inside the gesture; resuming the
     context is not enough on its own. One silent sample does it. */
  try {
    const source = ac.createBufferSource();
    source.buffer = ac.createBuffer(1, 1, 22050);
    source.connect(ac.destination);
    source.start(0);
  } catch {
    /* an older engine that will not take a zero-length buffer — the resume
       above is still worth having */
  }
}

/** True once the browser has actually allowed sound, so the UI can tell
    someone their reminders will be silent instead of letting them find out. */
export function alarmUnlocked(): boolean {
  return ctx !== null && ctx.state === "running";
}

/* One strike of the bell: a fundamental with two overtones, each fading on
   its own curve. Equal-volume overtones sound like a fire alarm; a bell is
   mostly fundamental with the higher partials dying first. */
function strike(ac: AudioContext, at: number): void {
  const out = ac.createGain();
  out.connect(ac.destination);
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(0.34, at + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 0.75);

  const partials: [number, number, number][] = [
    [880, 1, 0.75],
    [1318.5, 0.42, 0.45],
    [2640, 0.16, 0.22],
  ];
  for (const [freq, level, decay] of partials) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(gain);
    gain.connect(out);
    osc.start(at);
    osc.stop(at + 0.8);
  }
}

/** Ring. Three strikes, about a second and a quarter in total. */
export function playAlarm(): void {
  const ac = context();
  if (!ac) return;
  /* A context can be suspended again by the browser after a while in the
     background, so resume every time rather than only on the first call. */
  if (ac.state === "suspended") void ac.resume();
  const start = ac.currentTime + 0.02;
  for (let i = 0; i < 3; i++) strike(ac, start + i * 0.4);
}

/* Long-short-long-short-longer. Distinct from the single buzz of a message,
   which is the point — it should be recognisable through a pocket. */
export const VIBRATE_PATTERN = [220, 110, 220, 110, 420];

/** Buzz. Silently does nothing on desktop and on iOS, neither of which
    supports the API; nothing here depends on it having worked. */
export function vibrateAlarm(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(VIBRATE_PATTERN);
  } catch {
    /* some browsers throw instead of returning false when the page is hidden */
  }
}
