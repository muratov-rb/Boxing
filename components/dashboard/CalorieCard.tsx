"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";
import {
  addMeal,
  calorieTarget,
  loadProfile,
  mealsToday,
  removeMeal,
  burnedToday,
  dailyLimit,
  bumpUsage,
  MEAL_KCAL_MAX,
  type Meal,
  type LimitState,
} from "@/lib/tracking";
import { FoodScanner } from "./FoodScanner";
import { LockedFeature } from "./LockedFeature";

/* Calorie counter — manual meal log + AI photo scan, vs a target computed
   from the saved fighter profile (Mifflin–St Jeor, adjusted for the goal). */

export function CalorieCard() {
  const t = useTranslations("track");
  const tp = useTranslations("plans");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [target, setTarget] = useState(2200);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [kcalError, setKcalError] = useState(false);
  const [burned, setBurned] = useState(0);
  const [limit, setLimit] = useState<LimitState | null>(null);

  useEffect(() => {
    setMeals(mealsToday());
    setTarget(calorieTarget(loadProfile()));
    setBurned(burnedToday());
    setLimit(dailyLimit("calorieScan"));
  }, []);

  // budget/expired plans don't include the calorie counter at all
  if (limit?.locked)
    return (
      <LockedFeature icon="calorie" title={tp("f_calorie")} body={tp("lockedCalorie")} />
    );

  const metered = !!limit && Number.isFinite(limit.limit);
  const scanOk = !limit || limit.ok;

  const eaten = meals.reduce((s, m) => s + m.kcal, 0);
  const eatenProtein = meals.reduce((s, m) => s + (m.protein ?? 0), 0);
  /* training burn is credited back to the day's budget */
  const budget = target + burned;
  const left = budget - eaten;
  const pct = Math.min(100, Math.round((eaten / budget) * 100));

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(kcal);
    if (!name.trim() || !Number.isFinite(n) || n <= 0) return;
    if (n > MEAL_KCAL_MAX) {
      setKcalError(true);
      return;
    }
    setKcalError(false);
    setMeals(addMeal(name, n, "manual"));
    setName("");
    setKcal("");
  };

  /* no width class here — each instance sets its own, otherwise the two
     rules fight and the name field collapses to a sliver. Solid background
     + ≥16px font on mobile keeps typed text visible (and stops iOS zoom). */
  const inputCls =
    "min-w-0 border border-line bg-void/70 px-3 py-2.5 text-base sm:text-sm rounded-md text-bone placeholder:text-ash-dim focus:border-blood transition-colors duration-200 focus:outline-none";

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-blood">
            <Icon name="calorie" size={18} />
          </span>
          <h2 className="font-condensed text-sm font-bold uppercase tracking-widest">
            {t("calTitle")}
          </h2>
        </div>
        {eatenProtein > 0 && (
          <span className="font-condensed text-[0.65rem] uppercase tracking-[0.2em] text-ash-dim">
            {eatenProtein}g {t("protein")}
          </span>
        )}
      </div>

      {/* totals */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display text-4xl leading-none">{eaten}</span>
          <span className="ml-1.5 text-xs text-ash-dim">/ {budget} kcal</span>
        </div>
        <span
          className={`font-condensed text-sm ${left < 0 ? "text-blood-bright" : "text-ash"}`}
        >
          {left >= 0 ? t("left", { n: left }) : t("over", { n: -left })}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-line/60 bg-void">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            left < 0
              ? "bg-blood-bright"
              : "bg-gradient-to-r from-blood to-ember"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {burned > 0 && (
        <p className="mt-2 text-xs text-ash-dim">
          {t("burned", { n: burned })}
        </p>
      )}

      {/* camera-first scan — the primary way to log a meal */}
      {scanOk ? (
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="btn btn-primary shine mt-4 w-full"
        >
          <Icon name="calorie" size={16} /> {t("scanMeal")}
        </button>
      ) : (
        <Link href="/plans" className="btn btn-ghost mt-4 w-full">
          <Icon name="lock" size={15} /> {tp("limitReached")}
        </Link>
      )}
      {metered && limit && (
        <p className="mt-2 text-center text-xs text-ash-dim">
          {tp("scansToday", { used: limit.used, limit: limit.limit })}
        </p>
      )}

      {/* today's meals */}
      {meals.length > 0 && (
        <ul className="mt-4 max-h-40 divide-y divide-line/70 overflow-y-auto">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-bone/90">
                {m.name}
                {m.source === "scan" && (
                  <span className="ml-1.5 align-middle font-condensed text-[0.6rem] uppercase tracking-wider text-azure"> AI</span>
                )}
              </span>
              <span className="font-condensed text-ash">{m.kcal}</span>
              <button
                type="button"
                aria-label={t("remove")}
                onClick={() => setMeals(removeMeal(m.id))}
                className="text-ash-dim transition-colors hover:text-blood"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* manual add: name gets a full row of its own so you can see what
          you're typing; kcal + add button sit below */}
      <form onSubmit={submitManual} className="mt-4 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("mealName")}
          maxLength={60}
          className={`${inputCls} w-full`}
        />
        <div className="flex gap-2">
          <input
            value={kcal}
            onChange={(e) => {
              setKcal(e.target.value);
              setKcalError(Number(e.target.value) > MEAL_KCAL_MAX);
            }}
            placeholder="kcal"
            type="number"
            min="1"
            max={MEAL_KCAL_MAX}
            inputMode="numeric"
            className={`${inputCls} flex-1 ${kcalError ? "!border-blood-bright" : ""}`}
          />
          <button type="submit" className="btn btn-primary !px-5 !py-2 text-sm">
            +
          </button>
        </div>
      </form>
      <p className={`mt-2 text-xs ${kcalError ? "text-blood-bright" : "text-ash-dim"}`}>
        {kcalError ? t("kcalTooBig", { max: MEAL_KCAL_MAX }) : t("calHint")}
      </p>

      {scannerOpen && (
        <FoodScanner
          onAdd={(n, k, macros) => {
            setMeals(addMeal(n, k, "scan", macros));
            bumpUsage("calorieScan"); // a completed scan spends one of today's quota
            setLimit(dailyLimit("calorieScan"));
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </section>
  );
}
