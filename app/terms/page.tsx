import type { Metadata } from "next";
import { LegalPage, type Section } from "@/components/legal/LegalPage";
import { OPERATOR, SERVICE, SITE, GOVERNING_LAW, MIN_AGE, contactLine } from "@/lib/legal";
import { PRICES, PRICES_YEARLY, priceLabel } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Terms of Service — RingBornn",
  description:
    "The rules for using RingBornn, including the health disclaimer, subscriptions and account termination.",
};

/* Prices are read from lib/subscription.ts rather than typed out, so a pricing
   change can never leave the terms quoting a number we no longer charge. */
const priceRow = (id: "budget" | "pro" | "max", name: string) =>
  `${name} — ${priceLabel(PRICES[id])} per month, or ${priceLabel(PRICES_YEARLY[id])} per year.`;

const SECTIONS: Section[] = [
  {
    heading: "Agreeing to these terms",
    blocks: [
      `These terms are an agreement between you and ${OPERATOR}, who operates ${SERVICE} at ${SITE}. By creating an account or using the service, you accept them. If you do not accept them, do not use the service.`,
      `You must be at least ${MIN_AGE} years old to hold an account.`,
    ],
  },
  {
    heading: "Health and safety — read this one",
    blocks: [
      `${SERVICE} provides general fitness and boxing training information. It is not medical advice, and it is not a substitute for a doctor, a physiotherapist or a qualified coach who can see you in person.`,
      "Boxing and physical training carry a real risk of injury. Before you start:",
      [
        "Talk to a doctor before beginning any new training programme, particularly if you have a heart condition, high blood pressure, a joint or back problem, are pregnant, are recovering from injury or surgery, or have any medical condition at all.",
        "Stop immediately if you feel pain, dizziness, chest tightness or shortness of breath, and seek medical attention.",
        "Learn contact skills such as sparring under qualified in-person supervision. Nothing in this app prepares you to be hit, or to hit another person, safely.",
        "Use equipment appropriate to your level, and do not train beyond it.",
      ],
      "You train at your own risk. You are responsible for judging whether any exercise, plan or nutrition suggestion is right for your body and your circumstances.",
      "Calorie targets, macro targets and nutrition plans in this app are estimates produced by a formula or by an AI model. They are not a prescribed diet. If you have an eating disorder, a history of one, diabetes, or any condition affected by what you eat, speak to a medical professional rather than following what this app suggests.",
    ],
  },
  {
    heading: "Your account",
    blocks: [
      "You are responsible for keeping your password secret and for everything that happens under your account. Give accurate information when you sign up — the training and nutrition targets are calculated from what you enter, so wrong figures produce wrong guidance.",
      "One account per person. Do not share your account or let someone else use it.",
      "Tell us straight away if you think someone else has access to your account.",
    ],
  },
  {
    heading: "Plans, trials and payment",
    blocks: [
      "New accounts get a 7-day free trial with Budget-level access. When the trial ends, the account stays usable at a reduced level until you choose a paid plan.",
      "Paid plans are:",
      [
        priceRow("budget", "Budget"),
        priceRow("pro", "Pro"),
        priceRow("max", "Max"),
      ],
      "Yearly plans are billed once for the year and give the same features as the monthly plan at a lower effective rate.",
      "Card payments are not yet enabled. Until they are, no money is taken and plan changes are recorded without a charge.",
      "When payment goes live, these rules will apply:",
      [
        "Payments are handled by a third-party payment processor. We never hold your card details ourselves.",
        "Subscriptions renew automatically at the end of each period until you cancel.",
        "You can cancel at any time. Cancelling stops the next renewal; it does not refund the period you are already in, and you keep access until that period ends.",
        "Where your local law gives you a statutory right to withdraw from a purchase — such as the 14-day right in the EU and UK — that right applies and overrides the line above.",
        "If you buy through a mobile app store, that store's own refund rules apply instead.",
      ],
      "Prices are shown in US dollars. Your bank may convert the amount and add its own fees, which are outside our control. Taxes may be added depending on where you are.",
      "Prices may change. If they do, we will tell you before the change affects you, and you may cancel rather than accept it.",
    ],
  },
  {
    heading: "AI-generated content",
    blocks: [
      "Several features — the goal analysis, nutrition plans, food photo scanning and technique review — are produced by an AI model. AI output can be wrong, incomplete or confidently mistaken. Treat it as a suggestion to sanity-check, never as an authority.",
      "The calorie and macro figures returned by the food scanner are estimates from a photograph. They are not measurements.",
      "The technique review looks at a handful of frames from a short video. It cannot see everything a coach standing next to you would see.",
      "You keep ownership of the photos and video you submit. You give us permission to process them in order to generate your result, which includes sending them to our AI provider. Do not upload images of other people without their agreement, and do not upload anything you do not have the right to share.",
    ],
  },
  {
    heading: "Acceptable use",
    blocks: [
      "Do not:",
      [
        "Break the law, or use the service to harm, harass or impersonate anyone.",
        "Upload illegal content, or images of other people who have not agreed to it.",
        "Attempt to access accounts or data that are not yours.",
        "Scrape the service, hammer the API, or work around usage limits and feature gates.",
        "Resell or redistribute the service or its content as your own.",
      ],
    ],
  },
  {
    heading: "Suspension and closure",
    blocks: [
      "We may suspend or close an account that breaks these terms or abuses the service.",
      "Be aware that closing an account for abuse also permanently deletes its training history, progress and profile. That deletion cannot be reversed, and restoring access later does not restore the data.",
      "You can stop using the service at any time. You can delete your own account, and everything attached to it, from your dashboard under Account — you do not need to ask our permission or wait for us.",
    ],
  },
  {
    heading: "Availability",
    blocks: [
      `${SERVICE} is provided as it is, without any guarantee that it will be available without interruption or free of errors. We may change, suspend or discontinue features. We will try to give notice of significant changes, but we may not always be able to.`,
    ],
  },
  {
    heading: "Limitation of liability",
    blocks: [
      "To the fullest extent the law allows, we are not liable for injury, illness, loss of data, lost profits, or any indirect or consequential loss arising from your use of the service or from following guidance produced by it.",
      "Nothing in these terms excludes liability that cannot legally be excluded — including liability for death or personal injury caused by our negligence, or for fraud.",
      "Some places do not allow certain limitations of liability, so parts of this section may not apply to you.",
    ],
  },
  {
    heading: "Changes to these terms",
    blocks: [
      "We may update these terms. When we do, we will change the date at the top of this page. If a change is significant, we will make a reasonable effort to tell you. Continuing to use the service after a change means you accept the updated terms.",
    ],
  },
  {
    heading: "Governing law and contact",
    blocks: [
      `These terms are governed by the laws of ${GOVERNING_LAW}, and disputes will be handled by the courts there.`,
      "If you are a consumer, this does not take away the protection of the mandatory consumer laws of the country you live in, and you may bring a claim in your local courts where that law allows it.",
      "If any part of these terms turns out to be unenforceable, the rest stays in force. If we do not enforce a term straight away, we have not given up the right to enforce it later.",
      contactLine(),
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={[
        `These are the rules for using ${SERVICE}. They cover what you can expect from us, what we expect from you, and the limits of what a training app can safely do.`,
        "Section 2 is the one that matters most. Please read it properly before you train.",
      ]}
      sections={SECTIONS}
    />
  );
}
