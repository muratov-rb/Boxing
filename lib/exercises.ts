/* ===========================================================================
   PRESSURE — exercise / lesson library
   Static bilingual catalog, 100% home bodyweight for now: every entry can be
   done in a room with no equipment (a wall / chair / sturdy edge at most).
   `demo` picks the 3D technique animation, `muscles` drives the body map.
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

/* What the exercise needs. "none" = pure bodyweight, always available.
   The whole catalog is bodyweight right now, but the field stays so equipment
   work can come back later without touching the consumers. */
export type Requirement = "none" | EquipmentId;

export type DemoPreset =
  /* boxing technique */
  | "jab"
  | "hook"
  | "uppercut"
  | "slip"
  | "footwork"
  | "shadowbox"
  /* push family */
  | "wallpushup"
  | "kneepushup"
  | "pushup"
  | "inclinepushup"
  | "declinepushup"
  | "archerpushup"
  | "pikepushup"
  | "handstand"
  | "shouldertap"
  | "plankup"
  | "dip"
  /* core */
  | "plank"
  | "sideplank"
  | "plankjack"
  | "climber"
  | "situp"
  | "bicycle"
  | "legraise"
  | "flutter"
  | "vup"
  | "hollow"
  | "deadbug"
  | "twist"
  /* back */
  | "superman"
  | "swimmer"
  | "snowangel"
  | "birddog"
  | "goodmorning"
  /* legs */
  | "squat"
  | "sumosquat"
  | "squatjump"
  | "pistol"
  | "lunge"
  | "reverselunge"
  | "sidelunge"
  | "jumplunge"
  | "bulgarian"
  | "stepup"
  | "wallsit"
  | "calfraise"
  | "bridge"
  | "singlebridge"
  | "donkeykick"
  | "firehydrant"
  | "singledeadlift"
  /* conditioning */
  | "jack"
  | "highknees"
  | "buttkick"
  | "fastfeet"
  | "burpee"
  | "sprawl"
  | "skater"
  | "tuckjump"
  | "bearcrawl"
  | "inchworm"
  /* mobility */
  | "armcircle";

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
  requires: Requirement[]; // needs ANY of these; [] = bodyweight
  level: 1 | 2 | 3; // 1 beginner · 2 intermediate · 3 advanced
  dose: I18nText; // reps / time prescription
  demo: DemoPreset;
  kcal10min: number; // rough burn per 10 min, for the calorie counter
  workSec: number; // seconds of work per set in a guided session
}

/* compact authoring helper — every entry below is pure bodyweight */
function ex(
  id: string,
  name: [en: string, ru: string],
  desc: [en: string, ru: string],
  stepsEn: string[],
  stepsRu: string[],
  bodyPart: BodyPart,
  muscles: MuscleRegion[],
  level: 1 | 2 | 3,
  dose: [en: string, ru: string],
  demo: DemoPreset,
  kcal10min: number,
  workSec: number,
): Exercise {
  return {
    id,
    name: { en: name[0], ru: name[1] },
    desc: { en: desc[0], ru: desc[1] },
    steps: { en: stepsEn, ru: stepsRu },
    bodyPart,
    muscles,
    requires: [],
    level,
    dose: { en: dose[0], ru: dose[1] },
    demo,
    kcal10min,
    workSec,
  };
}

export const EXERCISES: Exercise[] = [
  /* ------------------------------ technique ------------------------------ */
  ex(
    "jab-cross",
    ["Jab – Cross", "Джеб – кросс"],
    [
      "The one-two: boxing's bread and butter. Snap the jab, rotate into the cross.",
      "«Раз-два» — хлеб бокса. Щёлкни джебом и провернись в кросс.",
    ],
    [
      "Stance: lead foot forward, hands at chin",
      "Snap the lead hand straight out, palm turning down",
      "Rotate hips and rear heel into the cross, exhale on every punch",
    ],
    [
      "Стойка: передняя нога вперёд, руки у подбородка",
      "Выстрели передней рукой прямо, ладонь вниз",
      "Провернись бёдрами и задней пяткой в кросс, выдох на каждый удар",
    ],
    "technique",
    ["shoulders", "triceps", "obliques"],
    1,
    ["3 rounds × 3 min", "3 раунда × 3 мин"],
    "jab",
    90,
    180,
  ),
  ex(
    "hooks",
    ["Lead & Rear Hook", "Боковые удары (хуки)"],
    [
      "Short-range power. The whole body turns — the arm just carries it.",
      "Сила ближней дистанции. Бьёт всё тело — рука лишь доносит удар.",
    ],
    [
      "Elbow up to 90°, wrist locked",
      "Pivot the lead foot and turn the hip through",
      "Other hand glued to the chin, snap back to guard",
    ],
    [
      "Локоть на 90°, запястье жёсткое",
      "Провернись на передней стопе, бедро идёт в удар",
      "Вторая рука у подбородка, резко вернись в защиту",
    ],
    "technique",
    ["shoulders", "obliques", "abs"],
    2,
    ["3 rounds × 2 min", "3 раунда × 2 мин"],
    "hook",
    95,
    120,
  ),
  ex(
    "uppercuts",
    ["Uppercuts", "Апперкоты"],
    [
      "The punch that comes from the legs — dig up through the target.",
      "Удар, который рождается в ногах — выстрели снизу вверх сквозь цель.",
    ],
    [
      "Dip the knees slightly, keep the guard up",
      "Drive up with the legs, palm turning toward you",
      "Strike up through chin height, elbow stays bent",
    ],
    [
      "Слегка подсядь, защита у подбородка",
      "Выпрямись ногами, ладонь разворачивается к себе",
      "Бей снизу вверх на высоту подбородка, локоть согнут",
    ],
    "technique",
    ["biceps", "shoulders", "abs", "quads"],
    2,
    ["3 rounds × 2 min", "3 раунда × 2 мин"],
    "uppercut",
    95,
    120,
  ),
  ex(
    "slips",
    ["Slips & Rolls", "Уклоны и нырки"],
    [
      "Defense that sets up offense. Move the head off the line, stay in range.",
      "Защита, из которой рождается атака. Убери голову с линии, оставаясь в дистанции.",
    ],
    [
      "Small bend in the knees, chin down",
      "Slip: shift the head just outside the line of fire",
      "Roll: dip under an imaginary hook, eyes forward the whole time",
    ],
    [
      "Небольшой присед, подбородок вниз",
      "Уклон: смести голову чуть в сторону от линии удара",
      "Нырок: пройди под воображаемым хуком, взгляд всё время вперёд",
    ],
    "technique",
    ["obliques", "quads", "abs"],
    2,
    ["4 rounds × 2 min", "4 раунда × 2 мин"],
    "slip",
    80,
    120,
  ),
  ex(
    "shadow-footwork",
    ["Footwork Drill", "Работа ног"],
    [
      "In-out and lateral steps — boxing is played with the feet first.",
      "Вперёд-назад и в стороны — в бокс сначала играют ногами.",
    ],
    [
      "Stay on the balls of your feet, knees soft",
      "Step-drag forward, back, then side to side",
      "Never cross the feet, keep the stance width",
    ],
    [
      "Стой на носках, колени мягкие",
      "Шаг-подтяжка вперёд, назад, затем в стороны",
      "Не скрещивай ноги, держи ширину стойки",
    ],
    "technique",
    ["calves", "quads", "abs"],
    1,
    ["3 rounds × 3 min", "3 раунда × 3 мин"],
    "footwork",
    85,
    180,
  ),
  ex(
    "shadowboxing",
    ["Shadowboxing Rounds", "Бой с тенью"],
    [
      "Full rounds against an imaginary opponent — punches, defense and movement in one.",
      "Полные раунды с воображаемым соперником — удары, защита и движение вместе.",
    ],
    [
      "Move the whole round: in-out, angles, pivots",
      "Throw combos of 2–4 punches with full rotation",
      "After every combo: slip, roll or step out",
    ],
    [
      "Двигайся весь раунд: вперёд-назад, углы, развороты",
      "Бросай связки по 2–4 удара с полным проворотом",
      "После каждой связки — уклон, нырок или шаг в сторону",
    ],
    "technique",
    ["shoulders", "triceps", "obliques", "calves"],
    1,
    ["3 rounds × 3 min", "3 раунда × 3 мин"],
    "shadowbox",
    110,
    180,
  ),

  /* -------------------------------- chest -------------------------------- */
  ex(
    "wall-pushup",
    ["Wall Push-Up", "Отжимания от стены"],
    [
      "The first rung of the push-up ladder — perfect form from day one.",
      "Первая ступень лестницы отжиманий — идеальная техника с первого дня.",
    ],
    [
      "Hands on the wall at chest height, body straight",
      "Bend the elbows, bring the chest to the wall",
      "Push back to straight arms, keep the core tight",
    ],
    [
      "Ладони на стене на уровне груди, тело прямое",
      "Согни локти, поднеси грудь к стене",
      "Выжмись обратно, держи кор в тонусе",
    ],
    "chest",
    ["chest", "triceps", "shoulders"],
    1,
    ["3 × 12–20 reps", "3 × 12–20 повторений"],
    "wallpushup",
    40,
    45,
  ),
  ex(
    "knee-pushup",
    ["Knee Push-Up", "Отжимания с колен"],
    [
      "Same push-up mechanics with less load — build to the full rep.",
      "Та же механика отжимания с меньшей нагрузкой — путь к полному повтору.",
    ],
    [
      "Knees down, hands under shoulders, hips in line",
      "Lower the chest with elbows ~45° from the body",
      "Press up fast, exhale at the top",
    ],
    [
      "Колени на полу, ладони под плечами, таз в линии",
      "Опусти грудь, локти ~45° к корпусу",
      "Мощно выжмись, выдох в верхней точке",
    ],
    "chest",
    ["chest", "triceps", "shoulders"],
    1,
    ["3 × 10–15 reps", "3 × 10–15 повторений"],
    "kneepushup",
    55,
    45,
  ),
  ex(
    "pushup",
    ["Push-Up", "Отжимания"],
    [
      "The classic upper-body builder — punching power starts here.",
      "Классика для верха тела — сила удара начинается здесь.",
    ],
    [
      "Hands under shoulders, body one straight line",
      "Lower until the chest nearly touches the floor",
      "Elbows ~45° from the body; press up fast, exhale at the top",
    ],
    [
      "Ладони под плечами, тело — прямая линия",
      "Опустись, пока грудь почти не коснётся пола",
      "Локти ~45° к корпусу; мощно выжми вверх, выдох наверху",
    ],
    "chest",
    ["chest", "triceps", "shoulders", "abs"],
    1,
    ["4 × 10–20 reps", "4 × 10–20 повторений"],
    "pushup",
    70,
    45,
  ),
  ex(
    "wide-pushup",
    ["Wide Push-Up", "Широкие отжимания"],
    [
      "Hands wide — more chest, the base of a crushing clinch.",
      "Ладони шире — больше груди, база жёсткого клинча.",
    ],
    [
      "Hands 1.5× shoulder width",
      "Lower with control, chest leads",
      "Press up, squeeze the chest at the top",
    ],
    [
      "Ладони в 1,5 раза шире плеч",
      "Опускайся подконтрольно, грудью вперёд",
      "Выжмись вверх, сожми грудь в верхней точке",
    ],
    "chest",
    ["chest", "shoulders", "triceps"],
    1,
    ["4 × 8–15 reps", "4 × 8–15 повторений"],
    "pushup",
    70,
    45,
  ),
  ex(
    "incline-pushup",
    ["Incline Push-Up", "Отжимания с опорой"],
    [
      "Hands on a chair or sofa edge — easier angle, full range.",
      "Руки на стуле или крае дивана — угол легче, амплитуда полная.",
    ],
    [
      "Hands on a sturdy edge, body one line",
      "Chest to the edge, elbows ~45°",
      "Push away strong, don't sag the hips",
    ],
    [
      "Ладони на устойчивой опоре, тело в линию",
      "Грудь к опоре, локти ~45°",
      "Мощно оттолкнись, не провисай тазом",
    ],
    "chest",
    ["chest", "triceps", "shoulders"],
    1,
    ["3 × 10–18 reps", "3 × 10–18 повторений"],
    "inclinepushup",
    60,
    45,
  ),
  ex(
    "decline-pushup",
    ["Decline Push-Up", "Отжимания ноги на опоре"],
    [
      "Feet elevated — upper chest and shoulders take the fight.",
      "Ноги на возвышении — работает верх груди и плечи.",
    ],
    [
      "Feet on a chair, hands under the shoulders",
      "Lower the forehead toward the floor with control",
      "Keep the body rigid — no banana back",
    ],
    [
      "Стопы на стуле, ладони под плечами",
      "Подконтрольно опусти лоб к полу",
      "Держи корпус жёстким — без прогиба",
    ],
    "chest",
    ["chest", "shoulders", "triceps", "abs"],
    2,
    ["3 × 8–14 reps", "3 × 8–14 повторений"],
    "declinepushup",
    75,
    45,
  ),
  ex(
    "archer-pushup",
    ["Archer Push-Up", "Отжимания лучника"],
    [
      "One arm works, one assists — the bridge to a one-arm push-up.",
      "Одна рука работает, вторая помогает — мост к отжиманию на одной руке.",
    ],
    [
      "Hands very wide, fingers slightly out",
      "Lower toward one hand, other arm stays long",
      "Press back to center, alternate sides",
    ],
    [
      "Ладони очень широко, пальцы чуть наружу",
      "Опустись к одной руке, вторая остаётся прямой",
      "Выжмись в центр, чередуй стороны",
    ],
    "chest",
    ["chest", "triceps", "shoulders", "abs"],
    3,
    ["3 × 4–8 / side", "3 × 4–8 на сторону"],
    "archerpushup",
    80,
    40,
  ),

  /* --------------------------------- arms -------------------------------- */
  ex(
    "diamond-pushup",
    ["Diamond Push-Up", "Алмазные отжимания"],
    [
      "Hands together — triceps take the load. Snappier straight punches.",
      "Ладони вместе — нагрузка уходит в трицепс. Более хлёсткие прямые.",
    ],
    [
      "Thumbs and index fingers form a diamond",
      "Elbows track back along the ribs",
      "Slow down, explosive up",
    ],
    [
      "Большие и указательные пальцы образуют ромб",
      "Локти идут назад вдоль рёбер",
      "Медленно вниз, взрывом вверх",
    ],
    "arms",
    ["triceps", "chest", "shoulders"],
    2,
    ["3 × 8–15 reps", "3 × 8–15 повторений"],
    "pushup",
    70,
    40,
  ),
  ex(
    "chair-dips",
    ["Chair Dips", "Обратные отжимания"],
    [
      "Triceps on any chair or bench — straight-punch snap at home.",
      "Трицепс на любом стуле или скамье — хлёсткость прямых ударов дома.",
    ],
    [
      "Hands on the edge behind you, legs forward",
      "Lower until elbows hit ~90°",
      "Press back up without shrugging",
    ],
    [
      "Руки на краю опоры за спиной, ноги вперёд",
      "Опустись до ~90° в локтях",
      "Выжмись вверх, не поднимая плечи",
    ],
    "arms",
    ["triceps", "shoulders", "chest"],
    1,
    ["3 × 10–15 reps", "3 × 10–15 повторений"],
    "dip",
    55,
    45,
  ),
  ex(
    "plank-up-down",
    ["Plank Up-Down", "Планка вверх-вниз"],
    [
      "Forearms to palms and back — triceps, shoulders and a core that never quits.",
      "С предплечий на ладони и обратно — трицепс, плечи и несдающийся кор.",
    ],
    [
      "Start in a forearm plank",
      "Press up one hand at a time to a straight-arm plank",
      "Lower back down, keep the hips level",
    ],
    [
      "Старт в планке на предплечьях",
      "По одной руке выжмись в планку на прямых руках",
      "Вернись вниз, таз держи ровно",
    ],
    "arms",
    ["triceps", "shoulders", "abs", "obliques"],
    2,
    ["3 × 8–12 reps", "3 × 8–12 повторений"],
    "plankup",
    75,
    40,
  ),

  /* ------------------------------ shoulders ------------------------------ */
  ex(
    "pike-pushup",
    ["Pike Push-Up", "Отжимания уголком"],
    [
      "Bodyweight shoulder press — guard stays up when shoulders don't quit.",
      "Жим плечами со своим весом — защита не падает, когда плечи не сдаются.",
    ],
    [
      "Hips high, body in an inverted V",
      "Lower the crown of the head toward the floor",
      "Press back up through the shoulders",
    ],
    [
      "Таз высоко, тело — перевёрнутая V",
      "Опусти макушку к полу",
      "Выжмись обратно плечами",
    ],
    "shoulders",
    ["shoulders", "triceps", "traps"],
    2,
    ["3 × 8–12 reps", "3 × 8–12 повторений"],
    "pikepushup",
    65,
    40,
  ),
  ex(
    "wall-handstand",
    ["Wall Handstand Hold", "Стойка на руках у стены"],
    [
      "Full bodyweight overhead — elite shoulder strength and control.",
      "Весь вес над головой — элитная сила и контроль плеч.",
    ],
    [
      "Kick up with heels resting on the wall",
      "Arms locked, fingers gripping the floor",
      "Squeeze glutes and ribs in; breathe, don't hold",
    ],
    [
      "Забрось ноги, пятки касаются стены",
      "Руки прямые, пальцы вжаты в пол",
      "Сожми ягодицы, рёбра внутрь; дыши, не задерживай",
    ],
    "shoulders",
    ["shoulders", "traps", "triceps", "abs"],
    3,
    ["3 × 15–40 sec", "3 × 15–40 сек"],
    "handstand",
    60,
    30,
  ),
  ex(
    "shoulder-taps",
    ["Shoulder Taps", "Касания плеч в планке"],
    [
      "A moving plank — anti-rotation core plus shoulder stability.",
      "Планка в движении — антиротация кора плюс стабильность плеч.",
    ],
    [
      "Straight-arm plank, feet slightly wide",
      "Tap the opposite shoulder without tilting the hips",
      "Slow tempo beats fast sloppy taps",
    ],
    [
      "Планка на прямых руках, стопы чуть шире",
      "Коснись противоположного плеча, не качая таз",
      "Медленный темп лучше быстрых небрежных касаний",
    ],
    "shoulders",
    ["shoulders", "abs", "obliques", "triceps"],
    1,
    ["3 × 10 / side", "3 × 10 на сторону"],
    "shouldertap",
    60,
    40,
  ),
  ex(
    "arm-circles",
    ["Arm Circles", "Круги руками"],
    [
      "Warm-up staple — shoulder endurance that keeps the guard tall.",
      "Базовая разминка — выносливость плеч, которая держит защиту.",
    ],
    [
      "Arms straight out to the sides",
      "Small controlled circles, then grow them",
      "Reverse direction halfway through",
    ],
    [
      "Прямые руки в стороны",
      "Маленькие подконтрольные круги, постепенно шире",
      "На середине смени направление",
    ],
    "shoulders",
    ["shoulders", "traps"],
    1,
    ["3 × 30 sec", "3 × 30 сек"],
    "armcircle",
    35,
    30,
  ),

  /* --------------------------------- back -------------------------------- */
  ex(
    "superman",
    ["Superman Hold", "Супермен"],
    [
      "Lower back and glutes — the armor behind your posture.",
      "Поясница и ягодицы — броня твоей осанки.",
    ],
    [
      "Face down, arms extended forward",
      "Lift arms, chest and legs off the floor together",
      "Hold, squeeze the glutes, breathe",
    ],
    [
      "Лёжа на животе, руки вытянуты вперёд",
      "Одновременно оторви руки, грудь и ноги от пола",
      "Держи, сжимай ягодицы, дыши",
    ],
    "back",
    ["lowerback", "glutes", "traps"],
    1,
    ["3 × 20–30 sec", "3 × 20–30 сек"],
    "superman",
    40,
    30,
  ),
  ex(
    "swimmer",
    ["Swimmers", "Пловец"],
    [
      "Alternating superman — the whole posterior chain learns to fire in rhythm.",
      "Попеременный супермен — вся задняя цепь учится работать в ритме.",
    ],
    [
      "Face down, arms and legs long",
      "Lift opposite arm and leg together",
      "Switch sides in a steady swimming rhythm",
    ],
    [
      "Лёжа на животе, руки и ноги вытянуты",
      "Подними противоположные руку и ногу вместе",
      "Меняй стороны в ровном плавательном ритме",
    ],
    "back",
    ["lowerback", "glutes", "traps", "hamstrings"],
    2,
    ["3 × 30 sec", "3 × 30 сек"],
    "swimmer",
    50,
    30,
  ),
  ex(
    "reverse-snow-angel",
    ["Reverse Snow Angel", "Обратный ангел"],
    [
      "Face-down arm sweeps — upper-back muscle you can't build with pushing.",
      "Махи руками лёжа на животе — верх спины, который не построить жимами.",
    ],
    [
      "Face down, chest slightly lifted",
      "Sweep straight arms from hips to overhead",
      "Keep thumbs up, shoulders away from the ears",
    ],
    [
      "Лёжа на животе, грудь слегка приподнята",
      "Веди прямые руки от бёдер за голову",
      "Большие пальцы вверх, плечи от ушей",
    ],
    "back",
    ["traps", "shoulders", "lowerback", "lats"],
    1,
    ["3 × 8–12 reps", "3 × 8–12 повторений"],
    "snowangel",
    40,
    40,
  ),
  ex(
    "birddog",
    ["Bird Dog", "Птица-собака"],
    [
      "Opposite arm and leg reach — spine stability every punch is built on.",
      "Вытяжение противоположных руки и ноги — стабильность позвоночника, на которой строится каждый удар.",
    ],
    [
      "On all fours, back flat",
      "Reach one arm forward and the opposite leg back",
      "Pause, return with control, switch sides",
    ],
    [
      "На четвереньках, спина ровная",
      "Вытяни руку вперёд и противоположную ногу назад",
      "Пауза, подконтрольно вернись, смени стороны",
    ],
    "back",
    ["lowerback", "glutes", "abs", "shoulders"],
    1,
    ["3 × 8 / side", "3 × 8 на сторону"],
    "birddog",
    40,
    40,
  ),
  ex(
    "good-morning",
    ["Good Morning", "Наклоны «доброе утро»"],
    [
      "The hip hinge — hamstrings and lower back learn the strongest pattern in sport.",
      "Тазобедренный наклон — бицепс бедра и поясница осваивают сильнейший паттерн в спорте.",
    ],
    [
      "Hands behind the head, knees soft",
      "Push the hips back, chest toward the floor",
      "Flat back throughout; squeeze glutes to stand",
    ],
    [
      "Руки за головой, колени мягкие",
      "Уведи таз назад, грудь к полу",
      "Спина ровная всё время; вставай, сжимая ягодицы",
    ],
    "back",
    ["hamstrings", "lowerback", "glutes"],
    1,
    ["3 × 12–15 reps", "3 × 12–15 повторений"],
    "goodmorning",
    45,
    45,
  ),

  /* --------------------------------- core -------------------------------- */
  ex(
    "plank",
    ["Plank", "Планка"],
    [
      "A cast-iron core keeps your punches connected to the ground.",
      "Железный кор связывает твои удары с землёй.",
    ],
    [
      "Forearms down, elbows under shoulders",
      "Squeeze glutes and abs — no sagging hips",
      "Neck neutral, breathe steadily",
    ],
    [
      "Предплечья на полу, локти под плечами",
      "Сожми ягодицы и пресс — таз не провисает",
      "Шея нейтральна, дыши ровно",
    ],
    "core",
    ["abs", "obliques", "lowerback", "shoulders"],
    1,
    ["3 × 30–60 sec", "3 × 30–60 сек"],
    "plank",
    40,
    45,
  ),
  ex(
    "side-plank",
    ["Side Plank", "Боковая планка"],
    [
      "Obliques under load — the muscles that turn punches over and take body shots.",
      "Косые под нагрузкой — мышцы, которые проворачивают удар и держат удары по корпусу.",
    ],
    [
      "Elbow under the shoulder, feet stacked",
      "Lift the hips into one straight line",
      "Don't let the hip drop; switch sides",
    ],
    [
      "Локоть под плечом, стопы друг на друге",
      "Подними таз в одну прямую линию",
      "Не роняй бедро; смени сторону",
    ],
    "core",
    ["obliques", "abs", "shoulders"],
    2,
    ["3 × 20–40 sec / side", "3 × 20–40 сек на сторону"],
    "sideplank",
    45,
    30,
  ),
  ex(
    "plank-jacks",
    ["Plank Jacks", "Планка с прыжками"],
    [
      "Jumping jacks in a plank — core tension plus a conditioning hit.",
      "Джампинг-джек в планке — напряжение кора плюс удар по дыхалке.",
    ],
    [
      "Straight-arm plank, body rigid",
      "Hop the feet wide, then back together",
      "Hips stay level the whole time",
    ],
    [
      "Планка на прямых руках, корпус жёсткий",
      "Прыжком разведи стопы, затем сведи",
      "Таз всё время на одном уровне",
    ],
    "core",
    ["abs", "shoulders", "quads", "obliques"],
    2,
    ["4 × 20–30 sec", "4 × 20–30 сек"],
    "plankjack",
    95,
    30,
  ),
  ex(
    "mountain-climber",
    ["Mountain Climbers", "Скалолаз"],
    [
      "Core + engine + hip speed. Fast knees, flat back.",
      "Кор + дыхалка + скорость бёдер. Быстрые колени, ровная спина.",
    ],
    [
      "Plank position, shoulders over wrists",
      "Drive knees to the chest, one after another",
      "Hips stay level — no bouncing",
    ],
    [
      "Планка, плечи над запястьями",
      "Поочерёдно гони колени к груди",
      "Таз ровный — без подпрыгиваний",
    ],
    "core",
    ["abs", "quads", "shoulders"],
    1,
    ["4 × 30 sec", "4 × 30 сек"],
    "climber",
    110,
    30,
  ),
  ex(
    "situp",
    ["Sit-Up / Crunch", "Скручивания"],
    [
      "Body shots happen. Armor the midsection.",
      "Удары по корпусу будут. Забронируй пресс.",
    ],
    [
      "Knees bent, feet flat, hands by temples",
      "Curl up rib by rib — don't yank the neck",
      "Lower with control",
    ],
    [
      "Колени согнуты, стопы на полу, руки у висков",
      "Скручивайся позвонок за позвонком — не тяни шею",
      "Опускайся подконтрольно",
    ],
    "core",
    ["abs", "obliques"],
    1,
    ["4 × 15–25 reps", "4 × 15–25 повторений"],
    "situp",
    60,
    45,
  ),
  ex(
    "bicycle-crunch",
    ["Bicycle Crunch", "Велосипед"],
    [
      "Elbow to opposite knee — rotation and flexion in one drill.",
      "Локоть к противоположному колену — ротация и скручивание в одном упражнении.",
    ],
    [
      "Shoulders off the floor, legs in the air",
      "Drive elbow to the opposite knee as the other leg extends",
      "Slow and controlled beats fast and sloppy",
    ],
    [
      "Лопатки оторваны от пола, ноги в воздухе",
      "Локоть к противоположному колену, вторая нога выпрямляется",
      "Медленно и чисто лучше, чем быстро и небрежно",
    ],
    "core",
    ["abs", "obliques"],
    2,
    ["3 × 20 turns", "3 × 20 поворотов"],
    "bicycle",
    70,
    40,
  ),
  ex(
    "leg-raises",
    ["Lying Leg Raises", "Подъёмы ног лёжа"],
    [
      "Lower abs — the deep armor under every body shot.",
      "Нижний пресс — глубокая броня под каждым ударом по корпусу.",
    ],
    [
      "On your back, hands under the hips",
      "Raise straight legs to vertical",
      "Lower slow — heels never touch the floor",
    ],
    [
      "Лёжа на спине, ладони под тазом",
      "Подними прямые ноги до вертикали",
      "Опускай медленно — пятки не касаются пола",
    ],
    "core",
    ["abs", "quads"],
    2,
    ["3 × 10–15 reps", "3 × 10–15 повторений"],
    "legraise",
    55,
    40,
  ),
  ex(
    "flutter-kicks",
    ["Flutter Kicks", "Ножницы"],
    [
      "Small fast kicks — relentless lower-ab endurance.",
      "Маленькие быстрые махи — неутомимая выносливость нижнего пресса.",
    ],
    [
      "On your back, legs long, heels off the floor",
      "Kick in small fast alternating pulses",
      "Press the lower back into the floor",
    ],
    [
      "Лёжа на спине, ноги прямые, пятки над полом",
      "Быстрые маленькие попеременные махи",
      "Поясница прижата к полу",
    ],
    "core",
    ["abs", "quads"],
    2,
    ["3 × 20–30 sec", "3 × 20–30 сек"],
    "flutter",
    65,
    30,
  ),
  ex(
    "v-ups",
    ["V-Ups", "Складка"],
    [
      "Hands meet feet at the top — the whole six-pack in one snap.",
      "Руки встречают стопы наверху — весь пресс в одном движении.",
    ],
    [
      "Lie long, arms overhead",
      "Fold: straight arms and legs meet above the hips",
      "Lower both halves with control",
    ],
    [
      "Ляг ровно, руки за головой",
      "Складка: прямые руки и ноги встречаются над тазом",
      "Опускай обе половины подконтрольно",
    ],
    "core",
    ["abs", "quads", "obliques"],
    3,
    ["3 × 8–15 reps", "3 × 8–15 повторений"],
    "vup",
    80,
    40,
  ),
  ex(
    "hollow-hold",
    ["Hollow Hold", "Лодочка"],
    [
      "The gymnast's secret — total-body tension you'll feel in every punch.",
      "Секрет гимнастов — тотальное натяжение тела, которое почувствуешь в каждом ударе.",
    ],
    [
      "Lower back pressed into the floor",
      "Shoulders and legs hover off the ground",
      "Arms by the ears; the lower you hold, the harder it gets",
    ],
    [
      "Поясница прижата к полу",
      "Плечи и ноги висят над полом",
      "Руки у ушей; чем ниже держишь, тем тяжелее",
    ],
    "core",
    ["abs", "quads"],
    2,
    ["3 × 20–40 sec", "3 × 20–40 сек"],
    "hollow",
    55,
    30,
  ),
  ex(
    "dead-bug",
    ["Dead Bug", "Мёртвый жук"],
    [
      "Opposite arm and leg lower away — core control without back strain.",
      "Противоположные рука и нога опускаются — контроль кора без нагрузки на спину.",
    ],
    [
      "On your back: arms up, knees over hips",
      "Lower opposite arm and leg toward the floor",
      "Lower back glued down; return and switch",
    ],
    [
      "Лёжа на спине: руки вверх, колени над тазом",
      "Опусти противоположные руку и ногу к полу",
      "Поясница прижата; вернись и смени стороны",
    ],
    "core",
    ["abs", "obliques"],
    1,
    ["3 × 8 / side", "3 × 8 на сторону"],
    "deadbug",
    45,
    40,
  ),
  ex(
    "russian-twists",
    ["Russian Twists", "Русские скручивания"],
    [
      "Rotational core — the exact muscles that turn a punch over.",
      "Ротационный кор — именно эти мышцы проворачивают удар.",
    ],
    [
      "Sit back to 45°, feet up or lightly grounded",
      "Rotate the torso side to side",
      "Turn the shoulders, not just the arms",
    ],
    [
      "Откинься на 45°, ноги подняты или слегка касаются пола",
      "Вращай корпус из стороны в сторону",
      "Поворачивай плечи, а не только руки",
    ],
    "core",
    ["obliques", "abs"],
    1,
    ["3 × 20 turns", "3 × 20 поворотов"],
    "twist",
    65,
    45,
  ),

  /* --------------------------------- legs -------------------------------- */
  ex(
    "squat",
    ["Bodyweight Squat", "Приседания"],
    [
      "Legs are where punching power is born. Own the full range.",
      "Сила удара рождается в ногах. Работай в полной амплитуде.",
    ],
    [
      "Feet shoulder-width, toes slightly out",
      "Sit back and down — knees track over toes",
      "Chest up, heels planted; drive up through the whole foot",
    ],
    [
      "Стопы на ширине плеч, носки чуть наружу",
      "Садись назад и вниз — колени по линии носков",
      "Грудь вверх, пятки прижаты; вставай, давя всей стопой",
    ],
    "legs",
    ["quads", "glutes", "hamstrings"],
    1,
    ["4 × 15–25 reps", "4 × 15–25 повторений"],
    "squat",
    75,
    60,
  ),
  ex(
    "sumo-squat",
    ["Sumo Squat", "Сумо-приседания"],
    [
      "Wide stance — inner thighs and glutes join the party.",
      "Широкая стойка — внутренняя поверхность бедра и ягодицы в работе.",
    ],
    [
      "Feet wide, toes out ~45°",
      "Sit straight down between the knees",
      "Knees push out over the toes the whole rep",
    ],
    [
      "Стопы широко, носки наружу ~45°",
      "Садись строго вниз между коленей",
      "Колени всё время идут наружу за носками",
    ],
    "legs",
    ["quads", "glutes", "hamstrings"],
    1,
    ["4 × 12–20 reps", "4 × 12–20 повторений"],
    "sumosquat",
    75,
    50,
  ),
  ex(
    "squat-jumps",
    ["Squat Jumps", "Выпрыгивания"],
    [
      "Explosive legs — the spring behind every knockout punch.",
      "Взрывные ноги — пружина каждого нокаутирующего удара.",
    ],
    [
      "Squat to parallel, chest up",
      "Explode straight up as high as you can",
      "Land soft into the next rep",
    ],
    [
      "Присядь до параллели, грудь вверх",
      "Выпрыгни вертикально со всей силы",
      "Мягко приземлись сразу в следующее повторение",
    ],
    "legs",
    ["quads", "glutes", "calves"],
    2,
    ["4 × 8–12 reps", "4 × 8–12 повторений"],
    "squatjump",
    120,
    40,
  ),
  ex(
    "pistol-squat",
    ["Pistol Squat", "Пистолетик"],
    [
      "Full squat on one leg — the summit of home leg strength.",
      "Полный присед на одной ноге — вершина домашней силы ног.",
    ],
    [
      "One leg extends forward, arms reach for balance",
      "Lower all the way down on the standing leg",
      "Drive up without the free foot touching down",
    ],
    [
      "Одна нога вытянута вперёд, руки для баланса",
      "Опустись до конца на опорной ноге",
      "Вставай, не касаясь пола свободной ногой",
    ],
    "legs",
    ["quads", "glutes", "hamstrings", "abs"],
    3,
    ["3 × 3–6 / leg", "3 × 3–6 на ногу"],
    "pistol",
    90,
    40,
  ),
  ex(
    "lunge",
    ["Forward Lunge", "Выпады"],
    [
      "Single-leg strength and balance — the base of every pivot and angle.",
      "Сила и баланс на одной ноге — база каждого разворота и угла.",
    ],
    [
      "Long step forward, torso tall",
      "Back knee kisses the floor",
      "Push through the front heel to rise; alternate legs",
    ],
    [
      "Длинный шаг вперёд, корпус ровный",
      "Заднее колено слегка касается пола",
      "Вставай, давя передней пяткой; чередуй ноги",
    ],
    "legs",
    ["quads", "glutes", "hamstrings", "calves"],
    1,
    ["3 × 10 / leg", "3 × 10 на ногу"],
    "lunge",
    80,
    60,
  ),
  ex(
    "reverse-lunge",
    ["Reverse Lunge", "Обратные выпады"],
    [
      "Step back instead of forward — easier on the knees, same leg-building punch.",
      "Шаг назад вместо вперёд — мягче для коленей, та же польза для ног.",
    ],
    [
      "Step back long, hips square",
      "Lower the back knee toward the floor",
      "Drive up through the front heel",
    ],
    [
      "Длинный шаг назад, таз ровно",
      "Опусти заднее колено к полу",
      "Вставай, давя передней пяткой",
    ],
    "legs",
    ["quads", "glutes", "hamstrings"],
    1,
    ["3 × 10 / leg", "3 × 10 на ногу"],
    "reverselunge",
    80,
    60,
  ),
  ex(
    "side-lunges",
    ["Side Lunges", "Боковые выпады"],
    [
      "Lateral strength for slips, pivots and ring movement.",
      "Боковая сила для уклонов, разворотов и движения по рингу.",
    ],
    [
      "Big step to the side, hips back",
      "Bend one knee, other leg stays straight",
      "Push off and switch sides",
    ],
    [
      "Широкий шаг в сторону, таз назад",
      "Сгибай одно колено, вторая нога прямая",
      "Оттолкнись и смени сторону",
    ],
    "legs",
    ["quads", "glutes", "hamstrings"],
    1,
    ["3 × 8 / side", "3 × 8 на сторону"],
    "sidelunge",
    75,
    60,
  ),
  ex(
    "jumping-lunges",
    ["Jumping Lunges", "Выпады с прыжком"],
    [
      "Switch legs mid-air — explosive stance changes straight out of the ring.",
      "Смена ног в воздухе — взрывная смена стойки прямо из ринга.",
    ],
    [
      "Start in a lunge, both knees at 90°",
      "Jump and switch legs in the air",
      "Land soft, sink straight into the next rep",
    ],
    [
      "Старт в выпаде, оба колена под 90°",
      "Выпрыгни и смени ноги в воздухе",
      "Мягко приземлись сразу в следующий повтор",
    ],
    "legs",
    ["quads", "glutes", "calves"],
    3,
    ["3 × 6–10 / leg", "3 × 6–10 на ногу"],
    "jumplunge",
    130,
    30,
  ),
  ex(
    "bulgarian-split-squat",
    ["Bulgarian Split Squat", "Болгарские выпады"],
    [
      "Rear foot on a chair — brutal single-leg strength with zero equipment.",
      "Задняя нога на стуле — жёсткая сила на одной ноге без железа.",
    ],
    [
      "Rear foot rests on a chair behind you",
      "Lower straight down on the front leg",
      "Front knee tracks the toes; drive up through the heel",
    ],
    [
      "Задняя стопа на стуле позади",
      "Опускайся строго вниз на передней ноге",
      "Колено по линии носка; вставай через пятку",
    ],
    "legs",
    ["quads", "glutes", "hamstrings"],
    2,
    ["3 × 8–12 / leg", "3 × 8–12 на ногу"],
    "bulgarian",
    85,
    45,
  ),
  ex(
    "step-ups",
    ["Step-Ups", "Зашагивания"],
    [
      "Step onto a chair or stair — single-leg drive you'll feel in every pivot.",
      "Зашагивай на стул или ступеньку — толчок одной ногой для каждого разворота.",
    ],
    [
      "Whole foot on a sturdy chair or step",
      "Drive through the heel to stand tall on top",
      "Lower with control; don't push off the floor leg",
    ],
    [
      "Вся стопа на устойчивом стуле или ступеньке",
      "Встань наверх, давя пяткой",
      "Опускайся подконтрольно; не отталкивайся нижней ногой",
    ],
    "legs",
    ["quads", "glutes", "calves"],
    1,
    ["3 × 8–12 / leg", "3 × 8–12 на ногу"],
    "stepup",
    85,
    45,
  ),
  ex(
    "wall-sit",
    ["Wall Sit", "Стульчик у стены"],
    [
      "Isometric leg endurance — for legs that don't fade in round three.",
      "Изометрическая выносливость ног — чтобы они не сели в третьем раунде.",
    ],
    [
      "Back flat on the wall, thighs parallel to the floor",
      "Knees at 90°, weight through the heels",
      "Hold and breathe — no hands on the legs",
    ],
    [
      "Спина прижата к стене, бёдра параллельны полу",
      "Колени под 90°, вес в пятках",
      "Держи и дыши — руки не на ногах",
    ],
    "legs",
    ["quads", "glutes"],
    1,
    ["3 × 30–60 sec", "3 × 30–60 сек"],
    "wallsit",
    50,
    45,
  ),
  ex(
    "calf-raises",
    ["Calf Raises", "Подъёмы на носки"],
    [
      "Boxers live on their toes — build the springs that keep you there.",
      "Боксёр живёт на носках — накачай пружины, которые тебя там держат.",
    ],
    [
      "Feet hip-width, rise to the balls of the feet",
      "Pause at the top, squeeze the calves",
      "Lower slow, heels kiss the floor",
    ],
    [
      "Стопы на ширине таза, поднимись на носки",
      "Задержись наверху, сожми икры",
      "Опускайся медленно, пятки едва касаются пола",
    ],
    "legs",
    ["calves"],
    1,
    ["4 × 15–25 reps", "4 × 15–25 повторений"],
    "calfraise",
    45,
    45,
  ),
  ex(
    "glute-bridge",
    ["Glute Bridge", "Ягодичный мост"],
    [
      "Hip drive is punch drive. Wake up the posterior chain.",
      "Работа бёдер — это сила удара. Разбуди заднюю цепь.",
    ],
    [
      "On your back, knees bent, feet close to hips",
      "Drive hips up, squeeze glutes hard at the top",
      "Lower slow, don't rest at the bottom",
    ],
    [
      "Лёжа на спине, колени согнуты, стопы близко к тазу",
      "Выжми таз вверх, сожми ягодицы в верхней точке",
      "Опускайся медленно, внизу не отдыхай",
    ],
    "legs",
    ["glutes", "hamstrings", "lowerback"],
    1,
    ["3 × 15–20 reps", "3 × 15–20 повторений"],
    "bridge",
    50,
    45,
  ),
  ex(
    "single-leg-bridge",
    ["Single-Leg Bridge", "Мост на одной ноге"],
    [
      "One leg in the air — double the glute work, plus anti-rotation control.",
      "Одна нога в воздухе — вдвое больше работы ягодиц плюс контроль ротации.",
    ],
    [
      "Bridge position, one leg extended straight",
      "Drive the hips up level — no tilting",
      "Full set on one side, then switch",
    ],
    [
      "Положение моста, одна нога выпрямлена",
      "Выжимай таз ровно вверх — без перекоса",
      "Полный подход на одну сторону, затем смена",
    ],
    "legs",
    ["glutes", "hamstrings", "lowerback", "abs"],
    2,
    ["3 × 8–12 / leg", "3 × 8–12 на ногу"],
    "singlebridge",
    55,
    40,
  ),
  ex(
    "donkey-kicks",
    ["Donkey Kicks", "Махи ногой назад"],
    [
      "Kick the ceiling — direct glute power for hip drive.",
      "Толкни пяткой потолок — прямая работа ягодиц для мощных бёдер.",
    ],
    [
      "On all fours, knee bent at 90°",
      "Drive the heel up toward the ceiling",
      "Squeeze at the top; don't arch the lower back",
    ],
    [
      "На четвереньках, колено согнуто под 90°",
      "Выжми пятку вверх к потолку",
      "Сожми ягодицу наверху; не прогибай поясницу",
    ],
    "legs",
    ["glutes", "hamstrings"],
    1,
    ["3 × 12 / leg", "3 × 12 на ногу"],
    "donkeykick",
    45,
    40,
  ),
  ex(
    "fire-hydrants",
    ["Fire Hydrants", "Отведения бедра"],
    [
      "Side hip strength — lateral movement and knee health in one drill.",
      "Сила бедра вбок — движение в сторону и здоровье коленей в одном упражнении.",
    ],
    [
      "On all fours, core braced",
      "Lift the bent knee out to the side",
      "Hips stay square — no leaning",
    ],
    [
      "На четвереньках, кор напряжён",
      "Подними согнутое колено в сторону",
      "Таз ровный — без завала корпуса",
    ],
    "legs",
    ["glutes", "obliques"],
    1,
    ["3 × 12 / leg", "3 × 12 на ногу"],
    "firehydrant",
    40,
    40,
  ),
  ex(
    "single-leg-rdl",
    ["Single-Leg Deadlift", "Румынская тяга на одной ноге"],
    [
      "Balance plus hamstrings — the anti-ankle-roll, anti-slip insurance policy.",
      "Баланс плюс бицепс бедра — страховка от подворотов и проскальзываний.",
    ],
    [
      "Stand on one leg, knee soft",
      "Hinge forward as the free leg extends back",
      "Flat back to horizontal, then squeeze up tall",
    ],
    [
      "Встань на одну ногу, колено мягкое",
      "Наклонись вперёд, свободная нога уходит назад",
      "Ровная спина до горизонтали, затем мощно выпрямись",
    ],
    "legs",
    ["hamstrings", "glutes", "lowerback"],
    2,
    ["3 × 8 / leg", "3 × 8 на ногу"],
    "singledeadlift",
    55,
    45,
  ),

  /* ------------------------------ conditioning --------------------------- */
  ex(
    "jumping-jacks",
    ["Jumping Jacks", "Джампинг-джек"],
    [
      "The classic warm-up — wake up the whole body in a minute.",
      "Классическая разминка — разбуди всё тело за минуту.",
    ],
    [
      "Jump feet wide while arms swing overhead",
      "Jump back to feet together, arms down",
      "Land soft, keep a steady rhythm",
    ],
    [
      "Прыжком ноги в стороны, руки через стороны вверх",
      "Прыжком обратно, руки вниз",
      "Приземляйся мягко, держи ровный ритм",
    ],
    "fullbody",
    ["shoulders", "calves", "quads"],
    1,
    ["3 × 45 sec", "3 × 45 сек"],
    "jack",
    100,
    45,
  ),
  ex(
    "high-knees",
    ["High Knees", "Высокое колено"],
    [
      "Sprint on the spot — engine, hip flexors and fast feet.",
      "Спринт на месте — дыхалка, сгибатели бедра и быстрые ноги.",
    ],
    [
      "Run in place driving knees to hip height",
      "Stay tall — don't lean back",
      "Pump the arms like a sprinter",
    ],
    [
      "Беги на месте, поднимая колени до уровня таза",
      "Держи корпус ровно — не отклоняйся назад",
      "Работай руками как спринтер",
    ],
    "fullbody",
    ["quads", "calves", "abs"],
    1,
    ["4 × 30 sec", "4 × 30 сек"],
    "highknees",
    130,
    30,
  ),
  ex(
    "butt-kicks",
    ["Butt Kicks", "Захлёст голени"],
    [
      "Heels to glutes — fast hamstrings and light feet.",
      "Пятки к ягодицам — быстрый бицепс бедра и лёгкие ноги.",
    ],
    [
      "Run in place kicking heels to the glutes",
      "Knees point down, torso tall",
      "Quick light contacts with the floor",
    ],
    [
      "Беги на месте, захлёстывая пятки к ягодицам",
      "Колени смотрят вниз, корпус ровный",
      "Быстрые лёгкие касания пола",
    ],
    "fullbody",
    ["hamstrings", "calves", "quads"],
    1,
    ["4 × 30 sec", "4 × 30 сек"],
    "buttkick",
    110,
    30,
  ),
  ex(
    "fast-feet",
    ["Fast Feet", "Быстрые ноги"],
    [
      "Machine-gun steps — the foot speed that wins exchanges.",
      "Пулемётные шаги — скорость ног, которая выигрывает размены.",
    ],
    [
      "Quarter squat, weight on the balls of the feet",
      "Chop the feet as fast as possible in place",
      "Stay low, arms in a loose guard",
    ],
    [
      "Четверть-присед, вес на носках",
      "Максимально быстро перебирай стопами на месте",
      "Оставайся низко, руки в лёгкой защите",
    ],
    "fullbody",
    ["calves", "quads", "abs"],
    1,
    ["4 × 20 sec", "4 × 20 сек"],
    "fastfeet",
    120,
    20,
  ),
  ex(
    "burpee",
    ["Burpee", "Бёрпи"],
    [
      "The whole-body gas-tank test. Nothing builds fight conditioning faster.",
      "Тест бензобака всего тела. Ничто не строит бойцовскую выносливость быстрее.",
    ],
    [
      "Squat down, hands to the floor",
      "Kick back to plank, chest to floor",
      "Snap the feet in and jump with hands up",
    ],
    [
      "Присядь, ладони на пол",
      "Выкинь ноги назад в планку, грудь к полу",
      "Верни стопы и выпрыгни вверх с руками",
    ],
    "fullbody",
    ["chest", "quads", "abs", "shoulders", "glutes"],
    2,
    ["5 × 10 reps", "5 × 10 повторений"],
    "burpee",
    140,
    45,
  ),
  ex(
    "sprawls",
    ["Sprawls", "Спрол"],
    [
      "The burpee's fighting cousin — hips down, no jump, straight back up.",
      "Боевой родственник бёрпи — таз вниз, без прыжка, сразу обратно в стойку.",
    ],
    [
      "Drop the hands and kick the legs back",
      "Hips drop low toward the floor",
      "Snap back up to the stance immediately",
    ],
    [
      "Брось руки на пол и выкинь ноги назад",
      "Таз опускается низко к полу",
      "Мгновенно вернись в стойку",
    ],
    "fullbody",
    ["quads", "abs", "shoulders", "glutes"],
    2,
    ["4 × 8–12 reps", "4 × 8–12 повторений"],
    "sprawl",
    125,
    40,
  ),
  ex(
    "skater-jumps",
    ["Skater Jumps", "Прыжки конькобежца"],
    [
      "Side-to-side bounds — lateral explosiveness for angles and slips.",
      "Прыжки из стороны в сторону — боковая взрывность для углов и уклонов.",
    ],
    [
      "Bound sideways onto one leg",
      "Free leg sweeps behind, arms counter-swing",
      "Stick the landing, then explode the other way",
    ],
    [
      "Прыгни вбок на одну ногу",
      "Свободная нога уходит за опорную, руки в противоход",
      "Зафиксируй приземление и взорвись в другую сторону",
    ],
    "fullbody",
    ["quads", "glutes", "calves", "abs"],
    2,
    ["4 × 20–30 sec", "4 × 20–30 сек"],
    "skater",
    120,
    30,
  ),
  ex(
    "tuck-jumps",
    ["Tuck Jumps", "Прыжки с подтягиванием коленей"],
    [
      "Knees to chest mid-air — maximum spring, maximum intent.",
      "Колени к груди в воздухе — максимум пружины, максимум решимости.",
    ],
    [
      "Quarter squat, arms loaded back",
      "Jump and pull both knees to the chest",
      "Land soft, reset, repeat",
    ],
    [
      "Четверть-присед, руки заряжены назад",
      "Выпрыгни и подтяни оба колена к груди",
      "Мягкое приземление, сброс, повтор",
    ],
    "fullbody",
    ["quads", "glutes", "calves", "abs"],
    3,
    ["3 × 6–10 reps", "3 × 6–10 повторений"],
    "tuckjump",
    140,
    30,
  ),
  ex(
    "bear-crawl",
    ["Bear Crawl", "Медвежья походка"],
    [
      "Crawl with knees hovering — shoulders, core and coordination under fatigue.",
      "Ползание с коленями над полом — плечи, кор и координация под усталостью.",
    ],
    [
      "On all fours, knees an inch off the floor",
      "Move opposite hand and foot together",
      "Hips low and level, small steps",
    ],
    [
      "На четвереньках, колени в паре сантиметров над полом",
      "Двигай противоположные руку и ногу вместе",
      "Таз низко и ровно, маленькие шаги",
    ],
    "fullbody",
    ["shoulders", "abs", "quads", "obliques"],
    2,
    ["3 × 20–30 sec", "3 × 20–30 сек"],
    "bearcrawl",
    100,
    30,
  ),
  ex(
    "inchworm",
    ["Inchworm", "Гусеница"],
    [
      "Walk out to a plank and back — hamstrings, shoulders and core in one flow.",
      "Прошагай руками в планку и обратно — бицепс бедра, плечи и кор в одном движении.",
    ],
    [
      "Fold forward, hands to the floor",
      "Walk the hands out to a plank",
      "Walk them back and stand tall",
    ],
    [
      "Наклонись, ладони на пол",
      "Прошагай руками вперёд до планки",
      "Прошагай обратно и выпрямись",
    ],
    "fullbody",
    ["hamstrings", "shoulders", "abs"],
    1,
    ["3 × 6–10 reps", "3 × 6–10 повторений"],
    "inchworm",
    70,
    45,
  ),
];

/* --------------------------------------------------------------------------
   filtering — what can this profile actually do?
   (everything is bodyweight today, so everyone gets the full catalog;
   kept for when equipment work returns)
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
