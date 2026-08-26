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

/* ------------------------- equipment-based circuits ----------------------- */
/* The first eight are all floor-and-bar work. These need something, and are
   hidden from anyone who has not ticked the gear at onboarding. */

CIRCUITS.push(
  c({
    id: "heavy-bag-rounds",
    name: ["Heavy Bag Rounds", "Раунды на мешке"],
    origin: ["Standard bag work, on the fight clock", "Стандартная работа на мешке по боевому таймеру"],
    blurb: [
      "Eight rounds on the bag. The one session that builds punch endurance and nothing else does.",
      "Восемь раундов на мешке. Единственная работа, которая строит выносливость удара.",
    ],
    timer: { mode: "interval", workSec: 180, restSec: 60, rounds: 8 },
    level: 2,
    requires: ["heavybag"],
    steps: [{ exerciseId: "heavy-bag-combos", seconds: 180 }],
    howTo: [
      ["Three minutes on the bag, one minute off, eight times.", "Три минуты на мешке, минута отдыха, восемь раз."],
      [
        "Pick one combination per round and live on it. Rounds spent throwing whatever comes teach nothing.",
        "Выбери одну комбинацию на раунд и живи в ней. Раунды «что придёт» ничему не учат.",
      ],
      [
        "Move after every combination. A fighter who stands still after punching gets hit.",
        "Двигайся после каждой комбинации. Кто стоит после ударов — тот получает.",
      ],
      [
        "Last thirty seconds of each round: throw at full output. That is where the round is won.",
        "Последние тридцать секунд раунда — работай на полную. Именно там раунд выигрывается.",
      ],
    ],
    scaling: [
      "Four rounds, or drop to two minutes. Volume before intensity.",
      "Четыре раунда или по две минуты. Сначала объём, потом интенсивность.",
    ],
  }),

  c({
    id: "bag-and-burpee",
    name: ["Bag & Burpee", "Мешок и бёрпи"],
    origin: ["Gym conditioning pairing", "Классическая связка зального кондиционирования"],
    blurb: [
      "Punch, hit the floor, get up, punch again. Teaches you to work while your lungs argue.",
      "Бей, падай, вставай, снова бей. Учит работать, когда лёгкие против.",
    ],
    timer: { mode: "interval", workSec: 60, restSec: 30, rounds: 10 },
    level: 3,
    requires: ["heavybag"],
    steps: [
      { exerciseId: "heavy-bag-combos", seconds: 30 },
      { exerciseId: "burpee", seconds: 30 },
    ],
    howTo: [
      [
        "Thirty seconds on the bag, then thirty seconds of burpees, without stopping between.",
        "Тридцать секунд на мешке, затем тридцать секунд бёрпи, без паузы между ними.",
      ],
      ["Thirty seconds rest, then go again. Ten times.", "Тридцать секунд отдыха и снова. Десять раз."],
      [
        "Punch at real speed even on the last round. Slow punches make this cardio, not boxing.",
        "Бей в реальной скорости даже на последнем круге. Медленные удары превращают это в кардио, а не бокс.",
      ],
    ],
    scaling: [
      "Six rounds, or replace burpees with sprawls to keep the pace honest.",
      "Шесть кругов или замени бёрпи на спролы, чтобы держать темп честным.",
    ],
  }),

  c({
    id: "rope-rounds",
    name: ["Rope Rounds", "Раунды на скакалке"],
    origin: ["Boxing gym warm-up standard", "Стандартная разминка боксёрского зала"],
    blurb: [
      "Six rounds of rope. Boring, unglamorous, and the reason good fighters have light feet.",
      "Шесть раундов скакалки. Скучно, непразднично — и именно поэтому у хороших бойцов лёгкие ноги.",
    ],
    timer: { mode: "interval", workSec: 180, restSec: 60, rounds: 6 },
    level: 1,
    requires: ["jumprope"],
    steps: [{ exerciseId: "jump-rope", seconds: 180 }],
    howTo: [
      ["Three minutes skipping, one minute off, six rounds.", "Три минуты прыжков, минута отдыха, шесть раундов."],
      [
        "Round 1–2 steady. Rounds 3–4 add a step: alternate feet, then boxer skip.",
        "Раунды 1–2 ровно. В 3–4 добавь вариант: попеременно ноги, затем боксёрский шаг.",
      ],
      [
        "Rounds 5–6: thirty seconds fast, thirty steady, repeat.",
        "Раунды 5–6: тридцать секунд быстро, тридцать ровно, повторяй.",
      ],
      [
        "Trip-ups are part of it. Pick the rope up and carry on — the clock does not stop.",
        "Зацепы — часть дела. Поднял скакалку и продолжай, таймер не ждёт.",
      ],
    ],
    scaling: [
      "Three rounds, and step over the rope instead of jumping if your calves are new to this.",
      "Три раунда, и переступай скакалку вместо прыжков, если икры к этому не привыкли.",
    ],
  }),

  c({
    id: "kettlebell-engine",
    name: ["Kettlebell Engine", "Гиревой мотор"],
    origin: ["Fighter's kettlebell complex", "Гиревой комплекс для бойцов"],
    blurb: [
      "The swing is the closest a gym movement gets to the hip snap of a real punch.",
      "Мах гирей — самое близкое к работе таза в настоящем ударе, что есть в зале.",
    ],
    timer: { mode: "interval", workSec: 40, restSec: 20, rounds: 12 },
    level: 2,
    requires: ["kettlebell"],
    steps: [
      { exerciseId: "kb-swing", seconds: 40 },
      { exerciseId: "goblet-squat", seconds: 40 },
      { exerciseId: "farmer-carry", seconds: 40 },
    ],
    howTo: [
      [
        "Forty seconds work, twenty rest, rotating through the three movements.",
        "Сорок секунд работы, двадцать отдыха, по кругу через три движения.",
      ],
      ["Twelve stations — that is four full laps.", "Двенадцать станций — это четыре полных круга."],
      [
        "The swing is a hip snap, not a squat and not a lift with the arms. The bell floats; you do not raise it.",
        "Мах — это щелчок тазом, не присед и не подъём руками. Гиря летит сама, ты её не поднимаешь.",
      ],
      [
        "Set the bell down the moment your back rounds. That is the rep that hurts you.",
        "Ставь гирю, как только округлилась спина. Именно это повторение и травмирует.",
      ],
    ],
    scaling: [
      "Eight stations, and swing to chest height rather than overhead.",
      "Восемь станций, и маши до груди, а не над головой.",
    ],
  }),

  c({
    id: "dumbbell-fighter",
    name: ["Dumbbell Fighter", "Боец с гантелями"],
    origin: ["Strength-endurance circuit", "Круг на силовую выносливость"],
    blurb: [
      "Pressing and rowing under fatigue — the shoulders and back that hold a guard up in round ten.",
      "Жимы и тяги на фоне усталости — плечи и спина, которые держат защиту в десятом раунде.",
    ],
    timer: { mode: "interval", workSec: 45, restSec: 15, rounds: 12 },
    level: 2,
    requires: ["dumbbells"],
    steps: [
      { exerciseId: "db-shoulder-press", seconds: 45 },
      { exerciseId: "db-row", seconds: 45 },
      { exerciseId: "lunge", seconds: 45 },
    ],
    howTo: [
      ["Forty-five seconds on, fifteen off, through the three movements.", "Сорок пять секунд работы, пятнадцать отдыха, через три движения."],
      ["Four laps. Pick a weight you could press for a full minute, not your heaviest.", "Четыре круга. Бери вес, который выжмешь целую минуту, а не максимальный."],
      [
        "Fifteen seconds is not enough to recover, and that is the point — this trains the tank, not the lift.",
        "Пятнадцати секунд не хватит на восстановление — в этом и смысл: тренируем бак, а не подъём.",
      ],
    ],
    scaling: [
      "Thirty seconds of work, thirty of rest, and lighter than you think.",
      "Тридцать секунд работы, тридцать отдыха, и легче, чем кажется.",
    ],
  }),

  c({
    id: "angie",
    name: ["Angie", "Энджи"],
    origin: ["CrossFit benchmark workout", "Эталонная тренировка CrossFit"],
    blurb: [
      "One hundred of each, in order, nothing shared out. A long, honest grind.",
      "По сто каждого, по порядку, без дробления. Долгая честная работа.",
    ],
    timer: { mode: "fortime", minutes: 40 },
    level: 3,
    requires: ["pullupbar"],
    steps: [
      { exerciseId: "pullups", reps: 100 },
      { exerciseId: "pushup", reps: 100 },
      { exerciseId: "situp", reps: 100 },
      { exerciseId: "squat", reps: 100 },
    ],
    howTo: [
      [
        "Finish all 100 pull-ups before starting push-ups. Then all 100 push-ups, and so on.",
        "Закончи все 100 подтягиваний до отжиманий. Затем все 100 отжиманий, и так далее.",
      ],
      [
        "Break into small sets from rep one — 10 sets of 10 beats going to failure at rep 14.",
        "Дроби на маленькие подходы с первого повтора: 10 по 10 лучше, чем отказ на 14-м.",
      ],
      [
        "The squats at the end are the easy part on paper and the hard part in reality.",
        "Приседания в конце легки на бумаге и тяжелы в реальности.",
      ],
      ["The 40-minute cap is a safety net, not a target.", "Лимит в 40 минут — страховка, а не цель."],
    ],
    scaling: [
      "Halve everything: 50 of each. Still a full session, and finishable.",
      "Урежь вдвое: по 50 каждого. Всё ещё полноценно и выполнимо.",
    ],
  }),

  c({
    id: "the-300",
    name: ["The 300", "Триста"],
    origin: ["Classic bodyweight century test", "Классический тест на сотни повторов"],
    blurb: [
      "Three hundred reps, no equipment, no excuses. The simplest hard thing in the library.",
      "Триста повторов, без инвентаря и без отговорок. Самое простое из тяжёлого.",
    ],
    timer: { mode: "fortime", minutes: 30 },
    level: 2,
    requires: [],
    steps: [
      { exerciseId: "pushup", reps: 100 },
      { exerciseId: "situp", reps: 100 },
      { exerciseId: "squat", reps: 100 },
    ],
    howTo: [
      ["100 push-ups, 100 sit-ups, 100 squats, in that order.", "100 отжиманий, 100 скручиваний, 100 приседаний, в этом порядке."],
      [
        "Sets of ten from the start. Everyone who opens with a set of thirty regrets it by rep sixty.",
        "Подходы по десять с самого начала. Кто начинает с тридцати, жалеет к шестидесятому.",
      ],
      [
        "Rest as little as you can rather than as much as you want.",
        "Отдыхай как можно меньше, а не сколько хочется.",
      ],
    ],
    scaling: [
      "150 total — 50 of each. Add ten a week rather than pushing through bad form.",
      "150 всего — по 50 каждого. Прибавляй по десять в неделю, а не ломай технику.",
    ],
  }),

  c({
    id: "core-finisher",
    name: ["Core Finisher", "Добивка корпуса"],
    origin: ["Standard end-of-session core block", "Стандартный блок корпуса в конце тренировки"],
    blurb: [
      "Six minutes to bolt onto any session. Power comes from the floor and passes through here.",
      "Шесть минут в конец любой тренировки. Сила идёт от пола и проходит здесь.",
    ],
    timer: { mode: "interval", workSec: 30, restSec: 15, rounds: 8 },
    level: 1,
    requires: [],
    steps: [
      { exerciseId: "plank", seconds: 30 },
      { exerciseId: "russian-twists", seconds: 30 },
      { exerciseId: "hollow-hold", seconds: 30 },
      { exerciseId: "leg-raises", seconds: 30 },
    ],
    howTo: [
      ["Thirty seconds each, fifteen to switch, two full laps.", "По тридцать секунд, пятнадцать на смену, два полных круга."],
      [
        "Breathe throughout. Holding your breath in a plank makes it a breath-hold, not a core exercise.",
        "Дыши всё время. Задержка дыхания в планке — это упражнение на задержку, а не на корпус.",
      ],
      [
        "Stop a set the moment your lower back lifts off or arches. Quality is the whole point here.",
        "Останови подход, как только поясница отрывается или прогибается. Качество здесь — весь смысл.",
      ],
    ],
    scaling: [
      "Twenty seconds of work, or one lap instead of two.",
      "Двадцать секунд работы или один круг вместо двух.",
    ],
  }),

  c({
    id: "shadow-pyramid",
    name: ["Shadow Pyramid", "Пирамида с тенью"],
    origin: ["Tempo-varied shadowboxing", "Бой с тенью с переменным темпом"],
    blurb: [
      "Rounds that get longer, then shorter. Pacing you can feel rather than be told about.",
      "Раунды, которые удлиняются, затем укорачиваются. Чувство темпа, а не рассказ о нём.",
    ],
    timer: { mode: "interval", workSec: 60, restSec: 30, rounds: 9 },
    level: 1,
    requires: [],
    steps: [{ exerciseId: "shadowboxing", seconds: 60 }],
    howTo: [
      [
        "Nine one-minute rounds with thirty seconds between. Output climbs to round five, then comes back down.",
        "Девять раундов по минуте с тридцатью секундами между. Нагрузка растёт до пятого раунда, потом снижается.",
      ],
      [
        "Rounds 1–3: technical, slow, perfect. Rounds 4–6: full speed. Rounds 7–9: technical again while tired.",
        "Раунды 1–3: технично, медленно, чисто. 4–6: полная скорость. 7–9: снова технично, но уже уставшим.",
      ],
      [
        "The last three are the real work — clean technique when the legs have gone is what carries into a fight.",
        "Последние три — настоящая работа: чистая техника на убитых ногах и есть то, что переносится в бой.",
      ],
    ],
    scaling: [
      "Five rounds instead of nine, keeping the same slow-fast-slow shape.",
      "Пять раундов вместо девяти, сохраняя форму «медленно-быстро-медленно».",
    ],
  }),

  c({
    id: "barbell-base",
    name: ["Barbell Base", "Штанговая база"],
    origin: ["Strength circuit for fighters", "Силовой круг для бойцов"],
    blurb: [
      "Heavy, slow, and nothing like a round — which is exactly why it belongs in the week.",
      "Тяжело, медленно и совсем не похоже на раунд — именно поэтому это нужно в неделе.",
    ],
    timer: { mode: "interval", workSec: 90, restSec: 90, rounds: 9 },
    level: 3,
    requires: ["barbell"],
    steps: [
      { exerciseId: "barbell-squat", seconds: 90 },
      { exerciseId: "barbell-row", seconds: 90 },
      { exerciseId: "overhead-press", seconds: 90 },
    ],
    howTo: [
      [
        "Ninety seconds to complete 5 good reps, then ninety seconds rest. Three laps.",
        "Девяносто секунд на 5 качественных повторов, затем девяносто секунд отдыха. Три круга.",
      ],
      [
        "This is a strength block, not conditioning. Rest the full ninety even if you feel fine.",
        "Это силовой блок, а не кондиция. Отдыхай все девяносто, даже если кажется, что не нужно.",
      ],
      [
        "Leave two reps in the tank on every set. Fighters do not need to miss lifts.",
        "Оставляй два повтора в запасе в каждом подходе. Бойцу незачем «ронять» подход.",
      ],
      [
        "Never on the day before hard sparring — heavy legs make you slow, not strong.",
        "Никогда накануне жёсткого спарринга: тяжёлые ноги делают медленным, а не сильным.",
      ],
    ],
    scaling: [
      "Use the bar alone, or swap for goblet squats and dumbbell rows until the movement is solid.",
      "Работай с пустым грифом или замени на гоблет-приседы и тяги гантели, пока техника не встанет.",
    ],
  }),
);

/* ------------------------------ short formats ----------------------------- */
/* Everything above needs 12 minutes at least. These exist for the days when
   the honest choice is ten minutes or nothing — which is most days, for most
   people, and is the difference between a streak and a gap. */

CIRCUITS.push(
  c({
    id: "ten-minute-round",
    name: ["Ten Minutes, No Excuses", "Десять минут без отговорок"],
    origin: ["The minimum session", "Минимальная тренировка"],
    blurb: [
      "Two rounds of shadow, two of floor work. Short enough that skipping it is a choice, not a reason.",
      "Два раунда с тенью, два на полу. Достаточно коротко, чтобы пропуск был выбором, а не причиной.",
    ],
    timer: { mode: "interval", workSec: 120, restSec: 30, rounds: 4 },
    level: 1,
    requires: [],
    steps: [
      { exerciseId: "shadowboxing", seconds: 120 },
      { exerciseId: "pushup", seconds: 120 },
      { exerciseId: "shadowboxing", seconds: 120 },
      { exerciseId: "squat", seconds: 120 },
    ],
    howTo: [
      ["Two minutes each, thirty seconds between. Four rounds and you are done.", "По две минуты, тридцать секунд между. Четыре раунда — и всё."],
      [
        "On a day you do not want to train, do this and nothing else. It still counts.",
        "В день, когда не хочется, сделай только это. Оно всё равно засчитывается.",
      ],
      [
        "Break the push-up and squat rounds into sets. Two minutes of continuous work is not the goal.",
        "Дроби раунды отжиманий и приседаний на подходы. Две минуты без остановки — не цель.",
      ],
    ],
    scaling: [
      "Ninety seconds a round. The point is that it happens, not how long it lasts.",
      "По полторы минуты на раунд. Смысл в том, что она состоялась, а не в длине.",
    ],
  }),

  c({
    id: "morning-five",
    name: ["The Morning Five", "Утренние пять"],
    origin: ["Wake-up circuit", "Круг для пробуждения"],
    blurb: [
      "Five minutes to get blood moving before the day starts. Not a workout — a switch.",
      "Пять минут, чтобы разогнать кровь до начала дня. Не тренировка — переключатель.",
    ],
    timer: { mode: "interval", workSec: 45, restSec: 15, rounds: 5 },
    level: 1,
    requires: [],
    steps: [
      { exerciseId: "jumping-jacks", seconds: 45 },
      { exerciseId: "inchworm", seconds: 45 },
      { exerciseId: "squat", seconds: 45 },
      { exerciseId: "shoulder-taps", seconds: 45 },
      { exerciseId: "shadow-footwork", seconds: 45 },
    ],
    howTo: [
      ["Forty-five seconds each, fifteen between. Five movements, five minutes.", "По сорок пять секунд, пятнадцать между. Пять движений, пять минут."],
      [
        "Easy pace throughout — this is for waking up, not for a score.",
        "Лёгкий темп везде: это про пробуждение, а не про результат.",
      ],
      [
        "Works as a warm-up before anything else in the library.",
        "Годится как разминка перед чем угодно из библиотеки.",
      ],
    ],
    scaling: [
      "Thirty seconds each. Still does the job.",
      "По тридцать секунд. Всё равно работает.",
    ],
  }),

  c({
    id: "legs-under-you",
    name: ["Legs Under You", "Ноги под тобой"],
    origin: ["Lower-body endurance block", "Блок выносливости ног"],
    blurb: [
      "Fighters lose rounds because their legs go, not their arms. This is the fix nobody wants.",
      "Раунды проигрывают из-за ног, а не рук. Это то лекарство, которого никто не хочет.",
    ],
    timer: { mode: "interval", workSec: 40, restSec: 20, rounds: 12 },
    level: 2,
    requires: [],
    steps: [
      { exerciseId: "squat", seconds: 40 },
      { exerciseId: "reverse-lunge", seconds: 40 },
      { exerciseId: "wall-sit", seconds: 40 },
      { exerciseId: "calf-raises", seconds: 40 },
    ],
    howTo: [
      ["Forty on, twenty off, through four movements. Three full laps.", "Сорок работы, двадцать отдыха, четыре движения. Три полных круга."],
      [
        "The wall sit is where it is decided. Sit at ninety degrees and stay there.",
        "Всё решается на приседе у стены. Угол девяносто градусов — и держись.",
      ],
      [
        "Expect the last lap to be ugly. Finishing it badly beats stopping cleanly.",
        "Последний круг будет некрасивым. Закончить плохо лучше, чем красиво бросить.",
      ],
    ],
    scaling: [
      "Two laps, and hold the wall sit above ninety degrees.",
      "Два круга, и держи присед у стены выше девяноста градусов.",
    ],
  }),

  c({
    id: "punch-out",
    name: ["Punch-Out", "На выброс"],
    origin: ["Punch-output interval", "Интервал на выброс ударов"],
    blurb: [
      "Thirty seconds of everything you have, six times. Trains the flurry that ends rounds.",
      "Тридцать секунд всего, что есть, шесть раз. Тренирует серию, которая заканчивает раунды.",
    ],
    timer: { mode: "interval", workSec: 30, restSec: 90, rounds: 6 },
    level: 3,
    requires: [],
    steps: [{ exerciseId: "shadowboxing", seconds: 30 }],
    howTo: [
      [
        "Thirty seconds at maximum punch output. Ninety seconds to recover. Six times.",
        "Тридцать секунд максимального выброса ударов. Полторы минуты на восстановление. Шесть раз.",
      ],
      [
        "The long rest is deliberate — this trains peak output, not endurance. Cutting it makes it a different, easier session.",
        "Долгий отдых намеренный: тренируем пик, а не выносливость. Урезав его, получишь другую, более лёгкую работу.",
      ],
      [
        "Count punches in round one. If round six is under 70% of it, the rest was too short or round one was a sprint you could not repeat.",
        "Посчитай удары в первом раунде. Если в шестом меньше 70% — отдых был мал или первый раунд был непосильным спринтом.",
      ],
    ],
    scaling: [
      "Four rounds. Keep the ninety seconds — that part is the training, not a break from it.",
      "Четыре раунда. Полторы минуты оставь: это часть тренировки, а не пауза в ней.",
    ],
  }),

  c({
    id: "chipper",
    name: ["The Chipper", "Чиппер"],
    origin: ["Classic chipper format — one pass, no repeats", "Классический чиппер — один проход без повторов"],
    blurb: [
      "One pass through a long list. No rounds to pace against, just work that ends when it ends.",
      "Один проход по длинному списку. Кругов нет, работа заканчивается, когда закончится.",
    ],
    timer: { mode: "fortime", minutes: 25 },
    level: 2,
    requires: [],
    steps: [
      { exerciseId: "burpee", reps: 40 },
      { exerciseId: "situp", reps: 50 },
      { exerciseId: "squat-jumps", reps: 40 },
      { exerciseId: "mountain-climber", reps: 60 },
      { exerciseId: "pushup", reps: 50 },
    ],
    howTo: [
      ["Work down the list once. Finish each movement before starting the next.", "Пройди список один раз. Заканчивай движение до перехода к следующему."],
      [
        "No rounds means no rhythm to hide in. Set your own: ten reps, breathe, ten more.",
        "Раз нет кругов — нет и ритма, за которым спрячешься. Задай свой: десять повторов, вдох, ещё десять.",
      ],
      [
        "The burpees at the front are the trap. Go slower than feels right for the first twenty.",
        "Бёрпи в начале — ловушка. Первые двадцать делай медленнее, чем хочется.",
      ],
    ],
    scaling: [
      "Halve every number. The shape of the session is the same.",
      "Урежь все числа вдвое. Форма тренировки та же.",
    ],
  }),

  c({
    id: "defense-drill",
    name: ["Defense Rounds", "Раунды защиты"],
    origin: ["Defensive movement drilling", "Отработка защитных движений"],
    blurb: [
      "Six rounds where you never throw a punch. Nobody trains this, and it is why nobody can slip.",
      "Шесть раундов, где ты не бьёшь вообще. Это никто не тренирует — поэтому никто и не умеет уклоняться.",
    ],
    timer: { mode: "interval", workSec: 120, restSec: 45, rounds: 6 },
    level: 2,
    requires: [],
    steps: [
      { exerciseId: "slips", seconds: 120 },
      { exerciseId: "roll-under", seconds: 120 },
      { exerciseId: "parry-block", seconds: 120 },
    ],
    howTo: [
      ["Two minutes each, forty-five seconds between. Two laps of the three.", "По две минуты, сорок пять секунд между. Два круга из трёх движений."],
      [
        "Move as if a punch is coming — the movement is meaningless without something to avoid. Picture the shot every time.",
        "Двигайся так, будто удар идёт: без того, от чего уходишь, движение бессмысленно. Представляй удар каждый раз.",
      ],
      [
        "Small movements. A slip that takes your head a foot off line takes you off balance too.",
        "Движения короткие. Уклон, уводящий голову на треть метра, уводит и равновесие.",
      ],
      [
        "Come back to the guard position after every single one. That is the whole drill.",
        "После каждого возвращайся в стойку. В этом и вся суть.",
      ],
    ],
    scaling: [
      "One lap. Three rounds of defence is more than most people ever do.",
      "Один круг. Три раунда защиты — больше, чем делает большинство.",
    ],
  }),
);

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
