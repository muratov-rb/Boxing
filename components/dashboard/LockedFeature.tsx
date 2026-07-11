"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

/* A drop-in "this feature isn't in your plan" card with an upgrade CTA.
   Used wherever a plan doesn't include a feature at all. */

export function LockedFeature({
  icon,
  title,
  body,
}: {
  icon: "belt" | "video" | "nutrition" | "calorie" | "rest";
  title: string;
  body: string;
}) {
  const t = useTranslations("plans");
  return (
    <section className="panel flex flex-col justify-between p-6 sm:p-7">
      <div>
        <span className="badge text-ash-dim">
          <Icon name="lock" size={12} /> {t("lockedBadge")}
        </span>
        <div className="mt-4 flex items-center gap-2.5 text-ash-dim">
          <Icon name={icon} size={18} />
          <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-bone">
            {title}
          </h2>
        </div>
        <p className="mt-2 text-sm text-ash">{body}</p>
      </div>
      <Link href="/plans" className="btn btn-primary mt-6">
        {t("upgrade")}
        <Icon name="arrow" size={16} />
      </Link>
    </section>
  );
}
