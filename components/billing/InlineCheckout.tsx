"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";
import { paddleClientToken, paddleEnvironment } from "@/lib/paddle-client";
import { ENTITLEMENTS, type BillingPeriod, type PaidPlanId } from "@/lib/subscription";
import { FEATURE_KEYS, featureCell } from "@/components/plans/plan-features";
import { Icon } from "@/components/ui/Icons";

/* ===========================================================================
   The checkout: our order summary beside Paddle's payment form.

   It used to be a near-empty page with Paddle's generic overlay popped on top
   -- the one screen where someone decides whether to trust us with a card was
   the one that looked least like us. Now Paddle's form is embedded INLINE, in
   its one-page layout (email and card on one step instead of two), and
   everything around it is ours.

   Paddle Billing has no hosted checkout: the server creates a transaction and
   Paddle sends the customer here with `?_ptxn=<id>`; this page must run
   Paddle.js and open the form itself. The plan is granted by the webhook,
   never here -- this page only shows and collects.

   The amounts come from Paddle's own checkout events, not from our price list,
   because Paddle localises the currency and adds tax once it knows the
   country: the summary always shows what will actually be charged.

   The form's colours are set in Paddle's dashboard (Checkout > Branded inline
   checkout); code cannot restyle inside Paddle's frame.
   =========================================================================== */

/** Paddle finds the container by class name. */
const FRAME_CLASS = "paddle-checkout-frame";

type State = "loading" | "ready" | "completed" | "no_token" | "failed";

interface Money {
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  recurring: number | null;
  interval: string | null;
  product: string | null;
}

/** Our locale codes to Paddle's. Chinese is the only one that differs. */
function paddleLocale(locale: string): string {
  return locale === "zh" ? "zh-Hans" : locale;
}

export interface CheckoutOrderProps {
  plan: PaidPlanId;
  period: BillingPeriod;
}

export function InlineCheckout({
  order,
  locale,
}: {
  order: CheckoutOrderProps | null;
  locale: string;
}) {
  const t = useTranslations("checkout");
  const tp = useTranslations("plans");
  const params = useSearchParams();
  const txnId = params.get("_ptxn");
  const [state, setState] = useState<State>("loading");
  const [money, setMoney] = useState<Money | null>(null);

  useEffect(() => {
    if (!txnId) return;
    let cancelled = false;

    const onEvent = (event: PaddleEventData) => {
      if (cancelled || !event.data) return;
      if (event.name === "checkout.completed") {
        setState("completed");
        return;
      }
      const d = event.data;
      const item = d.items?.[0];
      setMoney({
        currency: d.currency_code,
        subtotal: d.totals.subtotal,
        tax: d.totals.tax,
        total: d.totals.total,
        recurring: d.recurring_totals?.total ?? null,
        interval: item?.billing_cycle?.interval ?? null,
        product: item?.product?.name ?? null,
      });
    };

    const open = async () => {
      const token = paddleClientToken();
      if (!token) {
        if (!cancelled) setState("no_token");
        return;
      }
      try {
        const paddle: Paddle | undefined = await initializePaddle({
          token,
          environment: paddleEnvironment(token),
          eventCallback: onEvent,
        });
        if (cancelled) return;
        if (!paddle) {
          setState("failed");
          return;
        }
        paddle.Checkout.open({
          transactionId: txnId,
          settings: {
            displayMode: "inline",
            variant: "one-page",
            frameTarget: FRAME_CLASS,
            frameInitialHeight: 450,
            frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
            /* Paddle defaults to light; on a dark site that makes the payment
               step the one moment that looks like somebody else's website. */
            theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            locale: paddleLocale(locale),
            /* Where Paddle sends them once the payment succeeds. The plan
               itself arrives by webhook. */
            successUrl: `${window.location.origin}/dashboard?checkout=success`,
            allowLogout: false,
          },
        });
        setState("ready");
      } catch {
        if (!cancelled) setState("failed");
      }
    };
    void open();

    return () => {
      cancelled = true;
    };
  }, [txnId, locale]);

  /* Nothing to pay for: someone reached this page directly rather than
     through the plans page. */
  if (!txnId) {
    return <Problem text={t("noTransaction")} back={t("backToPlans")} />;
  }
  if (state === "no_token" || state === "failed") {
    return <Problem text={t("failed")} back={t("backToPlans")} />;
  }

  const fmt = (amount: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: money!.currency }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${money!.currency}`;
    }
  };
  const interval = money?.interval ?? (order?.period === "yearly" ? "year" : "month");
  const entitlements = order ? ENTITLEMENTS[order.plan] : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      {/* ------------------------- order summary ------------------------- */}
      <section className="panel p-5 sm:p-6" aria-label={t("yourPlan")}>
        <p className="font-condensed text-xs uppercase tracking-[0.2em] text-blood">{t("yourPlan")}</p>

        {order ? (
          <>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl uppercase leading-none">{tp(`name_${order.plan}`)}</h2>
              {order.plan === "pro" && (
                <span className="badge border-blood/40 text-blood">{tp("popular")}</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ash">{tp(`tagline_${order.plan}`)}</p>
            {/* Wide screens only: on a phone the list pushed the card form
                below the fold, and by now the plan has been chosen. */}
            <ul className="mt-5 hidden space-y-2 lg:block">
              {FEATURE_KEYS.map((k) => {
                const c = featureCell(entitlements!, k, tp);
                if (!c.on) return null;
                return (
                  <li key={k} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 text-blood">
                      <Icon name="check" size={14} />
                    </span>
                    <span className="text-bone/90">
                      {tp(`f_${k}`)}
                      {c.text && <span className="text-ash-dim"> · {c.text}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          /* No summary of our own (see lib/checkout-order.ts): Paddle's
             product name is still the right thing to show. */
          <h2 className="mt-2 font-display text-2xl uppercase leading-tight">
            {money?.product ?? "RingBornn"}
          </h2>
        )}

        <dl className="mt-6 space-y-2 border-t border-line/70 pt-4 text-sm">
          <div className="flex justify-between text-ash">
            <dt>
              {order ? tp(order.period === "yearly" ? "billYearly" : "billMonthly") : t("subtotal")}
            </dt>
            <dd>{money ? fmt(money.subtotal) : t("calculating")}</dd>
          </div>
          <div className="flex justify-between text-ash">
            <dt>{t("tax")}</dt>
            <dd>{money ? fmt(money.tax) : "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <dt className="font-condensed text-sm font-bold uppercase tracking-wide">{t("dueToday")}</dt>
            <dd className="font-display text-2xl">{money ? fmt(money.total) : "—"}</dd>
          </div>
        </dl>
        {money && money.recurring !== null && (
          <p className="mt-3 text-xs leading-relaxed text-ash-dim">
            {t(interval === "year" ? "thenYearly" : "thenMonthly", { amount: fmt(money.recurring) })}
          </p>
        )}
      </section>

      {/* ---------------------------- payment ---------------------------- */}
      <section className="panel p-3 sm:p-5" aria-label={t("payment")}>
        <p className="px-2 pt-1 font-condensed text-xs uppercase tracking-[0.2em] text-ash sm:px-1">
          {t("payment")}
        </p>

        {state === "loading" && (
          <p className="px-2 py-6 text-sm text-ash" role="status">
            {t("opening")}
          </p>
        )}
        {/* Shown above the form, never instead of it: Paddle is still finishing
            (and then redirecting) inside its frame when this event arrives. */}
        {state === "completed" && (
          <p
            className="mx-2 mt-3 flex items-center gap-2 rounded-xl border border-blood/40 bg-blood/10 px-3 py-2.5 text-sm text-bone"
            role="status"
          >
            <Icon name="check" size={16} />
            {t("completed")}
          </p>
        )}
        {/* Paddle mounts its form in here. Always rendered, so the element
            exists before Checkout.open() looks for it. */}
        <div className={`${FRAME_CLASS} mt-2 min-h-[450px]`} />


        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-line/70 px-2 pt-3 text-xs text-ash-dim">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="lock" size={12} />
            {t("secure")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="card" size={12} />
            {t("handledBy")}
          </span>
        </div>
      </section>
    </div>
  );
}

function Problem({ text, back }: { text: string; back: string }) {
  return (
    <div className="panel mx-auto max-w-md space-y-5 p-6 text-center">
      <p className="text-sm text-blood-bright">{text}</p>
      <a href="/plans" className="btn btn-primary !px-5 !py-2.5 text-xs">
        {back}
      </a>
    </div>
  );
}
