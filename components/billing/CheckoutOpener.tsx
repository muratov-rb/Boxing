"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { paddleClientToken, paddleEnvironment } from "@/lib/paddle-client";

/* Opens Paddle's checkout for a transaction the server already created.

   Paddle Billing has no hosted checkout page. transactions.create returns a
   URL pointing back at *our* site with `?_ptxn=<id>` appended, and expects the
   page it lands on to run Paddle.js and open the overlay itself. Before this
   existed the transaction was created correctly and the customer was then
   redirected to a page with no Paddle.js on it: the parameter sat in the
   address bar, nothing opened, and there was no way to pay. */

type State = "loading" | "open" | "no_token" | "no_txn" | "failed";

export function CheckoutOpener() {
  const t = useTranslations("checkout");
  const params = useSearchParams();
  const txnId = params.get("_ptxn");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    /* Paddle appends this itself. Without it there is nothing to pay for --
       someone reached this page directly rather than through the plans page. */
    if (!txnId) {
      setState("no_txn");
      return;
    }

    const token = paddleClientToken();
    if (!token) {
      setState("no_token");
      return;
    }

    const environment = paddleEnvironment(token);

    let cancelled = false;
    initializePaddle({ token, environment })
      .then((paddle: Paddle | undefined) => {
        if (cancelled) return;
        if (!paddle) {
          setState("failed");
          return;
        }
        paddle.Checkout.open({
          transactionId: txnId,
          settings: {
            /* Where Paddle sends them once the payment succeeds. The plan
               itself is granted by the webhook, never here -- this page only
               decides where the customer lands. */
            successUrl: `${window.location.origin}/dashboard?checkout=success`,
          },
        });
        setState("open");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [txnId]);

  if (state === "open" || state === "loading") {
    return (
      <p className="text-sm text-ash" role="status">
        {t("opening")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-blood-bright">
        {state === "no_txn" ? t("noTransaction") : t("failed")}
      </p>
      <a href="/plans" className="btn btn-primary !px-5 !py-2.5 text-xs">
        {t("backToPlans")}
      </a>
    </div>
  );
}
