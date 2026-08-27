"use client";

import { useTranslations } from "next-intl";
import {
  NUTRITION_ACCESS,
  type Profile,
  type ProfileAction,
  type NutritionAccessId,
} from "@/lib/onboarding";
import { Icon } from "@/components/ui/Icons";
import { Field, SelectCard, inputCls } from "./controls";

export function FuelStep({
  profile,
  dispatch,
  onBack,
  onNext,
}: {
  profile: Profile;
  dispatch: React.Dispatch<ProfileAction>;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("onb");
  const tn = useTranslations("nutritionAccess");
  const set = (patch: Partial<Profile>) => dispatch({ type: "patch", patch });
  const valid = profile.nutritionAccess !== null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="text-center">
        <p className="kicker justify-center">{t("fuelKicker")}</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,6vw,3.75rem)] uppercase leading-none">
          {t("fuelTitlePre")}
          <span className="text-blood">{t("fuelTitleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ash">{t("fuelSub")}</p>
      </header>

      <div className="mt-10 space-y-8">
        {/* access tier */}
        <Field label={t("accessLabel")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {NUTRITION_ACCESS.map((n) => (
              <SelectCard
                key={n.id}
                active={profile.nutritionAccess === n.id}
                onClick={() =>
                  set({ nutritionAccess: n.id as NutritionAccessId })
                }
                title={tn(`${n.id}L`)}
                hint={tn(`${n.id}H`)}
                showCheck={false}
              />
            ))}
          </div>
        </Field>

        {/* supplements */}
        <Field label={t("supplementsLabel")}>
          <button
            type="button"
            aria-pressed={profile.supplements}
            onClick={() => set({ supplements: !profile.supplements })}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
              profile.supplements
                ? "border-blood bg-surface-2"
                : "border-line hover:border-blood/50"
            }`}
          >
            <span>
              <span className="block font-condensed text-sm font-semibold uppercase tracking-wide">
                {t("supTitle")}
              </span>
              <span className="mt-0.5 block text-xs text-ash-dim">
                {t("supSub")}
              </span>
            </span>
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                profile.supplements
                  ? "border-blood bg-blood text-white"
                  : "border-line text-transparent"
              }`}
            >
              <Icon name="check" size={14} />
            </span>
          </button>
        </Field>

        {/* diet notes */}
        <Field label={t("dietLabel")} htmlFor="dietNotes">
          <textarea
            id="dietNotes"
            rows={3}
            placeholder={t("dietPlaceholder")}
            value={profile.dietNotes}
            onChange={(e) => set({ dietNotes: e.target.value })}
            className={`${inputCls} resize-none`}
          />
        </Field>

        {/* nav */}
        <div className="flex items-center justify-between border-t border-line/70 pt-6">
          <button type="button" onClick={onBack} className="btn btn-ghost">
            {t("back")}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!valid}
            className="btn btn-primary shine"
          >
            {t("analyze")}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
