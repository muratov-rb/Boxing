"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { loadProfile } from "@/lib/tracking";
import { Icon } from "@/components/ui/Icons";

/* The dashboard for someone who never finished onboarding.

   Until now it showed the full set of cards to a person with no plan behind
   any of them — and nothing pointed back at the one screen that would fix
   that. Anyone who bounced out of onboarding just lived here, half set up,
   with no way of knowing what was missing.

   Read on the client rather than the server on purpose: onboarding can be
   completed before an account exists, in which case the profile sits in local
   storage and only reaches the database on the next sync. Asking the server
   would call those people planless and send them round the flow again. */
export function PlanNudge() {
  const t = useTranslations("dashPage");
  // null = not looked yet; localStorage can't be read during the server render
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);

  useEffect(() => {
    setHasPlan(loadProfile() !== null);
  }, []);

  if (hasPlan !== false) return null;

  return (
    <section className="panel mb-6 flex flex-col justify-between gap-4 border-blood/40 p-6 sm:flex-row sm:items-center">
      <div>
        <span className="badge border-blood/40 text-blood">
          <Icon name="target" size={13} /> {t("noPlanBadge")}
        </span>
        <h2 className="mt-4 font-condensed text-xl font-bold uppercase tracking-wide">
          {t("noPlanTitle")}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ash">{t("noPlanCopy")}</p>
      </div>
      <Link href="/onboarding" className="btn btn-primary shrink-0">
        {t("noPlanCta")}
        <Icon name="arrow" size={18} />
      </Link>
    </section>
  );
}
