"use client";

import { useTranslations } from "next-intl";
import {
  ENVIRONMENTS,
  EQUIPMENT,
  toggle,
  type Profile,
  type ProfileAction,
  type EnvId,
  type EquipmentId,
} from "@/lib/onboarding";
import { Icon } from "@/components/ui/Icons";
import { Field, SelectCard, inputCls } from "./controls";

export function SetupStep({
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
  const te = useTranslations("environments");
  const teq = useTranslations("equipment");
  const set = (patch: Partial<Profile>) => dispatch({ type: "patch", patch });
  const valid = profile.environment !== null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="text-center">
        <p className="kicker justify-center">{t("setupKicker")}</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,6vw,3.75rem)] uppercase leading-none">
          {t("setupTitlePre")}
          <span className="text-blood">{t("setupTitleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ash">{t("setupSub")}</p>
      </header>

      <div className="mt-10 space-y-8">
        {/* environment */}
        <Field label={t("whereTrain")}>
          <div className="grid gap-3 sm:grid-cols-3">
            {ENVIRONMENTS.map((e) => (
              <SelectCard
                key={e.id}
                active={profile.environment === e.id}
                onClick={() =>
                  set({
                    environment: e.id as EnvId,
                    equipment: e.id === "home_equipped" ? profile.equipment : [],
                  })
                }
                title={te(`${e.id}L`)}
                hint={te(`${e.id}H`)}
                showCheck={false}
              />
            ))}
          </div>
        </Field>

        {/* equipment — only when partially equipped */}
        {profile.environment === "home_equipped" && (
          <div className="animate-rise space-y-3">
            <Field label={t("tickHave")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {EQUIPMENT.map((eq) => (
                  <SelectCard
                    key={eq.id}
                    active={profile.equipment.includes(eq.id)}
                    onClick={() =>
                      set({
                        equipment: toggle<EquipmentId>(profile.equipment, eq.id),
                      })
                    }
                    title={teq(eq.id)}
                  />
                ))}
              </div>
            </Field>
            <input
              type="text"
              placeholder={t("equipPlaceholder")}
              value={profile.equipmentNotes}
              onChange={(e) => set({ equipmentNotes: e.target.value })}
              className={inputCls}
            />
          </div>
        )}

        {profile.environment === "home_bodyweight" && (
          <p className="animate-rise rounded-xl border border-line/70 bg-surface/50 px-4 py-3 text-sm text-ash">
            {t("bodyweightNote")}
          </p>
        )}

        {/* nav */}
        <div className="flex items-center justify-between border-t border-line/70 pt-6">
          <button type="button" onClick={onBack} className="btn btn-ghost">
            {t("back")}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!valid}
            className="btn btn-primary"
          >
            {t("continue")}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
