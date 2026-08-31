import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { VerifyCode } from "@/components/auth/VerifyCode";

export const metadata: Metadata = { title: "Verify Your Email — RingBornn" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : undefined;
  const next = safeNext(sp.next);
  const t = await getTranslations("verify");

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-blood/50 text-blood">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </div>

      <p className="kicker mt-8 justify-center">{t("kicker")}</p>
      <h1 className="mt-4 font-display text-[clamp(2rem,7vw,3rem)] uppercase leading-none">
        {t("titlePre")}
        <span className="text-blood">{t("titleAccent")}</span>
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-ash">{t("lead")}</p>
      {email && (
        <p className="mt-2 text-sm text-bone">{t("sentTo", { email })}</p>
      )}

      {/* Without an address there is nothing to verify against -- that only
          happens if someone opens this page directly, and the register form
          is the honest thing to show them. */}
      {email && <VerifyCode email={email} next={next} />}

      <p className="mt-6 text-sm text-ash-dim">
        {t("spam")}
        <Link href="/register" className="text-blood hover:text-blood-bright">
          {t("tryAgain")}
        </Link>
        .
      </p>

      <Link href="/login" className="btn btn-ghost mt-8">
        {t("back")}
      </Link>
    </div>
  );
}
