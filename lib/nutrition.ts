/* ===========================================================================
   RINGBORNN — nutrition guidance engine (locale-aware, key-optional).
   `localNutrition` turns body stats + goal + budget into a full day of meals
   with calorie/macro targets. The /api/nutrition route returns this exact
   shape from Claude when a key is present, so the page is engine-agnostic.
   =========================================================================== */

import { type Profile } from "./onboarding";
import { macroTargets, type Macros } from "./tracking";

export type Locale = "en" | "ru";
export type Slot = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealRec {
  slot: Slot;
  title: string;
  detail: string;
  kcal: number;
  protein: number;
}

export interface NutritionPlan {
  macros: Macros;
  meals: MealRec[];
  tips: string[];
  headline: string;
  source: "local" | "ai";
}

type Diet = "cut" | "build" | "maintain";
type Budget = "full" | "moderate" | "tight" | "minimal";

function dietOf(p: Profile): Diet {
  if (p.goals.includes("lose_fat")) return "cut";
  if (p.goals.includes("build") || p.goals.includes("strength")) return "build";
  return "maintain";
}
function budgetOf(p: Profile): Budget {
  const b = p.nutritionAccess;
  return b === "full" || b === "moderate" || b === "tight" || b === "minimal"
    ? b
    : "moderate";
}

/* slot share of the day's energy */
const SPLIT: Record<Slot, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

/* meal ideas keyed by slot → diet → budget, EN/RU.
   Higher budgets get leaner proteins; tighter budgets lean on eggs, dairy,
   legumes, oats and tinned fish — cheap protein that still fuels training. */
type Text = { en: string; ru: string };
type SlotTable = Record<Diet, Record<Budget, { title: Text; detail: Text }>>;

const MEALS: Record<Slot, SlotTable> = {
  breakfast: {
    cut: {
      full: {
        title: { en: "Egg-white omelette & berries", ru: "Омлет из белков и ягоды" },
        detail: {
          en: "4 egg whites + 1 whole egg, spinach, a handful of berries, black coffee.",
          ru: "4 белка + 1 целое яйцо, шпинат, горсть ягод, чёрный кофе.",
        },
      },
      moderate: {
        title: { en: "Greek yogurt & oats", ru: "Греческий йогурт с овсянкой" },
        detail: {
          en: "200g low-fat Greek yogurt, 40g oats, cinnamon, half a banana.",
          ru: "200 г нежирного греческого йогурта, 40 г овсянки, корица, полбанана.",
        },
      },
      tight: {
        title: { en: "Eggs & oats", ru: "Яйца и овсянка" },
        detail: {
          en: "2 boiled eggs + 40g oats cooked on water with cinnamon.",
          ru: "2 варёных яйца + 40 г овсянки на воде с корицей.",
        },
      },
      minimal: {
        title: { en: "Boiled eggs & tea", ru: "Варёные яйца и чай" },
        detail: {
          en: "3 boiled eggs, a slice of bread, unsweetened tea.",
          ru: "3 варёных яйца, ломтик хлеба, несладкий чай.",
        },
      },
    },
    build: {
      full: {
        title: { en: "Big protein oats", ru: "Большая белковая овсянка" },
        detail: {
          en: "80g oats, whey scoop, whole milk, peanut butter, banana.",
          ru: "80 г овсянки, скуп протеина, цельное молоко, арахисовая паста, банан.",
        },
      },
      moderate: {
        title: { en: "Eggs, oats & milk", ru: "Яйца, овсянка и молоко" },
        detail: {
          en: "3 whole eggs, 60g oats, a glass of milk, honey.",
          ru: "3 целых яйца, 60 г овсянки, стакан молока, мёд.",
        },
      },
      tight: {
        title: { en: "Egg & oat bowl", ru: "Яйца с овсянкой" },
        detail: {
          en: "3 eggs, 60g oats on milk, banana — cheap mass-builder.",
          ru: "3 яйца, 60 г овсянки на молоке, банан — дешёвый набор массы.",
        },
      },
      minimal: {
        title: { en: "Eggs, bread & milk", ru: "Яйца, хлеб и молоко" },
        detail: {
          en: "3 eggs, 2 slices of bread, a glass of milk.",
          ru: "3 яйца, 2 ломтика хлеба, стакан молока.",
        },
      },
    },
    maintain: {
      full: {
        title: { en: "Omelette & avocado toast", ru: "Омлет и тост с авокадо" },
        detail: {
          en: "3-egg omelette, wholegrain toast, quarter avocado.",
          ru: "Омлет из 3 яиц, цельнозерновой тост, четверть авокадо.",
        },
      },
      moderate: {
        title: { en: "Oats & yogurt", ru: "Овсянка и йогурт" },
        detail: {
          en: "50g oats, 150g yogurt, fruit, a few nuts.",
          ru: "50 г овсянки, 150 г йогурта, фрукт, немного орехов.",
        },
      },
      tight: {
        title: { en: "Eggs & oats", ru: "Яйца и овсянка" },
        detail: {
          en: "2–3 eggs, 50g oats, a piece of fruit.",
          ru: "2–3 яйца, 50 г овсянки, фрукт.",
        },
      },
      minimal: {
        title: { en: "Eggs & bread", ru: "Яйца и хлеб" },
        detail: {
          en: "2 eggs, 2 slices of bread, tea.",
          ru: "2 яйца, 2 ломтика хлеба, чай.",
        },
      },
    },
  },
  lunch: {
    cut: {
      full: {
        title: { en: "Grilled chicken & greens", ru: "Курица гриль и зелень" },
        detail: {
          en: "150g chicken breast, big salad, 60g (dry) rice, olive oil.",
          ru: "150 г куриной грудки, большой салат, 60 г риса (сухого), оливковое масло.",
        },
      },
      moderate: {
        title: { en: "Chicken & rice bowl", ru: "Курица с рисом" },
        detail: {
          en: "150g chicken, 60g rice, mixed veg, soy sauce.",
          ru: "150 г курицы, 60 г риса, овощи, соевый соус.",
        },
      },
      tight: {
        title: { en: "Tuna & rice", ru: "Тунец с рисом" },
        detail: {
          en: "1 tin of tuna, 60g rice, tomato and onion.",
          ru: "1 банка тунца, 60 г риса, помидор и лук.",
        },
      },
      minimal: {
        title: { en: "Lentils & rice", ru: "Чечевица с рисом" },
        detail: {
          en: "Lentil–rice bowl with onion — cheap complete protein.",
          ru: "Чечевица с рисом и луком — дешёвый полноценный белок.",
        },
      },
    },
    build: {
      full: {
        title: { en: "Steak & potatoes", ru: "Стейк с картофелем" },
        detail: {
          en: "180g lean beef, 250g potatoes, salad, olive oil.",
          ru: "180 г нежирной говядины, 250 г картофеля, салат, оливковое масло.",
        },
      },
      moderate: {
        title: { en: "Chicken, rice & beans", ru: "Курица, рис и фасоль" },
        detail: {
          en: "180g chicken, 90g rice, beans, veg.",
          ru: "180 г курицы, 90 г риса, фасоль, овощи.",
        },
      },
      tight: {
        title: { en: "Eggs, rice & beans", ru: "Яйца, рис и фасоль" },
        detail: {
          en: "3 eggs, 90g rice, a cup of beans.",
          ru: "3 яйца, 90 г риса, чашка фасоли.",
        },
      },
      minimal: {
        title: { en: "Rice, beans & egg", ru: "Рис, фасоль и яйцо" },
        detail: {
          en: "Big rice-and-beans plate topped with 2 eggs.",
          ru: "Большая тарелка риса с фасолью и 2 яйцами сверху.",
        },
      },
    },
    maintain: {
      full: {
        title: { en: "Salmon & quinoa", ru: "Лосось и киноа" },
        detail: {
          en: "150g salmon, quinoa, roasted veg.",
          ru: "150 г лосося, киноа, запечённые овощи.",
        },
      },
      moderate: {
        title: { en: "Chicken wrap", ru: "Ролл с курицей" },
        detail: {
          en: "Chicken, wholegrain wrap, salad, yogurt sauce.",
          ru: "Курица, цельнозерновая лепёшка, салат, йогуртовый соус.",
        },
      },
      tight: {
        title: { en: "Tuna pasta", ru: "Паста с тунцом" },
        detail: {
          en: "Tuna, 80g pasta, tomato sauce, veg.",
          ru: "Тунец, 80 г пасты, томатный соус, овощи.",
        },
      },
      minimal: {
        title: { en: "Rice & lentils", ru: "Рис и чечевица" },
        detail: {
          en: "Rice, lentils, whatever veg is on hand.",
          ru: "Рис, чечевица, любые доступные овощи.",
        },
      },
    },
  },
  dinner: {
    cut: {
      full: {
        title: { en: "White fish & veg", ru: "Белая рыба и овощи" },
        detail: {
          en: "180g white fish, large plate of roasted vegetables.",
          ru: "180 г белой рыбы, большая тарелка запечённых овощей.",
        },
      },
      moderate: {
        title: { en: "Turkey & salad", ru: "Индейка и салат" },
        detail: {
          en: "150g turkey or chicken, big salad, small potato.",
          ru: "150 г индейки или курицы, большой салат, маленькая картофелина.",
        },
      },
      tight: {
        title: { en: "Eggs & veg", ru: "Яйца и овощи" },
        detail: {
          en: "3-egg scramble with lots of vegetables.",
          ru: "Яичница из 3 яиц с большим количеством овощей.",
        },
      },
      minimal: {
        title: { en: "Bean soup", ru: "Фасолевый суп" },
        detail: {
          en: "Bean-and-vegetable soup, a slice of bread.",
          ru: "Суп из фасоли и овощей, ломтик хлеба.",
        },
      },
    },
    build: {
      full: {
        title: { en: "Chicken pasta", ru: "Паста с курицей" },
        detail: {
          en: "180g chicken, 100g pasta, tomato sauce, cheese.",
          ru: "180 г курицы, 100 г пасты, томатный соус, сыр.",
        },
      },
      moderate: {
        title: { en: "Beef & rice", ru: "Говядина с рисом" },
        detail: {
          en: "150g beef mince, 90g rice, veg.",
          ru: "150 г говяжьего фарша, 90 г риса, овощи.",
        },
      },
      tight: {
        title: { en: "Chicken thighs & potato", ru: "Куриные бёдра и картофель" },
        detail: {
          en: "Chicken thighs (cheap cut), potatoes, veg.",
          ru: "Куриные бёдра (дешёвая часть), картофель, овощи.",
        },
      },
      minimal: {
        title: { en: "Potato & egg hash", ru: "Картофель с яйцом" },
        detail: {
          en: "Fried potatoes with 3 eggs and onion.",
          ru: "Жареный картофель с 3 яйцами и луком.",
        },
      },
    },
    maintain: {
      full: {
        title: { en: "Chicken stir-fry", ru: "Курица стир-фрай" },
        detail: {
          en: "150g chicken, rice, mixed vegetables, sesame oil.",
          ru: "150 г курицы, рис, овощи, кунжутное масло.",
        },
      },
      moderate: {
        title: { en: "Fish & potatoes", ru: "Рыба и картофель" },
        detail: {
          en: "Baked fish, potatoes, green vegetables.",
          ru: "Запечённая рыба, картофель, зелёные овощи.",
        },
      },
      tight: {
        title: { en: "Egg fried rice", ru: "Рис с яйцом" },
        detail: {
          en: "Rice fried with 2 eggs, peas and carrots.",
          ru: "Рис, обжаренный с 2 яйцами, горошком и морковью.",
        },
      },
      minimal: {
        title: { en: "Lentil stew", ru: "Рагу из чечевицы" },
        detail: {
          en: "Lentil-and-potato stew, bread.",
          ru: "Рагу из чечевицы и картофеля, хлеб.",
        },
      },
    },
  },
  snack: {
    cut: {
      full: {
        title: { en: "Cottage cheese & fruit", ru: "Творог и фрукт" },
        detail: { en: "150g low-fat cottage cheese, an apple.", ru: "150 г нежирного творога, яблоко." },
      },
      moderate: {
        title: { en: "Yogurt & nuts", ru: "Йогурт и орехи" },
        detail: { en: "150g yogurt, a small handful of nuts.", ru: "150 г йогурта, небольшая горсть орехов." },
      },
      tight: {
        title: { en: "Boiled egg & fruit", ru: "Варёное яйцо и фрукт" },
        detail: { en: "1–2 boiled eggs and a piece of fruit.", ru: "1–2 варёных яйца и фрукт." },
      },
      minimal: {
        title: { en: "Apple & tea", ru: "Яблоко и чай" },
        detail: { en: "A piece of fruit and unsweetened tea.", ru: "Фрукт и несладкий чай." },
      },
    },
    build: {
      full: {
        title: { en: "Protein shake & banana", ru: "Протеин и банан" },
        detail: { en: "Whey shake, banana, tablespoon of peanut butter.", ru: "Протеин, банан, ложка арахисовой пасты." },
      },
      moderate: {
        title: { en: "Milk & nuts", ru: "Молоко и орехи" },
        detail: { en: "A glass of milk, handful of nuts, dried fruit.", ru: "Стакан молока, горсть орехов, сухофрукты." },
      },
      tight: {
        title: { en: "Peanut butter toast", ru: "Тост с арахисовой пастой" },
        detail: { en: "2 slices of bread with peanut butter, milk.", ru: "2 ломтика хлеба с арахисовой пастой, молоко." },
      },
      minimal: {
        title: { en: "Bread & milk", ru: "Хлеб и молоко" },
        detail: { en: "Bread with jam and a glass of milk.", ru: "Хлеб с джемом и стакан молока." },
      },
    },
    maintain: {
      full: {
        title: { en: "Fruit & nuts", ru: "Фрукты и орехи" },
        detail: { en: "A piece of fruit and a small handful of nuts.", ru: "Фрукт и небольшая горсть орехов." },
      },
      moderate: {
        title: { en: "Yogurt", ru: "Йогурт" },
        detail: { en: "A pot of yogurt with some fruit.", ru: "Порция йогурта с фруктами." },
      },
      tight: {
        title: { en: "Banana & milk", ru: "Банан и молоко" },
        detail: { en: "A banana and a glass of milk.", ru: "Банан и стакан молока." },
      },
      minimal: {
        title: { en: "Fruit", ru: "Фрукт" },
        detail: { en: "Whatever fruit is available.", ru: "Любой доступный фрукт." },
      },
    },
  },
};

const HEADLINES: Record<Diet, Text> = {
  cut: {
    en: "Fuel the work, strip the fat.",
    ru: "Питай работу, сгоняй жир.",
  },
  build: {
    en: "Eat to build — protein and honest carbs.",
    ru: "Ешь, чтобы расти — белок и правильные углеводы.",
  },
  maintain: {
    en: "Eat around maintenance and train hard.",
    ru: "Держись у поддержки и тренируйся жёстко.",
  },
};

function tipsFor(diet: Diet, budget: Budget, L: Locale): string[] {
  const en = L !== "ru";
  const out: string[] = [];
  out.push(
    diet === "cut"
      ? en
        ? "Keep a modest deficit — aim to lose fat slowly so your training doesn't suffer."
        : "Держи умеренный дефицит — теряй жир медленно, чтобы не проседала тренировка."
      : diet === "build"
        ? en
          ? "Small surplus on training days; most of it around your session."
          : "Небольшой профицит в дни тренировок; большую часть — вокруг занятия."
        : en
          ? "Eat enough to train hard and recover — don't undercut your energy."
          : "Ешь достаточно, чтобы жёстко тренироваться и восстанавливаться.",
  );
  out.push(
    en
      ? "Hit your protein target every day — split it across all your meals."
      : "Каждый день добирай белок — распределяй его по всем приёмам пищи.",
  );
  if (budget === "tight" || budget === "minimal") {
    out.push(
      en
        ? "Cheapest quality protein: eggs, milk, tinned fish, lentils, beans, oats."
        : "Самый дешёвый качественный белок: яйца, молоко, консервированная рыба, чечевица, фасоль, овсянка.",
    );
  } else {
    out.push(
      en
        ? "Build each plate around a palm of protein, a fist of carbs and plenty of veg."
        : "Собирай тарелку из ладони белка, кулака углеводов и большого объёма овощей.",
    );
  }
  out.push(
    en
      ? "Drink water through the day and sleep 7–9 hours — recovery is where you grow."
      : "Пей воду в течение дня и спи 7–9 часов — рост происходит в восстановлении.",
  );
  return out;
}

export function localNutrition(profile: Profile, locale: Locale = "en"): NutritionPlan {
  const L = locale === "ru" ? "ru" : "en";
  const macros = macroTargets(profile);
  const diet = dietOf(profile);
  const budget = budgetOf(profile);

  const slots: Slot[] = ["breakfast", "lunch", "dinner", "snack"];
  const meals: MealRec[] = slots.map((slot) => {
    const tpl = MEALS[slot][diet][budget];
    const kcal = Math.round((macros.kcal * SPLIT[slot]) / 10) * 10;
    const protein = Math.round(macros.protein * SPLIT[slot]);
    return { slot, title: tpl.title[L], detail: tpl.detail[L], kcal, protein };
  });

  return {
    macros,
    meals,
    tips: tipsFor(diet, budget, L),
    headline: HEADLINES[diet][L],
    source: "local",
  };
}

/* Client helper: try the Claude-backed route, fall back to the local engine.
   Works today (no key → route returns local); no UI change when a key lands. */
export async function requestNutrition(
  profile: Profile,
  locale: Locale = "en",
): Promise<NutritionPlan> {
  try {
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const data = (await res.json()) as Partial<NutritionPlan>;
      if (data && Array.isArray(data.meals) && data.macros) {
        return data as NutritionPlan;
      }
    }
  } catch {
    /* offline / no route — fall through to local */
  }
  return localNutrition(profile, locale);
}
