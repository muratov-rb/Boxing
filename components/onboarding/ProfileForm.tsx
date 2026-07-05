"use client";

import { useTranslations } from "next-intl";
import {
  GOALS,
  TIMEFRAMES,
  toggle,
  goalNeedsTargetWeight,
  type Profile,
  type ProfileAction,
  type GoalId,
  type Sex,
} from "@/lib/onboarding";
import { Icon } from "@/components/ui/Icons";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const isPos = (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n > 0;
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="inline-flex border border-line" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "px-2.5 py-1 font-condensed text-xs font-semibold uppercase tracking-wider transition-colors",
            value === o.value ? "bg-blood text-white" : "text-ash hover:text-bone",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  action,
  children,
}: {
  label: string;
  htmlFor?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="font-condensed text-xs uppercase tracking-widest text-ash"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-line bg-void px-4 py-3 font-condensed text-lg text-bone placeholder:text-ash-dim focus:border-blood focus:outline-none";

export function ProfileForm({
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
  const tg = useTranslations("goals");
  const tf = useTranslations("timeframes");
  const set = (patch: Partial<Profile>) => dispatch({ type: "patch", patch });

  const needsTarget = goalNeedsTargetWeight(profile.goals);
  const hasGoal = profile.goals.length > 0 || profile.customGoal.trim() !== "";
  const timeframeOk =
    profile.timeframe !== null &&
    (profile.timeframe !== "custom" || profile.customTimeframe.trim() !== "");

  const valid =
    isPos(profile.weight) &&
    isPos(profile.height) &&
    isPos(profile.age) &&
    hasGoal &&
    timeframeOk &&
    (!needsTarget || isPos(profile.targetWeight));

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="text-center">
        <p className="kicker justify-center">{t("profileKicker")}</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,6vw,3.75rem)] uppercase leading-none">
          {t("profileTitlePre")}
          <span className="text-blood">{t("profileTitleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ash">{t("profileSub")}</p>
      </header>

      <form
        className="mt-10 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onNext();
        }}
      >
        {/* stats */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label={t("weight")}
            htmlFor="weight"
            action={
              <Segmented
                label={t("weight")}
                value={profile.weightUnit}
                onChange={(weightUnit) => set({ weightUnit })}
                options={[
                  { value: "kg", label: "kg" },
                  { value: "lb", label: "lb" },
                ]}
              />
            }
          >
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0"
              value={profile.weight}
              onChange={(e) => set({ weight: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field
            label={t("height")}
            htmlFor="height"
            action={
              <Segmented
                label={t("height")}
                value={profile.heightUnit}
                onChange={(heightUnit) => set({ heightUnit })}
                options={[
                  { value: "cm", label: "cm" },
                  { value: "ft", label: "ft" },
                ]}
              />
            }
          >
            <input
              id="height"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0"
              value={profile.height}
              onChange={(e) => set({ height: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label={t("age")} htmlFor="age">
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={profile.age}
              onChange={(e) => set({ age: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        {/* sex (optional) */}
        <Field label={t("sexLabel")}>
          <Segmented
            label={t("sexLabel")}
            value={profile.sex}
            onChange={(sex) => set({ sex: sex as Sex })}
            options={[
              { value: "male", label: t("sexMale") },
              { value: "female", label: t("sexFemale") },
              { value: "other", label: t("sexOther") },
            ]}
          />
        </Field>

        {/* goals — multi-select */}
        <Field label={t("goalsLabel")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GOALS.map((g) => {
              const active = profile.goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    set({ goals: toggle<GoalId>(profile.goals, g.id) })
                  }
                  className={cx(
                    "flex flex-col items-start border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-blood bg-surface-2"
                      : "border-line hover:border-blood/50",
                  )}
                >
                  <span className="flex w-full items-center justify-between font-condensed text-sm font-semibold uppercase tracking-wide">
                    {tg(`${g.id}L`)}
                    {active && (
                      <span className="text-blood">
                        <Icon name="check" size={15} />
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 text-xs text-ash-dim">
                    {tg(`${g.id}H`)}
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder={t("customGoalPlaceholder")}
            value={profile.customGoal}
            onChange={(e) => set({ customGoal: e.target.value })}
            className={`${inputCls} mt-3 text-base`}
          />
        </Field>

        {/* conditional target weight */}
        {needsTarget && (
          <div className="animate-rise">
            <Field
              label={t("targetWeight")}
              htmlFor="targetWeight"
              action={
                <span className="font-condensed text-xs uppercase tracking-wider text-ash-dim">
                  {profile.weightUnit}
                </span>
              }
            >
              <input
                id="targetWeight"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder={t("targetWeightPlaceholder", {
                  unit: profile.weightUnit,
                })}
                value={profile.targetWeight}
                onChange={(e) => set({ targetWeight: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {/* timeframe */}
        <Field label={t("timeframeLabel")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIMEFRAMES.map((item) => {
              const active = profile.timeframe === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ timeframe: item.id })}
                  className={cx(
                    "flex flex-col items-start border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-blood bg-surface-2"
                      : "border-line hover:border-blood/50",
                  )}
                >
                  <span className="font-condensed text-sm font-semibold uppercase tracking-wide">
                    {tf(`${item.id}L`)}
                  </span>
                  <span className="mt-0.5 text-xs text-ash-dim">
                    {tf(`${item.id}S`)}
                  </span>
                </button>
              );
            })}
          </div>
          {profile.timeframe === "custom" && (
            <input
              type="text"
              placeholder={t("customTimeframePlaceholder")}
              value={profile.customTimeframe}
              onChange={(e) => set({ customTimeframe: e.target.value })}
              className={`${inputCls} mt-3 animate-rise text-base`}
            />
          )}
        </Field>

        {/* nav */}
        <div className="flex items-center justify-between border-t border-line/70 pt-6">
          <button type="button" onClick={onBack} className="btn btn-ghost">
            {t("back")}
          </button>
          <button type="submit" disabled={!valid} className="btn btn-primary">
            {t("continue")}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
