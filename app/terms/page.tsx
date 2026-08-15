import type { Metadata } from "next";
import { LegalPage, type Section } from "@/components/legal/LegalPage";
import {
  OPERATOR,
  SERVICE,
  SITE,
  GOVERNING_LAW,
  MIN_AGE,
  MERCHANT,
  REQUEST_DAYS,
  contactLine,
} from "@/lib/legal";
import { PRICES, PRICES_YEARLY, priceLabel } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Terms of Service — RingBornn",
  description:
    "The rules for using RingBornn, including the health disclaimer, subscriptions, refunds, licensing and account termination.",
};

/* Prices are read from lib/subscription.ts rather than typed out, so a pricing
   change can never leave the terms quoting a number we no longer charge. */
const priceRow = (id: "budget" | "pro" | "max", name: string) =>
  `${name} — ${priceLabel(PRICES[id])} per month, or ${priceLabel(PRICES_YEARLY[id])} per year.`;

const SECTIONS: Section[] = [
  {
    heading: "1. Definitions",
    blocks: [
      "A few words are used throughout with a specific meaning:",
      [
        `"We", "us", "our" — ${OPERATOR}, the operator of ${SERVICE}.`,
        `"Service" — the ${SERVICE} website at ${SITE}, together with every feature, lesson, plan and tool available through it.`,
        `"You" — the person holding an account, or otherwise using the Service.`,
        `"Content" — text, images, video, exercise data, training plans and any other material made available through the Service.`,
        `"Your Content" — anything you upload, submit or enter, including photographs, video, and the figures in your profile.`,
        `"Merchant of record" — ${MERCHANT}, the company that legally sells the subscription to you, charges your payment method and accounts for sales tax.`,
      ],
    ],
  },
  {
    heading: "2. Agreeing to these terms",
    blocks: [
      `These terms are a binding agreement between you and ${OPERATOR}, who operates ${SERVICE} at ${SITE}. By ticking the box at sign-up, creating an account, or otherwise using the Service, you accept them. If you do not accept them, do not use the Service.`,
      `You must be at least ${MIN_AGE} years old to hold an account. If the age of digital consent where you live is higher than ${MIN_AGE}, that higher age applies to you instead.`,
      "By accepting, you confirm that the information you give us is accurate, that you are using the Service for your own personal training, and that you are legally able to enter into this agreement.",
      "These terms should be read together with our Privacy Policy, Cookie Policy and Refunds & Cancellation policy, each of which forms part of this agreement.",
    ],
  },
  {
    heading: "3. Health and safety — read this one",
    blocks: [
      `${SERVICE} provides general fitness and boxing training information. It is not medical advice, it is not a diagnosis, it is not physiotherapy, and it is not a substitute for a doctor, a physiotherapist, a dietitian or a qualified coach who can see you in person.`,
      "Nothing in the Service is intended to diagnose, treat, cure or prevent any disease or condition. No content here should be read as a prescription, a treatment plan, or a recommendation to start, stop or change any medication or medical treatment.",
      "Boxing and physical training carry a real and inherent risk of injury, including serious injury and, in rare cases, death. That risk cannot be removed by any app.",
      "Before you start:",
      [
        "Talk to a doctor before beginning any new training programme, particularly if you have a heart condition, high blood pressure, a joint, bone or back problem, are pregnant or recently gave birth, are recovering from injury or surgery, have an eating disorder or history of one, are taking medication, or have any medical condition at all.",
        "Talk to a doctor before following any nutrition or calorie guidance, especially if you have diabetes, kidney or liver disease, a history of disordered eating, or any dietary condition.",
        "Stop immediately if you feel pain, dizziness, faintness, chest tightness, irregular heartbeat or shortness of breath, and seek medical attention.",
        "Train within your own ability. Progress the intensity gradually. Do not train through pain.",
        "Make sure your training space is clear, your surface is stable, and any equipment you use is sound and correctly set up.",
      ],
      "You acknowledge and voluntarily accept these risks. You take part at your own risk, and you are solely responsible for deciding whether any exercise, session or nutritional suggestion is appropriate for you.",
      "If you are under 18, do not use the Service without the involvement and agreement of a parent or guardian.",
    ],
  },
  {
    heading: "4. Your account",
    blocks: [
      "You are responsible for keeping your password secret and for everything that happens under your account. Give accurate information when you sign up — the training and nutrition targets are calculated from what you enter, so wrong figures produce wrong guidance.",
      "One account per person. Do not share your account, sell it, or let someone else use it.",
      "Tell us straight away if you think someone else has access to your account.",
      "We may need to contact you about your account, security, or changes to the Service. Those messages are part of the Service and are not marketing.",
    ],
  },
  {
    heading: "5. Plans, trials and payment",
    blocks: [
      "New accounts get a 7-day free trial with Budget-level access. When the trial ends, the account stays usable at a reduced level until you choose a paid plan. No payment details are required for the trial and it does not convert into a paid plan by itself.",
      "Paid plans are:",
      [
        priceRow("budget", "Budget"),
        priceRow("pro", "Pro"),
        priceRow("max", "Max"),
      ],
      "Yearly plans are billed once for the year and give the same features as the monthly plan at a lower effective rate.",
      `Payments are handled by ${MERCHANT}, which acts as the merchant of record for ${SERVICE}. ${MERCHANT} is the seller on your invoice, charges your payment method and remits any sales tax or VAT due. ${MERCHANT} is the name that appears on your bank statement, and we never see or hold your card details. Your purchase is additionally subject to ${MERCHANT}'s own buyer terms, presented at checkout.`,
      "How billing works:",
      [
        "Subscriptions renew automatically at the end of each period until you cancel.",
        "You can cancel at any time from your dashboard — no email, no notice period, no fee.",
        "Cancelling stops the next payment. You keep the plan you paid for until that period ends, then the account drops to the free level.",
        "Ask within 14 days of any payment and we refund it in full, for any reason. The full rules are on our Refunds & Cancellation page.",
        "If a payment fails, we may retry it and may suspend paid features until it succeeds.",
        "If you ever buy through a mobile app store, that store's own refund rules apply instead.",
      ],
      "Prices are shown in US dollars. Depending on where you are, tax may be added at checkout, and your bank may convert the amount and add its own fees, which are outside our control.",
      "Prices may change. If they do, we will tell you before the change affects you, and you may cancel rather than accept it. A price change never applies to a period you have already paid for.",
    ],
  },
  {
    heading: "6. Your right to cancel (consumers in the EU, EEA and UK)",
    blocks: [
      "If you are a consumer in the EU, EEA or UK, you normally have 14 days to withdraw from a distance contract without giving a reason.",
      "Because the Service is digital content supplied immediately, you are asked at checkout to agree that we begin supplying it straight away, and to acknowledge that doing so ends the statutory withdrawal right once supply has begun.",
      "This makes no practical difference to you: our own refund policy is more generous than the statutory right, and we refund any payment in full on request within 14 days regardless of the reason or how much you have used.",
    ],
  },
  {
    heading: "7. What you may do with the Service — licence",
    blocks: [
      `We grant you a personal, limited, non-exclusive, non-transferable, non-sublicensable and revocable licence to access and use the Service and its Content for your own personal, non-commercial training, for as long as your account is in good standing and you comply with these terms.`,
      "You may:",
      [
        "Use the lessons, plans and tools for your own training.",
        "Save or print material from the Service for your own personal reference.",
      ],
      "You may not:",
      [
        "Copy, reproduce, republish, broadcast or distribute the Content, in whole or in part.",
        "Use the Content to train, fine-tune or evaluate a machine-learning model.",
        "Use the Service or its Content to coach paying clients, run classes, or operate a competing or derivative product.",
        "Remove or obscure any notice of ownership, authorship or attribution.",
        "Reverse-engineer, decompile or attempt to derive the source of any part of the Service, except to the extent that restriction is void under applicable law.",
      ],
      "This licence ends automatically if your account is closed or these terms are terminated.",
    ],
  },
  {
    heading: "8. Ownership",
    blocks: [
      `All rights in the Service — including the software, the exercise library, the written coaching material, the illustrations, the rank system, the name ${SERVICE}, and the associated branding and design — are owned by ${OPERATOR} or licensed to us, and are protected by copyright, trade mark and other intellectual property laws.`,
      "Nothing in these terms transfers any of those rights to you. Rights not expressly granted are reserved.",
      "Some components of the Service are provided by third parties under their own licences. Those components remain the property of their respective owners.",
    ],
  },
  {
    heading: "9. Your Content",
    blocks: [
      "You keep ownership of Your Content. We do not claim it.",
      "To operate the Service we need your permission to handle it. You grant us a worldwide, royalty-free, non-exclusive licence to store, process, transmit and display Your Content strictly for the purpose of providing the Service to you — for example, sending a photograph to our AI provider so it can return a result to you, or storing your profile so your plan can be generated.",
      "That licence exists only so the Service can function. It does not let us publish Your Content, sell it, share it for advertising, or use it to train AI models. It ends when you delete the content or your account, except for copies kept briefly in routine backups.",
      "You are responsible for Your Content. You confirm that you own it or have permission to submit it, and that submitting it does not break the law or anyone else's rights.",
      "Do not upload images or video of other people without their agreement, and never upload images of children.",
      "If you send us feedback or a suggestion, we may use it freely to improve the Service, without owing you anything for it.",
    ],
  },
  {
    heading: "10. AI-generated content",
    blocks: [
      "Several features — the goal analysis, nutrition plans, food photo scanning and technique review — are produced by an AI model. AI output can be wrong, incomplete or confidently mistaken. Treat it as a suggestion to sanity-check, never as an authority.",
      "The calorie and macro figures returned by the food scanner are estimates from a photograph. They are not measurements, and they should not be relied on where accuracy matters medically.",
      "The technique review looks at a handful of frames from a short video. It cannot see everything a coach standing next to you would see, and a good score is not a certification that a movement is safe for you.",
      "AI features depend on a third-party provider and may be changed, limited or withdrawn if that provider's service changes.",
      "We do not guarantee that AI output is accurate, complete, suitable for you, or free from bias or error. Section 3 applies to AI output in full.",
    ],
  },
  {
    heading: "11. Acceptable use",
    blocks: [
      "Do not:",
      [
        "Break the law, or use the Service to harm, harass, defame or impersonate anyone.",
        "Upload illegal content, or images of other people who have not agreed to it.",
        "Attempt to access accounts or data that are not yours, or probe, scan or test the security of the Service.",
        "Scrape the Service, hammer the API, or work around usage limits, paywalls or feature gates.",
        "Introduce malware, or interfere with the operation or availability of the Service.",
        "Resell, sublicense or redistribute the Service or its Content as your own.",
        "Use the Service to build a competing product, or to train a machine-learning model.",
        "Use automated means to create accounts, or create an account under a false identity.",
      ],
      "We may investigate suspected breaches and take any action we reasonably consider appropriate, including suspending or closing an account and cooperating with law enforcement.",
    ],
  },
  {
    heading: "12. Suspension and closure",
    blocks: [
      "We may suspend or close an account that breaks these terms or abuses the Service.",
      "Be aware that closing an account for abuse also permanently deletes its training history, progress and profile. That deletion cannot be reversed, and restoring access later does not restore the data.",
      "You can stop using the Service at any time. You can delete your own account, and everything attached to it, from your dashboard under Account — you do not need to ask our permission or wait for us.",
      "If we close your account without cause, and you have paid for a period that has not finished, we will refund the unused part.",
      "Sections that by their nature should survive termination — ownership, limitation of liability, indemnity and governing law — continue to apply after your account ends.",
    ],
  },
  {
    heading: "13. Third-party services",
    blocks: [
      "The Service relies on third-party providers for hosting, database storage, payment processing and AI features. Their handling of data is described in our Privacy Policy.",
      "We are not responsible for third-party services, their availability, or their own terms and policies. Where a third party is the seller — as with the merchant of record for payments — your contract for that transaction is with them.",
      "The Service may link to external sites. We do not control them and are not responsible for their content.",
    ],
  },
  {
    heading: "14. Data protection and cookies",
    blocks: [
      "How we handle personal data is set out in our Privacy Policy, which forms part of these terms.",
      "The Service uses only cookies that are strictly necessary or that remember a preference you set. It does not use advertising cookies, and does not run third-party analytics or tracking. Our Cookie Policy lists every cookie we set and what it does.",
      `You have rights over your personal data, including access, correction and deletion, and we respond to requests within ${REQUEST_DAYS} days. The Privacy Policy explains how to exercise them.`,
    ],
  },
  {
    heading: "15. Availability",
    blocks: [
      `${SERVICE} is provided as it is and as available, without any guarantee that it will be uninterrupted, timely, secure or free of errors. To the extent the law allows, we exclude all implied warranties, including fitness for a particular purpose and satisfactory quality.`,
      "We may change, suspend or discontinue features. We will try to give notice of significant changes, but we may not always be able to.",
      "We may need to take the Service down for maintenance, and access may be affected by events outside our control.",
    ],
  },
  {
    heading: "16. Limitation of liability",
    blocks: [
      "To the fullest extent the law allows, we are not liable for injury, illness, loss of data, lost profits, or any indirect, incidental, special or consequential loss arising from your use of the Service or from following guidance produced by it.",
      "Where liability cannot be excluded but can be limited, our total liability to you for all claims in any 12-month period is limited to the greater of the amount you paid us in that period, or twenty US dollars.",
      "Nothing in these terms excludes or limits liability that cannot legally be excluded — including liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that applicable law does not permit us to exclude.",
      "Some places do not allow certain limitations of liability, so parts of this section may not apply to you. If you are a consumer, your statutory rights are unaffected.",
    ],
  },
  {
    heading: "17. Indemnity",
    blocks: [
      "If someone brings a claim against us because of how you used the Service — because you broke these terms, broke the law, or infringed someone's rights — you agree to cover the reasonable losses, damages and legal costs we incur as a result.",
      "This does not apply to the extent the claim arises from our own breach or negligence, and it does not apply where you are a consumer and applicable consumer law prevents it.",
    ],
  },
  {
    heading: "18. Changes to these terms",
    blocks: [
      "We may update these terms. When we do, we will change the date at the top of this page. If a change is significant, we will make a reasonable effort to tell you in advance — for example by a notice in the Service or a message to your registered email address.",
      "Continuing to use the Service after a change takes effect means you accept the updated terms. If you do not accept them, stop using the Service and close your account; if you have paid for a period that has not finished, we will refund the unused part.",
    ],
  },
  {
    heading: "19. Events outside our control",
    blocks: [
      "We are not responsible for failing to perform where the cause is outside our reasonable control — including outages at our hosting, database, payment or AI providers, internet or power failures, natural events, epidemics, industrial action, war, sanctions, or acts of government.",
      "If such an event continues for a long period and prevents us from providing the Service, either of us may end this agreement, and we will refund any period you have paid for but not received.",
    ],
  },
  {
    heading: "20. General",
    blocks: [
      "These terms, together with the Privacy Policy, Cookie Policy and Refunds & Cancellation policy, are the entire agreement between us about the Service, and replace any earlier understanding.",
      "If any part of these terms turns out to be unenforceable, it is severed and the rest stays in force. If we do not enforce a term straight away, we have not given up the right to enforce it later.",
      "You may not transfer your rights or obligations under these terms to anyone else. We may transfer ours — for example if the business is sold — provided your rights are not reduced.",
      "There are no third-party beneficiaries to this agreement.",
      "We may send you notices by email to your registered address, or by a notice inside the Service. You can reach us using the contact details below.",
      "You must not use the Service where doing so would breach applicable export controls or sanctions, and you confirm you are not subject to such restrictions.",
    ],
  },
  {
    heading: "21. Complaints, governing law and contact",
    blocks: [
      "If something has gone wrong, contact us first — most problems are resolved quickly and directly, and we would rather fix an issue than argue about it.",
      `These terms are governed by the laws of ${GOVERNING_LAW}, and disputes will be handled by the courts there.`,
      "If you are a consumer, this does not take away the protection of the mandatory consumer laws of the country you live in, and you may bring a claim in your local courts where that law allows it. Consumers in the EU may also use the European Commission's online dispute resolution platform.",
      `For any question about these terms, your account, a refund, or your personal data: ${contactLine()}`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={[
        `These are the rules for using ${SERVICE}. They cover what you can expect from us, what we expect from you, and the limits of what a training app can safely do.`,
        "Section 3 is the one that matters most. Please read it properly before you train.",
      ]}
      sections={SECTIONS}
    />
  );
}
