/* ===========================================================================
   RINGBORNN — Technique Check data.
   A small set of core techniques, each with a quick self-assessment checklist
   (things a fighter can honestly tick off between sessions) and a 3D demo
   preset for reference. The same list drives the AI video review — the chosen
   technique's name + checklist are sent to the model as the rubric.
   =========================================================================== */

import type { DemoPreset } from "./exercises";

export interface I18n {
  en: string;
  ru: string;
}

export interface Technique {
  id: string;
  name: I18n;
  cue: I18n; // one-line "the point of it"
  demo: DemoPreset;
  checklist: I18n[]; // honest form points to self-assess
}

export const TECHNIQUES: Technique[] = [
  {
    id: "jab",
    name: { en: "Jab", ru: "Джеб" },
    cue: {
      en: "The range-finder — fast, straight, back to guard.",
      ru: "Измеритель дистанции — быстрый, прямой, назад в защиту.",
    },
    demo: "jab",
    checklist: [
      { en: "Chin tucked, rear hand glued to the cheek", ru: "Подбородок опущен, задняя рука у щеки" },
      { en: "Punch travels straight — no looping or dropping", ru: "Удар идёт прямо — без замаха и провисания" },
      { en: "Fist turns over at the end, knuckles horizontal", ru: "Кулак проворачивается в конце, костяшки горизонтально" },
      { en: "Exhale sharply on contact", ru: "Резкий выдох в момент удара" },
      { en: "Hand snaps straight back to guard", ru: "Рука мгновенно возвращается в защиту" },
    ],
  },
  {
    id: "cross",
    name: { en: "Cross", ru: "Кросс" },
    cue: {
      en: "Rear-hand power — it comes from the ground up.",
      ru: "Сила задней руки — рождается от пола вверх.",
    },
    demo: "jab",
    checklist: [
      { en: "Rear heel pivots, hip rotates through the shot", ru: "Задняя пятка проворачивается, бедро идёт в удар" },
      { en: "Rear shoulder finishes by the chin", ru: "Заднее плечо в конце у подбородка" },
      { en: "Lead hand stays up on defense", ru: "Передняя рука остаётся вверху в защите" },
      { en: "Weight shifts front, but balance stays centered", ru: "Вес переходит вперёд, но баланс сохраняется" },
      { en: "Full extension, then recoil — don't leave it out", ru: "Полное разгибание, затем возврат — не оставляй руку" },
    ],
  },
  {
    id: "hook",
    name: { en: "Lead Hook", ru: "Передний хук" },
    cue: {
      en: "Short-range torque — the whole body turns.",
      ru: "Момент ближней дистанции — поворачивается всё тело.",
    },
    demo: "hook",
    checklist: [
      { en: "Elbow raised to roughly 90°, wrist locked", ru: "Локоть поднят примерно на 90°, запястье жёсткое" },
      { en: "Lead foot pivots, knee and hip turn in", ru: "Передняя стопа проворачивается, колено и бедро внутрь" },
      { en: "Power comes from rotation, not the arm", ru: "Сила от вращения, а не от руки" },
      { en: "Rear hand protects the chin the whole time", ru: "Задняя рука всё время защищает подбородок" },
      { en: "Return to stance, don't swing past the target", ru: "Возврат в стойку, не проноси руку за цель" },
    ],
  },
  {
    id: "uppercut",
    name: { en: "Uppercut", ru: "Апперкот" },
    cue: {
      en: "Rises from the legs, up through the centre.",
      ru: "Поднимается из ног, вверх по центру.",
    },
    demo: "uppercut",
    checklist: [
      { en: "Slight dip in the knees to load the shot", ru: "Лёгкий присед в коленях, чтобы зарядить удар" },
      { en: "Drive up with the legs, not just the arm", ru: "Толчок ногами, а не только рукой" },
      { en: "Palm faces you, elbow stays bent", ru: "Ладонь к себе, локоть остаётся согнутым" },
      { en: "Short path — no big wind-up dropping the hand", ru: "Короткая траектория — без замаха с опусканием руки" },
      { en: "Guard resets immediately after", ru: "Защита сразу возвращается" },
    ],
  },
  {
    id: "guard",
    name: { en: "Stance & Guard", ru: "Стойка и защита" },
    cue: {
      en: "Everything is built on the base — get it right.",
      ru: "Всё строится на базе — выстрой её правильно.",
    },
    demo: "footwork",
    checklist: [
      { en: "Feet shoulder-width, lead foot forward, angled", ru: "Стопы на ширине плеч, передняя нога вперёд, под углом" },
      { en: "Knees soft, weight on the balls of the feet", ru: "Колени мягкие, вес на носках" },
      { en: "Hands high, elbows tucked to the ribs", ru: "Руки высоко, локти прижаты к рёбрам" },
      { en: "Chin down, eyes up over the gloves", ru: "Подбородок вниз, взгляд поверх перчаток" },
      { en: "Relaxed — not stiff or hunched", ru: "Расслаблен — без зажатости и сутулости" },
    ],
  },
  {
    id: "footwork",
    name: { en: "Footwork", ru: "Работа ног" },
    cue: {
      en: "Step and drag — never cross, never bounce flat.",
      ru: "Шаг и подтяжка — не скрещивай, не прыгай на плоской стопе.",
    },
    demo: "footwork",
    checklist: [
      { en: "Push off the trailing foot, step with the lead", ru: "Толчок задней стопой, шаг передней" },
      { en: "Feet never cross or click together", ru: "Стопы не скрещиваются и не сходятся" },
      { en: "Stance width stays the same after each step", ru: "Ширина стойки не меняется после каждого шага" },
      { en: "Stay light on the balls of the feet", ru: "Оставайся лёгким на носках" },
      { en: "Head stays level — no bobbing up and down", ru: "Голова на одном уровне — без подпрыгиваний" },
    ],
  },
];

export function techniqueById(id: string): Technique | undefined {
  return TECHNIQUES.find((t) => t.id === id);
}
