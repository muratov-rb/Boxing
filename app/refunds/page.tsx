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
   it is how a refund request becomes a chargeback.

   Translated for readability; the English text is the version that governs,
   which the page says at the foot in every other language. */

const SECTIONS: Section[] = [
  {
    heading: {
      en: "Cancelling",
      ru: "Отмена подписки",
      es: "Cancelar",
      fr: "Annulation",
      zh: "取消订阅",
    },
    blocks: [
      {
        en: "You can cancel at any time, yourself, without contacting anyone. Open your dashboard, choose Manage billing, and cancel there.",
        ru: "Отменить можно в любой момент и самостоятельно, ни с кем не связываясь. Открой кабинет, выбери «Управление оплатой» и отмени там.",
        es: "Puedes cancelar cuando quieras, tú mismo, sin contactar con nadie. Abre tu panel, elige Gestionar facturación y cancela ahí.",
        fr: "Vous pouvez annuler à tout moment, vous-même, sans contacter personne. Ouvrez votre tableau de bord, choisissez Gérer la facturation et annulez là.",
        zh: "你可以随时自行取消，无需联系任何人。打开面板，选择「管理付款」，在那里取消即可。",
      },
      {
        en: "Cancelling stops the next payment. It does not end your access straight away — you keep the plan you paid for until the period you have already paid for runs out, and then the account drops to the free level. Nothing is deleted when you cancel.",
        ru: "Отмена останавливает следующий платёж. Доступ при этом не пропадает сразу: оплаченный тариф действует до конца уже оплаченного периода, а потом аккаунт переходит на бесплатный уровень. При отмене ничего не удаляется.",
        es: "Cancelar detiene el siguiente cobro. No corta tu acceso de inmediato: mantienes el plan que pagaste hasta que termine el periodo ya abonado, y después la cuenta pasa al nivel gratuito. Al cancelar no se borra nada.",
        fr: "L'annulation arrête le prochain paiement. Elle ne met pas fin à votre accès immédiatement : vous conservez la formule payée jusqu'à la fin de la période déjà réglée, puis le compte repasse au niveau gratuit. Rien n'est supprimé lors de l'annulation.",
        zh: "取消会停止下一次扣款，但不会立刻中断使用：你已付费的方案会持续到当前付费周期结束，之后账户转为免费等级。取消不会删除任何数据。",
      },
      {
        en: "There is no cancellation fee and no minimum term.",
        ru: "Никаких комиссий за отмену и никакого минимального срока.",
        es: "No hay penalización por cancelar ni permanencia mínima.",
        fr: "Aucuns frais d'annulation et aucune durée minimale.",
        zh: "没有取消费用，也没有最短使用期限。",
      },
    ],
  },
  {
    heading: {
      en: "The 14-day refund",
      ru: "Возврат в течение 14 дней",
      es: "El reembolso de 14 días",
      fr: "Le remboursement sous 14 jours",
      zh: "14 天退款",
    },
    blocks: [
      {
        en: `If you are unhappy with ${SERVICE}, ask us within 14 days of a payment and we will refund it in full. You do not have to justify the request.`,
        ru: `Если ${SERVICE} тебя не устроил, напиши нам в течение 14 дней после платежа — вернём всю сумму. Объяснять причину не нужно.`,
        es: `Si no estás contento con ${SERVICE}, pídenoslo dentro de los 14 días siguientes a un pago y te lo devolvemos íntegro. No tienes que justificar nada.`,
        fr: `Si ${SERVICE} ne vous convient pas, demandez-le dans les 14 jours suivant un paiement et nous le remboursons intégralement. Aucune justification n'est requise.`,
        zh: `如果你对 ${SERVICE} 不满意，请在付款后 14 天内联系我们，我们会全额退款。无需说明理由。`,
      },
      {
        en: "This applies to your first payment on a plan and to each renewal — if a renewal catches you by surprise, tell us within 14 days of that charge and you get it back.",
        ru: "Это касается и первого платежа по тарифу, и каждого продления: если продление стало неожиданностью, сообщи в течение 14 дней после списания — вернём.",
        es: "Se aplica tanto al primer pago de un plan como a cada renovación: si una renovación te pilla por sorpresa, avísanos dentro de los 14 días del cargo y te la devolvemos.",
        fr: "Cela vaut pour votre premier paiement sur une formule comme pour chaque renouvellement : si un renouvellement vous surprend, signalez-le dans les 14 jours suivant le prélèvement et vous êtes remboursé.",
        zh: "首次付款和每次续费都适用：如果续费扣款出乎意料，请在该笔扣款后 14 天内告诉我们，我们会退还。",
      },
      {
        en: "Consumers in the EU and UK have a statutory 14-day right to withdraw from a purchase. This policy gives everyone the same thing, wherever you live.",
        ru: "У потребителей в ЕС и Великобритании есть законное право отказаться от покупки в течение 14 дней. Эта политика даёт то же самое всем, где бы ты ни жил.",
        es: "Los consumidores de la UE y el Reino Unido tienen un derecho legal de desistimiento de 14 días. Esta política ofrece lo mismo a todo el mundo, vivas donde vivas.",
        fr: "Les consommateurs de l'UE et du Royaume-Uni disposent d'un droit légal de rétractation de 14 jours. Cette politique accorde la même chose à tous, où que vous viviez.",
        zh: "欧盟和英国的消费者依法享有 14 天的撤销权。本政策对所有人一视同仁，无论你住在哪里。",
      },
    ],
  },
  {
    heading: {
      en: "After 14 days",
      ru: "После 14 дней",
      es: "Pasados los 14 días",
      fr: "Après 14 jours",
      zh: "14 天之后",
    },
    blocks: [
      {
        en: "We will still consider a refund, and we generally say yes when something on our side went wrong — a feature that did not work, a double charge, a plan that was not what the page described.",
        ru: "Мы всё равно рассмотрим возврат и обычно соглашаемся, если проблема на нашей стороне: функция не работала, списали дважды, тариф оказался не тем, что описан на странице.",
        es: "Aun así estudiaremos el reembolso, y solemos decir que sí cuando el fallo fue nuestro: una función que no funcionaba, un cobro duplicado, un plan que no era lo que describía la página.",
        fr: "Nous étudierons quand même la demande, et nous acceptons en général lorsque le problème vient de nous : une fonctionnalité qui ne marchait pas, un double prélèvement, une formule différente de ce que la page décrivait.",
        zh: "我们仍会考虑退款，如果问题出在我们这边通常都会同意：功能不可用、重复扣款、方案与页面描述不符。",
      },
      {
        en: "What we will not usually refund is a period you used normally and simply forgot to cancel. If that is your situation, tell us anyway; we would rather sort it out than have you dispute the charge with your bank.",
        ru: "Обычно не возвращаем за период, которым ты нормально пользовался и просто забыл отменить. Но всё равно напиши — нам лучше разобраться, чем получить спор через банк.",
        es: "Lo que no solemos reembolsar es un periodo que usaste con normalidad y simplemente olvidaste cancelar. Si es tu caso, escríbenos igualmente: preferimos resolverlo antes que acabar en una disputa con tu banco.",
        fr: "Ce que nous ne remboursons généralement pas, c'est une période que vous avez utilisée normalement et que vous avez simplement oublié d'annuler. Si c'est votre cas, écrivez quand même : nous préférons régler cela plutôt qu'une contestation auprès de votre banque.",
        zh: "通常不予退款的情形是：该周期你正常使用过，只是忘了取消。即便如此也请告诉我们——我们宁愿把事情处理好，也不希望你去银行发起争议。",
      },
    ],
  },
  {
    heading: {
      en: "How to ask",
      ru: "Как попросить возврат",
      es: "Cómo pedirlo",
      fr: "Comment demander",
      zh: "如何申请",
    },
    blocks: [
      contactLine(),
      {
        en: "Tell us the email on the account and roughly when the payment was taken. That is enough — we do not need a reason.",
        ru: "Укажи почту аккаунта и примерную дату списания. Этого достаточно — причина не нужна.",
        es: "Dinos el correo de la cuenta y más o menos cuándo se hizo el cobro. Con eso basta; no necesitamos un motivo.",
        fr: "Indiquez l'e-mail du compte et la date approximative du prélèvement. Cela suffit : nous n'avons pas besoin de motif.",
        zh: "告诉我们账户邮箱和大致的扣款时间即可。不需要说明理由。",
      },
      {
        en: `We reply within ${REQUEST_DAYS} days and usually much sooner. Once approved, the refund is issued to the original payment method; how quickly it appears is up to your bank, but it is typically 5–10 working days.`,
        ru: `Отвечаем в течение ${REQUEST_DAYS} дней, обычно намного быстрее. После одобрения деньги возвращаются на исходный способ оплаты; срок зачисления зависит от банка, обычно 5–10 рабочих дней.`,
        es: `Respondemos en ${REQUEST_DAYS} días, y normalmente mucho antes. Una vez aprobado, el reembolso se emite al método de pago original; lo que tarde en aparecer depende de tu banco, pero suelen ser de 5 a 10 días hábiles.`,
        fr: `Nous répondons sous ${REQUEST_DAYS} jours, et généralement bien plus vite. Une fois accepté, le remboursement est émis vers le moyen de paiement d'origine ; le délai d'apparition dépend de votre banque, en général 5 à 10 jours ouvrés.`,
        zh: `我们会在 ${REQUEST_DAYS} 天内回复，通常快得多。批准后，退款将退回原支付方式；到账时间取决于你的银行，一般为 5–10 个工作日。`,
      },
    ],
  },
  {
    heading: {
      en: "Who actually takes the payment",
      ru: "Кто на самом деле принимает платёж",
      es: "Quién cobra realmente",
      fr: "Qui encaisse réellement le paiement",
      zh: "实际收款方是谁",
    },
    blocks: [
      {
        en: `Payments are processed by ${MERCHANT}, which acts as the merchant of record for ${SERVICE}. That is the name you will see on your bank statement, and ${MERCHANT} issues the refund on our instruction.`,
        ru: `Платежи обрабатывает ${MERCHANT} — он выступает продавцом записи для ${SERVICE}. Именно это название ты увидишь в выписке банка, и возврат ${MERCHANT} проводит по нашему указанию.`,
        es: `Los pagos los procesa ${MERCHANT}, que actúa como comerciante registrado de ${SERVICE}. Es el nombre que verás en tu extracto bancario, y ${MERCHANT} emite el reembolso siguiendo nuestras instrucciones.`,
        fr: `Les paiements sont traités par ${MERCHANT}, qui agit comme marchand officiel pour ${SERVICE}. C'est le nom qui apparaîtra sur votre relevé bancaire, et ${MERCHANT} effectue le remboursement sur notre instruction.`,
        zh: `付款由 ${MERCHANT} 处理，其作为 ${SERVICE} 的登记商户。你在银行账单上看到的就是这个名称，退款由 ${MERCHANT} 依我们的指示发起。`,
      },
      {
        en: `You can also contact ${MERCHANT} directly about a payment, and they can help with receipts and invoices. Either route works.`,
        ru: `По вопросам платежа можно обратиться и напрямую в ${MERCHANT} — там помогут с чеками и счетами. Оба пути рабочие.`,
        es: `También puedes contactar directamente con ${MERCHANT} por un pago; pueden ayudarte con recibos y facturas. Cualquiera de las dos vías sirve.`,
        fr: `Vous pouvez aussi contacter ${MERCHANT} directement au sujet d'un paiement ; ils peuvent vous aider pour les reçus et les factures. Les deux voies fonctionnent.`,
        zh: `你也可以就付款问题直接联系 ${MERCHANT}，他们可以协助提供收据和发票。两种方式都可以。`,
      },
    ],
  },
  {
    heading: {
      en: "Free trial",
      ru: "Бесплатный период",
      es: "Prueba gratuita",
      fr: "Essai gratuit",
      zh: "免费试用",
    },
    blocks: [
      {
        en: "The 7-day trial does not ask for a card and does not charge you. When it ends, nothing is taken — the account simply drops to the free level until you choose to pay. There is nothing to cancel and nothing to refund.",
        ru: "7-дневный пробный период не требует карты и ничего не списывает. Когда он заканчивается, деньги не берутся: аккаунт просто переходит на бесплатный уровень, пока ты сам не решишь оплатить. Отменять и возвращать нечего.",
        es: "La prueba de 7 días no pide tarjeta ni te cobra. Cuando termina no se cobra nada: la cuenta simplemente pasa al nivel gratuito hasta que decidas pagar. No hay nada que cancelar ni que reembolsar.",
        fr: "L'essai de 7 jours ne demande pas de carte et ne vous facture rien. À la fin, rien n'est prélevé : le compte repasse simplement au niveau gratuit jusqu'à ce que vous choisissiez de payer. Il n'y a rien à annuler ni à rembourser.",
        zh: "7 天试用不需要银行卡，也不会扣费。试用结束时不会有任何扣款——账户只是转为免费等级，直到你自己决定付费。没有什么需要取消，也没有什么需要退款。",
      },
    ],
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      title={{
        en: "Refunds & Cancellation",
        ru: "Возвраты и отмена",
        es: "Reembolsos y cancelación",
        fr: "Remboursements et annulation",
        zh: "退款与取消",
      }}
      intro={[
        {
          en: "Cancel whenever you like, and ask for your money back within 14 days for any reason at all.",
          ru: "Отменяй когда угодно и проси деньги назад в течение 14 дней — по любой причине.",
          es: "Cancela cuando quieras y pide que te devolvamos el dinero dentro de 14 días, por el motivo que sea.",
          fr: "Annulez quand vous voulez, et demandez à être remboursé sous 14 jours, pour n'importe quelle raison.",
          zh: "随时可以取消，并且可在 14 天内以任何理由申请退款。",
        },
        {
          en: "This page is short on purpose. A refund policy you need a lawyer to read is not a refund policy.",
          ru: "Эта страница намеренно короткая. Политика возврата, для чтения которой нужен юрист, — не политика возврата.",
          es: "Esta página es corta a propósito. Una política de reembolso que necesita un abogado para entenderse no es una política de reembolso.",
          fr: "Cette page est courte volontairement. Une politique de remboursement qu'il faut un avocat pour lire n'en est pas une.",
          zh: "本页刻意写得很短。需要律师才能读懂的退款政策，算不上退款政策。",
        },
      ]}
      sections={SECTIONS}
    />
  );
}
