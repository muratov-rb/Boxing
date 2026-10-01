/* Search titles and descriptions, per language.

   Kept here rather than in messages/*.json: the whole message catalogue is
   inlined into every page's HTML for the client, and these strings are only
   ever read on the server to build <head>. Same reason the legal pages keep
   their text in the page files.

   Who sees which language: the locale comes from the visitor's cookie, so
   Google (no cookie) always gets English. The other languages show in the
   browser tab and bookmarks of someone who switched language. Getting them
   into search needs a URL per language, which the site does not have yet.

   Keep titles under ~60 characters so the brand at the end isn't cut off,
   and descriptions under ~160. Russian names the Budget plan «Бюджет», like
   the rest of the Russian UI; the other languages keep "Budget". */

type Copy = { title: string; description: string; ogTitle: string; ogDescription: string };
type PageCopy = { title: string; description: string };

const HOME: Record<string, Copy> = {
  en: {
    title: "Learn Boxing: Lessons, Workouts & AI Coach | RingBornn",
    description:
      "Learn boxing step by step: jab, cross, hooks, footwork and defense, plus home or gym workouts, AI training plans and nutrition. 7-day free trial, no card.",
    ogTitle: "RingBornn — Learn Boxing: Lessons, Workouts & AI Coach",
    ogDescription:
      "Boxing technique step by step, home or gym workouts, AI training plans and nutrition. 7-day free trial, no card.",
  },
  ru: {
    title: "Уроки бокса: техника, тренировки и ИИ-тренер | RingBornn",
    description:
      "Учись боксу шаг за шагом: джеб, кросс, хуки, работа ног и защита, тренировки дома или в зале, ИИ-планы и питание. 7 дней бесплатно, без карты.",
    ogTitle: "RingBornn — уроки бокса, тренировки и ИИ-тренер",
    ogDescription:
      "Техника бокса шаг за шагом, тренировки дома или в зале, ИИ-планы и питание. 7 дней бесплатно, без карты.",
  },
  es: {
    title: "Aprende boxeo: clases, entrenos y coach IA | RingBornn",
    description:
      "Aprende boxeo paso a paso: jab, cross, ganchos, juego de pies y defensa, entrenos en casa o en el gimnasio, planes con IA y nutrición. 7 días gratis, sin tarjeta.",
    ogTitle: "RingBornn — Aprende boxeo: clases, entrenos y coach IA",
    ogDescription:
      "Técnica de boxeo paso a paso, entrenos en casa o en el gimnasio, planes con IA y nutrición. 7 días gratis, sin tarjeta.",
  },
  fr: {
    title: "Apprends la boxe : cours, séances et coach IA | RingBornn",
    description:
      "Apprends la boxe étape par étape : jab, direct, crochets, jeu de jambes et défense, séances à la maison ou en salle, plans IA et nutrition. 7 jours gratuits, sans carte.",
    ogTitle: "RingBornn — Apprends la boxe : cours, séances et coach IA",
    ogDescription:
      "La technique de boxe étape par étape, séances à la maison ou en salle, plans IA et nutrition. 7 jours gratuits, sans carte.",
  },
  zh: {
    title: "学拳击：课程、训练与 AI 教练 | RingBornn",
    description:
      "一步步学拳击：刺拳、直拳、勾拳、步法与防守，居家或健身房训练，AI 训练计划与营养建议。7 天免费试用，无需绑卡。",
    ogTitle: "RingBornn — 学拳击：课程、训练与 AI 教练",
    ogDescription: "一步步学拳击技术，居家或健身房训练，AI 训练计划与营养建议。7 天免费试用，无需绑卡。",
  },
};

const PLANS: Record<string, PageCopy> = {
  en: {
    title: "Plans & Pricing — RingBornn",
    description:
      "Compare RingBornn's Budget, Pro and Max plans, monthly or yearly. Every account starts with a 7-day free trial, no card needed.",
  },
  ru: {
    title: "Тарифы и цены — RingBornn",
    description:
      "Сравни тарифы RingBornn «Бюджет», Pro и Max, помесячно или на год. Каждый аккаунт начинается с 7 дней бесплатно, без карты.",
  },
  es: {
    title: "Planes y precios — RingBornn",
    description:
      "Compara los planes Budget, Pro y Max de RingBornn, mensuales o anuales. Toda cuenta empieza con 7 días de prueba gratis, sin tarjeta.",
  },
  fr: {
    title: "Formules et tarifs — RingBornn",
    description:
      "Compare les formules Budget, Pro et Max de RingBornn, au mois ou à l'année. Chaque compte commence par 7 jours d'essai gratuit, sans carte.",
  },
  zh: {
    title: "套餐与价格 — RingBornn",
    description: "比较 RingBornn 的 Budget、Pro 和 Max 套餐，按月或按年付费。每个账户都从 7 天免费试用开始，无需绑卡。",
  },
};

export const homeCopy = (locale: string): Copy => HOME[locale] ?? HOME.en;
export const plansCopy = (locale: string): PageCopy => PLANS[locale] ?? PLANS.en;
