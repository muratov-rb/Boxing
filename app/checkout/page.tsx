import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteNav } from "@/components/landing/SiteNav";
import { InlineCheckout } from "@/components/billing/InlineCheckout";
import { Icon } from "@/components/ui/Icons";
import { getUser } from "@/lib/supabase/user";
import { checkoutOrder } from "@/lib/checkout-order";
import { SERVICE } from "@/lib/legal";

/* The page Paddle sends people to in order to pay.

   It is the "default payment link": transactions.create returns this URL with
   `?_ptxn=<id>` on the end, and Paddle.js here reads that and embeds the
   payment form (components/billing/InlineCheckout.tsx). It must stay a real,
   reachable page on this domain -- Paddle rejects localhost, and a checkout
   cannot be opened before the link is set under Checkout settings.

   Deliberately NOT in the protected route list. The customer arrives here
   from Paddle's redirect, and bouncing them through /login at that moment
   would drop the _ptxn parameter and lose the payment. Nothing is exposed by
   leaving it open: without a transaction id there is nothing to open, the id
   is not guessable, and the order summary is only shown to the account the
   transaction was created for (lib/checkout-order.ts). */

export const metadata: Metadata = {
  title: `Checkout — ${SERVICE}`,
  /* Nothing here belongs in an index: the page is meaningless without a
     transaction id, and a crawler following it would only ever see the error
     state. */
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ _ptxn?: string }>;
}) {
  const [t, user, locale, sp] = await Promise.all([
    getTranslations("checkout"),
    getUser(),
    getLocale(),
    searchParams,
  ]);
  const order = await checkoutOrder(sp._ptxn, user?.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav authed={!!user} minimal />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
        <a
          href="/plans"
          className="inline-flex items-center gap-1.5 font-condensed text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone"
        >
          <span className="rotate-180">
            <Icon name="arrow" size={12} />
          </span>
          {t("backToPlans")}
        </a>
        <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.8rem)] uppercase leading-none">
          {t("heading")}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ash">{t("sub")}</p>

        <div className="mt-7">
          {/* useSearchParams client-side renders everything up to the nearest
              boundary, so it gets its own rather than taking the page with it. */}
          <Suspense fallback={<p className="text-sm text-ash">{t("opening")}</p>}>
            <InlineCheckout order={order} locale={locale} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
