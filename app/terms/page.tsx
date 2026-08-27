import type { Metadata } from "next";
import { LegalPage, type Loc, type Section } from "@/components/legal/LegalPage";
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
   change can never leave the terms quoting a number we no longer charge.

   Headings carry no number of their own: LegalPage numbers them from their
   position. They used to be written as "1. Definitions" as well, which
   rendered as "1. 1. Definitions" on every one of the twenty-one sections.

   Translated for readability; the English text is the version that governs,
   which the page states at the foot in every other language. */

const priceRow = (id: "budget" | "pro" | "max", name: string): Loc => {
  const m = priceLabel(PRICES[id]);
  const y = priceLabel(PRICES_YEARLY[id]);
  return {
    en: `${name} — ${m} per month, or ${y} per year.`,
    ru: `${name} — ${m} в месяц или ${y} в год.`,
    es: `${name}: ${m} al mes, o ${y} al año.`,
    fr: `${name} — ${m} par mois, ou ${y} par an.`,
    zh: `${name}——每月 ${m}，或每年 ${y}。`,
  };
};

const contact = contactLine();

const SECTIONS: Section[] = [
  {
    heading: {
      en: "Definitions",
      ru: "Определения",
      es: "Definiciones",
      fr: "Définitions",
      zh: "定义",
    },
    blocks: [
      {
        en: "A few words are used throughout with a specific meaning:",
        ru: "Несколько слов используются здесь в особом значении:",
        es: "A lo largo del texto, algunas palabras tienen un significado concreto:",
        fr: "Quelques mots sont employés ici avec un sens précis :",
        zh: "以下几个词在全文中具有特定含义：",
      },
      [
        {
          en: `"We", "us", "our" — ${OPERATOR}, the operator of ${SERVICE}.`,
          ru: `«Мы», «нас», «наш» — ${OPERATOR}, оператор ${SERVICE}.`,
          es: `«Nosotros», «nos», «nuestro»: ${OPERATOR}, el operador de ${SERVICE}.`,
          fr: `« Nous », « notre » — ${OPERATOR}, l'exploitant de ${SERVICE}.`,
          zh: `「我们」「我方」——${OPERATOR}，即 ${SERVICE} 的运营方。`,
        },
        {
          en: `"Service" — the ${SERVICE} website at ${SITE}, together with every feature, lesson, plan and tool available through it.`,
          ru: `«Сервис» — сайт ${SERVICE} по адресу ${SITE} вместе со всеми функциями, уроками, планами и инструментами в нём.`,
          es: `«Servicio»: el sitio web de ${SERVICE} en ${SITE}, junto con todas las funciones, lecciones, planes y herramientas disponibles en él.`,
          fr: `« Service » — le site ${SERVICE} à l'adresse ${SITE}, ainsi que l'ensemble des fonctionnalités, leçons, plans et outils qui y sont proposés.`,
          zh: `「本服务」——位于 ${SITE} 的 ${SERVICE} 网站，及其提供的所有功能、课程、计划和工具。`,
        },
        {
          en: `"You" — the person holding an account, or otherwise using the Service.`,
          ru: `«Ты» — человек, у которого есть аккаунт, или иным образом использующий Сервис.`,
          es: `«Tú»: la persona que tiene una cuenta o que usa el Servicio de cualquier otro modo.`,
          fr: `« Vous » — la personne titulaire d'un compte, ou utilisant le Service de toute autre manière.`,
          zh: `「你」——持有账户或以其他方式使用本服务的个人。`,
        },
        {
          en: `"Content" — text, images, video, exercise data, training plans and any other material made available through the Service.`,
          ru: `«Контент» — тексты, изображения, видео, данные упражнений, планы тренировок и любые другие материалы, доступные через Сервис.`,
          es: `«Contenido»: textos, imágenes, vídeo, datos de ejercicios, planes de entrenamiento y cualquier otro material disponible a través del Servicio.`,
          fr: `« Contenu » — textes, images, vidéos, données d'exercices, plans d'entraînement et tout autre élément mis à disposition via le Service.`,
          zh: `「内容」——通过本服务提供的文字、图片、视频、动作数据、训练计划及其他任何材料。`,
        },
        {
          en: `"Your Content" — anything you upload, submit or enter, including photographs, video, and the figures in your profile.`,
          ru: `«Твой контент» — всё, что ты загружаешь, отправляешь или вводишь, включая фотографии, видео и цифры в профиле.`,
          es: `«Tu Contenido»: todo lo que subas, envíes o introduzcas, incluidas fotografías, vídeo y las cifras de tu perfil.`,
          fr: `« Votre Contenu » — tout ce que vous téléversez, soumettez ou saisissez, y compris photographies, vidéos et les chiffres de votre profil.`,
          zh: `「你的内容」——你上传、提交或填写的一切，包括照片、视频以及个人档案中的数据。`,
        },
        {
          en: `"Merchant of record" — ${MERCHANT}, the company that legally sells the subscription to you, charges your payment method and accounts for sales tax.`,
          ru: `«Продавец записи» — ${MERCHANT}, компания, которая юридически продаёт тебе подписку, списывает оплату и отчитывается по налогу с продаж.`,
          es: `«Comerciante registrado»: ${MERCHANT}, la empresa que te vende legalmente la suscripción, cobra tu método de pago y responde del impuesto sobre ventas.`,
          fr: `« Marchand officiel » — ${MERCHANT}, la société qui vous vend juridiquement l'abonnement, débite votre moyen de paiement et acquitte la taxe sur les ventes.`,
          zh: `「登记商户」——${MERCHANT}，即在法律上向你销售订阅、向你的支付方式扣款并申报销售税的公司。`,
        },
      ],
    ],
  },
  {
    heading: {
      en: "Agreeing to these terms",
      ru: "Согласие с этими условиями",
      es: "Aceptación de estos términos",
      fr: "Acceptation des présentes conditions",
      zh: "接受本条款",
    },
    blocks: [
      {
        en: `These terms are a binding agreement between you and ${OPERATOR}, who operates ${SERVICE} at ${SITE}. By ticking the box at sign-up, creating an account, or otherwise using the Service, you accept them. If you do not accept them, do not use the Service.`,
        ru: `Эти условия — обязывающее соглашение между тобой и ${OPERATOR}, который ведёт ${SERVICE} на ${SITE}. Отмечая галочку при регистрации, создавая аккаунт или иначе пользуясь Сервисом, ты их принимаешь. Не согласен — не пользуйся Сервисом.`,
        es: `Estos términos son un acuerdo vinculante entre tú y ${OPERATOR}, que opera ${SERVICE} en ${SITE}. Al marcar la casilla al registrarte, crear una cuenta o usar el Servicio de cualquier otro modo, los aceptas. Si no los aceptas, no uses el Servicio.`,
        fr: `Les présentes conditions constituent un accord contraignant entre vous et ${OPERATOR}, qui exploite ${SERVICE} à l'adresse ${SITE}. En cochant la case lors de l'inscription, en créant un compte ou en utilisant le Service de toute autre manière, vous les acceptez. Si vous ne les acceptez pas, n'utilisez pas le Service.`,
        zh: `本条款是你与 ${OPERATOR}（在 ${SITE} 运营 ${SERVICE}）之间具有约束力的协议。当你在注册时勾选选框、创建账户或以其他方式使用本服务，即表示接受本条款。若不接受，请勿使用本服务。`,
      },
      {
        en: `You must be at least ${MIN_AGE} years old to hold an account. If the age of digital consent where you live is higher than ${MIN_AGE}, that higher age applies to you instead.`,
        ru: `Чтобы иметь аккаунт, тебе должно быть не меньше ${MIN_AGE} лет. Если возраст цифрового согласия в твоей стране выше ${MIN_AGE}, применяется он.`,
        es: `Debes tener al menos ${MIN_AGE} años para tener una cuenta. Si la edad de consentimiento digital donde vives es superior a ${MIN_AGE}, se aplica esa edad más alta.`,
        fr: `Vous devez avoir au moins ${MIN_AGE} ans pour détenir un compte. Si l'âge du consentement numérique là où vous vivez est supérieur à ${MIN_AGE} ans, c'est cet âge qui s'applique.`,
        zh: `你必须年满 ${MIN_AGE} 岁才能持有账户。如果你所在地的数字同意年龄高于 ${MIN_AGE} 岁，则以该更高年龄为准。`,
      },
      {
        en: "By accepting, you confirm that the information you give us is accurate, that you are using the Service for your own personal training, and that you are legally able to enter into this agreement.",
        ru: "Принимая условия, ты подтверждаешь, что данные, которые ты сообщаешь, достоверны, что пользуешься Сервисом для собственных тренировок и что вправе заключить это соглашение.",
        es: "Al aceptar, confirmas que la información que nos das es exacta, que usas el Servicio para tu propio entrenamiento personal y que tienes capacidad legal para celebrar este acuerdo.",
        fr: "En acceptant, vous confirmez que les informations que vous nous fournissez sont exactes, que vous utilisez le Service pour votre entraînement personnel et que vous avez la capacité juridique de conclure cet accord.",
        zh: "接受即表示你确认所提供的信息真实准确，你为自己的个人训练使用本服务，并且在法律上有能力订立本协议。",
      },
      {
        en: "These terms should be read together with our Privacy Policy and Refunds & Cancellation policy, each of which forms part of this agreement.",
        ru: "Эти условия следует читать вместе с Политикой конфиденциальности и Политикой возвратов и отмены — каждая из них является частью соглашения.",
        es: "Estos términos deben leerse junto con nuestra Política de privacidad y nuestra política de Reembolsos y cancelación, que forman parte de este acuerdo.",
        fr: "Les présentes conditions doivent être lues conjointement avec notre Politique de confidentialité et notre politique de Remboursements et annulation, qui font partie intégrante de cet accord.",
        zh: "本条款应与我们的隐私政策以及退款与取消政策一并阅读，二者均构成本协议的一部分。",
      },
    ],
  },
  {
    heading: {
      en: "Health and safety — read this one",
      ru: "Здоровье и безопасность — прочитай этот раздел",
      es: "Salud y seguridad: lee esta sección",
      fr: "Santé et sécurité — à lire absolument",
      zh: "健康与安全——请务必阅读本节",
    },
    blocks: [
      {
        en: `${SERVICE} provides general fitness and boxing training information. It is not medical advice, it is not a diagnosis, it is not physiotherapy, and it is not a substitute for a doctor, a physiotherapist, a dietitian or a qualified coach who can see you in person.`,
        ru: `${SERVICE} даёт общую информацию о фитнесе и боксёрских тренировках. Это не медицинская консультация, не диагноз, не физиотерапия и не замена врачу, физиотерапевту, диетологу или квалифицированному тренеру, который видит тебя лично.`,
        es: `${SERVICE} ofrece información general sobre fitness y entrenamiento de boxeo. No es consejo médico, no es un diagnóstico, no es fisioterapia y no sustituye a un médico, un fisioterapeuta, un dietista ni un entrenador cualificado que pueda verte en persona.`,
        fr: `${SERVICE} fournit des informations générales sur le fitness et l'entraînement à la boxe. Il ne s'agit pas d'un avis médical, ni d'un diagnostic, ni de kinésithérapie, et cela ne remplace pas un médecin, un kinésithérapeute, un diététicien ou un entraîneur qualifié pouvant vous voir en personne.`,
        zh: `${SERVICE} 提供的是一般性的健身与拳击训练信息。它不是医疗建议、不是诊断、不是理疗，也不能替代能够当面观察你的医生、理疗师、营养师或合格教练。`,
      },
      {
        en: "Nothing in the Service is intended to diagnose, treat, cure or prevent any disease or condition. No content here should be read as a prescription, a treatment plan, or a recommendation to start, stop or change any medication or medical treatment.",
        ru: "Ничто в Сервисе не предназначено для диагностики, лечения, излечения или профилактики какого-либо заболевания или состояния. Никакой контент здесь нельзя воспринимать как назначение, план лечения или рекомендацию начать, прекратить или изменить приём лекарств либо лечение.",
        es: "Nada en el Servicio pretende diagnosticar, tratar, curar ni prevenir ninguna enfermedad o afección. Ningún contenido de aquí debe interpretarse como una receta, un plan de tratamiento ni una recomendación para iniciar, interrumpir o cambiar cualquier medicación o tratamiento médico.",
        fr: "Rien dans le Service ne vise à diagnostiquer, traiter, guérir ou prévenir une maladie ou un trouble. Aucun contenu ici ne doit être lu comme une ordonnance, un plan de traitement ou une recommandation de commencer, d'arrêter ou de modifier un médicament ou un traitement médical.",
        zh: "本服务中的任何内容均无意用于诊断、治疗、治愈或预防任何疾病或状况。此处任何内容都不应被理解为处方、治疗方案，或开始、停止、更改任何药物或医疗治疗的建议。",
      },
      {
        en: "Boxing and physical training carry a real and inherent risk of injury, including serious injury and, in rare cases, death. That risk cannot be removed by any app.",
        ru: "Бокс и физические тренировки несут реальный и неотъемлемый риск травм, включая серьёзные, а в редких случаях — смерть. Ни одно приложение не может убрать этот риск.",
        es: "El boxeo y el entrenamiento físico conllevan un riesgo real e inherente de lesión, incluidas lesiones graves y, en casos raros, la muerte. Ninguna app puede eliminar ese riesgo.",
        fr: "La boxe et l'entraînement physique comportent un risque réel et inhérent de blessure, y compris de blessure grave et, dans de rares cas, de décès. Aucune application ne peut supprimer ce risque.",
        zh: "拳击和体能训练本身就存在真实的受伤风险，包括严重受伤，极少数情况下甚至死亡。任何应用都无法消除这一风险。",
      },
      {
        en: "Before you start:",
        ru: "Прежде чем начать:",
        es: "Antes de empezar:",
        fr: "Avant de commencer :",
        zh: "开始之前：",
      },
      [
        {
          en: "Talk to a doctor before beginning any new training programme, particularly if you have a heart condition, high blood pressure, a joint, bone or back problem, are pregnant or recently gave birth, are recovering from injury or surgery, have an eating disorder or history of one, are taking medication, or have any medical condition at all.",
          ru: "Поговори с врачом до начала любой новой программы, особенно если у тебя болезнь сердца, высокое давление, проблемы с суставами, костями или спиной, если ты беременна или недавно родила, восстанавливаешься после травмы или операции, есть расстройство пищевого поведения или было в прошлом, принимаешь лекарства или имеешь любое медицинское состояние.",
          es: "Habla con un médico antes de empezar cualquier programa de entrenamiento nuevo, sobre todo si tienes una afección cardíaca, hipertensión, problemas de articulaciones, huesos o espalda, estás embarazada o has dado a luz recientemente, te recuperas de una lesión o cirugía, tienes o has tenido un trastorno alimentario, tomas medicación o padeces cualquier condición médica.",
          fr: "Parlez à un médecin avant de commencer tout nouveau programme d'entraînement, en particulier si vous avez une maladie cardiaque, de l'hypertension, un problème articulaire, osseux ou dorsal, si vous êtes enceinte ou venez d'accoucher, si vous vous remettez d'une blessure ou d'une opération, si vous souffrez ou avez souffert d'un trouble alimentaire, si vous prenez des médicaments, ou si vous avez la moindre affection médicale.",
          zh: "开始任何新的训练计划前请咨询医生，尤其是当你有心脏疾病、高血压、关节、骨骼或背部问题，处于孕期或刚生产不久，正在从伤病或手术中恢复，患有或曾患进食障碍，正在服药，或有任何身体疾病时。",
        },
        {
          en: "Talk to a doctor before following any nutrition or calorie guidance, especially if you have diabetes, kidney or liver disease, a history of disordered eating, or any dietary condition.",
          ru: "Поговори с врачом до того, как следовать любым рекомендациям по питанию или калориям, особенно при диабете, болезнях почек или печени, при расстройствах пищевого поведения в анамнезе или любых диетических состояниях.",
          es: "Habla con un médico antes de seguir cualquier orientación nutricional o de calorías, especialmente si tienes diabetes, enfermedad renal o hepática, antecedentes de alimentación desordenada o cualquier condición dietética.",
          fr: "Parlez à un médecin avant de suivre tout conseil nutritionnel ou calorique, en particulier si vous êtes diabétique, souffrez d'une maladie rénale ou hépatique, avez des antécédents de troubles alimentaires ou toute condition diététique.",
          zh: "在遵循任何营养或热量建议之前请咨询医生，尤其是当你患有糖尿病、肾病或肝病、有饮食失调史，或有任何饮食相关状况时。",
        },
        {
          en: "Stop immediately if you feel pain, dizziness, faintness, chest tightness, irregular heartbeat or shortness of breath, and seek medical attention.",
          ru: "Немедленно прекрати при боли, головокружении, слабости, стеснении в груди, неровном сердцебиении или одышке — и обратись за медицинской помощью.",
          es: "Detente de inmediato si sientes dolor, mareo, desvanecimiento, opresión en el pecho, latidos irregulares o falta de aire, y busca atención médica.",
          fr: "Arrêtez immédiatement en cas de douleur, vertige, malaise, oppression thoracique, rythme cardiaque irrégulier ou essoufflement, et consultez un médecin.",
          zh: "如出现疼痛、头晕、眩晕、胸闷、心律不齐或呼吸急促，请立即停止并就医。",
        },
        {
          en: "Train within your own ability. Progress the intensity gradually. Do not train through pain.",
          ru: "Тренируйся в пределах своих возможностей. Повышай интенсивность постепенно. Не тренируйся через боль.",
          es: "Entrena dentro de tus posibilidades. Aumenta la intensidad de forma gradual. No entrenes con dolor.",
          fr: "Entraînez-vous dans les limites de vos capacités. Augmentez l'intensité progressivement. Ne vous entraînez pas malgré la douleur.",
          zh: "在自身能力范围内训练。逐步提高强度。不要忍痛训练。",
        },
        {
          en: "Make sure your training space is clear, your surface is stable, and any equipment you use is sound and correctly set up.",
          ru: "Убедись, что место для тренировки свободно, поверхность устойчива, а оборудование исправно и правильно установлено.",
          es: "Asegúrate de que tu espacio de entrenamiento esté despejado, la superficie sea estable y cualquier equipo que uses esté en buen estado y bien montado.",
          fr: "Assurez-vous que votre espace d'entraînement est dégagé, que le sol est stable et que tout matériel utilisé est en bon état et correctement installé.",
          zh: "确保训练空间无障碍物、地面稳固，所使用的任何器材完好且安装正确。",
        },
      ],
      {
        en: "You acknowledge and voluntarily accept these risks. You take part at your own risk, and you are solely responsible for deciding whether any exercise, session or nutritional suggestion is appropriate for you.",
        ru: "Ты признаёшь и добровольно принимаешь эти риски. Ты участвуешь на свой страх и риск и сам несёшь ответственность за решение, подходит ли тебе то или иное упражнение, тренировка или рекомендация по питанию.",
        es: "Reconoces y aceptas voluntariamente estos riesgos. Participas bajo tu propia responsabilidad y eres el único responsable de decidir si un ejercicio, sesión o sugerencia nutricional es adecuado para ti.",
        fr: "Vous reconnaissez et acceptez volontairement ces risques. Vous participez à vos propres risques et êtes seul responsable de décider si un exercice, une séance ou une suggestion nutritionnelle vous convient.",
        zh: "你知悉并自愿接受这些风险。你自行承担参与风险，并独自负责判断某项动作、训练课或营养建议是否适合自己。",
      },
      {
        en: "If you are under 18, do not use the Service without the involvement and agreement of a parent or guardian.",
        ru: "Если тебе нет 18, не пользуйся Сервисом без участия и согласия родителя или опекуна.",
        es: "Si eres menor de 18 años, no uses el Servicio sin la participación y el consentimiento de un padre o tutor.",
        fr: "Si vous avez moins de 18 ans, n'utilisez pas le Service sans l'implication et l'accord d'un parent ou tuteur.",
        zh: "如果你未满 18 岁，请勿在没有家长或监护人参与和同意的情况下使用本服务。",
      },
      {
        en: "On results: we do not promise any particular outcome. Fitness results depend on genetics, age, starting point, sleep, stress, diet, injury history, consistency and much else that no app can see or control, and two people following the same plan will not get the same result.",
        ru: "О результатах: мы не обещаем какого-либо конкретного исхода. Результаты зависят от генетики, возраста, стартовой точки, сна, стресса, питания, истории травм, регулярности и множества других вещей, которых приложение не видит и не контролирует. Два человека по одному плану не получат одинаковый результат.",
        es: "Sobre los resultados: no prometemos ningún resultado concreto. Los resultados dependen de la genética, la edad, el punto de partida, el sueño, el estrés, la dieta, el historial de lesiones, la constancia y mucho más que ninguna app puede ver ni controlar; dos personas con el mismo plan no obtendrán el mismo resultado.",
        fr: "Concernant les résultats : nous ne promettons aucun résultat particulier. Les résultats dépendent de la génétique, de l'âge, du point de départ, du sommeil, du stress, de l'alimentation, des antécédents de blessures, de la régularité et de bien d'autres facteurs qu'aucune application ne peut voir ni contrôler ; deux personnes suivant le même plan n'obtiendront pas le même résultat.",
        zh: "关于效果：我们不承诺任何特定结果。健身效果取决于基因、年龄、起点、睡眠、压力、饮食、伤病史、坚持程度以及许多应用无法察觉或控制的因素；两个人执行同一份计划不会得到相同结果。",
      },
      {
        en: "When you give a goal and a deadline, the Service estimates how realistic that combination looks and shows a percentage. That figure is an illustration produced from your own numbers, not a forecast, not a promise, and not a professional assessment. A high score is not a guarantee you will succeed, and a low one is not a verdict that you cannot — it is there to help you set a sensible timeframe, and you should treat it that way.",
        ru: "Когда ты задаёшь цель и срок, Сервис оценивает, насколько это сочетание реалистично, и показывает процент. Эта цифра — иллюстрация на основе твоих же чисел, а не прогноз, не обещание и не профессиональная оценка. Высокий балл не гарантирует успех, а низкий не приговор — он нужен, чтобы помочь выбрать разумный срок, и относиться к нему стоит именно так.",
        es: "Cuando indicas un objetivo y un plazo, el Servicio estima cómo de realista parece esa combinación y muestra un porcentaje. Esa cifra es una ilustración calculada a partir de tus propios números; no es una previsión, ni una promesa, ni una valoración profesional. Una puntuación alta no garantiza que lo consigas, y una baja no dictamina que no puedas: está ahí para ayudarte a fijar un plazo sensato, y así deberías tomártela.",
        fr: "Lorsque vous indiquez un objectif et une échéance, le Service estime le réalisme de cette combinaison et affiche un pourcentage. Ce chiffre est une illustration calculée à partir de vos propres données : ce n'est ni une prévision, ni une promesse, ni une évaluation professionnelle. Un score élevé ne garantit pas la réussite, un score faible n'est pas un verdict d'échec — il sert à vous aider à fixer une échéance raisonnable, et c'est ainsi qu'il faut le comprendre.",
        zh: "当你设定目标和期限时，本服务会评估这一组合的现实程度并显示一个百分比。该数字是根据你自己的数据得出的示意值，不是预测、不是承诺，也不是专业评估。分数高不保证你会成功，分数低也不是你做不到的定论——它的作用是帮你设定合理的时间安排，也应当这样看待它。",
      },
      {
        en: "Calorie, macronutrient and energy-burn figures throughout the Service are estimates from standard formulas and typical values. They are not measurements of your body, and real figures vary from person to person and from day to day.",
        ru: "Значения калорий, макронутриентов и расхода энергии в Сервисе — оценки по стандартным формулам и типичным величинам. Это не измерения твоего тела; реальные цифры различаются от человека к человеку и изо дня в день.",
        es: "Las cifras de calorías, macronutrientes y gasto energético que aparecen en el Servicio son estimaciones basadas en fórmulas estándar y valores típicos. No son mediciones de tu cuerpo, y las cifras reales varían de una persona a otra y de un día a otro.",
        fr: "Les chiffres de calories, de macronutriments et de dépense énergétique présentés dans le Service sont des estimations issues de formules standard et de valeurs typiques. Ce ne sont pas des mesures de votre corps, et les valeurs réelles varient d'une personne à l'autre et d'un jour à l'autre.",
        zh: "本服务中的热量、宏量营养素和能量消耗数值均为依据标准公式和典型数值得出的估算。它们并非对你身体的实测，实际数值因人而异、逐日不同。",
      },
    ],
  },
  {
    heading: {
      en: "Your account",
      ru: "Твой аккаунт",
      es: "Tu cuenta",
      fr: "Votre compte",
      zh: "你的账户",
    },
    blocks: [
      {
        en: "You are responsible for keeping your password secret and for everything that happens under your account. Give accurate information when you sign up — the training and nutrition targets are calculated from what you enter, so wrong figures produce wrong guidance.",
        ru: "Ты отвечаешь за сохранность пароля и за всё, что происходит под твоим аккаунтом. Указывай точные данные при регистрации: цели по тренировкам и питанию считаются из того, что ты вводишь, поэтому неверные цифры дадут неверные рекомендации.",
        es: "Eres responsable de mantener tu contraseña en secreto y de todo lo que ocurra en tu cuenta. Da información exacta al registrarte: los objetivos de entrenamiento y nutrición se calculan a partir de lo que introduces, así que unas cifras erróneas producen recomendaciones erróneas.",
        fr: "Vous êtes responsable de la confidentialité de votre mot de passe et de tout ce qui se passe sur votre compte. Donnez des informations exactes à l'inscription : les objectifs d'entraînement et de nutrition sont calculés à partir de ce que vous saisissez, de mauvais chiffres produisent donc de mauvais conseils.",
        zh: "你有责任保管好自己的密码，并对账户下发生的一切负责。注册时请提供准确信息——训练和营养目标是根据你填写的内容计算的，错误的数据会得出错误的建议。",
      },
      {
        en: "One account per person. Do not share your account, sell it, or let someone else use it.",
        ru: "Один аккаунт на человека. Не передавай его, не продавай и не давай пользоваться другим.",
        es: "Una cuenta por persona. No compartas tu cuenta, no la vendas ni dejes que la use otra persona.",
        fr: "Un compte par personne. Ne partagez pas votre compte, ne le vendez pas et ne laissez personne d'autre l'utiliser.",
        zh: "每人一个账户。请勿分享、出售账户，也不要让他人使用。",
      },
      {
        en: "Tell us straight away if you think someone else has access to your account.",
        ru: "Сразу сообщи нам, если считаешь, что доступ к аккаунту получил кто-то ещё.",
        es: "Avísanos de inmediato si crees que otra persona tiene acceso a tu cuenta.",
        fr: "Prévenez-nous immédiatement si vous pensez qu'une autre personne a accès à votre compte.",
        zh: "如果你认为他人获得了你账户的访问权限，请立即告知我们。",
      },
      {
        en: "We may need to contact you about your account, security, or changes to the Service. Those messages are part of the Service and are not marketing.",
        ru: "Иногда нам нужно связаться с тобой по поводу аккаунта, безопасности или изменений в Сервисе. Такие сообщения — часть Сервиса, а не реклама.",
        es: "Puede que necesitemos contactarte sobre tu cuenta, la seguridad o cambios en el Servicio. Esos mensajes forman parte del Servicio y no son publicidad.",
        fr: "Nous pouvons avoir besoin de vous contacter au sujet de votre compte, de la sécurité ou de modifications du Service. Ces messages font partie du Service et ne constituent pas de la publicité.",
        zh: "我们可能需要就你的账户、安全或本服务的变更与你联系。此类消息属于服务的一部分，不是营销信息。",
      },
    ],
  },
  {
    heading: {
      en: "Plans, trials and payment",
      ru: "Тарифы, пробный период и оплата",
      es: "Planes, pruebas y pago",
      fr: "Formules, essais et paiement",
      zh: "方案、试用与付款",
    },
    blocks: [
      {
        en: "New accounts get a 7-day free trial with Budget-level access. When the trial ends, the account stays usable at a reduced level until you choose a paid plan. No payment details are required for the trial and it does not convert into a paid plan by itself.",
        ru: "Новые аккаунты получают 7-дневный бесплатный период с доступом уровня Budget. По его окончании аккаунт остаётся рабочим на урезанном уровне, пока ты не выберешь платный тариф. Платёжные данные для пробного периода не нужны, и сам по себе он в платный тариф не переходит.",
        es: "Las cuentas nuevas tienen 7 días de prueba gratuita con acceso de nivel Budget. Cuando termina la prueba, la cuenta sigue siendo utilizable en un nivel reducido hasta que elijas un plan de pago. La prueba no requiere datos de pago y no se convierte por sí sola en un plan de pago.",
        fr: "Les nouveaux comptes bénéficient d'un essai gratuit de 7 jours avec un accès de niveau Budget. À la fin de l'essai, le compte reste utilisable à un niveau réduit jusqu'à ce que vous choisissiez une formule payante. Aucune information de paiement n'est requise pour l'essai, et celui-ci ne se transforme pas de lui-même en abonnement payant.",
        zh: "新账户可享 7 天免费试用，权限为 Budget 级别。试用结束后，账户仍可在较低级别下使用，直到你选择付费方案。试用无需提供支付信息，也不会自动转为付费方案。",
      },
      {
        en: "Paid plans are:",
        ru: "Платные тарифы:",
        es: "Los planes de pago son:",
        fr: "Les formules payantes sont :",
        zh: "付费方案如下：",
      },
      [priceRow("budget", "Budget"), priceRow("pro", "Pro"), priceRow("max", "Max")],
      {
        en: "Yearly plans are billed once for the year and give the same features as the monthly plan at a lower effective rate.",
        ru: "Годовые тарифы оплачиваются один раз за год и дают те же функции, что и месячные, но по более выгодной ставке.",
        es: "Los planes anuales se cobran una vez al año y ofrecen las mismas funciones que el mensual a una tarifa efectiva menor.",
        fr: "Les formules annuelles sont facturées une fois pour l'année et offrent les mêmes fonctionnalités que la formule mensuelle à un tarif effectif plus bas.",
        zh: "年度方案按年一次性收费，功能与月度方案相同，但实际单价更低。",
      },
      {
        en: `Payments are handled by ${MERCHANT}, which acts as the merchant of record for ${SERVICE}. ${MERCHANT} is the seller on your invoice, charges your payment method and remits any sales tax or VAT due. ${MERCHANT} is the name that appears on your bank statement, and we never see or hold your card details. Your purchase is additionally subject to ${MERCHANT}'s own buyer terms, presented at checkout.`,
        ru: `Платежи обрабатывает ${MERCHANT}, выступая продавцом записи для ${SERVICE}. ${MERCHANT} указан продавцом в счёте, списывает оплату и перечисляет налог с продаж или НДС. Именно название ${MERCHANT} появится в банковской выписке, а данные твоей карты мы не видим и не храним. К покупке дополнительно применяются собственные условия покупателя ${MERCHANT}, показываемые при оформлении.`,
        es: `Los pagos los gestiona ${MERCHANT}, que actúa como comerciante registrado de ${SERVICE}. ${MERCHANT} es el vendedor en tu factura, cobra tu método de pago y liquida el impuesto sobre ventas o el IVA que corresponda. ${MERCHANT} es el nombre que aparece en tu extracto bancario, y nosotros nunca vemos ni conservamos los datos de tu tarjeta. Tu compra está sujeta además a los términos de comprador de ${MERCHANT}, que se muestran al finalizar la compra.`,
        fr: `Les paiements sont gérés par ${MERCHANT}, qui agit comme marchand officiel pour ${SERVICE}. ${MERCHANT} est le vendeur figurant sur votre facture, débite votre moyen de paiement et reverse la taxe sur les ventes ou la TVA due. ${MERCHANT} est le nom qui apparaît sur votre relevé bancaire, et nous ne voyons ni ne conservons jamais vos données de carte. Votre achat est en outre soumis aux conditions acheteur propres à ${MERCHANT}, présentées au moment du paiement.`,
        zh: `付款由 ${MERCHANT} 处理，其作为 ${SERVICE} 的登记商户。${MERCHANT} 是你发票上的卖方，负责向你的支付方式扣款并缴纳应付的销售税或增值税。你的银行账单上显示的是 ${MERCHANT} 的名称，我们从不查看或保存你的卡片信息。你的购买还须遵守 ${MERCHANT} 在结账时展示的买家条款。`,
      },
      {
        en: "How billing works:",
        ru: "Как устроена оплата:",
        es: "Cómo funciona la facturación:",
        fr: "Comment fonctionne la facturation :",
        zh: "计费方式：",
      },
      [
        {
          en: "Subscriptions renew automatically at the end of each period until you cancel.",
          ru: "Подписки продлеваются автоматически в конце каждого периода, пока ты не отменишь.",
          es: "Las suscripciones se renuevan automáticamente al final de cada periodo hasta que canceles.",
          fr: "Les abonnements se renouvellent automatiquement à la fin de chaque période jusqu'à annulation.",
          zh: "订阅会在每个周期结束时自动续期，直到你取消为止。",
        },
        {
          en: "You can cancel at any time from your dashboard — no email, no notice period, no fee.",
          ru: "Отменить можно в любой момент в кабинете — без писем, без срока уведомления, без комиссии.",
          es: "Puedes cancelar cuando quieras desde tu panel: sin correos, sin preaviso y sin comisiones.",
          fr: "Vous pouvez annuler à tout moment depuis votre tableau de bord — sans e-mail, sans préavis, sans frais.",
          zh: "你可以随时在面板中取消——无需发邮件、无需提前通知、不收取费用。",
        },
        {
          en: "Cancelling stops the next payment. You keep the plan you paid for until that period ends, then the account drops to the free level.",
          ru: "Отмена останавливает следующий платёж. Оплаченный тариф действует до конца периода, затем аккаунт переходит на бесплатный уровень.",
          es: "Cancelar detiene el siguiente cobro. Mantienes el plan que pagaste hasta que termine ese periodo, y después la cuenta pasa al nivel gratuito.",
          fr: "L'annulation arrête le prochain paiement. Vous conservez la formule payée jusqu'à la fin de la période, puis le compte repasse au niveau gratuit.",
          zh: "取消会停止下一次扣款。你已付费的方案会持续到该周期结束，之后账户转为免费等级。",
        },
        {
          en: "Ask within 14 days of any payment and we refund it in full, for any reason. The full rules are on our Refunds & Cancellation page.",
          ru: "Попроси в течение 14 дней после любого платежа — вернём полностью, по любой причине. Полные правила на странице возвратов и отмены.",
          es: "Pídelo dentro de los 14 días siguientes a cualquier pago y te lo devolvemos íntegro, por el motivo que sea. Las reglas completas están en nuestra página de Reembolsos y cancelación.",
          fr: "Demandez-le dans les 14 jours suivant tout paiement et nous le remboursons intégralement, quelle qu'en soit la raison. Les règles complètes figurent sur notre page Remboursements et annulation.",
          zh: "在任何一笔付款后 14 天内提出申请，我们都会全额退款，无论理由为何。完整规则见我们的「退款与取消」页面。",
        },
        {
          en: "If a payment fails, we may retry it and may suspend paid features until it succeeds.",
          ru: "Если платёж не прошёл, мы можем повторить попытку и приостановить платные функции до успешного списания.",
          es: "Si un pago falla, podemos reintentarlo y suspender las funciones de pago hasta que se complete.",
          fr: "Si un paiement échoue, nous pouvons le retenter et suspendre les fonctionnalités payantes jusqu'à ce qu'il aboutisse.",
          zh: "如果扣款失败，我们可能会重试，并在成功前暂停付费功能。",
        },
        {
          en: "If you ever buy through a mobile app store, that store's own refund rules apply instead.",
          ru: "Если ты когда-нибудь купишь через магазин мобильных приложений, применяются правила возврата этого магазина.",
          es: "Si alguna vez compras a través de una tienda de aplicaciones móviles, se aplican las reglas de reembolso de esa tienda.",
          fr: "Si vous achetez un jour via une boutique d'applications mobiles, ce sont les règles de remboursement de cette boutique qui s'appliquent.",
          zh: "如果你通过移动应用商店购买，则适用该商店自身的退款规则。",
        },
      ],
      {
        en: "Prices are shown in US dollars. Depending on where you are, tax may be added at checkout, and your bank may convert the amount and add its own fees, which are outside our control.",
        ru: "Цены указаны в долларах США. В зависимости от страны при оформлении может добавиться налог, а банк может конвертировать сумму и взять свою комиссию — это вне нашего контроля.",
        es: "Los precios se muestran en dólares estadounidenses. Según dónde estés, puede añadirse impuesto al finalizar la compra, y tu banco puede convertir el importe y añadir sus propias comisiones, que están fuera de nuestro control.",
        fr: "Les prix sont affichés en dollars américains. Selon votre localisation, une taxe peut s'ajouter au moment du paiement, et votre banque peut convertir le montant et appliquer ses propres frais, qui échappent à notre contrôle.",
        zh: "价格以美元显示。根据你所在地区，结账时可能加收税费；你的银行也可能进行货币兑换并收取自身费用，这些均不在我们控制范围内。",
      },
      {
        en: "Prices may change. If they do, we will tell you before the change affects you, and you may cancel rather than accept it. A price change never applies to a period you have already paid for.",
        ru: "Цены могут меняться. Если это произойдёт, мы сообщим до того, как изменение тебя коснётся, и ты сможешь отменить подписку вместо согласия. Изменение цены никогда не применяется к уже оплаченному периоду.",
        es: "Los precios pueden cambiar. Si lo hacen, te lo comunicaremos antes de que el cambio te afecte, y podrás cancelar en lugar de aceptarlo. Un cambio de precio nunca se aplica a un periodo que ya has pagado.",
        fr: "Les prix peuvent changer. Le cas échéant, nous vous préviendrons avant que le changement ne vous concerne, et vous pourrez annuler plutôt que l'accepter. Une modification de prix ne s'applique jamais à une période déjà payée.",
        zh: "价格可能变动。如有变动，我们会在其对你生效之前告知，你可以选择取消而非接受。价格变动绝不适用于你已付费的周期。",
      },
    ],
  },
  {
    heading: {
      en: "Your right to cancel (consumers in the EU, EEA and UK)",
      ru: "Право на отказ (потребители в ЕС, ЕЭЗ и Великобритании)",
      es: "Tu derecho de desistimiento (consumidores de la UE, EEE y Reino Unido)",
      fr: "Votre droit de rétractation (consommateurs UE, EEE et Royaume-Uni)",
      zh: "你的撤销权（欧盟、欧洲经济区及英国消费者）",
    },
    blocks: [
      {
        en: "If you are a consumer in the EU, EEA or UK, you normally have 14 days to withdraw from a distance contract without giving a reason.",
        ru: "Если ты потребитель в ЕС, ЕЭЗ или Великобритании, у тебя обычно есть 14 дней, чтобы отказаться от дистанционного договора без объяснения причин.",
        es: "Si eres consumidor en la UE, el EEE o el Reino Unido, normalmente dispones de 14 días para desistir de un contrato a distancia sin dar explicaciones.",
        fr: "Si vous êtes consommateur dans l'UE, l'EEE ou au Royaume-Uni, vous disposez normalement de 14 jours pour vous rétracter d'un contrat à distance sans avoir à vous justifier.",
        zh: "如果你是欧盟、欧洲经济区或英国的消费者，通常有 14 天时间可以无理由撤销远程订立的合同。",
      },
      {
        en: "Because the Service is digital content supplied immediately, you are asked at checkout to agree that we begin supplying it straight away, and to acknowledge that doing so ends the statutory withdrawal right once supply has begun.",
        ru: "Поскольку Сервис — цифровой контент, предоставляемый сразу, при оформлении тебя просят согласиться на немедленное начало предоставления и подтвердить, что с этого момента законное право на отказ прекращается.",
        es: "Como el Servicio es contenido digital suministrado de inmediato, al finalizar la compra se te pide aceptar que empecemos a suministrarlo enseguida y reconocer que, una vez iniciado el suministro, se extingue el derecho legal de desistimiento.",
        fr: "Le Service étant un contenu numérique fourni immédiatement, il vous est demandé au moment du paiement d'accepter que nous commencions la fourniture sans délai et de reconnaître que, dès lors, le droit légal de rétractation prend fin.",
        zh: "由于本服务属于即时提供的数字内容，结账时会请你同意我们立即开始提供，并确认一旦开始提供，法定撤销权即告终止。",
      },
      {
        en: "This makes no practical difference to you: our own refund policy is more generous than the statutory right, and we refund any payment in full on request within 14 days regardless of the reason or how much you have used.",
        ru: "На практике для тебя это ничего не меняет: наша политика возвратов щедрее закона — по запросу в течение 14 дней мы возвращаем любой платёж полностью, независимо от причины и объёма использования.",
        es: "En la práctica esto no te supone diferencia alguna: nuestra política de reembolsos es más generosa que el derecho legal, y devolvemos íntegro cualquier pago si lo pides dentro de 14 días, sea cual sea el motivo o cuánto lo hayas usado.",
        fr: "Cela ne change rien en pratique pour vous : notre politique de remboursement est plus généreuse que le droit légal, et nous remboursons intégralement tout paiement sur demande dans les 14 jours, quels que soient le motif et l'usage que vous en avez fait.",
        zh: "这对你实际上没有影响：我们自己的退款政策比法定权利更宽松——在 14 天内提出申请，无论理由为何、使用了多少，我们都会全额退款。",
      },
    ],
  },
  {
    heading: {
      en: "What you may do with the Service — licence",
      ru: "Что можно делать с Сервисом — лицензия",
      es: "Qué puedes hacer con el Servicio: licencia",
      fr: "Ce que vous pouvez faire du Service — licence",
      zh: "你可以如何使用本服务——许可",
    },
    blocks: [
      {
        en: "We grant you a personal, limited, non-exclusive, non-transferable, non-sublicensable and revocable licence to access and use the Service and its Content for your own personal, non-commercial training, for as long as your account is in good standing and you comply with these terms.",
        ru: "Мы предоставляем тебе личную, ограниченную, неисключительную, непередаваемую, несублицензируемую и отзывную лицензию на доступ к Сервису и его Контенту и использование их для собственных некоммерческих тренировок — пока аккаунт в порядке и ты соблюдаешь эти условия.",
        es: "Te concedemos una licencia personal, limitada, no exclusiva, intransferible, no sublicenciable y revocable para acceder y usar el Servicio y su Contenido para tu propio entrenamiento personal y no comercial, mientras tu cuenta esté en regla y cumplas estos términos.",
        fr: "Nous vous accordons une licence personnelle, limitée, non exclusive, non transférable, non sous-licenciable et révocable pour accéder au Service et à son Contenu et les utiliser pour votre entraînement personnel non commercial, tant que votre compte est en règle et que vous respectez les présentes conditions.",
        zh: "我们授予你一项个人的、有限的、非独占的、不可转让的、不可再许可的且可撤销的许可，允许你为自身个人的、非商业性的训练目的访问和使用本服务及其内容，前提是你的账户状态良好且遵守本条款。",
      },
      {
        en: "You may:",
        ru: "Можно:",
        es: "Puedes:",
        fr: "Vous pouvez :",
        zh: "你可以：",
      },
      [
        {
          en: "Use the lessons, plans and tools for your own training.",
          ru: "Использовать уроки, планы и инструменты для собственных тренировок.",
          es: "Usar las lecciones, planes y herramientas para tu propio entrenamiento.",
          fr: "Utiliser les leçons, plans et outils pour votre propre entraînement.",
          zh: "将课程、计划和工具用于自己的训练。",
        },
        {
          en: "Save or print material from the Service for your own personal reference.",
          ru: "Сохранять или печатать материалы Сервиса для личного пользования.",
          es: "Guardar o imprimir material del Servicio para tu consulta personal.",
          fr: "Enregistrer ou imprimer des éléments du Service pour votre usage personnel.",
          zh: "保存或打印本服务中的材料，供个人参考。",
        },
      ],
      {
        en: "You may not:",
        ru: "Нельзя:",
        es: "No puedes:",
        fr: "Vous ne pouvez pas :",
        zh: "你不得：",
      },
      [
        {
          en: "Copy, reproduce, republish, broadcast or distribute the Content, in whole or in part.",
          ru: "Копировать, воспроизводить, переиздавать, транслировать или распространять Контент целиком или частично.",
          es: "Copiar, reproducir, republicar, difundir ni distribuir el Contenido, total o parcialmente.",
          fr: "Copier, reproduire, republier, diffuser ou distribuer le Contenu, en tout ou partie.",
          zh: "全部或部分地复制、再现、转载、播送或分发本内容。",
        },
        {
          en: "Use the Content to train, fine-tune or evaluate a machine-learning model.",
          ru: "Использовать Контент для обучения, дообучения или оценки моделей машинного обучения.",
          es: "Usar el Contenido para entrenar, ajustar o evaluar un modelo de aprendizaje automático.",
          fr: "Utiliser le Contenu pour entraîner, affiner ou évaluer un modèle d'apprentissage automatique.",
          zh: "使用本内容训练、微调或评估机器学习模型。",
        },
        {
          en: "Use the Service or its Content to coach paying clients, run classes, or operate a competing or derivative product.",
          ru: "Использовать Сервис или Контент для тренировки платных клиентов, проведения занятий либо создания конкурирующего или производного продукта.",
          es: "Usar el Servicio o su Contenido para entrenar a clientes de pago, impartir clases u operar un producto competidor o derivado.",
          fr: "Utiliser le Service ou son Contenu pour entraîner des clients payants, animer des cours, ou exploiter un produit concurrent ou dérivé.",
          zh: "使用本服务或其内容来指导付费客户、开设课程，或运营竞争性或衍生性产品。",
        },
        {
          en: "Remove or obscure any notice of ownership, authorship or attribution.",
          ru: "Удалять или скрывать любые указания на права, авторство или атрибуцию.",
          es: "Eliminar u ocultar cualquier aviso de propiedad, autoría o atribución.",
          fr: "Supprimer ou masquer toute mention de propriété, de paternité ou d'attribution.",
          zh: "移除或掩盖任何所有权、著作权或署名声明。",
        },
        {
          en: "Reverse-engineer, decompile or attempt to derive the source of any part of the Service, except to the extent that restriction is void under applicable law.",
          ru: "Реверс-инжинирить, декомпилировать или пытаться получить исходный код любой части Сервиса — кроме случаев, когда такое ограничение недействительно по применимому праву.",
          es: "Aplicar ingeniería inversa, descompilar o intentar obtener el código fuente de cualquier parte del Servicio, salvo en la medida en que esa restricción sea nula según la ley aplicable.",
          fr: "Faire de la rétro-ingénierie, décompiler ou tenter d'obtenir le code source d'une quelconque partie du Service, sauf dans la mesure où cette restriction est nulle en vertu du droit applicable.",
          zh: "对本服务的任何部分进行逆向工程、反编译或试图获取其源代码，但适用法律认定该限制无效的范围除外。",
        },
      ],
      {
        en: "This licence ends automatically if your account is closed or these terms are terminated.",
        ru: "Лицензия автоматически прекращается при закрытии аккаунта или расторжении этих условий.",
        es: "Esta licencia termina automáticamente si se cierra tu cuenta o se resuelven estos términos.",
        fr: "Cette licence prend fin automatiquement si votre compte est fermé ou si les présentes conditions sont résiliées.",
        zh: "如果你的账户被关闭或本条款终止，本许可自动终止。",
      },
    ],
  },
  {
    heading: {
      en: "Ownership",
      ru: "Права собственности",
      es: "Titularidad",
      fr: "Propriété",
      zh: "所有权",
    },
    blocks: [
      {
        en: `All rights in the Service — including the software, the exercise library, the written coaching material, the illustrations, the rank system, the name ${SERVICE}, and the associated branding and design — are owned by ${OPERATOR} or licensed to us, and are protected by copyright, trade mark and other intellectual property laws.`,
        ru: `Все права на Сервис — программное обеспечение, библиотеку упражнений, письменные тренерские материалы, иллюстрации, систему рангов, название ${SERVICE}, а также связанный брендинг и дизайн — принадлежат ${OPERATOR} или лицензированы нам и защищены авторским правом, правом на товарные знаки и иными законами об интеллектуальной собственности.`,
        es: `Todos los derechos sobre el Servicio —incluidos el software, la biblioteca de ejercicios, el material escrito de entrenamiento, las ilustraciones, el sistema de rangos, el nombre ${SERVICE} y la marca y el diseño asociados— pertenecen a ${OPERATOR} o nos han sido licenciados, y están protegidos por las leyes de derechos de autor, marcas y otras de propiedad intelectual.`,
        fr: `Tous les droits sur le Service — y compris le logiciel, la bibliothèque d'exercices, les contenus écrits de coaching, les illustrations, le système de rangs, le nom ${SERVICE} et l'identité visuelle associée — appartiennent à ${OPERATOR} ou nous sont concédés sous licence, et sont protégés par le droit d'auteur, le droit des marques et les autres lois sur la propriété intellectuelle.`,
        zh: `本服务的全部权利——包括软件、动作库、书面教学材料、插图、段位体系、${SERVICE} 名称以及相关品牌与设计——归 ${OPERATOR} 所有或已许可给我们，并受著作权法、商标法及其他知识产权法保护。`,
      },
      {
        en: "Nothing in these terms transfers any of those rights to you. Rights not expressly granted are reserved.",
        ru: "Ничто в этих условиях не передаёт тебе эти права. Права, не предоставленные явно, сохраняются за нами.",
        es: "Nada en estos términos te transfiere ninguno de esos derechos. Los derechos no concedidos expresamente quedan reservados.",
        fr: "Rien dans les présentes conditions ne vous transfère ces droits. Les droits non expressément accordés sont réservés.",
        zh: "本条款中的任何内容均不向你转让上述任何权利。未明确授予的权利均予保留。",
      },
      {
        en: "Some components of the Service are provided by third parties under their own licences. Those components remain the property of their respective owners.",
        ru: "Некоторые компоненты Сервиса предоставлены третьими лицами по их собственным лицензиям и остаются собственностью соответствующих правообладателей.",
        es: "Algunos componentes del Servicio los proporcionan terceros bajo sus propias licencias. Esos componentes siguen siendo propiedad de sus respectivos titulares.",
        fr: "Certains composants du Service sont fournis par des tiers sous leurs propres licences. Ces composants restent la propriété de leurs titulaires respectifs.",
        zh: "本服务的部分组件由第三方依其自身许可提供，这些组件仍归各自权利人所有。",
      },
    ],
  },
  {
    heading: {
      en: "Your Content",
      ru: "Твой контент",
      es: "Tu Contenido",
      fr: "Votre Contenu",
      zh: "你的内容",
    },
    blocks: [
      {
        en: "You keep ownership of Your Content. We do not claim it.",
        ru: "Твой контент остаётся твоим. Мы на него не претендуем.",
        es: "Conservas la titularidad de Tu Contenido. No lo reclamamos.",
        fr: "Vous conservez la propriété de Votre Contenu. Nous n'en revendiquons rien.",
        zh: "你的内容仍归你所有，我们不主张任何权利。",
      },
      {
        en: "To operate the Service we need your permission to handle it. You grant us a worldwide, royalty-free, non-exclusive licence to store, process, transmit and display Your Content strictly for the purpose of providing the Service to you — for example, sending a photograph to our AI provider so it can return a result to you, or storing your profile so your plan can be generated.",
        ru: "Чтобы Сервис работал, нам нужно твоё разрешение на обработку. Ты предоставляешь нам всемирную, безвозмездную, неисключительную лицензию хранить, обрабатывать, передавать и отображать Твой контент строго для оказания тебе Сервиса — например, отправить фото нашему ИИ-провайдеру, чтобы он вернул результат, или хранить профиль, чтобы построить план.",
        es: "Para operar el Servicio necesitamos tu permiso para tratarlo. Nos concedes una licencia mundial, gratuita y no exclusiva para almacenar, procesar, transmitir y mostrar Tu Contenido estrictamente con el fin de prestarte el Servicio; por ejemplo, enviar una fotografía a nuestro proveedor de IA para que te devuelva un resultado, o guardar tu perfil para poder generar tu plan.",
        fr: "Pour faire fonctionner le Service, nous avons besoin de votre autorisation pour le traiter. Vous nous accordez une licence mondiale, gratuite et non exclusive pour stocker, traiter, transmettre et afficher Votre Contenu, strictement aux fins de vous fournir le Service — par exemple envoyer une photo à notre prestataire d'IA pour qu'il vous renvoie un résultat, ou conserver votre profil afin de générer votre plan.",
        zh: "为运营本服务，我们需要你的授权来处理这些内容。你授予我们一项全球性的、免版税的、非独占的许可，仅为向你提供本服务之目的而存储、处理、传输和展示你的内容——例如将照片发送给我们的 AI 服务商以便返回结果，或保存你的档案以生成训练计划。",
      },
      {
        en: "That licence exists only so the Service can function. It does not let us publish Your Content, sell it, share it for advertising, or use it to train AI models. It ends when you delete the content or your account, except for copies kept briefly in routine backups.",
        ru: "Эта лицензия существует только ради работы Сервиса. Она не даёт нам публиковать Твой контент, продавать его, передавать для рекламы или использовать для обучения ИИ-моделей. Она прекращается, когда ты удаляешь контент или аккаунт, кроме копий, недолго хранящихся в обычных резервных копиях.",
        es: "Esa licencia existe únicamente para que el Servicio funcione. No nos permite publicar Tu Contenido, venderlo, compartirlo con fines publicitarios ni usarlo para entrenar modelos de IA. Termina cuando borras el contenido o tu cuenta, salvo por copias conservadas brevemente en copias de seguridad rutinarias.",
        fr: "Cette licence n'existe que pour permettre au Service de fonctionner. Elle ne nous autorise pas à publier Votre Contenu, à le vendre, à le partager à des fins publicitaires ni à l'utiliser pour entraîner des modèles d'IA. Elle prend fin lorsque vous supprimez le contenu ou votre compte, hormis les copies conservées brièvement dans les sauvegardes de routine.",
        zh: "该许可的存在仅为使本服务能够运行。它不允许我们发布、出售你的内容，不允许为广告目的共享，也不允许用于训练 AI 模型。当你删除内容或账户时，该许可即告终止，常规备份中短暂保留的副本除外。",
      },
      {
        en: "You are responsible for Your Content. You confirm that you own it or have permission to submit it, and that submitting it does not break the law or anyone else's rights.",
        ru: "Ты отвечаешь за Твой контент. Ты подтверждаешь, что владеешь им или имеешь право его отправлять и что отправка не нарушает закон или чужие права.",
        es: "Eres responsable de Tu Contenido. Confirmas que es tuyo o que tienes permiso para enviarlo, y que enviarlo no infringe la ley ni los derechos de nadie.",
        fr: "Vous êtes responsable de Votre Contenu. Vous confirmez que vous en êtes titulaire ou que vous avez l'autorisation de le soumettre, et que cette soumission n'enfreint ni la loi ni les droits d'autrui.",
        zh: "你对自己的内容负责。你确认该内容归你所有或你已获授权提交，且提交行为不违反法律或他人权利。",
      },
      {
        en: "Do not upload images or video of other people without their agreement, and never upload images of children.",
        ru: "Не загружай изображения или видео других людей без их согласия и никогда не загружай изображения детей.",
        es: "No subas imágenes ni vídeos de otras personas sin su consentimiento, y nunca subas imágenes de menores.",
        fr: "Ne téléversez pas d'images ou de vidéos d'autres personnes sans leur accord, et ne téléversez jamais d'images d'enfants.",
        zh: "未经他人同意，请勿上传他人的图片或视频；任何情况下都不得上传儿童的图片。",
      },
      {
        en: "If you send us feedback or a suggestion, we may use it freely to improve the Service, without owing you anything for it.",
        ru: "Если ты пришлёшь отзыв или предложение, мы вправе свободно использовать его для улучшения Сервиса, ничего тебе за это не должны.",
        es: "Si nos envías comentarios o una sugerencia, podemos usarlos libremente para mejorar el Servicio, sin deberte nada a cambio.",
        fr: "Si vous nous envoyez un retour ou une suggestion, nous pouvons l'utiliser librement pour améliorer le Service, sans rien vous devoir en contrepartie.",
        zh: "如果你向我们提供反馈或建议，我们可以自由地将其用于改进本服务，无需为此向你支付任何对价。",
      },
    ],
  },
  {
    heading: {
      en: "AI-generated content",
      ru: "Контент, созданный ИИ",
      es: "Contenido generado por IA",
      fr: "Contenu généré par IA",
      zh: "AI 生成的内容",
    },
    blocks: [
      {
        en: "Several features — the goal analysis, nutrition plans and food photo scanning — are produced by an AI model. AI output can be wrong, incomplete or confidently mistaken. Treat it as a suggestion to sanity-check, never as an authority.",
        ru: "Несколько функций — анализ целей, планы питания и распознавание еды по фото — создаются ИИ-моделью. Вывод ИИ может быть неверным, неполным или уверенно ошибочным. Относись к нему как к подсказке, которую нужно перепроверить, а не как к авторитету.",
        es: "Varias funciones —el análisis de objetivos, los planes de nutrición y el escaneo de fotos de comida— las produce un modelo de IA. La salida de una IA puede ser incorrecta, incompleta o estar equivocada con total seguridad. Trátala como una sugerencia que hay que contrastar, nunca como una autoridad.",
        fr: "Plusieurs fonctionnalités — l'analyse d'objectifs, les plans nutritionnels et l'analyse des photos de repas — sont produites par un modèle d'IA. Une sortie d'IA peut être erronée, incomplète ou fausse avec aplomb. Considérez-la comme une suggestion à vérifier, jamais comme une autorité.",
        zh: "若干功能——目标分析、营养计划和食物照片识别——由 AI 模型生成。AI 的输出可能有误、不完整，或言之凿凿却是错的。请把它当作需要核实的建议，绝不要当作权威。",
      },
      {
        en: "The calorie and macro figures returned by the food scanner are estimates from a photograph. They are not measurements, and they should not be relied on where accuracy matters medically.",
        ru: "Значения калорий и БЖУ, которые возвращает сканер еды, — оценки по фотографии. Это не измерения, и на них нельзя полагаться там, где точность важна с медицинской точки зрения.",
        es: "Las cifras de calorías y macros que devuelve el escáner de comida son estimaciones a partir de una fotografía. No son mediciones y no deben usarse cuando la exactitud importa desde el punto de vista médico.",
        fr: "Les valeurs de calories et de macros renvoyées par le scanner de repas sont des estimations issues d'une photographie. Ce ne sont pas des mesures, et il ne faut pas s'y fier lorsque l'exactitude a une importance médicale.",
        zh: "食物识别返回的热量和宏量营养素数值是基于一张照片的估算，并非实测数据，在精确度具有医学意义的场合不应依赖它们。",
      },
      {
        en: "AI features depend on a third-party provider and may be changed, limited or withdrawn if that provider's service changes.",
        ru: "ИИ-функции зависят от стороннего провайдера и могут быть изменены, ограничены или отключены, если его сервис изменится.",
        es: "Las funciones de IA dependen de un proveedor externo y pueden cambiarse, limitarse o retirarse si el servicio de ese proveedor cambia.",
        fr: "Les fonctionnalités d'IA dépendent d'un prestataire tiers et peuvent être modifiées, limitées ou retirées si le service de ce prestataire évolue.",
        zh: "AI 功能依赖第三方服务商，若该服务商的服务发生变化，这些功能可能被更改、限制或撤下。",
      },
      {
        en: "We do not guarantee that AI output is accurate, complete, suitable for you, or free from bias or error. Section 3 applies to AI output in full.",
        ru: "Мы не гарантируем, что вывод ИИ точен, полон, подходит именно тебе или свободен от предвзятости и ошибок. Раздел 3 применяется к выводу ИИ полностью.",
        es: "No garantizamos que la salida de la IA sea exacta, completa, adecuada para ti ni libre de sesgos o errores. La sección 3 se aplica íntegramente a la salida de la IA.",
        fr: "Nous ne garantissons pas que la sortie de l'IA soit exacte, complète, adaptée à vous, ni exempte de biais ou d'erreurs. La section 3 s'applique intégralement aux sorties de l'IA.",
        zh: "我们不保证 AI 输出准确、完整、适合你，或不含偏见与错误。第 3 节完整适用于 AI 输出。",
      },
    ],
  },
  {
    heading: {
      en: "Acceptable use",
      ru: "Допустимое использование",
      es: "Uso aceptable",
      fr: "Usage acceptable",
      zh: "可接受使用",
    },
    blocks: [
      {
        en: "Do not:",
        ru: "Нельзя:",
        es: "No debes:",
        fr: "Il est interdit de :",
        zh: "不得：",
      },
      [
        {
          en: "Break the law, or use the Service to harm, harass, defame or impersonate anyone.",
          ru: "Нарушать закон или использовать Сервис, чтобы вредить, преследовать, клеветать или выдавать себя за другого.",
          es: "Infringir la ley ni usar el Servicio para dañar, acosar, difamar o suplantar a nadie.",
          fr: "Enfreindre la loi, ou utiliser le Service pour nuire à quelqu'un, le harceler, le diffamer ou usurper son identité.",
          zh: "违反法律，或利用本服务伤害、骚扰、诽谤或冒充他人。",
        },
        {
          en: "Upload illegal content, or images of other people who have not agreed to it.",
          ru: "Загружать незаконный контент или изображения других людей без их согласия.",
          es: "Subir contenido ilegal ni imágenes de otras personas que no lo hayan consentido.",
          fr: "Téléverser du contenu illégal, ou des images de personnes qui n'y ont pas consenti.",
          zh: "上传违法内容，或未经他人同意上传其图像。",
        },
        {
          en: "Attempt to access accounts or data that are not yours, or probe, scan or test the security of the Service.",
          ru: "Пытаться получить доступ к чужим аккаунтам или данным либо зондировать, сканировать и тестировать безопасность Сервиса.",
          es: "Intentar acceder a cuentas o datos que no son tuyos, ni sondear, escanear o poner a prueba la seguridad del Servicio.",
          fr: "Tenter d'accéder à des comptes ou données qui ne sont pas les vôtres, ni sonder, scanner ou tester la sécurité du Service.",
          zh: "试图访问不属于你的账户或数据，或对本服务的安全性进行探测、扫描或测试。",
        },
        {
          en: "Scrape the Service, hammer the API, or work around usage limits, paywalls or feature gates.",
          ru: "Скрапить Сервис, долбить API или обходить лимиты, платные ограничения и гейты функций.",
          es: "Hacer scraping del Servicio, saturar la API, ni eludir límites de uso, muros de pago o restricciones de funciones.",
          fr: "Extraire massivement les données du Service, marteler l'API, ou contourner les limites d'usage, les paywalls ou les restrictions de fonctionnalités.",
          zh: "抓取本服务、高频冲击 API，或绕过使用限制、付费墙或功能门槛。",
        },
        {
          en: "Introduce malware, or interfere with the operation or availability of the Service.",
          ru: "Внедрять вредоносное ПО или мешать работе и доступности Сервиса.",
          es: "Introducir malware ni interferir en el funcionamiento o la disponibilidad del Servicio.",
          fr: "Introduire des logiciels malveillants, ou perturber le fonctionnement ou la disponibilité du Service.",
          zh: "植入恶意软件，或干扰本服务的运行或可用性。",
        },
        {
          en: "Resell, sublicense or redistribute the Service or its Content as your own.",
          ru: "Перепродавать, сублицензировать или распространять Сервис либо Контент как свой.",
          es: "Revender, sublicenciar ni redistribuir el Servicio o su Contenido como si fuera tuyo.",
          fr: "Revendre, sous-licencier ou redistribuer le Service ou son Contenu comme s'il était le vôtre.",
          zh: "将本服务或其内容作为你自己的产品转售、再许可或再分发。",
        },
        {
          en: "Use the Service to build a competing product, or to train a machine-learning model.",
          ru: "Использовать Сервис для создания конкурирующего продукта или обучения модели машинного обучения.",
          es: "Usar el Servicio para construir un producto competidor ni para entrenar un modelo de aprendizaje automático.",
          fr: "Utiliser le Service pour créer un produit concurrent, ou pour entraîner un modèle d'apprentissage automatique.",
          zh: "利用本服务构建竞争性产品，或训练机器学习模型。",
        },
        {
          en: "Use automated means to create accounts, or create an account under a false identity.",
          ru: "Создавать аккаунты автоматизированными средствами или регистрироваться под чужой личностью.",
          es: "Crear cuentas por medios automatizados ni crear una cuenta con una identidad falsa.",
          fr: "Créer des comptes par des moyens automatisés, ou créer un compte sous une fausse identité.",
          zh: "以自动化手段批量创建账户，或以虚假身份注册账户。",
        },
      ],
      {
        en: "We may investigate suspected breaches and take any action we reasonably consider appropriate, including suspending or closing an account and cooperating with law enforcement.",
        ru: "Мы можем расследовать подозрения в нарушениях и принимать любые разумно уместные меры, включая приостановку или закрытие аккаунта и содействие правоохранительным органам.",
        es: "Podemos investigar sospechas de incumplimiento y adoptar cualquier medida que consideremos razonablemente apropiada, incluida la suspensión o el cierre de una cuenta y la cooperación con las autoridades.",
        fr: "Nous pouvons enquêter sur des manquements présumés et prendre toute mesure que nous jugeons raisonnablement appropriée, y compris suspendre ou fermer un compte et coopérer avec les autorités.",
        zh: "我们可以对涉嫌违规行为进行调查，并采取我们合理认为适当的任何措施，包括暂停或关闭账户以及配合执法机关。",
      },
    ],
  },
  {
    heading: {
      en: "Suspension and closure",
      ru: "Приостановка и закрытие",
      es: "Suspensión y cierre",
      fr: "Suspension et fermeture",
      zh: "暂停与关闭",
    },
    blocks: [
      {
        en: "We may suspend or close an account that breaks these terms or abuses the Service.",
        ru: "Мы можем приостановить или закрыть аккаунт, который нарушает эти условия или злоупотребляет Сервисом.",
        es: "Podemos suspender o cerrar una cuenta que incumpla estos términos o abuse del Servicio.",
        fr: "Nous pouvons suspendre ou fermer un compte qui enfreint les présentes conditions ou abuse du Service.",
        zh: "对于违反本条款或滥用本服务的账户，我们可以暂停或关闭。",
      },
      {
        en: "Be aware that closing an account for abuse also permanently deletes its training history, progress and profile. That deletion cannot be reversed, and restoring access later does not restore the data.",
        ru: "Учти: закрытие аккаунта за злоупотребление также безвозвратно удаляет историю тренировок, прогресс и профиль. Это удаление необратимо, и восстановление доступа позже не восстановит данные.",
        es: "Ten en cuenta que cerrar una cuenta por abuso también borra de forma permanente su historial de entrenamiento, progreso y perfil. Ese borrado no se puede revertir, y recuperar el acceso más adelante no recupera los datos.",
        fr: "Sachez que la fermeture d'un compte pour abus supprime aussi définitivement son historique d'entraînement, sa progression et son profil. Cette suppression est irréversible, et rétablir l'accès plus tard ne restaure pas les données.",
        zh: "请注意，因滥用而关闭账户也会永久删除其训练历史、进度和档案。该删除无法撤销，日后恢复访问权限也不会恢复数据。",
      },
      {
        en: "You can stop using the Service at any time. You can delete your own account, and everything attached to it, from your dashboard under Account — you do not need to ask our permission or wait for us.",
        ru: "Ты можешь прекратить пользоваться Сервисом в любой момент. Удалить свой аккаунт и всё связанное с ним можно в кабинете, в разделе «Аккаунт», — разрешения у нас спрашивать и ждать нас не нужно.",
        es: "Puedes dejar de usar el Servicio cuando quieras. Puedes eliminar tu propia cuenta, y todo lo asociado a ella, desde tu panel en Cuenta: no necesitas pedirnos permiso ni esperarnos.",
        fr: "Vous pouvez cesser d'utiliser le Service à tout moment. Vous pouvez supprimer vous-même votre compte et tout ce qui y est rattaché depuis votre tableau de bord, rubrique Compte — sans avoir à nous demander la permission ni à nous attendre.",
        zh: "你可以随时停止使用本服务。你可以在面板的「账户」中自行删除账户及其所有关联数据——无需征得我们同意，也无需等待我们处理。",
      },
      {
        en: "If we close your account without cause, and you have paid for a period that has not finished, we will refund the unused part.",
        ru: "Если мы закроем твой аккаунт без причины, а у тебя оплачен незавершённый период, мы вернём неиспользованную часть.",
        es: "Si cerramos tu cuenta sin causa y has pagado un periodo que no ha terminado, te devolveremos la parte no utilizada.",
        fr: "Si nous fermons votre compte sans motif alors que vous avez payé une période non achevée, nous rembourserons la partie non utilisée.",
        zh: "如果我们无故关闭你的账户，而你已付费的周期尚未结束，我们将退还未使用的部分。",
      },
      {
        en: "Sections that by their nature should survive termination — ownership, limitation of liability, indemnity and governing law — continue to apply after your account ends.",
        ru: "Разделы, которые по своей природе должны пережить расторжение — права собственности, ограничение ответственности, возмещение и применимое право, — продолжают действовать после закрытия аккаунта.",
        es: "Las secciones que por su naturaleza deben sobrevivir a la terminación —titularidad, limitación de responsabilidad, indemnización y ley aplicable— siguen aplicándose después de que tu cuenta termine.",
        fr: "Les sections qui, par nature, doivent survivre à la résiliation — propriété, limitation de responsabilité, indemnisation et droit applicable — continuent de s'appliquer après la fermeture de votre compte.",
        zh: "依其性质应在终止后继续有效的条款——所有权、责任限制、赔偿和适用法律——在你的账户终止后仍然适用。",
      },
    ],
  },
  {
    heading: {
      en: "Third-party services",
      ru: "Сторонние сервисы",
      es: "Servicios de terceros",
      fr: "Services tiers",
      zh: "第三方服务",
    },
    blocks: [
      {
        en: "The Service relies on third-party providers for hosting, database storage, payment processing and AI features. Their handling of data is described in our Privacy Policy.",
        ru: "Сервис опирается на сторонних провайдеров для хостинга, хранения базы, обработки платежей и ИИ-функций. Как они обращаются с данными, описано в Политике конфиденциальности.",
        es: "El Servicio se apoya en proveedores externos para el alojamiento, el almacenamiento en base de datos, el procesamiento de pagos y las funciones de IA. Su tratamiento de los datos se describe en nuestra Política de privacidad.",
        fr: "Le Service s'appuie sur des prestataires tiers pour l'hébergement, le stockage en base de données, le traitement des paiements et les fonctionnalités d'IA. Leur traitement des données est décrit dans notre Politique de confidentialité.",
        zh: "本服务在托管、数据库存储、支付处理和 AI 功能方面依赖第三方服务商。他们对数据的处理方式见我们的隐私政策。",
      },
      {
        en: "We are not responsible for third-party services, their availability, or their own terms and policies. Where a third party is the seller — as with the merchant of record for payments — your contract for that transaction is with them.",
        ru: "Мы не отвечаем за сторонние сервисы, их доступность и их собственные условия и политики. Там, где продавцом выступает третья сторона — как продавец записи по платежам, — договор по этой сделке заключается с ней.",
        es: "No somos responsables de los servicios de terceros, de su disponibilidad ni de sus propios términos y políticas. Cuando el vendedor es un tercero —como el comerciante registrado en los pagos—, tu contrato para esa transacción es con él.",
        fr: "Nous ne sommes pas responsables des services tiers, de leur disponibilité, ni de leurs propres conditions et politiques. Lorsqu'un tiers est le vendeur — comme le marchand officiel pour les paiements —, votre contrat pour cette transaction est conclu avec lui.",
        zh: "我们不对第三方服务、其可用性或其自身的条款与政策负责。当第三方为卖方时——例如支付环节的登记商户——该笔交易的合同是你与其订立的。",
      },
      {
        en: "The Service may link to external sites. We do not control them and are not responsible for their content.",
        ru: "Сервис может ссылаться на внешние сайты. Мы их не контролируем и не отвечаем за их содержимое.",
        es: "El Servicio puede enlazar a sitios externos. No los controlamos ni somos responsables de su contenido.",
        fr: "Le Service peut renvoyer vers des sites externes. Nous ne les contrôlons pas et ne sommes pas responsables de leur contenu.",
        zh: "本服务可能链接到外部网站。我们不控制这些网站，也不对其内容负责。",
      },
    ],
  },
  {
    heading: {
      en: "Data protection and cookies",
      ru: "Защита данных и cookie",
      es: "Protección de datos y cookies",
      fr: "Protection des données et cookies",
      zh: "数据保护与 Cookie",
    },
    blocks: [
      {
        en: "How we handle personal data is set out in our Privacy Policy, which forms part of these terms.",
        ru: "Как мы обращаемся с персональными данными, изложено в Политике конфиденциальности, которая является частью этих условий.",
        es: "Cómo tratamos los datos personales se explica en nuestra Política de privacidad, que forma parte de estos términos.",
        fr: "La manière dont nous traitons les données personnelles est décrite dans notre Politique de confidentialité, qui fait partie des présentes conditions.",
        zh: "我们如何处理个人数据，详见构成本条款一部分的隐私政策。",
      },
      {
        en: "The Service uses only cookies that are strictly necessary or that remember a preference you set. It does not use advertising cookies, and does not run third-party analytics or tracking. Our Privacy Policy lists every cookie we set, what it does and how long it lasts.",
        ru: "Сервис использует только строго необходимые cookie и те, что запоминают выбранные тобой настройки. Рекламных cookie нет, сторонней аналитики и трекинга нет. В Политике конфиденциальности перечислены все cookie, их назначение и срок жизни.",
        es: "El Servicio solo usa cookies estrictamente necesarias o que recuerdan una preferencia que fijaste. No usa cookies publicitarias ni ejecuta analítica o rastreo de terceros. Nuestra Política de privacidad enumera cada cookie que instalamos, para qué sirve y cuánto dura.",
        fr: "Le Service n'utilise que des cookies strictement nécessaires ou destinés à mémoriser une préférence que vous avez définie. Il n'utilise pas de cookies publicitaires et n'exécute ni analyse ni traçage tiers. Notre Politique de confidentialité liste chaque cookie déposé, son rôle et sa durée.",
        zh: "本服务仅使用严格必要的 Cookie，或用于记住你所设偏好的 Cookie。不使用广告 Cookie，也不运行第三方分析或追踪。我们的隐私政策列出了我们设置的每一个 Cookie、其用途及有效期。",
      },
      {
        en: `You have rights over your personal data, including access, correction and deletion, and we respond to requests within ${REQUEST_DAYS} days. The Privacy Policy explains how to exercise them.`,
        ru: `У тебя есть права на свои персональные данные, включая доступ, исправление и удаление; на запросы мы отвечаем в течение ${REQUEST_DAYS} дней. Как их реализовать — в Политике конфиденциальности.`,
        es: `Tienes derechos sobre tus datos personales, incluidos el acceso, la rectificación y la supresión, y respondemos a las solicitudes en ${REQUEST_DAYS} días. La Política de privacidad explica cómo ejercerlos.`,
        fr: `Vous disposez de droits sur vos données personnelles, notamment l'accès, la rectification et l'effacement, et nous répondons aux demandes sous ${REQUEST_DAYS} jours. La Politique de confidentialité explique comment les exercer.`,
        zh: `你对自己的个人数据享有权利，包括访问、更正和删除，我们会在 ${REQUEST_DAYS} 天内回应请求。隐私政策说明了如何行使这些权利。`,
      },
    ],
  },
  {
    heading: {
      en: "Availability",
      ru: "Доступность",
      es: "Disponibilidad",
      fr: "Disponibilité",
      zh: "可用性",
    },
    blocks: [
      {
        en: `${SERVICE} is provided as it is and as available, without any guarantee that it will be uninterrupted, timely, secure or free of errors. To the extent the law allows, we exclude all implied warranties, including fitness for a particular purpose and satisfactory quality.`,
        ru: `${SERVICE} предоставляется «как есть» и «как доступно», без гарантий бесперебойности, своевременности, безопасности и отсутствия ошибок. В пределах, допустимых законом, мы исключаем все подразумеваемые гарантии, включая пригодность для конкретной цели и удовлетворительное качество.`,
        es: `${SERVICE} se ofrece tal cual y según disponibilidad, sin garantía alguna de que vaya a ser ininterrumpido, puntual, seguro o libre de errores. En la medida en que la ley lo permita, excluimos todas las garantías implícitas, incluidas la idoneidad para un fin concreto y la calidad satisfactoria.`,
        fr: `${SERVICE} est fourni « en l'état » et « selon disponibilité », sans garantie qu'il sera ininterrompu, ponctuel, sécurisé ou exempt d'erreurs. Dans la mesure permise par la loi, nous excluons toutes les garanties implicites, y compris l'adéquation à un usage particulier et la qualité satisfaisante.`,
        zh: `${SERVICE} 按「现状」和「现有」提供，不保证不中断、及时、安全或无错误。在法律允许的范围内，我们排除一切默示保证，包括适销性、特定用途适用性和令人满意的质量。`,
      },
      {
        en: "We may change, suspend or discontinue features. We will try to give notice of significant changes, but we may not always be able to.",
        ru: "Мы можем изменять, приостанавливать или прекращать функции. Мы постараемся предупреждать о существенных изменениях, но не всегда сможем.",
        es: "Podemos cambiar, suspender o retirar funciones. Intentaremos avisar de los cambios importantes, pero no siempre podremos hacerlo.",
        fr: "Nous pouvons modifier, suspendre ou supprimer des fonctionnalités. Nous essaierons de signaler les changements importants, mais nous ne pourrons pas toujours le faire.",
        zh: "我们可能更改、暂停或停止某些功能。对于重大变更我们会尽量提前告知，但并非总能做到。",
      },
      {
        en: "We may need to take the Service down for maintenance, and access may be affected by events outside our control.",
        ru: "Иногда Сервис приходится останавливать на обслуживание, а доступ может нарушаться событиями вне нашего контроля.",
        es: "Puede que necesitemos parar el Servicio por mantenimiento, y el acceso puede verse afectado por eventos fuera de nuestro control.",
        fr: "Nous pouvons avoir à interrompre le Service pour maintenance, et l'accès peut être affecté par des événements indépendants de notre volonté.",
        zh: "我们可能需要因维护而暂停服务，访问也可能受我们无法控制的事件影响。",
      },
    ],
  },
  {
    heading: {
      en: "Limitation of liability",
      ru: "Ограничение ответственности",
      es: "Limitación de responsabilidad",
      fr: "Limitation de responsabilité",
      zh: "责任限制",
    },
    blocks: [
      {
        en: "To the fullest extent the law allows, we are not liable for injury, illness, loss of data, lost profits, or any indirect, incidental, special or consequential loss arising from your use of the Service or from following guidance produced by it.",
        ru: "В максимально допустимой законом мере мы не несём ответственности за травмы, болезни, потерю данных, упущенную выгоду и любые косвенные, случайные, специальные или последующие убытки, возникшие из использования Сервиса или следования его рекомендациям.",
        es: "En la máxima medida que permita la ley, no somos responsables de lesiones, enfermedad, pérdida de datos, lucro cesante ni de ninguna pérdida indirecta, incidental, especial o consecuente derivada de tu uso del Servicio o de seguir las orientaciones que produce.",
        fr: "Dans toute la mesure permise par la loi, nous ne sommes pas responsables des blessures, maladies, pertes de données, pertes de profits, ni d'aucune perte indirecte, accessoire, spéciale ou consécutive résultant de votre utilisation du Service ou du suivi des conseils qu'il produit.",
        zh: "在法律允许的最大范围内，对于因你使用本服务或遵循其生成的建议而产生的伤害、疾病、数据丢失、利润损失，或任何间接、附带、特殊或后果性损失，我们概不负责。",
      },
      {
        en: "Where liability cannot be excluded but can be limited, our total liability to you for all claims in any 12-month period is limited to the greater of the amount you paid us in that period, or twenty US dollars.",
        ru: "Там, где ответственность нельзя исключить, но можно ограничить, наша совокупная ответственность перед тобой по всем требованиям за любые 12 месяцев ограничена большей из двух величин: суммой, которую ты заплатил нам за этот период, или двадцатью долларами США.",
        es: "Cuando la responsabilidad no pueda excluirse pero sí limitarse, nuestra responsabilidad total ante ti por todas las reclamaciones en cualquier periodo de 12 meses se limita a la mayor de estas cantidades: lo que nos pagaste en ese periodo o veinte dólares estadounidenses.",
        fr: "Lorsque la responsabilité ne peut être exclue mais peut être limitée, notre responsabilité totale envers vous pour l'ensemble des réclamations sur une période de 12 mois est limitée au plus élevé des deux montants suivants : la somme que vous nous avez versée sur cette période, ou vingt dollars américains.",
        zh: "在责任无法排除但可以限制的情形下，我们在任何 12 个月期间就全部索赔对你承担的总责任，以你在该期间向我们支付的金额与二十美元中的较高者为限。",
      },
      {
        en: "Nothing in these terms excludes or limits liability that cannot legally be excluded — including liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that applicable law does not permit us to exclude.",
        ru: "Ничто в этих условиях не исключает и не ограничивает ответственность, которую нельзя исключить по закону, — в том числе за смерть или телесные повреждения по нашей неосторожности, за мошенничество или мошенническое введение в заблуждение, а также любую иную ответственность, исключение которой не допускается применимым правом.",
        es: "Nada en estos términos excluye ni limita la responsabilidad que legalmente no puede excluirse, incluida la responsabilidad por muerte o lesiones personales causadas por nuestra negligencia, por fraude o declaración fraudulenta, o cualquier otra responsabilidad que la ley aplicable no nos permita excluir.",
        fr: "Rien dans les présentes conditions n'exclut ni ne limite une responsabilité qui ne peut légalement être exclue — y compris la responsabilité en cas de décès ou de dommage corporel causé par notre négligence, en cas de fraude ou de manœuvre dolosive, ou toute autre responsabilité que le droit applicable ne nous permet pas d'exclure.",
        zh: "本条款中的任何内容均不排除或限制法律上不得排除的责任——包括因我们的过失造成死亡或人身伤害的责任、欺诈或欺诈性不实陈述的责任，以及适用法律不允许我们排除的任何其他责任。",
      },
      {
        en: "Some places do not allow certain limitations of liability, so parts of this section may not apply to you. If you are a consumer, your statutory rights are unaffected.",
        ru: "В некоторых юрисдикциях отдельные ограничения ответственности не допускаются, поэтому часть этого раздела может к тебе не применяться. Если ты потребитель, твои законные права не затрагиваются.",
        es: "Algunos lugares no permiten ciertas limitaciones de responsabilidad, por lo que partes de esta sección pueden no aplicarse a ti. Si eres consumidor, tus derechos legales no se ven afectados.",
        fr: "Certaines juridictions n'autorisent pas certaines limitations de responsabilité ; des parties de cette section peuvent donc ne pas s'appliquer à vous. Si vous êtes consommateur, vos droits légaux ne sont pas affectés.",
        zh: "某些地区不允许特定的责任限制，因此本节的部分内容可能不适用于你。如果你是消费者，你的法定权利不受影响。",
      },
    ],
  },
  {
    heading: {
      en: "Indemnity",
      ru: "Возмещение",
      es: "Indemnización",
      fr: "Indemnisation",
      zh: "赔偿",
    },
    blocks: [
      {
        en: "If someone brings a claim against us because of how you used the Service — because you broke these terms, broke the law, or infringed someone's rights — you agree to cover the reasonable losses, damages and legal costs we incur as a result.",
        ru: "Если к нам предъявят требование из-за того, как ты пользовался Сервисом — нарушил эти условия, закон или чужие права, — ты соглашаешься покрыть разумные убытки, ущерб и юридические расходы, которые мы из-за этого понесём.",
        es: "Si alguien nos presenta una reclamación por cómo usaste el Servicio —porque incumpliste estos términos, infringiste la ley o vulneraste los derechos de alguien—, aceptas cubrir las pérdidas, daños y costes legales razonables que ello nos ocasione.",
        fr: "Si une personne engage une action contre nous en raison de votre utilisation du Service — parce que vous avez enfreint les présentes conditions, la loi, ou les droits d'autrui —, vous acceptez de couvrir les pertes, dommages et frais juridiques raisonnables que nous subissons de ce fait.",
        zh: "如果因你使用本服务的方式——违反本条款、违反法律或侵犯他人权利——导致他人向我们提出索赔，你同意承担我们因此产生的合理损失、损害赔偿及法律费用。",
      },
      {
        en: "This does not apply to the extent the claim arises from our own breach or negligence, and it does not apply where you are a consumer and applicable consumer law prevents it.",
        ru: "Это не применяется в той части, в какой требование вызвано нашим нарушением или неосторожностью, и не применяется, если ты потребитель и применимое потребительское право этого не допускает.",
        es: "Esto no se aplica en la medida en que la reclamación derive de nuestro propio incumplimiento o negligencia, ni cuando seas consumidor y la ley de consumo aplicable lo impida.",
        fr: "Cela ne s'applique pas dans la mesure où la réclamation découle de notre propre manquement ou négligence, ni lorsque vous êtes consommateur et que le droit de la consommation applicable s'y oppose.",
        zh: "在索赔源于我们自身违约或过失的范围内不适用本条；当你是消费者且适用的消费者法律禁止时，也不适用。",
      },
    ],
  },
  {
    heading: {
      en: "Changes to these terms",
      ru: "Изменения этих условий",
      es: "Cambios en estos términos",
      fr: "Modifications des présentes conditions",
      zh: "本条款的变更",
    },
    blocks: [
      {
        en: "We may update these terms. When we do, we will change the date at the top of this page. If a change is significant, we will make a reasonable effort to tell you in advance — for example by a notice in the Service or a message to your registered email address.",
        ru: "Мы можем обновлять эти условия. При этом мы меняем дату вверху страницы. Если изменение существенное, мы приложим разумные усилия, чтобы предупредить заранее — например, уведомлением в Сервисе или письмом на твою почту.",
        es: "Podemos actualizar estos términos. Cuando lo hagamos, cambiaremos la fecha que aparece en la parte superior de esta página. Si un cambio es importante, haremos un esfuerzo razonable por avisarte con antelación, por ejemplo mediante un aviso en el Servicio o un mensaje a tu correo registrado.",
        fr: "Nous pouvons mettre à jour les présentes conditions. Le cas échéant, nous modifierons la date en haut de cette page. Si une modification est importante, nous ferons un effort raisonnable pour vous en informer à l'avance — par exemple par un avis dans le Service ou un message à votre adresse e-mail enregistrée.",
        zh: "我们可能更新本条款。更新时会修改本页顶部的日期。如果变更重大，我们会作出合理努力提前告知你——例如在服务内发布通知或发送邮件至你注册的邮箱。",
      },
      {
        en: "Continuing to use the Service after a change takes effect means you accept the updated terms. If you do not accept them, stop using the Service and close your account; if you have paid for a period that has not finished, we will refund the unused part.",
        ru: "Продолжая пользоваться Сервисом после вступления изменений в силу, ты принимаешь обновлённые условия. Если не принимаешь — прекрати пользоваться и закрой аккаунт; если оплачен незавершённый период, мы вернём неиспользованную часть.",
        es: "Seguir usando el Servicio después de que un cambio entre en vigor significa que aceptas los términos actualizados. Si no los aceptas, deja de usar el Servicio y cierra tu cuenta; si has pagado un periodo que no ha terminado, te devolveremos la parte no utilizada.",
        fr: "Continuer à utiliser le Service après l'entrée en vigueur d'une modification vaut acceptation des conditions mises à jour. Si vous ne les acceptez pas, cessez d'utiliser le Service et fermez votre compte ; si vous avez payé une période non achevée, nous rembourserons la partie non utilisée.",
        zh: "变更生效后继续使用本服务，即表示你接受更新后的条款。若不接受，请停止使用并关闭账户；如果你已付费的周期尚未结束，我们会退还未使用的部分。",
      },
    ],
  },
  {
    heading: {
      en: "Events outside our control",
      ru: "Обстоятельства вне нашего контроля",
      es: "Eventos fuera de nuestro control",
      fr: "Événements indépendants de notre volonté",
      zh: "我们无法控制的事件",
    },
    blocks: [
      {
        en: "We are not responsible for failing to perform where the cause is outside our reasonable control — including outages at our hosting, database, payment or AI providers, internet or power failures, natural events, epidemics, industrial action, war, sanctions, or acts of government.",
        ru: "Мы не отвечаем за неисполнение, причина которого вне нашего разумного контроля, — включая сбои у хостинга, базы данных, платёжного или ИИ-провайдера, отказы интернета и электричества, стихийные события, эпидемии, забастовки, войну, санкции или действия властей.",
        es: "No somos responsables del incumplimiento cuando la causa esté fuera de nuestro control razonable, incluidas caídas de nuestros proveedores de alojamiento, base de datos, pagos o IA, fallos de internet o de suministro eléctrico, fenómenos naturales, epidemias, huelgas, guerra, sanciones o actos de gobierno.",
        fr: "Nous ne sommes pas responsables d'une inexécution dont la cause échappe à notre contrôle raisonnable — y compris les pannes de nos prestataires d'hébergement, de base de données, de paiement ou d'IA, les coupures d'internet ou d'électricité, les événements naturels, les épidémies, les mouvements sociaux, la guerre, les sanctions ou les actes des autorités.",
        zh: "对于原因超出我们合理控制范围的不履行，我们不承担责任——包括托管、数据库、支付或 AI 服务商的故障，互联网或电力中断，自然事件，疫情，罢工，战争，制裁或政府行为。",
      },
      {
        en: "If such an event continues for a long period and prevents us from providing the Service, either of us may end this agreement, and we will refund any period you have paid for but not received.",
        ru: "Если такое обстоятельство длится долго и мешает нам оказывать Сервис, любая из сторон может прекратить это соглашение, и мы вернём оплату за период, который ты не получил.",
        es: "Si tal evento se prolonga y nos impide prestar el Servicio, cualquiera de las partes puede poner fin a este acuerdo, y te devolveremos el periodo que hayas pagado pero no recibido.",
        fr: "Si un tel événement se prolonge et nous empêche de fournir le Service, chacune des parties peut mettre fin à cet accord, et nous rembourserons toute période payée mais non fournie.",
        zh: "如果此类事件长期持续并妨碍我们提供服务，任何一方均可终止本协议，我们将退还你已付费但未获得服务的周期费用。",
      },
    ],
  },
  {
    heading: {
      en: "General",
      ru: "Общие положения",
      es: "Disposiciones generales",
      fr: "Dispositions générales",
      zh: "一般条款",
    },
    blocks: [
      {
        en: "These terms, together with the Privacy Policy and Refunds & Cancellation policy, are the entire agreement between us about the Service, and replace any earlier understanding.",
        ru: "Эти условия вместе с Политикой конфиденциальности и Политикой возвратов и отмены составляют полное соглашение между нами о Сервисе и заменяют любые прежние договорённости.",
        es: "Estos términos, junto con la Política de privacidad y la política de Reembolsos y cancelación, constituyen el acuerdo completo entre nosotros sobre el Servicio y sustituyen cualquier entendimiento anterior.",
        fr: "Les présentes conditions, avec la Politique de confidentialité et la politique de Remboursements et annulation, constituent l'intégralité de l'accord entre nous concernant le Service et remplacent tout accord antérieur.",
        zh: "本条款连同隐私政策以及退款与取消政策，构成我们之间关于本服务的完整协议，并取代此前的任何约定。",
      },
      {
        en: "If any part of these terms turns out to be unenforceable, it is severed and the rest stays in force. If we do not enforce a term straight away, we have not given up the right to enforce it later.",
        ru: "Если какая-то часть этих условий окажется неисполнимой, она отделяется, а остальное продолжает действовать. Если мы не применили какое-то условие сразу, это не значит, что мы отказались применять его позже.",
        es: "Si alguna parte de estos términos resulta inexigible, se separa y el resto sigue vigente. Si no hacemos valer una cláusula de inmediato, no renunciamos al derecho de hacerla valer más adelante.",
        fr: "Si une partie des présentes conditions s'avère inapplicable, elle est retranchée et le reste demeure en vigueur. Si nous n'appliquons pas immédiatement une clause, nous ne renonçons pas au droit de l'appliquer ultérieurement.",
        zh: "如果本条款的任何部分被认定不可执行，该部分将被分离，其余部分继续有效。我们未立即执行某一条款，不代表放弃日后执行该条款的权利。",
      },
      {
        en: "You may not transfer your rights or obligations under these terms to anyone else. We may transfer ours — for example if the business is sold — provided your rights are not reduced.",
        ru: "Ты не можешь передавать свои права и обязанности по этим условиям кому-либо ещё. Мы свои передать можем — например, при продаже бизнеса — при условии, что твои права не уменьшатся.",
        es: "No puedes transferir tus derechos u obligaciones bajo estos términos a nadie más. Nosotros sí podemos transferir los nuestros —por ejemplo, si se vende el negocio— siempre que tus derechos no se reduzcan.",
        fr: "Vous ne pouvez transférer vos droits ou obligations au titre des présentes conditions à quiconque. Nous pouvons transférer les nôtres — par exemple en cas de cession de l'activité — à condition que vos droits ne soient pas réduits.",
        zh: "你不得将本条款下的权利或义务转让给他人。我们可以转让我们的权利义务——例如业务被出售时——前提是你的权利不因此减损。",
      },
      {
        en: "There are no third-party beneficiaries to this agreement.",
        ru: "У этого соглашения нет третьих лиц-выгодоприобретателей.",
        es: "Este acuerdo no tiene terceros beneficiarios.",
        fr: "Le présent accord ne comporte pas de tiers bénéficiaires.",
        zh: "本协议不存在第三方受益人。",
      },
      {
        en: "We may send you notices by email to your registered address, or by a notice inside the Service. You can reach us using the contact details below.",
        ru: "Мы можем направлять тебе уведомления письмом на зарегистрированный адрес или сообщением внутри Сервиса. Связаться с нами можно по контактам ниже.",
        es: "Podemos enviarte avisos por correo a tu dirección registrada o mediante un aviso dentro del Servicio. Puedes contactarnos con los datos que figuran abajo.",
        fr: "Nous pouvons vous adresser des notifications par e-mail à votre adresse enregistrée, ou par un avis au sein du Service. Vous pouvez nous joindre via les coordonnées ci-dessous.",
        zh: "我们可以通过发送邮件至你注册的地址，或在服务内发布通知的方式向你送达通知。你可以通过下方的联系方式联系我们。",
      },
      {
        en: "You must not use the Service where doing so would breach applicable export controls or sanctions, and you confirm you are not subject to such restrictions.",
        ru: "Нельзя пользоваться Сервисом там, где это нарушило бы применимый экспортный контроль или санкции; ты подтверждаешь, что под такие ограничения не подпадаешь.",
        es: "No debes usar el Servicio cuando hacerlo infringiría controles de exportación o sanciones aplicables, y confirmas que no estás sujeto a tales restricciones.",
        fr: "Vous ne devez pas utiliser le Service lorsque cela enfreindrait les contrôles à l'exportation ou les sanctions applicables, et vous confirmez ne pas être soumis à de telles restrictions.",
        zh: "如果使用本服务会违反适用的出口管制或制裁规定，你不得使用本服务，并确认你不属于此类限制对象。",
      },
    ],
  },
  {
    heading: {
      en: "Complaints, governing law and contact",
      ru: "Жалобы, применимое право и контакты",
      es: "Reclamaciones, ley aplicable y contacto",
      fr: "Réclamations, droit applicable et contact",
      zh: "投诉、适用法律与联系方式",
    },
    blocks: [
      {
        en: "If something has gone wrong, contact us first — most problems are resolved quickly and directly, and we would rather fix an issue than argue about it.",
        ru: "Если что-то пошло не так, сначала напиши нам — большинство проблем решается быстро и напрямую, и нам лучше починить, чем спорить.",
        es: "Si algo ha ido mal, contáctanos primero: la mayoría de los problemas se resuelven rápido y de forma directa, y preferimos arreglar algo antes que discutirlo.",
        fr: "Si quelque chose s'est mal passé, contactez-nous d'abord — la plupart des problèmes se règlent vite et directement, et nous préférons corriger un problème plutôt qu'en débattre.",
        zh: "如果出了问题，请先联系我们——大多数问题都能快速直接地解决，我们宁愿把问题修好，也不愿争论。",
      },
      {
        en: `These terms are governed by the laws of ${GOVERNING_LAW}, and disputes will be handled by the courts there.`,
        ru: `Эти условия регулируются правом ${GOVERNING_LAW}, и споры рассматриваются судами этой юрисдикции.`,
        es: `Estos términos se rigen por las leyes de ${GOVERNING_LAW}, y las disputas se resolverán en sus tribunales.`,
        fr: `Les présentes conditions sont régies par le droit de ${GOVERNING_LAW}, et les litiges relèvent des tribunaux de ce ressort.`,
        zh: `本条款受 ${GOVERNING_LAW} 法律管辖，争议由当地法院处理。`,
      },
      {
        en: "If you are a consumer, this does not take away the protection of the mandatory consumer laws of the country you live in, and you may bring a claim in your local courts where that law allows it. Consumers in the EU may also use the European Commission's online dispute resolution platform.",
        ru: "Если ты потребитель, это не лишает тебя защиты императивных норм потребительского права страны проживания, и ты можешь подать иск в местный суд, если это право позволяет. Потребители в ЕС также могут воспользоваться платформой онлайн-урегулирования споров Еврокомиссии.",
        es: "Si eres consumidor, esto no te priva de la protección de las normas imperativas de consumo del país donde vives, y puedes presentar una reclamación ante tus tribunales locales cuando esa ley lo permita. Los consumidores de la UE también pueden usar la plataforma de resolución de litigios en línea de la Comisión Europea.",
        fr: "Si vous êtes consommateur, cela ne vous prive pas de la protection des règles impératives de consommation du pays où vous résidez, et vous pouvez agir devant vos tribunaux locaux lorsque ce droit le permet. Les consommateurs de l'UE peuvent également recourir à la plateforme de règlement en ligne des litiges de la Commission européenne.",
        zh: "如果你是消费者，这不影响你所居住国强制性消费者法律给予的保护；在该法律允许的情况下，你可以在当地法院提起诉讼。欧盟消费者还可以使用欧盟委员会的在线争议解决平台。",
      },
      {
        en: `For any question about these terms, your account, a refund, or your personal data: ${contact.en}`,
        ru: `По любым вопросам об этих условиях, аккаунте, возврате или персональных данных: ${contact.ru}`,
        es: `Para cualquier duda sobre estos términos, tu cuenta, un reembolso o tus datos personales: ${contact.es}`,
        fr: `Pour toute question sur les présentes conditions, votre compte, un remboursement ou vos données personnelles : ${contact.fr}`,
        zh: `如对本条款、你的账户、退款或个人数据有任何疑问：${contact.zh}`,
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title={{
        en: "Terms of Service",
        ru: "Условия использования",
        es: "Términos del servicio",
        fr: "Conditions d'utilisation",
        zh: "服务条款",
      }}
      intro={[
        {
          en: `These are the rules for using ${SERVICE}. They cover what you can expect from us, what we expect from you, and the limits of what a training app can safely do.`,
          ru: `Это правила пользования ${SERVICE}. Здесь о том, чего ждать от нас, чего мы ждём от тебя и где границы того, что тренировочное приложение может делать безопасно.`,
          es: `Estas son las reglas para usar ${SERVICE}. Cubren qué puedes esperar de nosotros, qué esperamos de ti y los límites de lo que una app de entrenamiento puede hacer con seguridad.`,
          fr: `Voici les règles d'utilisation de ${SERVICE}. Elles précisent ce que vous pouvez attendre de nous, ce que nous attendons de vous, et les limites de ce qu'une application d'entraînement peut faire en toute sécurité.`,
          zh: `这些是使用 ${SERVICE} 的规则，说明你可以对我们有何期待、我们对你有何期待，以及一款训练应用在安全范围内能做什么。`,
        },
        {
          en: "Section 3 is the one that matters most. Please read it properly before you train.",
          ru: "Самый важный — раздел 3. Прочитай его внимательно до начала тренировок.",
          es: "La sección 3 es la que más importa. Léela con atención antes de entrenar.",
          fr: "La section 3 est la plus importante. Lisez-la attentivement avant de vous entraîner.",
          zh: "第 3 节最为重要。开始训练前请认真阅读。",
        },
      ]}
      sections={SECTIONS}
    />
  );
}
