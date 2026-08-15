import type { Metadata } from "next";
import { LegalPage, type Section } from "@/components/legal/LegalPage";
import { OPERATOR, SERVICE, SITE, contactLine } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy — RingBornn",
  description:
    "Every cookie RingBornn sets, what it does, and how long it lasts. No advertising cookies, no third-party analytics, no tracking.",
};

/* This page is deliberately specific rather than generic. The usual cookie
   policy is written for a site running advertising and analytics and hedges
   accordingly; ours can simply list four cookies, because that is all there
   is. Anything added later has to be added here too — a policy that lists
   cookies we don't set is as wrong as one that omits cookies we do. */
const SECTIONS: Section[] = [
  {
    heading: "The short version",
    blocks: [
      `${SERVICE} sets four cookies. Every one of them is either required for the site to work or remembers a setting you chose. There are no advertising cookies, no third-party analytics, and nothing that follows you to other websites.`,
      "Because of that, there is no consent banner to click through. Under the ePrivacy rules, cookies that are strictly necessary to deliver a service you asked for — and cookies that simply remember a preference you set yourself — do not require consent. We do not set any other kind.",
    ],
  },
  {
    heading: "What a cookie is",
    blocks: [
      "A cookie is a small text file a website asks your browser to keep. When you come back, the browser sends it again, which is how a site can recognise your session or remember a setting.",
      "Cookies set by the site you are visiting are called first-party cookies. Cookies set by another company through that site — typically for advertising or analytics — are third-party cookies. We use only the first kind.",
    ],
  },
  {
    heading: "Every cookie we set",
    blocks: [
      "Strictly necessary — the site cannot work without these:",
      [
        "Supabase authentication cookies (names begin with sb-) — keep you signed in as you move between pages, and prove to our server that a request is really from you. Without them you would be signed out on every page load. They last for the length of your session and are refreshed while you stay signed in.",
        "rb_admin — set only on the administrator's own device after an administrator signs in to the private admin area. It is never set on a normal user's device. It is signed, readable only by our server, and expires after 7 days.",
      ],
      "Functional — these remember something you chose:",
      [
        "theme — remembers whether you picked light or dark mode, so the right one is used the moment the next page renders instead of flashing the wrong one. Lasts one year.",
        "NEXT_LOCALE — remembers the language you selected, so the site opens in it next time. Lasts one year.",
      ],
      "That is the complete list. If we ever add a cookie, it will be listed here before it is set.",
    ],
  },
  {
    heading: "What we do not use",
    blocks: [
      "To be explicit, because most sites do use these and you are entitled to know we do not:",
      [
        "No advertising or retargeting cookies.",
        "No third-party analytics — no Google Analytics, no Meta Pixel, no heatmap or session-recording tools.",
        "No social media tracking pixels or share-button trackers.",
        "No cross-site tracking, and no selling or sharing of your browsing behaviour with anyone.",
        "No fingerprinting, and no device identifiers used in place of cookies.",
      ],
    ],
  },
  {
    heading: "Local storage",
    blocks: [
      "Separately from cookies, the Service keeps some information in your browser's local storage — your training profile, streaks, logged meals and progress. This stays on your device and is what lets the app work quickly and continue to work when your connection drops.",
      "When you are signed in, that information is also synchronised to your account so you can pick up on another device. When you delete your account, both copies are removed.",
      "Clearing your browser's site data will clear local storage. If you are signed in, your data syncs back from your account; if you were using the Service without an account, it is gone.",
    ],
  },
  {
    heading: "Controlling cookies",
    blocks: [
      "You can delete or block cookies in your browser's settings, and you can browse in a private window to have them discarded when you close it.",
      "Blocking the strictly necessary cookies will stop you being able to sign in — the Service cannot keep you authenticated without them. Blocking the functional ones only means the site forgets your theme and language between visits.",
      "You can change your theme and language at any time from the header, which simply updates the relevant cookie.",
    ],
  },
  {
    heading: "Changes and contact",
    blocks: [
      "If we add, remove or change a cookie, we will update this page and change the date at the top.",
      `This policy is part of our Terms of Service and should be read with our Privacy Policy. It applies to ${SITE}, operated by ${OPERATOR}.`,
      `Any question about cookies or anything else on this page: ${contactLine()}`,
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro={[
        `A complete list of the cookies ${SERVICE} sets, what each one is for, and how long it lasts.`,
        "There are four, and none of them track you.",
      ]}
      sections={SECTIONS}
    />
  );
}
