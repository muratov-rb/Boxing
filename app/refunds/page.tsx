import type { Metadata } from "next";
import { LegalPage, type Section } from "@/components/legal/LegalPage";
import { SERVICE, MERCHANT, contactLine, REQUEST_DAYS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refunds & Cancellation — RingBornn",
  description:
    "How to cancel a RingBornn subscription, when refunds are given, and how long they take.",
};

/* A page of its own rather than a clause buried in the terms: people look for
   this when they are already unhappy, and making them read a contract to find
   it is how a refund request becomes a chargeback. */

const SECTIONS: Section[] = [
  {
    heading: "Cancelling",
    blocks: [
      "You can cancel at any time, yourself, without contacting anyone. Open your dashboard, choose Manage billing, and cancel there.",
      "Cancelling stops the next payment. It does not end your access straight away — you keep the plan you paid for until the period you have already paid for runs out, and then the account drops to the free level. Nothing is deleted when you cancel.",
      "There is no cancellation fee and no minimum term.",
    ],
  },
  {
    heading: "The 14-day refund",
    blocks: [
      `If you are unhappy with ${SERVICE}, ask us within 14 days of a payment and we will refund it in full. You do not have to justify the request.`,
      "This applies to your first payment on a plan and to each renewal — if a renewal catches you by surprise, tell us within 14 days of that charge and you get it back.",
      "Consumers in the EU and UK have a statutory 14-day right to withdraw from a purchase. This policy gives everyone the same thing, wherever you live.",
    ],
  },
  {
    heading: "After 14 days",
    blocks: [
      "We will still consider a refund, and we generally say yes when something on our side went wrong — a feature that did not work, a double charge, a plan that was not what the page described.",
      "What we will not usually refund is a period you used normally and simply forgot to cancel. If that is your situation, tell us anyway; we would rather sort it out than have you dispute the charge with your bank.",
    ],
  },
  {
    heading: "How to ask",
    blocks: [
      contactLine(),
      "Tell us the email on the account and roughly when the payment was taken. That is enough — we do not need a reason.",
      `We reply within ${REQUEST_DAYS} days and usually much sooner. Once approved, the refund is issued to the original payment method; how quickly it appears is up to your bank, but it is typically 5–10 working days.`,
    ],
  },
  {
    heading: "Who actually takes the payment",
    blocks: [
      `Payments are processed by ${MERCHANT}, which acts as the merchant of record for ${SERVICE}. That is the name you will see on your bank statement, and ${MERCHANT} issues the refund on our instruction.`,
      `You can also contact ${MERCHANT} directly about a payment, and they can help with receipts and invoices. Either route works.`,
    ],
  },
  {
    heading: "Free trial",
    blocks: [
      "The 7-day trial does not ask for a card and does not charge you. When it ends, nothing is taken — the account simply drops to the free level until you choose to pay. There is nothing to cancel and nothing to refund.",
    ],
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refunds & Cancellation"
      intro={[
        "Cancel whenever you like, and ask for your money back within 14 days for any reason at all.",
        "This page is short on purpose. A refund policy you need a lawyer to read is not a refund policy.",
      ]}
      sections={SECTIONS}
    />
  );
}
