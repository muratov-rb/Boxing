import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SiteNav } from "@/components/landing/SiteNav";
import { CheckoutOpener } from "@/components/billing/CheckoutOpener";
import { getUser } from "@/lib/supabase/user";
import { SERVICE } from "@/lib/legal";

/* The page Paddle sends people to in order to pay.

   It is the "default payment link": transactions.create returns this URL with
   `?_ptxn=<id>` on the end, and Paddle.js here reads that and opens the
   overlay. It must stay a real, reachable page on this domain -- Paddle
   rejects localhost, and a checkout cannot be opened before the link is set
   under Checkout settings.

   Deliberately NOT in the protected route list. The customer arrives here
   from Paddle's redirect, and bouncing them through /login at that moment
   would drop the _ptxn parameter and lose the payment. Nothing is exposed by
   leaving it open: without a transaction id there is nothing to open, and the
   id is not guessable. */

export const metadata: Metadata = {
  title: `Checkout — ${SERVICE}`,
  /* Nothing here belongs in an index: the page is meaningless without a
     transaction id, and a crawler following it would only ever see the error
     state. */
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  const user = await getUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav authed={!!user} minimal />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-[clamp(1.6rem,5vw,2.4rem)] uppercase leading-none">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ash">{t("sub")}</p>
        <div className="mt-8">
          {/* useSearchParams client-side renders everything up to the nearest
              boundary, so it gets its own rather than taking the page with it. */}
          <Suspense fallback={<p className="text-sm text-ash">{t("opening")}</p>}>
            <CheckoutOpener />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
