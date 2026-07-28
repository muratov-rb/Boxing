import type { Metadata } from "next";
import { LegalPage, type Section } from "@/components/legal/LegalPage";
import {
  OPERATOR,
  SERVICE,
  SITE,
  DATA_REGION,
  MIN_AGE,
  contactLine,
  GOVERNING_LAW,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — RingBornn",
  description:
    "What RingBornn collects, why, who it is shared with, and how to get it deleted.",
};

/* Written against what the app actually does — the tables in Supabase, the
   keys in lib/tracking.ts and the three calls that reach Anthropic. If the
   data model changes, this has to change with it. */

const SECTIONS: Section[] = [
  {
    heading: "Who we are",
    blocks: [
      `${SERVICE} is a boxing training service operated by ${OPERATOR} at ${SITE}. This policy explains what we do with your information, in plain language.`,
      contactLine(),
    ],
  },
  {
    heading: "What we collect",
    blocks: [
      "Only what the app needs to work. There is no advertising network, no analytics tracker and no third-party pixel anywhere in this product.",
      "Account details, when you sign up:",
      [
        "Your email address.",
        "A password, which is hashed by our authentication provider. We never see or store the password itself.",
        "If you sign in with Google instead, the basic account identifier Google returns to us.",
      ],
      "Training profile, which you enter during onboarding:",
      [
        "Body statistics: weight, height, age and sex.",
        "Your training path, goals (including anything you type in the free-text goal box) and target weight.",
        "Your timeframe, training environment and the equipment you have.",
        "Nutrition access and budget, whether you take supplements, and any diet notes you write.",
      ],
      "Training activity, generated as you use the app:",
      [
        "Which days you trained and which days you opened the app.",
        "XP, rank and streak progress.",
        "Meals you log: name, calories, protein, carbohydrate, fat, and the time you logged them.",
        "Calories burned, and counters for how often you use limited features.",
      ],
      "Subscription state: your plan, billing period, and when your trial started.",
      "Photos and video you choose to submit: a food photo for the calorie scanner, or a short video or burst of frames for the technique check. We do not access your camera without asking, and each of those features shows a consent prompt before the camera is opened.",
    ],
  },
  {
    heading: "Why we collect it",
    blocks: [
      "Each piece of data earns its place:",
      [
        "Your body statistics and goals are used to calculate calorie and macro targets and to assess how realistic your goal is in your timeframe.",
        "Your equipment and environment decide which lessons and daily plans you are shown.",
        "Your activity drives streaks, XP and ranks.",
        "Your email identifies your account and lets us contact you about it.",
        "Your subscription state decides which features are unlocked.",
      ],
      "We do not sell your data. We do not share it for advertising. We do not build profiles about you for anyone else.",
    ],
  },
  {
    heading: "Health-related information",
    blocks: [
      "Your weight, height, age and fitness goals say something about your health. We treat them accordingly: they are used to generate your targets and guidance inside the app, and for nothing else. They are not shared with advertisers, insurers, employers, or any other third party.",
      `You can use ${SERVICE} without entering a target weight or writing anything in the free-text goal and diet fields. The more you leave out, the less we hold.`,
    ],
  },
  {
    heading: "Who your data is shared with",
    blocks: [
      "We use a small number of service providers to run the app. They process data on our instructions:",
      [
        "Supabase — stores your account, profile, activity and subscription in a Postgres database, and handles sign-in.",
        "Vercel — hosts and serves the application.",
        "Anthropic — provides the AI behind the goal analysis, nutrition plans, food photo scanning and technique review. When you use one of those features, the relevant information is sent to Anthropic to generate the response. For the scanner and technique check, that includes the image or video frames you submitted.",
        "Google — only if you choose to sign in with Google.",
      ],
      "We may also disclose information if we are legally required to, or where it is necessary to investigate abuse of the service.",
    ],
  },
  {
    heading: "Where your data is stored",
    blocks: [
      `Your account and training data are stored in our database in ${DATA_REGION}. The application is served from a global hosting network, which means requests may be handled close to you wherever you are.`,
      "If you use the app from outside that region, your data will be transferred there. By using the service you understand that this transfer takes place.",
    ],
  },
  {
    heading: "Data stored on your own device",
    blocks: [
      "The app keeps a copy of your training data in your browser so it loads instantly and keeps working when you are offline. That copy is synchronised with your account when you are signed in.",
      "We set a small number of cookies, all of them necessary:",
      [
        "A sign-in session cookie, so you stay logged in.",
        "A theme cookie, remembering light or dark mode.",
        "A language cookie, remembering the language you picked.",
      ],
      "There are no advertising or analytics cookies. Clearing your browser storage removes the local copy; your account data stays on the server.",
    ],
  },
  {
    heading: "How long we keep it",
    blocks: [
      "We keep your data for as long as your account exists. If you ask us to delete your account, we remove your profile, training history and progress.",
      "If an account is closed for abuse of the service, its training history, progress and profile are deleted at the same time. That deletion is permanent and cannot be undone.",
    ],
  },
  {
    heading: "Your rights",
    blocks: [
      "You can ask us to:",
      [
        "Give you a copy of the data we hold about you.",
        "Correct anything that is wrong — most of it you can edit yourself in the app.",
        "Delete your account and the data attached to it.",
        "Stop using your data for a particular purpose, or withdraw consent you previously gave.",
      ],
      contactLine() + " We will respond within 30 days.",
      `Depending on where you live, you may also have the right to complain to your national data protection authority. If you are in ${GOVERNING_LAW}, or in the EU, UK, or another region with its own data protection law, those rights apply to you regardless of where we are based.`,
    ],
  },
  {
    heading: "Children",
    blocks: [
      `${SERVICE} is not intended for children under ${MIN_AGE}. Do not create an account if you are younger than that. If you are under 18, you should have your parent or guardian read these terms with you before you start training.`,
      "If we learn that we are holding data from a child below the minimum age, we will delete it.",
    ],
  },
  {
    heading: "Security",
    blocks: [
      "Your data is protected by database rules that allow each account to read and write only its own rows, enforced by the database itself rather than by application code. Passwords are hashed by our authentication provider. Traffic is encrypted in transit.",
      "No system is perfect. If you believe you have found a security problem, please report it to us rather than exploiting it, and we will address it.",
    ],
  },
  {
    heading: "Changes to this policy",
    blocks: [
      "If we change how we handle your data, we will update this page and the date at the top of it. Continuing to use the service after a change means you accept the updated policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={[
        `This policy describes what ${SERVICE} collects about you, why we collect it, who else sees it, and what you can do about it.`,
        "It is written to be read, not to be skipped. If anything here is unclear, ask us and we will explain it.",
      ]}
      sections={SECTIONS}
    />
  );
}
