/* Builds lib/food-db.ts from USDA FoodData Central, SR Legacy.

   1. Download the "SR Legacy" CSV release (April 2018, about 6 MB) from
      https://fdc.nal.usda.gov/download-datasets and unzip it anywhere outside
      the repo.
   2. node scripts/build-food-db.mjs <path to the unzipped folder>
      Add --review to print the picks without writing the file.

   Each target below resolves to exactly one USDA entry. The build fails if any
   target finds nothing, so a typo cannot quietly drop a food. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const review = args.includes("--review");
const dir = args.find((a) => !a.startsWith("--"));
if (!dir || !fs.existsSync(path.join(dir, "food.csv"))) {
  console.error("usage: node scripts/build-food-db.mjs <folder holding food.csv and food_nutrient.csv> [--review]");
  process.exit(1);
}

const csv = (file) =>
  fs.readFileSync(path.join(dir, file), "utf8").split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
      } else if (ch === "," && !quoted) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out;
  });

const foods = new Map();
for (const [id, , desc] of csv("food.csv")) foods.set(id, { id: +id, desc });
// FoodData Central nutrient ids
const WANT = { 1008: "kcal", 1003: "protein", 1004: "fat", 1005: "carbs", 1079: "fiber" };
for (const [, fdc, nutrient, amount] of csv("food_nutrient.csv")) {
  const field = WANT[nutrient];
  if (field && foods.has(fdc)) foods.get(fdc)[field] = +amount;
}
const all = [...foods.values()];

/* key: [words that must all appear, words that must not appear]. The shortest
   matching description wins, so the plainest entry is chosen. A string in
   place of the arrays means "this exact description".

   The key is what the meal scanner is shown, so it has to say the cooking
   state wherever that changes the numbers: cooked rice is 130 kcal per 100 g
   and dry rice is 365. */
const TARGETS = {
  // grains and starches
  rice_white_cooked: [["rice, white, long-grain, regular", "cooked", "enriched"], ["parboiled", "salt", "instant"]],
  rice_brown_cooked: [["rice, brown, long-grain, cooked"], []],
  pasta_cooked: [["pasta, cooked, enriched, without added salt"], ["whole", "gluten"]],
  noodles_egg_cooked: "Noodles, egg, enriched, cooked",
  buckwheat_cooked: [["buckwheat groats, roasted, cooked"], []],
  oatmeal_cooked: [["oats", "cooked with water", "regular and quick", "unenriched"], ["with salt", "instant"]],
  quinoa_cooked: [["quinoa, cooked"], []],
  couscous_cooked: [["couscous, cooked"], []],
  bulgur_cooked: [["bulgur, cooked"], []],
  bread_white: [["bread, white, commercially prepared"], ["toasted", "low sodium", "no salt"]],
  bread_whole_wheat: [["bread, whole-wheat, commercially prepared"], ["toasted"]],
  bread_rye: [["bread, rye"], ["toasted", "reduced"]],
  tortilla_flour: "Tortillas, ready-to-bake or -fry, flour, refrigerated",
  bagel_plain: [["bagels, plain, enriched, with calcium propionate"], ["toasted"]],
  croissant: [["croissants, butter"], []],
  pancake: [["pancakes, plain, prepared from recipe"], []],
  granola: [["granola", "homemade"], []],
  // potatoes
  potato_boiled: [["potatoes, boiled, cooked without skin, flesh, without salt"], []],
  potato_baked: [["potatoes, baked, flesh and skin, without salt"], ["russet", "red", "white"]],
  potato_mashed: [["potatoes, mashed, home-prepared, whole milk and butter added"], []],
  french_fries: [["fast foods, potato, french fried in vegetable oil"], []],
  sweet_potato_baked: [["sweet potato, cooked, baked in skin, flesh, without salt"], []],
  // poultry and meat
  chicken_breast_cooked: [["chicken, broilers or fryers, breast, meat only, cooked, roasted"], []],
  chicken_thigh_cooked: [["chicken, broilers or fryers, thigh, meat only, cooked, roasted"], []],
  chicken_drumstick_cooked: "Chicken, broilers or fryers, dark meat, drumstick, meat only, cooked, roasted",
  chicken_wing_cooked: [["chicken, broilers or fryers, wing, meat and skin, cooked, roasted"], []],
  chicken_fried: [["chicken, broilers or fryers, breast, meat and skin, cooked, fried, flour"], []],
  turkey_breast_cooked: [["turkey", "breast, meat only, cooked, roasted"], ["retail", "enhanced", "fryer"]],
  beef_ground_cooked: [["beef, ground, 85% lean meat / 15% fat, patty, cooked, pan-broiled"], []],
  beef_steak_cooked: [['beef, top sirloin, steak, separable lean and fat, trimmed to 1/8" fat, all grades, cooked, broiled'], []],
  beef_stew_meat_cooked: "Beef, chuck for stew, separable lean and fat, all grades, cooked, braised",
  lamb_cooked: 'Lamb, leg, whole (shank and sirloin), separable lean and fat, trimmed to 1/4" fat, choice, cooked, roasted',
  pork_chop_cooked: [["pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, cooked, broiled"], []],
  bacon_cooked: "Pork, cured, bacon, cooked, baked",
  ham_sliced: [["ham, sliced, regular (approximately 11% fat)"], []],
  sausage_pork_cooked: "Pork sausage, link/patty, cooked, pan-fried",
  hot_dog_beef: "Frankfurter, beef, heated",
  // fish and seafood
  salmon_cooked: [["fish, salmon, atlantic, farmed, cooked, dry heat"], []],
  tuna_canned: [["fish, tuna, light, canned in water, drained solids"], ["without salt"]],
  cod_cooked: [["fish, cod, atlantic, cooked, dry heat"], []],
  tilapia_cooked: [["fish, tilapia, cooked, dry heat"], []],
  shrimp_cooked: "Crustaceans, shrimp, cooked",
  // eggs and dairy
  egg_boiled: [["egg, whole, cooked, hard-boiled"], []],
  egg_fried: [["egg, whole, cooked, fried"], []],
  egg_scrambled: [["egg, whole, cooked, scrambled"], []],
  omelet: [["egg, whole, cooked, omelet"], []],
  milk_whole: [["milk, whole, 3.25% milkfat, with added vitamin d"], []],
  milk_2_percent: [["milk, reduced fat, fluid, 2% milkfat, with added vitamin a and vitamin d"], ["nonfat milk solids", "protein fortified"]],
  milk_skim: [["milk, nonfat, fluid, with added vitamin a and vitamin d (fat free or skim)"], []],
  yogurt_plain: [["yogurt, plain, whole milk"], ["greek"]],
  yogurt_greek_nonfat: [["yogurt, greek, plain, nonfat"], []],
  yogurt_greek_whole: [["yogurt, greek, plain, whole milk"], []],
  kefir: [["kefir"], ["strawberry"]],
  cottage_cheese: [["cheese, cottage, creamed, large or small curd"], []],
  cheese_cheddar: "Cheese, cheddar (Includes foods for USDA's Food Distribution Program)",
  cheese_mozzarella: [["cheese, mozzarella, whole milk"], ["low moisture"]],
  cheese_feta: "Cheese, feta",
  cheese_parmesan: [["cheese, parmesan, grated"], ["low", "topping"]],
  cream_cheese: "Cheese, cream",
  butter: "Butter, salted",
  sour_cream: [["cream, sour, cultured"], ["reduced", "imitation"]],
  heavy_cream: [["cream, fluid, heavy whipping"], []],
  ice_cream_vanilla: "Ice creams, vanilla",
  // vegetables
  tomato: [["tomatoes, red, ripe, raw, year round average"], []],
  cucumber: [["cucumber, with peel, raw"], []],
  carrot_raw: "Carrots, raw",
  carrot_cooked: [["carrots, cooked, boiled, drained, without salt"], ["baby", "frozen", "canned"]],
  onion: "Onions, raw",
  bell_pepper: [["peppers, sweet, red, raw"], []],
  broccoli_cooked: [["broccoli, cooked, boiled, drained, without salt"], ["frozen", "chinese", "raab", "flower", "stalks"]],
  cauliflower_cooked: [["cauliflower, cooked, boiled, drained, without salt"], ["frozen", "green"]],
  cabbage_raw: "Cabbage, raw",
  lettuce: [["lettuce, cos or romaine, raw"], []],
  spinach_raw: "Spinach, raw",
  zucchini_cooked: [["squash, summer, zucchini, includes skin, cooked, boiled, drained, without salt"], []],
  eggplant_cooked: [["eggplant, cooked, boiled, drained, without salt"], []],
  mushrooms: [["mushrooms, white, raw"], []],
  corn_cooked: [["corn, sweet, yellow, cooked, boiled, drained, without salt"], ["frozen", "canned"]],
  green_peas_cooked: [["peas, green, cooked, boiled, drained, without salt"], ["frozen", "canned", "edible"]],
  green_beans_cooked: [["beans, snap, green, cooked, boiled, drained, without salt"], ["frozen", "canned"]],
  beets_cooked: [["beets, cooked, boiled, drained"], ["salt", "greens"]],
  pumpkin_cooked: [["pumpkin, cooked, boiled, drained, without salt"], ["flowers", "leaves"]],
  avocado: [["avocados, raw, all commercial varieties"], []],
  garlic: "Garlic, raw",
  // fruit
  apple: [["apples, raw, with skin"], ["fuji", "gala", "granny", "golden", "red delicious"]],
  banana: "Bananas, raw",
  orange: [["oranges, raw, all commercial varieties"], []],
  mandarin: [["tangerines, (mandarin oranges), raw"], []],
  pear: "Pears, raw",
  peach: [["peaches, yellow, raw"], []],
  apricot: "Apricots, raw",
  plum: "Plums, raw",
  grapes: [["grapes, red or green (european type, such as thompson seedless), raw"], []],
  watermelon: "Watermelon, raw",
  melon: [["melons, cantaloupe, raw"], []],
  strawberries: "Strawberries, raw",
  blueberries: "Blueberries, raw",
  raspberries: "Raspberries, raw",
  cherries: [["cherries, sweet, raw"], []],
  kiwi: [["kiwifruit, green, raw"], []],
  pineapple: [["pineapple, raw, all varieties"], []],
  mango: "Mangos, raw",
  pomegranate: "Pomegranates, raw",
  persimmon: [["persimmons, japanese, raw"], []],
  lemon: [["lemons, raw, without peel"], []],
  grapefruit: [["grapefruit, raw, pink and red, all areas"], []],
  dates: [["dates, medjool"], []],
  raisins: [["raisins", "seedless"], ["golden", "seeded"]],
  dried_apricots: [["apricots, dried, sulfured, uncooked"], []],
  dried_figs: [["figs, dried, uncooked"], []],
  // legumes and soy
  lentils_cooked: [["lentils, mature seeds, cooked, boiled, without salt"], ["pink"]],
  chickpeas_cooked: [["chickpeas", "mature seeds, cooked, boiled, without salt"], []],
  kidney_beans_cooked: [["beans, kidney, red, mature seeds, cooked, boiled, without salt"], ["california", "royal"]],
  black_beans_cooked: [["beans, black, mature seeds, cooked, boiled, without salt"], ["turtle"]],
  white_beans_cooked: [["beans, white, mature seeds, cooked, boiled, without salt"], ["small"]],
  hummus: "Hummus, commercial",
  tofu: [["tofu, raw, firm, prepared with calcium sulfate"], []],
  // nuts, seeds, fats
  almonds: "Nuts, almonds",
  walnuts: "Nuts, walnuts, english",
  peanuts: [["peanuts, all types, dry-roasted, without salt"], []],
  cashews: [["nuts, cashew nuts, dry roasted, without salt added"], []],
  pistachios: [["nuts, pistachio nuts, dry roasted, without salt added"], []],
  hazelnuts: "Nuts, hazelnuts or filberts",
  sunflower_seeds: [["seeds, sunflower seed kernels, dried"], []],
  pumpkin_seeds: [["seeds, pumpkin and squash seed kernels, dried"], []],
  peanut_butter: [["peanut butter, smooth style, with salt"], ["reduced", "vitamin"]],
  olive_oil: "Oil, olive, salad or cooking",
  sunflower_oil: [["oil, sunflower, linoleic, (approx. 65%)"], []],
  mayonnaise: [["salad dressing, mayonnaise, regular"], []],
  // sweets, snacks, sauces, drinks
  chocolate_dark: [["chocolate, dark, 70-85% cacao solids"], []],
  chocolate_milk_bar: "Candies, milk chocolate",
  honey: "Honey",
  sugar: "Sugars, granulated",
  jam: "Jams and preserves",
  potato_chips: [["snacks, potato chips, plain, salted"], ["made from dried", "reduced", "unsalted"]],
  popcorn: [["snacks, popcorn, air-popped"], ["white"]],
  ketchup: "Catsup",
  soy_sauce: [["soy sauce made from soy and wheat (shoyu)"], ["low", "reduced"]],
  orange_juice: "Orange juice, chilled, includes from concentrate",
  apple_juice: [["apple juice, canned or bottled, unsweetened, without added ascorbic acid"], []],
  cola: "Beverages, carbonated, cola, regular",
};

const picked = {};
const missed = [];
for (const [key, spec] of Object.entries(TARGETS)) {
  let hits;
  if (typeof spec === "string") hits = all.filter((f) => f.desc === spec);
  else {
    const [need, not] = spec;
    hits = all.filter((f) => {
      const d = f.desc.toLowerCase();
      return need.every((w) => d.includes(w.toLowerCase())) && !not.some((w) => d.includes(w.toLowerCase()));
    });
  }
  hits.sort((a, b) => a.desc.length - b.desc.length);
  const pick = hits[0];
  if (!pick || pick.kcal == null) { missed.push(key); continue; }
  picked[key] = pick;
  if (review) {
    console.log(
      (hits.length > 1 ? "(" + hits.length + ")" : "   ").padEnd(5) + key.padEnd(26) + String(pick.kcal).padStart(4) +
        " kcal  P" + pick.protein + " F" + pick.fat + " C" + pick.carbs + " fib" + (pick.fiber ?? "-") + "  | " + pick.desc,
    );
  }
}

console.log(Object.keys(picked).length + " picked, " + missed.length + " missed, of " + Object.keys(TARGETS).length);
if (missed.length) {
  console.error("no USDA entry found for: " + missed.join(", "));
  process.exit(1);
}
if (review) process.exit(0);

const r1 = (n) => Math.round((n ?? 0) * 10) / 10;
const rows = Object.entries(picked).map(
  ([key, f]) =>
    "  " + key + ": { kcal: " + Math.round(f.kcal) + ", protein: " + r1(f.protein) + ", carbs: " + r1(f.carbs) +
    ", fat: " + r1(f.fat) + ", fiber: " + r1(f.fiber) + ", fdc: " + f.id + ", usda: " + JSON.stringify(f.desc) + " },",
);

const NL = String.fromCharCode(10);
const file = [
  "/* ===========================================================================",
  "   Nutrition facts for plain, everyday foods, per 100 g.",
  "",
  "   Every number here is copied from USDA FoodData Central, Standard Reference",
  "   Legacy release (April 2018), the laboratory-measured reference set. fdc is",
  "   the entry's FoodData Central id and usda its exact description, so any",
  "   value can be checked at fdc.nal.usda.gov. The data is in the public domain.",
  "   Source: U.S. Department of Agriculture, Agricultural Research Service.",
  "   FoodData Central. fdc.nal.usda.gov.",
  "",
  "   GENERATED by scripts/build-food-db.mjs. Do not edit a number by hand: change",
  "   the target list in that script and run it again.",
  "",
  "   What is deliberately NOT here: mixed dishes (plov, stew, pizza, burgers).",
  "   Their composition depends on the recipe, and no single reference value is",
  "   honest for them. The meal scanner estimates those itself.",
  "",
  "   Imported only by the scan route, which looks values up here and sends the",
  "   chosen per-100 g figures to the browser, so this table never ships to it.",
  "   =========================================================================== */",
  "",
  "export interface FoodFact {",
  "  kcal: number;",
  "  protein: number;",
  "  carbs: number;",
  "  fat: number;",
  "  fiber: number;",
  "  /** FoodData Central id */",
  "  fdc: number;",
  "  /** the entry's description in SR Legacy */",
  "  usda: string;",
  "}",
  "",
  "export const FOOD_DB: Record<string, FoodFact> = {",
  ...rows,
  "};",
  "",
  "export const FOOD_KEYS = Object.keys(FOOD_DB);",
  "",
  "/** The entry for a key, or undefined. The key arrives as free text from the",
  "    model, so only the table's own keys count: indexing FOOD_DB directly with",
  "    \"constructor\" would hand back Object's. */",
  "export function foodFact(key: string): FoodFact | undefined {",
  "  return Object.prototype.hasOwnProperty.call(FOOD_DB, key) ? FOOD_DB[key] : undefined;",
  "}",
  "",
].join(NL);

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "food-db.ts");
fs.writeFileSync(target, file);
console.log("wrote " + path.relative(process.cwd(), target) + " (" + rows.length + " foods, " + file.length + " bytes)");
