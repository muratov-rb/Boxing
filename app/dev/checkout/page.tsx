"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InlineCheckout } from "@/components/billing/InlineCheckout";
import type { BillingPeriod, PaidPlanId } from "@/lib/subscription";

/* Bench for the checkout page. The real Paddle form only loads on the
   approved live domain, so here a stand-in takes Paddle's place at
   window.PaddleBillingV1 -- which @paddle/paddle-js uses instead of loading
   the script when it is already present. The stand-in draws a placeholder
   form and sends the same events Paddle sends, so everything of OURS runs
   for real: the summary, the live totals, the completed state.

   URL: /dev/checkout?_ptxn=txn_bench&plan=pro&period=monthly
   Extra: &currency=EUR &tax=4.75 &fail=1 &complete=1 &noorder=1

   Hidden in production by proxy.ts. */

type Callback = (e: unknown) => void;

if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown> & {
    __PRESSURE_ENV?: Record<string, string>;
  };
  w.__PRESSURE_ENV = { ...(w.__PRESSURE_ENV ?? {}), PADDLE_CLIENT_TOKEN: "test_bench_token" };
  let callback: Callback = () => {};
  const standIn = {
    Initialized: false,
    Environment: { set() {} },
    Initialize(o: { eventCallback?: Callback }) {
      callback = o.eventCallback ?? callback;
      standIn.Initialized = true;
    },
    Update(o: { eventCallback?: Callback }) {
      callback = o.eventCallback ?? callback;
    },
    Checkout: {
      open(o: { settings: { frameTarget: string; displayMode: string; variant: string; theme: string; locale: string } }) {
        const q = new URLSearchParams(window.location.search);
        if (q.get("fail")) throw new Error("bench: open failed");
        (window as unknown as { __benchOpen: unknown }).__benchOpen = o;
        const target = document.querySelector("." + o.settings.frameTarget);
        if (target) {
          target.innerHTML =
            '<div style="padding:12px;display:grid;gap:10px;font:13px system-ui;color:#a3a8b4">' +
            ["Email", "Card number", "MM / YY", "CVC", "Country"]
              .map((l) => `<div style="border:1px solid #2a2e39;border-radius:8px;padding:9px 10px;background:#1e2129">${l}</div>`)
              .join("") +
            '<div style="background:#e30f2a;color:#fff;border-radius:999px;padding:11px;text-align:center;font-weight:600">Pay</div>' +
            "<small style='text-align:center'>[bench stand-in for the Paddle form]</small></div>";
        }
        const price = q.get("period") === "yearly" ? 269.99 : 24.99;
        const tax = Number(q.get("tax") ?? 0);
        setTimeout(() => {
          callback({
            name: "checkout.loaded",
            data: {
              currency_code: q.get("currency") ?? "USD",
              totals: { subtotal: price, tax, total: price + tax, discount: 0 },
              recurring_totals: { subtotal: price, tax, total: price + tax, discount: 0 },
              items: [
                {
                  billing_cycle: { interval: q.get("period") === "yearly" ? "year" : "month", frequency: 1 },
                  product: { name: "RingBornn Pro" },
                },
              ],
            },
          });
          if (q.get("complete")) {
            setTimeout(() => callback({ name: "checkout.completed", data: { currency_code: "USD", totals: { subtotal: 0, tax: 0, total: 0 }, items: [] } }), 300);
          }
        }, 150);
      },
    },
  };
  w.PaddleBillingV1 = standIn;
}

function Bench() {
  const q = useSearchParams();
  const plan = (q.get("plan") ?? "pro") as PaidPlanId;
  const period = (q.get("period") ?? "monthly") as BillingPeriod;
  const order = q.get("noorder") ? null : { plan, period };
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <InlineCheckout order={order} locale={q.get("locale") ?? "en"} />
    </main>
  );
}

export default function CheckoutBench() {
  return (
    <Suspense>
      <Bench />
    </Suspense>
  );
}
