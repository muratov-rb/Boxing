import type { EquipmentId, Profile } from "./onboarding";

/* ===========================================================================
   CIRCUITS — named conditioning formats, run against a clock.

   Different in kind from the lesson library. A lesson teaches one movement
   with a picture; a circuit is a rule for how to combine movements you can
   already do, and its value is entirely in the structure and the timer. So
   these are text and numbers, not illustrations — which is also why they suit
   the experienced end of the audience.

   The named ones are real, widely-run benchmarks rather than invented
   routines, and each carries its origin. That matters twice over: a fighter
   who has done Cindy elsewhere can compare a score honestly, and we are not
   passing off the CrossFit canon as our own programming.
   =========================================================================== */

export type CircuitMode = "amrap" | "fortime" | "interval";

export interface TimerSpec {
  mode: CircuitMode;
  /** amrap: the window. fortime: the cap you must finish inside. */
  minutes?: number;
  /** interval only */
  workSec?: number;
  restSec?: number;
  rounds?: number;
}

export interface CircuitStep {
  /** Links to lib/exercises so the runner can show the movement's own name. */
  exerciseId: string;
  /** Fixed reps, or seconds for a timed station. Exactly one is set. */
  reps?: number;
  seconds?: number;
}

export interface Circuit {
  id: string;
  name: [en: string, ru: string];
  /** Where the format actually comes from — credited, never claimed. */
  origin: [en: string, ru: string];
  blurb: [en: string, ru: string];
  timer: TimerSpec;
  level: 1 | 2 | 3;
  requires: EquipmentId[];
  steps: CircuitStep[];
  /** The step-by-step rules. Read once before starting, not during. */
  howTo: [en: string, ru: string][];
  /** How to make it fit if the prescribed version is out of reach today. */
  scaling: [en: string, ru: string];
}

/* Tuple-to-object at the call site keeps the table below readable. */
const c = (x: Circuit): Circuit => x;

export const CIRCUITS: Circuit[] = [
  c({
    id: "cindy",
    name: ["Cindy", "Синди"],
    origin: ["CrossFit benchmark workout", "Эталонная тренировка CrossFit"],
    blurb: [
      "Twenty minutes, three movements, no rest written into it. The classic test of bodyweight engine.",
      "Двадцать минут, три движения, отдых не прописан. Классическая проверка выносливости на своём весе.",
    ],
    timer: { mode: "amrap", minutes: 20 },
    level: 2,
    requires: ["pullupbar"],
    steps: [
      { exerciseId: "pullups", reps: 5 },
      { exerciseId: "pushup", reps: 10 },
      { exerciseId: "squat", reps: 15 },
    ],
    howTo: [
      ["Set the clock for 20 minutes and start.", "Поставь таймер на 20 минут и начинай."],
      [
        "Do 5 pull-ups, 10 push-ups, 15 squats. That is one round.",
        "5 подтягиваний, 10 отжиманий, 15 приседаний. Это один круг.",
      ],
      [
        "Go straight into the next round. Rest is yours to take, but it comes out of your score.",
        "Сразу начинай следующий круг. Отдыхать можно, но это съедает результат.",
      ],
      [
        "Tap the round counter each time you finish all three movements.",
        "Отмечай круг каждый раз, когда закончил все три упражнения.",
      ],
      [
        "Your score is total rounds. 8–10 is a solid first attempt; 20+ is advanced.",
        "Результат — число кругов. 8–10 — хорошее начало; 20+ — продвинутый уровень.",
      ],
    ],
    scaling: [
      "No bar, or pull-ups not there yet? Run Ringside 5–10–15 instead — same clock, burpees in place of pull-ups.",
      "Нет турника или подтягивания пока не даются? Возьми «Рингсайд 5–10–15» — тот же таймер, вместо подтягиваний бёрпи.",
    ],
  }),

  c({
    id: "ringside-5-10-15",
    name: ["Ringside 5–10–15", "Рингсайд 5–10–15"],
    origin: [
      "Cindy, scaled for no equipment",
      "«Синди», адаптированная без инвентаря",
    ],
    blurb: [
      "Cindy's engine test with nothing but floor. Burpees replace the bar.",
      "Та же проверка выносливости, но нужен только пол. Вместо турника — бёрпи.",
    ],
    timer: { mode: "amrap", minutes: 20 },
    level: 2,
    requires: [],
    steps: [
      { exerciseId: "burpee", reps: 5 },
      { exerciseId: "pushup", reps: 10 },
      { exerciseId: "squat", reps: 15 },
    ],
    howTo: [
      ["Set the clock for 20 minutes.", "Поставь таймер на 20 минут."],
      [
        "5 burpees, 10 push-ups, 15 squats — that is a round. Repeat until time.",
        "5 бёрпи, 10 отжиманий, 15 приседаний — круг. Повторяй до конца времени.",
      ],
      [
        "Pace it from the first round. Everyone goes out too fast on this one.",
        "Держи темп с первого круга. На этой все выходят слишком быстро.",
      ],
      [
        "Break the push-ups before you fail them — 6 and 4 beats grinding to a stop.",
        "Дроби отжимания до отказа — 6 и 4 лучше, чем встать намертво.",
      ],
    ],
    scaling: [
      "Push-ups from the knees, and step back into the burpee instead of jumping.",
      "Отжимания с колен, а в бёрпи — шаг назад вместо прыжка.",
    ],
  }),

  c({
    id: "chelsea",
    name: ["Chelsea", "Челси"],
    origin: ["CrossFit benchmark workout", "Эталонная тренировка CrossFit"],
    blurb: [
      "Cindy's reps, but the clock owns you: one round every minute for thirty minutes.",
      "Те же движения, но минутой командует таймер: круг каждую минуту, тридцать минут.",
    ],
    timer: { mode: "interval", workSec: 60, restSec: 0, rounds: 30 },
    level: 3,
    requires: ["pullupbar"],
    steps: [
      { exerciseId: "pullups", reps: 5 },
      { exerciseId: "pushup", reps: 10 },
      { exerciseId: "squat", reps: 15 },
    ],
    howTo: [
      [
        "At the top of each minute: 5 pull-ups, 10 push-ups, 15 squats.",
        "В начале каждой минуты: 5 подтягиваний, 10 отжиманий, 15 приседаний.",
      ],
      [
        "Whatever is left of the minute is your rest. Finish faster, rest longer.",
        "Что осталось от минуты — твой отдых. Быстрее закончил — дольше отдыхаешь.",
      ],
      [
        "Thirty minutes. Most people fall off between minute 12 and 18.",
        "Тридцать минут. Большинство сходит между 12-й и 18-й минутой.",
      ],
      [
        "The honest version stops when you first miss a round. Note the minute you got to.",
        "Честный вариант — остановиться на первой несделанной минуте. Запиши, докуда дошёл.",
      ],
    ],
    scaling: [
      "Run 20 minutes instead of 30, or halve the reps and keep all thirty minutes.",
      "Возьми 20 минут вместо 30 — или урежь повторы вдвое, но отработай все тридцать.",
    ],
  }),

  c({
    id: "fighter-rounds",
    name: ["Fighter's Rounds", "Раунды бойца"],
    origin: [
      "The standard boxing round: 3 minutes work, 1 minute rest",
      "Стандартный боксёрский раунд: 3 минуты работы, 1 минута отдыха",
    ],
    blurb: [
      "The format every fighter on earth trains on. Six rounds of shadowbox, timed properly.",
      "Формат, по которому тренируется весь бокс. Шесть раундов боя с тенью по нормальному таймеру.",
    ],
    timer: { mode: "interval", workSec: 180, restSec: 60, rounds: 6 },
    level: 1,
    requires: [],
    steps: [{ exerciseId: "shadowboxing", seconds: 180 }],
    howTo: [
      [
        "Three minutes on, one minute off, six times. The bell runs it.",
        "Три минуты работы, минута отдыха, шесть раз. Гонг задаёт ритм.",
      ],
      [
        "Change tempo inside the round: control, then a fast flurry, then back to control.",
        "Меняй темп внутри раунда: контроль, быстрая серия, снова контроль.",
      ],
      [
        "Hands come back to the chin every single time. Tired hands drop first.",
        "Руки всегда возвращаются к подбородку. Усталые руки падают первыми.",
      ],
      [
        "Keep moving in the rest minute — walk it off, don't sit down.",
        "В минуту отдыха двигайся — походи, не садись.",
      ],
    ],
    scaling: [
      "Start at three rounds. Add one a week rather than adding minutes.",
      "Начни с трёх раундов. Добавляй по раунду в неделю, а не по минутам.",
    ],
  }),

  c({
    id: "tabata-burnout",
    name: ["Tabata Burnout", "Табата на выгорание"],
    origin: [
      "Tabata protocol — 20 seconds work, 10 rest, 8 rounds",
      "Протокол Табата — 20 секунд работы, 10 отдыха, 8 раундов",
    ],
    blurb: [
      "Four minutes, and they are the longest four minutes in conditioning.",
      "Четыре минуты — и это самые длинные четыре минуты в кондиции.",
    ],
    timer: { mode: "interval", workSec: 20, restSec: 10, rounds: 8 },
    level: 1,
    requires: [],
    steps: [{ exerciseId: "squat-jumps", seconds: 20 }],
    howTo: [
      ["Twenty seconds all-out, ten seconds rest, eight times.", "20 секунд на максимум, 10 отдых, восемь раз."],
      [
        "All-out means all-out. If round 8 looks like round 1, you paced it — that is not Tabata.",
        "Максимум — значит максимум. Если 8-й раунд как 1-й, ты экономил — это не Табата.",
      ],
      [
        "Count your reps in the first round and try to hold that number.",
        "Посчитай повторы в первом раунде и старайся держать это число.",
      ],
      [
        "Four minutes total. Do not add rounds — add intensity.",
        "Всего четыре минуты. Не добавляй раунды — добавляй интенсивность.",
      ],
    ],
    scaling: [
      "Swap jump squats for air squats, or high knees if your knees object.",
      "Замени прыжковые приседания на обычные или на высокие колени, если колени против.",
    ],
  }),

  c({
    id: "eight-station",
    name: ["Eight Stations", "Восемь станций"],
    origin: [
      "Standard boxing-gym conditioning circuit",
      "Стандартный кондиционный круг боксёрского зала",
    ],
    blurb: [
      "Timed stations, no rep counting. The gentlest way into circuit work.",
      "Станции по времени, без счёта повторов. Самый мягкий вход в круговую работу.",
    ],
    timer: { mode: "interval", workSec: 30, restSec: 20, rounds: 8 },
    level: 1,
    requires: [],
    steps: [
      { exerciseId: "jumping-jacks", seconds: 30 },
      { exerciseId: "pushup", seconds: 30 },
      { exerciseId: "squat", seconds: 30 },
      { exerciseId: "mountain-climber", seconds: 30 },
      { exerciseId: "shadowboxing", seconds: 30 },
      { exerciseId: "plank", seconds: 30 },
      { exerciseId: "high-knees", seconds: 30 },
      { exerciseId: "situp", seconds: 30 },
    ],
    howTo: [
      [
        "Thirty seconds at each station, twenty seconds to move on.",
        "Тридцать секунд на станции, двадцать — на переход.",
      ],
      [
        "Work at a pace you could hold for all eight. This is not a sprint.",
        "Держи темп, который вытянешь все восемь. Это не спринт.",
      ],
      [
        "One full lap is about seven minutes. Two or three laps makes a session.",
        "Полный круг — примерно семь минут. Два-три круга — полноценная тренировка.",
      ],
      [
        "Take 90 seconds between laps if you run more than one.",
        "Между кругами — 90 секунд, если делаешь больше одного.",
      ],
    ],
    scaling: [
      "Cut to 20 seconds of work and keep the 20 of rest until the lap feels repeatable.",
      "Сократи работу до 20 секунд, оставив 20 отдыха, пока круг не станет повторяемым.",
    ],
  }),

  c({
    id: "the-ladder",
    name: ["The Ladder", "Лестница"],
    origin: ["Classic pyramid rep scheme", "Классическая пирамида повторов"],
    blurb: [
      "Up one to ten and back down. The way down is where it is decided.",
      "Вверх от одного до десяти и обратно вниз. Всё решается на спуске.",
    ],
    timer: { mode: "fortime", minutes: 25 },
    level: 2,
    requires: [],
    steps: [
      { exerciseId: "burpee", reps: 1 },
      { exerciseId: "pushup", reps: 1 },
      { exerciseId: "squat-jumps", reps: 1 },
    ],
    howTo: [
      [
        "Round 1: one of each. Round 2: two of each. Keep climbing to ten.",
        "Круг 1: по одному. Круг 2: по два. Поднимайся до десяти.",
      ],
      [
        "At ten, come back down: nine, eight, seven, all the way to one.",
        "На десяти иди обратно вниз: девять, восемь, семь — до одного.",
      ],
      [
        "That is 100 of each movement. The clock stops when you finish, not at 25 minutes.",
        "Это по 100 повторов каждого. Часы стоят, когда закончил, а не на 25-й минуте.",
      ],
      [
        "The 25-minute cap is a safety net, not a target.",
        "Лимит в 25 минут — страховка, а не цель.",
      ],
    ],
    scaling: [
      "Climb to six instead of ten. That is 36 of each and still a real session.",
      "Поднимись до шести вместо десяти. Это по 36 повторов и всё ещё настоящая работа.",
    ],
  }),

  c({
    id: "death-by-burpees",
    name: ["Death by Burpees", "Смерть от бёрпи"],
    origin: ["Classic ascending EMOM", "Классический возрастающий EMOM"],
    blurb: [
      "One burpee in minute one, two in minute two. It ends when you cannot.",
      "Одно бёрпи в первую минуту, два — во вторую. Заканчивается, когда не смог.",
    ],
    timer: { mode: "interval", workSec: 60, restSec: 0, rounds: 20 },
    level: 3,
    requires: [],
    steps: [{ exerciseId: "burpee", reps: 1 }],
    howTo: [
      [
        "Minute 1: one burpee. Minute 2: two. Minute 3: three. Keep adding one.",
        "Минута 1: одно бёрпи. Минута 2: два. Минута 3: три. Каждый раз плюс одно.",
      ],
      [
        "The rest of each minute is recovery — and it shrinks every single round.",
        "Остаток минуты — восстановление, и он тает с каждым кругом.",
      ],
      [
        "You are done at the first minute you cannot finish. Your score is the last one you did.",
        "Конец — первая минута, которую не закрыл. Результат — последняя выполненная.",
      ],
      [
        "Round 10 is where most people meet themselves. Round 15 is a genuinely strong score.",
        "На 10-м круге большинство встречает себя. 15-й — по-настоящему сильный результат.",
      ],
    ],
    scaling: [
      "Start at three and add one — or use sprawls instead of full burpees.",
      "Начни с трёх и добавляй по одному — или делай спрол вместо полного бёрпи.",
    ],
  }),
];

/* ------------------------------ helpers ---------------------------------- */

export function circuitById(id: string): Circuit | undefined {
  return CIRCUITS.find((x) => x.id === id);
}

/** Total wall-clock length, so a card can promise a time before you commit. */
export function circuitMinutes(x: Circuit): number {
  const t = x.timer;
  if (t.mode === "interval") {
    const secs = ((t.workSec ?? 0) + (t.restSec ?? 0)) * (t.rounds ?? 0);
    return Math.round(secs / 60);
  }
  return t.minutes ?? 0;
}

/** Hidden rather than shown-and-locked: a circuit needing a pull-up bar is
    noise to someone training in a bedroom. Mirrors filterExercises. */
export function availableCircuits(
  profile: Pick<Profile, "environment" | "equipment"> | null,
): Circuit[] {
  if (!profile) return CIRCUITS.filter((x) => x.requires.length === 0);
  if (profile.environment === "gym") return CIRCUITS;
  const owned = profile.equipment ?? [];
  return CIRCUITS.filter(
    (x) => x.requires.length === 0 || x.requires.every((r) => owned.includes(r)),
  );
}
