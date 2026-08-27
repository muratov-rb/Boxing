"use client";

import { useState } from "react";
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

  const [customDraft, setCustomDraft] = useState("");
  const trimmed = customDraft.trim();
  /* Case-insensitive duplicate check: "Tyre" and "tyre" are the same tyre, and
     two chips for it would just look like a bug. Capped so the list stays a
     list rather than an essay. */
  const canAddCustom =
    trimmed.length > 0 &&
    profile.customEquipment.length < 12 &&
    !profile.customEquipment.some((x) => x.toLowerCase() === trimmed.toLowerCase());

  const addCustom = () => {
    if (!canAddCustom) return;
    set({ customEquipment: [...profile.customEquipment, trimmed] });
    setCustomDraft("");
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="text-center">
        <p className="kicker justify-center">{t("setupKicker")}</p>
        <h1 className="mt-4 font-display text-[clamp(1.64rem, 6vw, 3.75rem)] uppercase leading-none">
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
            {/* Anything the tiles don't cover — a tyre, a vest, a sandbag. */}
            <Field label={t("customEquipLabel")}>
              {profile.customEquipment.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {profile.customEquipment.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() =>
                          set({
                            customEquipment: profile.customEquipment.filter((x) => x !== item),
                          })
                        }
                        className="flex min-h-[36px] items-center gap-2 rounded-full border border-blood/50 bg-blood/10 px-3.5 text-sm text-bone transition-colors hover:border-blood"
                      >
                        {item}
                        <span className="text-ash-dim">×</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("equipPlaceholder")}
                  value={customDraft}
                  maxLength={40}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onKeyDown={(e) => {
                    /* Enter adds the item rather than submitting the step —
                       otherwise typing a name and pressing Enter skips ahead
                       and silently drops what was typed. */
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  className={`${inputCls} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!canAddCustom}
                  className="btn btn-ghost !px-5 disabled:opacity-40"
                >
                  {t("customEquipAdd")}
                </button>
              </div>
            </Field>
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
