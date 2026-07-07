/* ===========================================================================
   PRESSURE — exercise / lesson library
   Static bilingual catalog. Every exercise is tagged with the equipment it
   needs, so the library filters itself to the user's setup (a bodyweight-only
   user never sees barbell work). `demo` picks the 3D technique animation,
   `muscles` drives the body-map illustration.
   =========================================================================== */

import type { EquipmentId, EnvId, Profile } from "./onboarding";

export type BodyPart =
  | "arms"
  | "chest"
  | "shoulders"
  | "back"
  | "core"
  | "legs"
  | "fullbody"
  | "technique";

export type MuscleRegion =
  | "shoulders"
  | "chest"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "lats"
  | "traps"
  | "lowerback";

/* What the exercise needs. "none" = pure bodyweight, always available. */
export type Requirement = "none" | EquipmentId;

export type DemoPreset =
  | "pushup"
  | "squat"
  | "lunge"
  | "plank"
  | "situp"
  | "burpee"
  | "climber"
  | "bridge"
  | "jab"
  | "hook"
  | "slip"
  | "jumprope"
  | "press"
  | "row"
  | "swing"
  | "pullup"
  | "curl"
  | "benchpress"
  | "uppercut"
  | "footwork"
  | "speedbag"
  | "jack"
  | "highknees"
  | "squatjump"
  | "dip"
  | "superman"
  | "twist"
  | "sidelunge"
  | "calfraise"
  | "wallsit"
  | "deadlift"
  | "latraise";

export interface I18nText {
  en: string;
  ru: string;
}

export interface Exercise {
  id: string;
  name: I18nText;
  desc: I18nText;
  steps: { en: string[]; ru: string[] };
  bodyPart: BodyPart;
  muscles: MuscleRegion[];
  requires: Requirement[]; // needs ANY of these; [] or ["none"] = bodyweight
  level: 1 | 2 | 3; // 1 beginner · 2 intermediate · 3 advanced
  dose: I18nText; // reps / time prescription
  demo: DemoPreset;
  kcal10min: number; // rough burn per 10 min, for the calorie counter
  workSec: number; // seconds of work per set in a guided session
}

export const EXERCISES: Exercise[] = [
  /* ------------------------------ technique ------------------------------ */
  {
    id: "jab-cross",
    name: { en: "Jab – Cross", ru: "Джеб – кросс" },
    desc: {
      en: "The one-two: boxing's bread and butter. Snap the jab, rotate into the cross.",
      ru: "«Раз-два» — хлеб бокса. Щёлкни джебом и провернись в кросс.",
    },
    steps: {
      en: [
        "Stance: lead foot forward, hands at chin",
        "Snap the lead hand straight out, palm turning down",
        "Return fast; rotate hips and rear heel into the cross",
        "Exhale sharply on every punch",
      ],
      ru: [
        "Стойка: передняя нога вперёд, руки у подбородка",
        "Выстрели передней рукой прямо, ладонь вниз",
        "Быстро верни руку; провернись бёдрами и задней пяткой в кросс",
        "Резкий выдох на каждый удар",
      ],
    },
    bodyPart: "technique",
    muscles: ["shoulders", "triceps", "obliques"],
    requires: [],
    level: 1,
    dose: { en: "3 rounds × 3 min", ru: "3 раунда × 3 мин" },
    demo: "jab",
    kcal10min: 90,
    workSec: 180,
  },
  {
    id: "hooks",
    name: { en: "Lead & Rear Hook", ru: "Боковые удары (хуки)" },
    desc: {
      en: "Short-range power. The whole body turns — the arm just carries it.",
      ru: "Сила ближней дистанции. Бьёт всё тело — рука лишь доносит удар.",
    },
    steps: {
      en: [
        "Elbow up to 90°, wrist locked",
        "Pivot the lead foot and turn the hip through",
        "Keep the other hand glued to your chin",
        "Snap back to guard",
      ],
      ru: [
        "Локоть на 90°, запястье жёсткое",
        "Провернись на передней стопе, бедро идёт в удар",
        "Вторая рука приклеена к подбородку",
        "Резко вернись в защиту",
      ],
    },
    bodyPart: "technique",
    muscles: ["shoulders", "obliques", "abs"],
    requires: [],
    level: 2,
    dose: { en: "3 rounds × 2 min", ru: "3 раунда × 2 мин" },
    demo: "hook",
    kcal10min: 95,
    workSec: 120,
  },
  {
    id: "slips",
    name: { en: "Slips & Rolls", ru: "Уклоны и нырки" },
    desc: {
      en: "Defense that sets up offense. Move the head off the line, stay in range.",
      ru: "Защита, из которой рождается атака. Убери голову с линии, оставаясь в дистанции.",
    },
    steps: {
      en: [
        "Small bend in the knees, chin down",
        "Slip: shift head just outside the line of fire",
        "Roll: dip under an imaginary hook, weight transfers",
        "Eyes forward the whole time",
      ],
      ru: [
        "Небольшой присед, подбородок вниз",
        "Уклон: смести голову чуть в сторону от линии удара",
        "Нырок: пройди под воображаемым хуком с переносом веса",
        "Взгляд всё время вперёд",
      ],
    },
    bodyPart: "technique",
    muscles: ["obliques", "quads", "abs"],
    requires: [],
    level: 2,
    dose: { en: "4 rounds × 2 min", ru: "4 раунда × 2 мин" },
    demo: "slip",
    kcal10min: 80,
    workSec: 120,
  },
  {
    id: "bag-combos",
    name: { en: "Heavy Bag Combos", ru: "Комбинации на мешке" },
    desc: {
      en: "Put your punches together with real resistance. Power meets rhythm.",
      ru: "Собери удары в связки с реальным сопротивлением. Сила встречает ритм.",
    },
    steps: {
      en: [
        "Start with 1-2 (jab–cross), add the hook: 1-2-3",
        "Move around the bag between combos",
        "Hit through the bag, don't push it",
        "Last 30s of each round: all-out output",
      ],
      ru: [
        "Начни с «раз-два», добавь хук: 1-2-3",
        "Двигайся вокруг мешка между связками",
        "Бей сквозь мешок, а не толкай его",
        "Последние 30 сек раунда — максимальная работа",
      ],
    },
    bodyPart: "technique",
    muscles: ["shoulders", "triceps", "obliques", "abs"],
    requires: ["heavybag"],
    level: 2,
    dose: { en: "4 rounds × 3 min", ru: "4 раунда × 3 мин" },
    demo: "jab",
    kcal10min: 130,
    workSec: 180,
  },
  {
    id: "jump-rope",
    name: { en: "Jump Rope", ru: "Скакалка" },
    desc: {
      en: "The boxer's engine builder — footwork, rhythm and lungs in one tool.",
      ru: "Движок боксёра — работа ног, ритм и дыхалка в одном инструменте.",
    },
    steps: {
      en: [
        "Elbows in, wrists spin the rope — not the arms",
        "Jump just high enough to clear the rope",
        "Stay on the balls of your feet",
        "Mix in one-foot hops as you improve",
      ],
      ru: [
        "Локти прижаты, крутят кисти — не руки",
        "Прыгай ровно настолько, чтобы пропустить трос",
        "Оставайся на носках",
        "Со временем добавляй прыжки на одной ноге",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["calves", "shoulders", "forearms"],
    requires: ["jumprope"],
    level: 1,
    dose: { en: "3 rounds × 3 min", ru: "3 раунда × 3 мин" },
    demo: "jumprope",
    kcal10min: 120,
    workSec: 180,
  },

  /* ------------------------------ bodyweight ----------------------------- */
  {
    id: "pushup",
    name: { en: "Push-Up", ru: "Отжимания" },
    desc: {
      en: "The classic upper-body builder — punching power starts here.",
      ru: "Классика для верха тела — сила удара начинается здесь.",
    },
    steps: {
      en: [
        "Hands under shoulders, body one straight line",
        "Lower until chest nearly touches the floor",
        "Elbows ~45° from the body, not flared",
        "Press up fast, exhale at the top",
      ],
      ru: [
        "Ладони под плечами, тело — прямая линия",
        "Опустись, пока грудь почти не коснётся пола",
        "Локти ~45° к корпусу, не разводи их",
        "Мощно выжми вверх, выдох в верхней точке",
      ],
    },
    bodyPart: "chest",
    muscles: ["chest", "triceps", "shoulders", "abs"],
    requires: [],
    level: 1,
    dose: { en: "4 × 10–20 reps", ru: "4 × 10–20 повторений" },
    demo: "pushup",
    kcal10min: 70,
    workSec: 45,
  },
  {
    id: "diamond-pushup",
    name: { en: "Diamond Push-Up", ru: "Алмазные отжимания" },
    desc: {
      en: "Hands together — triceps take the load. Snappier straight punches.",
      ru: "Ладони вместе — нагрузка уходит в трицепс. Более хлёсткие прямые.",
    },
    steps: {
      en: [
        "Thumbs and index fingers form a diamond",
        "Elbows track back along the ribs",
        "Slow down, explosive up",
      ],
      ru: [
        "Большие и указательные пальцы образуют ромб",
        "Локти идут назад вдоль рёбер",
        "Медленно вниз, взрывом вверх",
      ],
    },
    bodyPart: "arms",
    muscles: ["triceps", "chest", "shoulders"],
    requires: [],
    level: 2,
    dose: { en: "3 × 8–15 reps", ru: "3 × 8–15 повторений" },
    demo: "pushup",
    kcal10min: 70,
    workSec: 40,
  },
  {
    id: "squat",
    name: { en: "Bodyweight Squat", ru: "Приседания" },
    desc: {
      en: "Legs are where punching power is born. Own the full range.",
      ru: "Сила удара рождается в ногах. Работай в полной амплитуде.",
    },
    steps: {
      en: [
        "Feet shoulder-width, toes slightly out",
        "Sit back and down — knees track over toes",
        "Chest up, heels planted",
        "Drive up through the whole foot",
      ],
      ru: [
        "Стопы на ширине плеч, носки чуть наружу",
        "Садись назад и вниз — колени по линии носков",
        "Грудь вверх, пятки прижаты",
        "Вставай, давя всей стопой",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes", "hamstrings"],
    requires: [],
    level: 1,
    dose: { en: "4 × 15–25 reps", ru: "4 × 15–25 повторений" },
    demo: "squat",
    kcal10min: 75,
    workSec: 60,
  },
  {
    id: "lunge",
    name: { en: "Walking Lunge", ru: "Выпады" },
    desc: {
      en: "Single-leg strength and balance — the base of every pivot and angle.",
      ru: "Сила и баланс на одной ноге — база каждого разворота и угла.",
    },
    steps: {
      en: [
        "Long step forward, torso tall",
        "Back knee kisses the floor",
        "Push through the front heel to rise",
        "Alternate legs",
      ],
      ru: [
        "Длинный шаг вперёд, корпус ровный",
        "Заднее колено слегка касается пола",
        "Вставай, давя передней пяткой",
        "Чередуй ноги",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes", "hamstrings", "calves"],
    requires: [],
    level: 1,
    dose: { en: "3 × 10 / leg", ru: "3 × 10 на ногу" },
    demo: "lunge",
    kcal10min: 80,
    workSec: 60,
  },
  {
    id: "plank",
    name: { en: "Plank", ru: "Планка" },
    desc: {
      en: "A cast-iron core keeps your punches connected to the ground.",
      ru: "Железный кор связывает твои удары с землёй.",
    },
    steps: {
      en: [
        "Forearms down, elbows under shoulders",
        "Squeeze glutes and abs — no sagging hips",
        "Neck neutral, breathe steadily",
      ],
      ru: [
        "Предплечья на полу, локти под плечами",
        "Сожми ягодицы и пресс — таз не провисает",
        "Шея нейтральна, дыши ровно",
      ],
    },
    bodyPart: "core",
    muscles: ["abs", "obliques", "lowerback", "shoulders"],
    requires: [],
    level: 1,
    dose: { en: "3 × 30–60 sec", ru: "3 × 30–60 сек" },
    demo: "plank",
    kcal10min: 40,
    workSec: 45,
  },
  {
    id: "situp",
    name: { en: "Sit-Up / Crunch", ru: "Скручивания" },
    desc: {
      en: "Body shots happen. Armor the midsection.",
      ru: "Удары по корпусу будут. Забронируй пресс.",
    },
    steps: {
      en: [
        "Knees bent, feet flat, hands by temples",
        "Curl up rib by rib — don't yank the neck",
        "Lower with control",
      ],
      ru: [
        "Колени согнуты, стопы на полу, руки у висков",
        "Скручивайся позвонок за позвонком — не тяни шею",
        "Опускайся подконтрольно",
      ],
    },
    bodyPart: "core",
    muscles: ["abs", "obliques"],
    requires: [],
    level: 1,
    dose: { en: "4 × 15–25 reps", ru: "4 × 15–25 повторений" },
    demo: "situp",
    kcal10min: 60,
    workSec: 45,
  },
  {
    id: "burpee",
    name: { en: "Burpee", ru: "Бёрпи" },
    desc: {
      en: "The whole-body gas-tank test. Nothing builds fight conditioning faster.",
      ru: "Тест бензобака всего тела. Ничто не строит бойцовскую выносливость быстрее.",
    },
    steps: {
      en: [
        "Squat down, hands to the floor",
        "Kick back to plank, chest to floor",
        "Snap the feet in and jump with hands up",
      ],
      ru: [
        "Присядь, ладони на пол",
        "Выкинь ноги назад в планку, грудь к полу",
        "Верни стопы и выпрыгни вверх с руками",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["chest", "quads", "abs", "shoulders", "glutes"],
    requires: [],
    level: 2,
    dose: { en: "5 × 10 reps", ru: "5 × 10 повторений" },
    demo: "burpee",
    kcal10min: 140,
    workSec: 45,
  },
  {
    id: "mountain-climber",
    name: { en: "Mountain Climbers", ru: "Скалолаз" },
    desc: {
      en: "Core + engine + hip speed. Fast knees, flat back.",
      ru: "Кор + дыхалка + скорость бёдер. Быстрые колени, ровная спина.",
    },
    steps: {
      en: [
        "Plank position, shoulders over wrists",
        "Drive knees to chest, one after another",
        "Hips stay level — no bouncing",
      ],
      ru: [
        "Планка, плечи над запястьями",
        "Поочерёдно гони колени к груди",
        "Таз ровный — без подпрыгиваний",
      ],
    },
    bodyPart: "core",
    muscles: ["abs", "quads", "shoulders"],
    requires: [],
    level: 1,
    dose: { en: "4 × 30 sec", ru: "4 × 30 сек" },
    demo: "climber",
    kcal10min: 110,
    workSec: 30,
  },
  {
    id: "glute-bridge",
    name: { en: "Glute Bridge", ru: "Ягодичный мост" },
    desc: {
      en: "Hip drive is punch drive. Wake up the posterior chain.",
      ru: "Работа бёдер — это сила удара. Разбуди заднюю цепь.",
    },
    steps: {
      en: [
        "On your back, knees bent, feet close to hips",
        "Drive hips up, squeeze glutes hard at the top",
        "Lower slow, don't rest at the bottom",
      ],
      ru: [
        "Лёжа на спине, колени согнуты, стопы близко к тазу",
        "Выжми таз вверх, сожми ягодицы в верхней точке",
        "Опускайся медленно, внизу не отдыхай",
      ],
    },
    bodyPart: "legs",
    muscles: ["glutes", "hamstrings", "lowerback"],
    requires: [],
    level: 1,
    dose: { en: "3 × 15–20 reps", ru: "3 × 15–20 повторений" },
    demo: "bridge",
    kcal10min: 50,
    workSec: 45,
  },
  {
    id: "pike-pushup",
    name: { en: "Pike Push-Up", ru: "Отжимания уголком" },
    desc: {
      en: "Bodyweight shoulder press — guard stays up when shoulders don't quit.",
      ru: "Жим плечами со своим весом — защита не падает, когда плечи не сдаются.",
    },
    steps: {
      en: [
        "Hips high, body in an inverted V",
        "Lower the crown of your head toward the floor",
        "Press back up through the shoulders",
      ],
      ru: [
        "Таз высоко, тело — перевёрнутая V",
        "Опусти макушку к полу",
        "Выжмись обратно плечами",
      ],
    },
    bodyPart: "shoulders",
    muscles: ["shoulders", "triceps", "traps"],
    requires: [],
    level: 2,
    dose: { en: "3 × 8–12 reps", ru: "3 × 8–12 повторений" },
    demo: "pushup",
    kcal10min: 65,
    workSec: 40,
  },

  /* ------------------------------ equipment ------------------------------ */
  {
    id: "pullup",
    name: { en: "Pull-Up", ru: "Подтягивания" },
    desc: {
      en: "The king of back builders — clinch strength and posture in one move.",
      ru: "Король упражнений на спину — сила в клинче и осанка в одном движении.",
    },
    steps: {
      en: [
        "Grip slightly wider than shoulders",
        "Pull the chest to the bar, elbows down",
        "Lower fully under control",
      ],
      ru: [
        "Хват чуть шире плеч",
        "Тяни грудь к перекладине, локти вниз",
        "Полностью и подконтрольно опустись",
      ],
    },
    bodyPart: "back",
    muscles: ["lats", "biceps", "forearms", "traps"],
    requires: ["pullupbar"],
    level: 2,
    dose: { en: "4 × 5–12 reps", ru: "4 × 5–12 повторений" },
    demo: "pullup",
    kcal10min: 85,
    workSec: 40,
  },
  {
    id: "hanging-knee-raise",
    name: { en: "Hanging Knee Raise", ru: "Подъём коленей в висе" },
    desc: {
      en: "Lower abs and grip — armor and clinch control together.",
      ru: "Нижний пресс и хват — броня и контроль в клинче вместе.",
    },
    steps: {
      en: [
        "Dead hang, shoulders active",
        "Raise knees to chest without swinging",
        "Lower slow, keep tension",
      ],
      ru: [
        "Вис на прямых руках, плечи в тонусе",
        "Подними колени к груди без раскачки",
        "Опускай медленно, держи напряжение",
      ],
    },
    bodyPart: "core",
    muscles: ["abs", "forearms", "obliques"],
    requires: ["pullupbar"],
    level: 2,
    dose: { en: "3 × 10–15 reps", ru: "3 × 10–15 повторений" },
    demo: "pullup",
    kcal10min: 60,
    workSec: 40,
  },
  {
    id: "goblet-squat",
    name: { en: "Goblet Squat", ru: "Гоблет-присед" },
    desc: {
      en: "Loaded legs with built-in posture coaching from the front-held weight.",
      ru: "Присед с весом у груди — нагрузка на ноги и осанка в комплекте.",
    },
    steps: {
      en: [
        "Hold a dumbbell/kettlebell at your chest",
        "Squat between your knees, elbows inside",
        "Drive up, keep the chest proud",
      ],
      ru: [
        "Держи гантель/гирю у груди",
        "Приседай между коленей, локти внутри",
        "Вставай мощно, грудь развёрнута",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes", "abs"],
    requires: ["dumbbells", "kettlebell"],
    level: 1,
    dose: { en: "4 × 10–12 reps", ru: "4 × 10–12 повторений" },
    demo: "squat",
    kcal10min: 85,
    workSec: 50,
  },
  {
    id: "db-press",
    name: { en: "Dumbbell Shoulder Press", ru: "Жим гантелей стоя" },
    desc: {
      en: "Strong shoulders keep the guard high in round twelve.",
      ru: "Сильные плечи держат защиту высоко и в двенадцатом раунде.",
    },
    steps: {
      en: [
        "Dumbbells at shoulder height, core braced",
        "Press straight up until arms lock",
        "Lower with control to the ears",
      ],
      ru: [
        "Гантели на уровне плеч, кор напряжён",
        "Выжми строго вверх до выпрямления",
        "Подконтрольно опусти к ушам",
      ],
    },
    bodyPart: "shoulders",
    muscles: ["shoulders", "triceps", "traps"],
    requires: ["dumbbells"],
    level: 1,
    dose: { en: "4 × 8–12 reps", ru: "4 × 8–12 повторений" },
    demo: "press",
    kcal10min: 65,
    workSec: 45,
  },
  {
    id: "db-row",
    name: { en: "One-Arm Dumbbell Row", ru: "Тяга гантели в наклоне" },
    desc: {
      en: "Pulling strength balances all that punching — healthy shoulders, big back.",
      ru: "Тяговая сила уравновешивает удары — здоровые плечи, мощная спина.",
    },
    steps: {
      en: [
        "One hand braced on a bench/knee, flat back",
        "Pull the dumbbell to your hip, elbow close",
        "Lower long and controlled",
      ],
      ru: [
        "Одна рука на скамье/колене, спина ровная",
        "Тяни гантель к бедру, локоть вдоль корпуса",
        "Опускай длинно и подконтрольно",
      ],
    },
    bodyPart: "back",
    muscles: ["lats", "biceps", "traps", "forearms"],
    requires: ["dumbbells"],
    level: 1,
    dose: { en: "4 × 10 / arm", ru: "4 × 10 на руку" },
    demo: "row",
    kcal10min: 70,
    workSec: 50,
  },
  {
    id: "kb-swing",
    name: { en: "Kettlebell Swing", ru: "Махи гирей" },
    desc: {
      en: "Explosive hips — the same snap that ends fights.",
      ru: "Взрывные бёдра — тот же щелчок, что заканчивает бои.",
    },
    steps: {
      en: [
        "Hinge at the hips, kettlebell between knees",
        "Snap the hips forward — the bell floats to chest height",
        "Let it swing back, don't squat it",
      ],
      ru: [
        "Наклон в тазобедренных, гиря между коленей",
        "Резко выпрями таз — гиря взлетает до груди",
        "Дай ей уйти назад, это не присед",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["glutes", "hamstrings", "lowerback", "shoulders"],
    requires: ["kettlebell"],
    level: 2,
    dose: { en: "5 × 15 reps", ru: "5 × 15 повторений" },
    demo: "swing",
    kcal10min: 120,
    workSec: 40,
  },
  {
    id: "bench-press",
    name: { en: "Bench Press", ru: "Жим лёжа" },
    desc: {
      en: "Raw pressing power for the whole punching chain.",
      ru: "Чистая жимовая сила для всей ударной цепи.",
    },
    steps: {
      en: [
        "Shoulder blades pinned, feet planted",
        "Lower the bar to mid-chest",
        "Press up and slightly back, elbows ~45°",
      ],
      ru: [
        "Лопатки сведены, стопы упёрты",
        "Опусти гриф к середине груди",
        "Жми вверх и чуть назад, локти ~45°",
      ],
    },
    bodyPart: "chest",
    muscles: ["chest", "triceps", "shoulders"],
    requires: ["barbell", "bench"],
    level: 2,
    dose: { en: "4 × 6–10 reps", ru: "4 × 6–10 повторений" },
    demo: "benchpress",
    kcal10min: 70,
    workSec: 50,
  },
  {
    id: "db-curl",
    name: { en: "Dumbbell Curl", ru: "Сгибания с гантелями" },
    desc: {
      en: "Biceps assist every pull, clinch and guard — keep them honest.",
      ru: "Бицепс работает в каждой тяге, клинче и защите — не запускай его.",
    },
    steps: {
      en: [
        "Elbows pinned to the ribs",
        "Curl without swinging the torso",
        "Lower slow — the negative builds most",
      ],
      ru: [
        "Локти прижаты к рёбрам",
        "Сгибай руки без раскачки корпуса",
        "Опускай медленно — негатив строит больше всего",
      ],
    },
    bodyPart: "arms",
    muscles: ["biceps", "forearms"],
    requires: ["dumbbells"],
    level: 1,
    dose: { en: "3 × 10–15 reps", ru: "3 × 10–15 повторений" },
    demo: "curl",
    kcal10min: 50,
    workSec: 45,
  },
  {
    id: "sandbag-carry",
    name: { en: "Sandbag / Stone Carry", ru: "Переноска сэндбэга / камней" },
    desc: {
      en: "Old-school grit. Odd-object strength that transfers straight to the clinch.",
      ru: "Старая школа. Сила с неудобным весом, которая напрямую переносится в клинч.",
    },
    steps: {
      en: [
        "Deadlift the object with a flat back",
        "Hug it tight to the chest",
        "Walk tall for distance or time",
      ],
      ru: [
        "Подними снаряд с ровной спиной",
        "Прижми его крепко к груди",
        "Иди с прямой осанкой — на дистанцию или время",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["forearms", "traps", "abs", "quads", "lowerback"],
    requires: ["oddobjects"],
    level: 2,
    dose: { en: "5 × 20–40 m", ru: "5 × 20–40 м" },
    demo: "swing",
    kcal10min: 100,
    workSec: 60,
  },

  /* --------------------------- more technique ---------------------------- */
  {
    id: "uppercuts",
    name: { en: "Uppercuts", ru: "Апперкоты" },
    desc: {
      en: "The punch that comes from the legs — dig up through the target.",
      ru: "Удар, который рождается в ногах — выстрели снизу вверх сквозь цель.",
    },
    steps: {
      en: [
        "Dip the knees slightly, keep the guard up",
        "Drive up with the legs, palm turning toward you",
        "Strike up through the chin height, elbow stays bent",
      ],
      ru: [
        "Слегка подсядь, защита у подбородка",
        "Выпрямись ногами, ладонь разворачивается к себе",
        "Бей снизу вверх на высоту подбородка, локоть согнут",
      ],
    },
    bodyPart: "technique",
    muscles: ["biceps", "shoulders", "abs", "quads"],
    requires: [],
    level: 2,
    dose: { en: "3 rounds × 2 min", ru: "3 раунда × 2 мин" },
    demo: "uppercut",
    kcal10min: 95,
    workSec: 120,
  },
  {
    id: "shadow-footwork",
    name: { en: "Footwork Drill", ru: "Работа ног" },
    desc: {
      en: "In-out and lateral steps — boxing is played with the feet first.",
      ru: "Вперёд-назад и в стороны — в бокс сначала играют ногами.",
    },
    steps: {
      en: [
        "Stay on the balls of your feet, knees soft",
        "Step-drag forward, back, then side to side",
        "Never cross the feet, keep the stance width",
      ],
      ru: [
        "Стой на носках, колени мягкие",
        "Шаг-подтяжка вперёд, назад, затем в стороны",
        "Не скрещивай ноги, держи ширину стойки",
      ],
    },
    bodyPart: "technique",
    muscles: ["calves", "quads", "abs"],
    requires: [],
    level: 1,
    dose: { en: "3 rounds × 3 min", ru: "3 раунда × 3 мин" },
    demo: "footwork",
    kcal10min: 85,
    workSec: 180,
  },
  {
    id: "speed-bag",
    name: { en: "Speed Bag", ru: "Пневмогруша" },
    desc: {
      en: "Rhythm, hand speed and shoulder endurance — the classic gym soundtrack.",
      ru: "Ритм, скорость рук и выносливость плеч — классический саундтрек зала.",
    },
    steps: {
      en: [
        "Bag at eye level, elbows high",
        "Small circular strikes with the side of the fist",
        "Find the 1-2-3 rebound rhythm before speeding up",
      ],
      ru: [
        "Груша на уровне глаз, локти высоко",
        "Маленькие круговые удары ребром кулака",
        "Поймай ритм отскока на 1-2-3, потом ускоряйся",
      ],
    },
    bodyPart: "technique",
    muscles: ["shoulders", "forearms", "triceps"],
    requires: ["speedbag"],
    level: 2,
    dose: { en: "3 rounds × 2 min", ru: "3 раунда × 2 мин" },
    demo: "speedbag",
    kcal10min: 80,
    workSec: 120,
  },

  /* --------------------------- more bodyweight --------------------------- */
  {
    id: "jumping-jacks",
    name: { en: "Jumping Jacks", ru: "Джампинг-джек" },
    desc: {
      en: "The classic warm-up — wake up the whole body in a minute.",
      ru: "Классическая разминка — разбуди всё тело за минуту.",
    },
    steps: {
      en: [
        "Jump feet wide while arms swing overhead",
        "Jump back to feet together, arms down",
        "Land soft, keep a steady rhythm",
      ],
      ru: [
        "Прыжком ноги в стороны, руки через стороны вверх",
        "Прыжком обратно, руки вниз",
        "Приземляйся мягко, держи ровный ритм",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["shoulders", "calves", "quads"],
    requires: [],
    level: 1,
    dose: { en: "3 × 45 sec", ru: "3 × 45 сек" },
    demo: "jack",
    kcal10min: 100,
    workSec: 45,
  },
  {
    id: "high-knees",
    name: { en: "High Knees", ru: "Высокое колено" },
    desc: {
      en: "Sprint on the spot — engine, hip flexors and fast feet.",
      ru: "Спринт на месте — дыхалка, сгибатели бедра и быстрые ноги.",
    },
    steps: {
      en: [
        "Run in place driving knees to hip height",
        "Stay tall — don't lean back",
        "Pump the arms like a sprinter",
      ],
      ru: [
        "Беги на месте, поднимая колени до уровня таза",
        "Держи корпус ровно — не отклоняйся назад",
        "Работай руками как спринтер",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["quads", "calves", "abs"],
    requires: [],
    level: 1,
    dose: { en: "4 × 30 sec", ru: "4 × 30 сек" },
    demo: "highknees",
    kcal10min: 130,
    workSec: 30,
  },
  {
    id: "squat-jumps",
    name: { en: "Squat Jumps", ru: "Выпрыгивания" },
    desc: {
      en: "Explosive legs — the spring behind every knockout punch.",
      ru: "Взрывные ноги — пружина каждого нокаутирующего удара.",
    },
    steps: {
      en: [
        "Squat to parallel, chest up",
        "Explode straight up as high as you can",
        "Land soft into the next rep",
      ],
      ru: [
        "Присядь до параллели, грудь вверх",
        "Выпрыгни вертикально со всей силы",
        "Мягко приземлись сразу в следующее повторение",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes", "calves"],
    requires: [],
    level: 2,
    dose: { en: "4 × 8–12 reps", ru: "4 × 8–12 повторений" },
    demo: "squatjump",
    kcal10min: 120,
    workSec: 40,
  },
  {
    id: "chair-dips",
    name: { en: "Chair Dips", ru: "Обратные отжимания" },
    desc: {
      en: "Triceps on any chair or bench — straight-punch snap at home.",
      ru: "Трицепс на любом стуле или скамье — хлёсткость прямых ударов дома.",
    },
    steps: {
      en: [
        "Hands on the edge behind you, legs forward",
        "Lower until elbows hit ~90°",
        "Press back up without shrugging",
      ],
      ru: [
        "Руки на краю опоры за спиной, ноги вперёд",
        "Опустись до ~90° в локтях",
        "Выжмись вверх, не поднимая плечи",
      ],
    },
    bodyPart: "arms",
    muscles: ["triceps", "shoulders", "chest"],
    requires: [],
    level: 1,
    dose: { en: "3 × 10–15 reps", ru: "3 × 10–15 повторений" },
    demo: "dip",
    kcal10min: 55,
    workSec: 45,
  },
  {
    id: "superman",
    name: { en: "Superman Hold", ru: "Супермен" },
    desc: {
      en: "Lower back and glutes — the armor behind your posture.",
      ru: "Поясница и ягодицы — броня твоей осанки.",
    },
    steps: {
      en: [
        "Face down, arms extended forward",
        "Lift arms, chest and legs off the floor together",
        "Hold, squeeze the glutes, breathe",
      ],
      ru: [
        "Лёжа на животе, руки вытянуты вперёд",
        "Одновременно оторви руки, грудь и ноги от пола",
        "Держи, сжимай ягодицы, дыши",
      ],
    },
    bodyPart: "back",
    muscles: ["lowerback", "glutes", "traps"],
    requires: [],
    level: 1,
    dose: { en: "3 × 20–30 sec", ru: "3 × 20–30 сек" },
    demo: "superman",
    kcal10min: 40,
    workSec: 30,
  },
  {
    id: "russian-twists",
    name: { en: "Russian Twists", ru: "Русские скручивания" },
    desc: {
      en: "Rotational core — the exact muscles that turn a punch over.",
      ru: "Ротационный кор — именно эти мышцы проворачивают удар.",
    },
    steps: {
      en: [
        "Sit back to 45°, feet up or lightly grounded",
        "Rotate the torso side to side",
        "Turn the shoulders, not just the arms",
      ],
      ru: [
        "Откинься на 45°, ноги подняты или слегка касаются пола",
        "Вращай корпус из стороны в сторону",
        "Поворачивай плечи, а не только руки",
      ],
    },
    bodyPart: "core",
    muscles: ["obliques", "abs"],
    requires: [],
    level: 1,
    dose: { en: "3 × 20 turns", ru: "3 × 20 поворотов" },
    demo: "twist",
    kcal10min: 65,
    workSec: 45,
  },
  {
    id: "side-lunges",
    name: { en: "Side Lunges", ru: "Боковые выпады" },
    desc: {
      en: "Lateral strength for slips, pivots and ring movement.",
      ru: "Боковая сила для уклонов, разворотов и движения по рингу.",
    },
    steps: {
      en: [
        "Big step to the side, hips back",
        "Bend one knee, other leg stays straight",
        "Push off and switch sides",
      ],
      ru: [
        "Широкий шаг в сторону, таз назад",
        "Сгибай одно колено, вторая нога прямая",
        "Оттолкнись и смени сторону",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes", "hamstrings"],
    requires: [],
    level: 1,
    dose: { en: "3 × 8 / side", ru: "3 × 8 на сторону" },
    demo: "sidelunge",
    kcal10min: 75,
    workSec: 60,
  },
  {
    id: "calf-raises",
    name: { en: "Calf Raises", ru: "Подъёмы на носки" },
    desc: {
      en: "Boxers live on their toes — build the springs that keep you there.",
      ru: "Боксёр живёт на носках — накачай пружины, которые тебя там держат.",
    },
    steps: {
      en: [
        "Feet hip-width, rise to the balls of the feet",
        "Pause at the top, squeeze the calves",
        "Lower slow, heels kiss the floor",
      ],
      ru: [
        "Стопы на ширине таза, поднимись на носки",
        "Задержись наверху, сожми икры",
        "Опускайся медленно, пятки едва касаются пола",
      ],
    },
    bodyPart: "legs",
    muscles: ["calves"],
    requires: [],
    level: 1,
    dose: { en: "4 × 15–25 reps", ru: "4 × 15–25 повторений" },
    demo: "calfraise",
    kcal10min: 45,
    workSec: 45,
  },
  {
    id: "wall-sit",
    name: { en: "Wall Sit", ru: "Стульчик у стены" },
    desc: {
      en: "Isometric leg endurance — for legs that don't fade in round three.",
      ru: "Изометрическая выносливость ног — чтобы они не сели в третьем раунде.",
    },
    steps: {
      en: [
        "Back flat on the wall, thighs parallel to the floor",
        "Knees at 90°, weight through the heels",
        "Hold and breathe — no hands on the legs",
      ],
      ru: [
        "Спина прижата к стене, бёдра параллельны полу",
        "Колени под 90°, вес в пятках",
        "Держи и дыши — руки не на ногах",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes"],
    requires: [],
    level: 1,
    dose: { en: "3 × 30–60 sec", ru: "3 × 30–60 сек" },
    demo: "wallsit",
    kcal10min: 50,
    workSec: 45,
  },
  {
    id: "wide-pushup",
    name: { en: "Wide Push-Up", ru: "Широкие отжимания" },
    desc: {
      en: "Hands wide — more chest, the base of a crushing clinch.",
      ru: "Ладони шире — больше груди, база жёсткого клинча.",
    },
    steps: {
      en: [
        "Hands 1.5× shoulder width",
        "Lower with control, chest leads",
        "Press up, squeeze the chest at the top",
      ],
      ru: [
        "Ладони в 1,5 раза шире плеч",
        "Опускайся подконтрольно, грудью вперёд",
        "Выжмись вверх, сожми грудь в верхней точке",
      ],
    },
    bodyPart: "chest",
    muscles: ["chest", "shoulders", "triceps"],
    requires: [],
    level: 1,
    dose: { en: "4 × 8–15 reps", ru: "4 × 8–15 повторений" },
    demo: "pushup",
    kcal10min: 70,
    workSec: 45,
  },

  /* --------------------------- more equipment ---------------------------- */
  {
    id: "deadlift",
    name: { en: "Deadlift", ru: "Становая тяга" },
    desc: {
      en: "The whole posterior chain in one lift — raw fight-ending strength.",
      ru: "Вся задняя цепь в одном движении — грубая, завершающая бой сила.",
    },
    steps: {
      en: [
        "Bar over mid-foot, flat back, chest up",
        "Push the floor away, bar close to the legs",
        "Lock out tall — don't lean back",
      ],
      ru: [
        "Гриф над серединой стопы, спина ровная, грудь вверх",
        "Отталкивай пол, гриф идёт вдоль ног",
        "Выпрямись полностью — не отклоняйся назад",
      ],
    },
    bodyPart: "back",
    muscles: ["hamstrings", "glutes", "lowerback", "traps", "forearms"],
    requires: ["barbell"],
    level: 3,
    dose: { en: "5 × 5 reps", ru: "5 × 5 повторений" },
    demo: "deadlift",
    kcal10min: 90,
    workSec: 50,
  },
  {
    id: "lateral-raise",
    name: { en: "Lateral Raise", ru: "Махи в стороны" },
    desc: {
      en: "Wide shoulders that carry a long guard deep into the fight.",
      ru: "Широкие плечи, которые держат защиту до конца боя.",
    },
    steps: {
      en: [
        "Dumbbells at your sides, slight elbow bend",
        "Raise to shoulder height, lead with the elbows",
        "Lower slower than you lifted",
      ],
      ru: [
        "Гантели по бокам, локти слегка согнуты",
        "Подними до уровня плеч, веди локтями",
        "Опускай медленнее, чем поднимал",
      ],
    },
    bodyPart: "shoulders",
    muscles: ["shoulders", "traps"],
    requires: ["dumbbells"],
    level: 1,
    dose: { en: "3 × 12–15 reps", ru: "3 × 12–15 повторений" },
    demo: "latraise",
    kcal10min: 50,
    workSec: 45,
  },
  {
    id: "barbell-squat",
    name: { en: "Barbell Squat", ru: "Присед со штангой" },
    desc: {
      en: "The king of leg strength — loaded power from the ground up.",
      ru: "Король силы ног — нагруженная мощь от самого пола.",
    },
    steps: {
      en: [
        "Bar on the upper back, core braced",
        "Sit down between the knees to parallel",
        "Drive up through the whole foot",
      ],
      ru: [
        "Гриф на верхе спины, кор напряжён",
        "Садись между коленей до параллели",
        "Вставай, давя всей стопой",
      ],
    },
    bodyPart: "legs",
    muscles: ["quads", "glutes", "hamstrings", "lowerback"],
    requires: ["barbell"],
    level: 2,
    dose: { en: "5 × 5–8 reps", ru: "5 × 5–8 повторений" },
    demo: "squat",
    kcal10min: 95,
    workSec: 50,
  },
  {
    id: "double-unders",
    name: { en: "Double Unders", ru: "Двойные прыжки" },
    desc: {
      en: "Two rope turns per jump — elite timing and a furious engine.",
      ru: "Два оборота троса за прыжок — элитный тайминг и бешеная дыхалка.",
    },
    steps: {
      en: [
        "Jump slightly higher than a regular skip",
        "Spin the wrists twice per jump — fast, small circles",
        "Stay tall, land on the balls of the feet",
      ],
      ru: [
        "Прыгай чуть выше обычного",
        "Два быстрых маленьких оборота кистями за прыжок",
        "Держись ровно, приземляйся на носки",
      ],
    },
    bodyPart: "fullbody",
    muscles: ["calves", "forearms", "shoulders", "abs"],
    requires: ["jumprope"],
    level: 3,
    dose: { en: "5 × 20 reps", ru: "5 × 20 повторений" },
    demo: "jumprope",
    kcal10min: 150,
    workSec: 40,
  },
];

/* --------------------------------------------------------------------------
   filtering — what can this profile actually do?
   -------------------------------------------------------------------------- */
export function availableToProfile(
  ex: Exercise,
  env: EnvId | null,
  equipment: EquipmentId[],
): boolean {
  if (ex.requires.length === 0) return true; // bodyweight — always
  if (env === "gym") return true; // full gym has everything
  return ex.requires.some((r) => equipment.includes(r as EquipmentId));
}

export function filterExercises(profile: Pick<Profile, "environment" | "equipment">) {
  return EXERCISES.filter((e) =>
    availableToProfile(e, profile.environment, profile.equipment),
  );
}

export const BODY_PARTS: BodyPart[] = [
  "technique",
  "fullbody",
  "chest",
  "arms",
  "shoulders",
  "back",
  "core",
  "legs",
];
