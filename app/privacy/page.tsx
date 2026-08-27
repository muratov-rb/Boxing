import type { Metadata } from "next";
import { LegalPage, type Section } from "@/components/legal/LegalPage";
import {
  OPERATOR,
  SERVICE,
  SITE,
  DATA_REGION,
  MIN_AGE,
  REQUEST_DAYS,
  MERCHANT,
  contactLine,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — RingBornn",
  description:
    "What RingBornn collects, why, who it is shared with, and how to get it deleted.",
};

/* Written against what the app actually does — the tables in Supabase, the
   keys in lib/tracking.ts and the three calls that reach Anthropic. If the
   data model changes, this has to change with it.

   Translated for readability; the English text is the version that governs,
   which the page states at the foot in every other language. */

const contact = contactLine();

const SECTIONS: Section[] = [
  {
    heading: {
      en: "Who we are",
      ru: "Кто мы",
      es: "Quiénes somos",
      fr: "Qui nous sommes",
      zh: "我们是谁",
    },
    blocks: [
      {
        en: `${SERVICE} is a boxing training service operated by ${OPERATOR} at ${SITE}. This policy explains what we do with your information, in plain language.`,
        ru: `${SERVICE} — сервис боксёрских тренировок, который ведёт ${OPERATOR} на ${SITE}. Эта политика простым языком объясняет, что мы делаем с твоими данными.`,
        es: `${SERVICE} es un servicio de entrenamiento de boxeo operado por ${OPERATOR} en ${SITE}. Esta política explica en lenguaje claro qué hacemos con tu información.`,
        fr: `${SERVICE} est un service d'entraînement à la boxe exploité par ${OPERATOR} sur ${SITE}. Cette politique explique en langage clair ce que nous faisons de vos informations.`,
        zh: `${SERVICE} 是由 ${OPERATOR} 在 ${SITE} 运营的拳击训练服务。本政策用直白的语言说明我们如何处理你的信息。`,
      },
      contact,
    ],
  },
  {
    heading: {
      en: "What we collect",
      ru: "Что мы собираем",
      es: "Qué recopilamos",
      fr: "Ce que nous collectons",
      zh: "我们收集什么",
    },
    blocks: [
      {
        en: "Only what the app needs to work. There is no advertising network, no analytics tracker and no third-party pixel anywhere in this product.",
        ru: "Только то, что нужно приложению для работы. Здесь нет рекламных сетей, аналитических трекеров и сторонних пикселей.",
        es: "Solo lo que la app necesita para funcionar. En este producto no hay ninguna red publicitaria, ningún rastreador de analítica ni ningún píxel de terceros.",
        fr: "Uniquement ce dont l'application a besoin pour fonctionner. Ce produit ne contient aucune régie publicitaire, aucun traceur analytique et aucun pixel tiers.",
        zh: "只收集应用运行所必需的内容。本产品中没有任何广告网络、分析追踪器或第三方像素。",
      },
      {
        en: "Account details, when you sign up:",
        ru: "Данные аккаунта при регистрации:",
        es: "Datos de la cuenta, al registrarte:",
        fr: "Informations de compte, lors de votre inscription :",
        zh: "注册时的账户信息：",
      },
      [
        {
          en: "Your email address.",
          ru: "Адрес электронной почты.",
          es: "Tu dirección de correo electrónico.",
          fr: "Votre adresse e-mail.",
          zh: "你的电子邮箱地址。",
        },
        {
          en: "Your name, as you choose to write it. It is shown on your profile and to any training partner you add.",
          ru: "Имя — в том виде, в каком ты его напишешь. Оно показывается в профиле и напарникам, которых ты добавишь.",
          es: "Tu nombre, tal como decidas escribirlo. Se muestra en tu perfil y a cualquier compañero de entrenamiento que añadas.",
          fr: "Votre nom, tel que vous choisissez de l'écrire. Il apparaît sur votre profil et auprès des partenaires d'entraînement que vous ajoutez.",
          zh: "你填写的名字。它会显示在你的个人资料上，以及你添加的训练搭档那里。",
        },
        {
          en: "A password, which is hashed by our authentication provider. We never see or store the password itself.",
          ru: "Пароль — его хеширует наш провайдер аутентификации. Сам пароль мы не видим и не храним.",
          es: "Una contraseña, cifrada mediante hash por nuestro proveedor de autenticación. Nunca vemos ni guardamos la contraseña en sí.",
          fr: "Un mot de passe, haché par notre fournisseur d'authentification. Nous ne voyons ni ne stockons jamais le mot de passe lui-même.",
          zh: "密码，由我们的身份验证服务商进行哈希处理。我们从不查看或存储密码本身。",
        },
        {
          en: "There is no sign-in with Google, Facebook or any other social account. An email address and a password is the only way in, so no social network is told that you use this service.",
          ru: "Входа через Google, Facebook или другие соцсети нет. Только почта и пароль — поэтому ни одна соцсеть не узнаёт, что ты пользуешься сервисом.",
          es: "No hay inicio de sesión con Google, Facebook ni ninguna otra cuenta social. Un correo y una contraseña son la única vía de acceso, así que ninguna red social se entera de que usas este servicio.",
          fr: "Il n'y a pas de connexion via Google, Facebook ou un autre compte social. Une adresse e-mail et un mot de passe sont le seul moyen d'entrer : aucun réseau social n'apprend que vous utilisez ce service.",
          zh: "不支持使用 Google、Facebook 或其他社交账号登录。唯一的登录方式是邮箱加密码，因此没有任何社交网络会知道你在使用本服务。",
        },
      ],
      {
        en: "Training profile, which you enter during onboarding:",
        ru: "Профиль тренировок, который ты заполняешь при настройке:",
        es: "Perfil de entrenamiento, que introduces durante la configuración inicial:",
        fr: "Profil d'entraînement, que vous saisissez lors de la configuration :",
        zh: "你在初始设置时填写的训练档案：",
      },
      [
        {
          en: "Body statistics: weight, height, age and sex.",
          ru: "Параметры тела: вес, рост, возраст и пол.",
          es: "Datos corporales: peso, altura, edad y sexo.",
          fr: "Données corporelles : poids, taille, âge et sexe.",
          zh: "身体数据：体重、身高、年龄和性别。",
        },
        {
          en: "Your training path, goals (including anything you type in the free-text goal box) and target weight.",
          ru: "Твой путь тренировок, цели (включая всё, что ты напишешь в свободном поле) и целевой вес.",
          es: "Tu itinerario de entrenamiento, objetivos (incluido lo que escribas en el campo libre) y peso objetivo.",
          fr: "Votre parcours d'entraînement, vos objectifs (y compris ce que vous écrivez dans le champ libre) et votre poids cible.",
          zh: "你的训练路线、目标（包括你在自由填写栏里写的内容）以及目标体重。",
        },
        {
          en: "Your timeframe, training environment and the equipment you have.",
          ru: "Срок, условия тренировок и доступное оборудование.",
          es: "Tu plazo, entorno de entrenamiento y el equipamiento del que dispones.",
          fr: "Votre échéance, votre environnement d'entraînement et le matériel dont vous disposez.",
          zh: "你的时间安排、训练环境以及你拥有的器材。",
        },
        {
          en: "Nutrition access and budget, whether you take supplements, and any diet notes you write.",
          ru: "Доступ к продуктам и бюджет, принимаешь ли добавки, и любые заметки о питании.",
          es: "Acceso a alimentos y presupuesto, si tomas suplementos y cualquier nota sobre tu dieta.",
          fr: "Votre accès à la nourriture et votre budget, la prise éventuelle de compléments, et vos notes sur l'alimentation.",
          zh: "食材获取情况与预算、是否服用补剂，以及你写下的任何饮食备注。",
        },
      ],
      {
        en: "Training activity, generated as you use the app:",
        ru: "Активность тренировок, которая накапливается по мере использования:",
        es: "Actividad de entrenamiento, generada mientras usas la app:",
        fr: "Activité d'entraînement, générée au fil de votre utilisation :",
        zh: "你使用应用过程中产生的训练活动数据：",
      },
      [
        {
          en: "Which days you trained and which days you opened the app.",
          ru: "В какие дни ты тренировался и в какие открывал приложение.",
          es: "Qué días entrenaste y qué días abriste la app.",
          fr: "Les jours où vous vous êtes entraîné et ceux où vous avez ouvert l'application.",
          zh: "你在哪些天训练过，以及哪些天打开过应用。",
        },
        {
          en: "XP, rank and streak progress.",
          ru: "Опыт, ранг и прогресс серий.",
          es: "XP, rango y progreso de rachas.",
          fr: "XP, rang et progression des séries.",
          zh: "经验值、段位和连续天数进度。",
        },
        {
          en: "Meals you log: name, calories, protein, carbohydrate, fat, and the time you logged them.",
          ru: "Записанные приёмы пищи: название, калории, белки, углеводы, жиры и время записи.",
          es: "Las comidas que registras: nombre, calorías, proteínas, carbohidratos, grasas y la hora en que las registraste.",
          fr: "Les repas que vous enregistrez : nom, calories, protéines, glucides, lipides et l'heure de l'enregistrement.",
          zh: "你记录的餐食：名称、热量、蛋白质、碳水、脂肪，以及记录时间。",
        },
        {
          en: "Calories burned, and counters for how often you use limited features.",
          ru: "Сожжённые калории и счётчики использования лимитированных функций.",
          es: "Calorías quemadas y contadores de cuántas veces usas funciones limitadas.",
          fr: "Les calories brûlées et des compteurs d'utilisation des fonctionnalités limitées.",
          zh: "消耗的热量，以及你使用受限功能次数的计数。",
        },
      ],
      {
        en: "Training partners, if you add any: who you are linked with, requests you have sent or received, and challenges exchanged between you. Your partners can see your name, your picture, your streak and your XP.",
        ru: "Напарники, если ты их добавишь: с кем ты связан, отправленные и полученные запросы и вызовы между вами. Напарники видят твоё имя, фото, серию и опыт.",
        es: "Compañeros de entrenamiento, si añades alguno: con quién estás vinculado, las solicitudes enviadas o recibidas y los retos intercambiados. Tus compañeros ven tu nombre, tu foto, tu racha y tu XP.",
        fr: "Vos partenaires d'entraînement, le cas échéant : avec qui vous êtes lié, les demandes envoyées ou reçues et les défis échangés. Vos partenaires voient votre nom, votre photo, votre série et vos XP.",
        zh: "训练搭档（如果你添加了）：你与谁建立了连接、你发出或收到的请求，以及你们之间的挑战。你的搭档可以看到你的名字、头像、连续天数和经验值。",
      },
      {
        en: "Subscription state: your plan, billing period, and when your trial started.",
        ru: "Состояние подписки: тариф, период оплаты и дата начала пробного периода.",
        es: "Estado de la suscripción: tu plan, periodo de facturación y cuándo empezó tu prueba.",
        fr: "État de l'abonnement : votre formule, la période de facturation et la date de début de votre essai.",
        zh: "订阅状态：你的方案、计费周期，以及试用开始的时间。",
      },
      {
        en: "Photos you choose to submit: a food photo for the calorie scanner, and a profile picture if you upload one. We do not access your camera without asking, and the scanner shows a consent prompt before the camera is opened.",
        ru: "Фотографии, которые ты сам отправляешь: снимок еды для сканера калорий и фото профиля, если загрузишь. Мы не обращаемся к камере без спроса, а сканер показывает запрос согласия до её открытия.",
        es: "Fotos que decides enviar: una foto de comida para el escáner de calorías y una foto de perfil si subes una. No accedemos a tu cámara sin pedírtelo, y el escáner muestra un aviso de consentimiento antes de abrirla.",
        fr: "Les photos que vous choisissez d'envoyer : une photo de repas pour le scanner de calories, et une photo de profil si vous en téléversez une. Nous n'accédons pas à votre caméra sans le demander, et le scanner affiche une demande de consentement avant de l'ouvrir.",
        zh: "你主动提交的照片：用于卡路里识别的食物照片，以及你上传的头像。未经询问我们不会访问你的摄像头，识别功能在开启摄像头前会显示同意提示。",
      },
      {
        en: "Support messages, if you write to us:",
        ru: "Обращения в поддержку, если ты нам пишешь:",
        es: "Mensajes de soporte, si nos escribes:",
        fr: "Les messages d'assistance, si vous nous écrivez :",
        zh: "如果你联系我们，还包括支持请求：",
      },
      [
        {
          en: "The reply address you give us, and what you write in the message.",
          ru: "Адрес для ответа, который ты укажешь, и текст сообщения.",
          es: "La dirección de respuesta que nos das y lo que escribes en el mensaje.",
          fr: "L'adresse de réponse que vous indiquez et le contenu de votre message.",
          zh: "你提供的回复地址，以及你在消息中写的内容。",
        },
        {
          en: "The page you came from and your browser's user-agent string, so a bug report can be reproduced. Nothing is read from the page itself.",
          ru: "Страница, с которой ты пришёл, и строка user-agent браузера — чтобы можно было воспроизвести баг. Содержимое страницы не считывается.",
          es: "La página desde la que llegaste y la cadena user-agent de tu navegador, para poder reproducir un fallo. No se lee nada de la página en sí.",
          fr: "La page d'où vous venez et la chaîne user-agent de votre navigateur, afin de pouvoir reproduire un bug. Rien n'est lu depuis la page elle-même.",
          zh: "你来自哪个页面，以及浏览器的 user-agent 字符串，以便复现问题。我们不会读取页面本身的内容。",
        },
        {
          en: "You can write to us without an account, in which case we hold only the above and have nothing to link it to.",
          ru: "Писать можно и без аккаунта — тогда у нас есть только перечисленное и связать это не с чем.",
          es: "Puedes escribirnos sin tener cuenta; en ese caso solo guardamos lo anterior y no hay nada con lo que vincularlo.",
          fr: "Vous pouvez nous écrire sans compte : dans ce cas nous ne conservons que ce qui précède, sans rien à quoi le rattacher.",
          zh: "你也可以在没有账户的情况下联系我们；那样我们只保存上述内容，没有任何东西可以与之关联。",
        },
      ],
    ],
  },
  {
    heading: {
      en: "Why we collect it",
      ru: "Зачем мы это собираем",
      es: "Por qué lo recopilamos",
      fr: "Pourquoi nous le collectons",
      zh: "我们为什么收集",
    },
    blocks: [
      {
        en: "Each piece of data earns its place:",
        ru: "Каждый кусочек данных должен быть оправдан:",
        es: "Cada dato se gana su sitio:",
        fr: "Chaque donnée doit justifier sa présence :",
        zh: "每一项数据都有其存在的理由：",
      },
      [
        {
          en: "Your body statistics and goals are used to calculate calorie and macro targets and to assess how realistic your goal is in your timeframe.",
          ru: "Параметры тела и цели нужны, чтобы рассчитать нормы калорий и БЖУ и оценить, насколько цель реальна в заданный срок.",
          es: "Tus datos corporales y objetivos sirven para calcular tus metas de calorías y macros y para valorar si tu objetivo es realista en tu plazo.",
          fr: "Vos données corporelles et vos objectifs servent à calculer vos cibles de calories et de macros et à évaluer si votre objectif est réaliste dans votre délai.",
          zh: "你的身体数据和目标用于计算热量与宏量营养素目标，并评估你的目标在设定时间内是否现实。",
        },
        {
          en: "Your equipment and environment decide which lessons and daily plans you are shown.",
          ru: "Оборудование и условия определяют, какие уроки и дневные планы тебе показывают.",
          es: "Tu equipamiento y entorno determinan qué lecciones y planes diarios se te muestran.",
          fr: "Votre matériel et votre environnement déterminent les leçons et plans quotidiens qui vous sont proposés.",
          zh: "你的器材和环境决定了向你展示哪些课程和每日计划。",
        },
        {
          en: "Your activity drives streaks, XP and ranks.",
          ru: "Активность формирует серии, опыт и ранги.",
          es: "Tu actividad alimenta las rachas, la XP y los rangos.",
          fr: "Votre activité alimente les séries, les XP et les rangs.",
          zh: "你的活动记录驱动连续天数、经验值和段位。",
        },
        {
          en: "Your email identifies your account and lets us contact you about it.",
          ru: "Почта идентифицирует аккаунт и позволяет с тобой связаться.",
          es: "Tu correo identifica tu cuenta y nos permite contactarte sobre ella.",
          fr: "Votre e-mail identifie votre compte et nous permet de vous contacter à son sujet.",
          zh: "你的邮箱用于标识账户，并让我们能就账户事宜联系你。",
        },
        {
          en: "Your name and picture identify you to the training partners you choose to add.",
          ru: "Имя и фото показывают, кто ты, тем напарникам, которых ты сам добавил.",
          es: "Tu nombre y tu foto te identifican ante los compañeros de entrenamiento que decidas añadir.",
          fr: "Votre nom et votre photo vous identifient auprès des partenaires d'entraînement que vous choisissez d'ajouter.",
          zh: "你的名字和头像用于向你主动添加的训练搭档标识你的身份。",
        },
        {
          en: "Your subscription state decides which features are unlocked.",
          ru: "Состояние подписки определяет, какие функции открыты.",
          es: "El estado de tu suscripción determina qué funciones están desbloqueadas.",
          fr: "L'état de votre abonnement détermine les fonctionnalités débloquées.",
          zh: "你的订阅状态决定哪些功能已解锁。",
        },
      ],
      {
        en: "We do not sell your data. We do not share it for advertising. We do not build profiles about you for anyone else.",
        ru: "Мы не продаём твои данные. Не передаём их для рекламы. Не строим на тебя профили для кого-то ещё.",
        es: "No vendemos tus datos. No los compartimos con fines publicitarios. No creamos perfiles sobre ti para nadie más.",
        fr: "Nous ne vendons pas vos données. Nous ne les partageons pas à des fins publicitaires. Nous ne constituons pas de profils vous concernant pour qui que ce soit.",
        zh: "我们不出售你的数据，不为广告目的共享数据，也不会为任何第三方建立你的画像。",
      },
    ],
  },
  {
    heading: {
      en: "Health-related information",
      ru: "Данные, связанные со здоровьем",
      es: "Información relacionada con la salud",
      fr: "Informations liées à la santé",
      zh: "与健康相关的信息",
    },
    blocks: [
      {
        en: "Your weight, height, age and fitness goals say something about your health. We treat them accordingly: they are used to generate your targets and guidance inside the app, and for nothing else. They are not shared with advertisers, insurers, employers, or any other third party.",
        ru: "Вес, рост, возраст и спортивные цели кое-что говорят о твоём здоровье. Мы относимся к ним соответственно: они используются только для расчёта твоих норм и рекомендаций внутри приложения. Их не передают рекламодателям, страховым, работодателям и никаким третьим лицам.",
        es: "Tu peso, altura, edad y objetivos de forma física dicen algo sobre tu salud. Los tratamos en consecuencia: se usan para generar tus metas y recomendaciones dentro de la app y para nada más. No se comparten con anunciantes, aseguradoras, empleadores ni ningún tercero.",
        fr: "Votre poids, votre taille, votre âge et vos objectifs sportifs disent quelque chose de votre santé. Nous les traitons en conséquence : ils servent à générer vos cibles et vos conseils dans l'application, et à rien d'autre. Ils ne sont partagés ni avec des annonceurs, ni avec des assureurs, ni avec des employeurs, ni avec aucun tiers.",
        zh: "你的体重、身高、年龄和健身目标在一定程度上反映了你的健康状况。我们据此谨慎对待：它们仅用于在应用内生成你的目标和建议，别无他用。不会共享给广告商、保险公司、雇主或任何第三方。",
      },
      {
        en: `You can use ${SERVICE} without entering a target weight or writing anything in the free-text goal and diet fields. The more you leave out, the less we hold.`,
        ru: `Пользоваться ${SERVICE} можно и без указания целевого веса и без записей в свободных полях цели и питания. Чем меньше ты укажешь, тем меньше у нас останется.`,
        es: `Puedes usar ${SERVICE} sin introducir un peso objetivo ni escribir nada en los campos libres de objetivo y dieta. Cuanto más omitas, menos guardamos.`,
        fr: `Vous pouvez utiliser ${SERVICE} sans indiquer de poids cible ni rien écrire dans les champs libres d'objectif et d'alimentation. Moins vous en dites, moins nous en détenons.`,
        zh: `你可以在不填写目标体重、也不在目标和饮食的自由填写栏里写任何内容的情况下使用 ${SERVICE}。你留白越多，我们掌握的就越少。`,
      },
    ],
  },
  {
    heading: {
      en: "Who your data is shared with",
      ru: "С кем мы делимся данными",
      es: "Con quién se comparten tus datos",
      fr: "Avec qui vos données sont partagées",
      zh: "你的数据会与谁共享",
    },
    blocks: [
      {
        en: "We use a small number of service providers to run the app. They process data on our instructions:",
        ru: "Для работы приложения мы используем небольшое число подрядчиков. Они обрабатывают данные по нашим указаниям:",
        es: "Usamos un número reducido de proveedores para hacer funcionar la app. Procesan los datos siguiendo nuestras instrucciones:",
        fr: "Nous faisons appel à un petit nombre de prestataires pour faire fonctionner l'application. Ils traitent les données sur nos instructions :",
        zh: "我们使用少数几家服务商来运行应用。他们按我们的指示处理数据：",
      },
      [
        {
          en: "Supabase — stores your account, profile, activity and subscription in a Postgres database, and handles sign-in.",
          ru: "Supabase — хранит аккаунт, профиль, активность и подписку в базе Postgres и отвечает за вход.",
          es: "Supabase: almacena tu cuenta, perfil, actividad y suscripción en una base de datos Postgres, y gestiona el inicio de sesión.",
          fr: "Supabase — stocke votre compte, votre profil, votre activité et votre abonnement dans une base Postgres, et gère la connexion.",
          zh: "Supabase——在 Postgres 数据库中存储你的账户、档案、活动和订阅，并处理登录。",
        },
        {
          en: "Vercel — hosts and serves the application.",
          ru: "Vercel — хостит и отдаёт приложение.",
          es: "Vercel: aloja y sirve la aplicación.",
          fr: "Vercel — héberge et sert l'application.",
          zh: "Vercel——托管并分发本应用。",
        },
        {
          en: `${MERCHANT} — takes payment as the merchant of record. If you subscribe, they receive your email and billing details in order to charge you and to work out the tax due where you live. We never see or store your card number.`,
          ru: `${MERCHANT} — принимает платежи как продавец записи. При оформлении подписки он получает твою почту и платёжные данные, чтобы списать оплату и рассчитать налог по месту жительства. Номер карты мы не видим и не храним.`,
          es: `${MERCHANT}: cobra como comerciante registrado. Si te suscribes, recibe tu correo y tus datos de facturación para cobrarte y calcular el impuesto correspondiente a tu país. Nunca vemos ni guardamos el número de tu tarjeta.`,
          fr: `${MERCHANT} — encaisse les paiements en tant que marchand officiel. Si vous vous abonnez, il reçoit votre e-mail et vos informations de facturation afin de vous débiter et de calculer la taxe due là où vous vivez. Nous ne voyons ni ne stockons jamais votre numéro de carte.`,
          zh: `${MERCHANT}——作为登记商户收款。如果你订阅，他们会收到你的邮箱和账单信息，用于扣款并计算你所在地应缴的税款。我们从不查看或存储你的卡号。`,
        },
        {
          en: "Anthropic — provides the AI behind the goal analysis, nutrition plans and food photo scanning. When you use one of those features, the relevant information is sent to Anthropic to generate the response. For the scanner, that includes the photo you submitted.",
          ru: "Anthropic — обеспечивает ИИ для анализа целей, планов питания и распознавания еды по фото. Когда ты пользуешься этими функциями, нужные данные отправляются в Anthropic для генерации ответа. Для сканера это включает отправленное фото.",
          es: "Anthropic: proporciona la IA que hay detrás del análisis de objetivos, los planes de nutrición y el escaneo de fotos de comida. Cuando usas una de esas funciones, la información pertinente se envía a Anthropic para generar la respuesta. En el caso del escáner, eso incluye la foto que enviaste.",
          fr: "Anthropic — fournit l'IA derrière l'analyse des objectifs, les plans nutritionnels et l'analyse des photos de repas. Lorsque vous utilisez l'une de ces fonctionnalités, les informations concernées sont envoyées à Anthropic pour générer la réponse. Pour le scanner, cela inclut la photo que vous avez envoyée.",
          zh: "Anthropic——为目标分析、营养计划和食物照片识别提供 AI 能力。当你使用其中任一功能时，相关信息会发送给 Anthropic 以生成回复。就识别功能而言，这包括你提交的照片。",
        },
      ],
      {
        en: "That is the whole list. There is no advertising network, no analytics provider and no social login in it.",
        ru: "Это весь список. В нём нет рекламных сетей, аналитических сервисов и входа через соцсети.",
        es: "Esa es la lista completa. En ella no hay ninguna red publicitaria, ningún proveedor de analítica ni ningún inicio de sesión social.",
        fr: "C'est la liste complète. Elle ne comprend aucune régie publicitaire, aucun prestataire d'analyse et aucune connexion sociale.",
        zh: "这就是全部名单。其中没有广告网络、分析服务商，也没有社交登录。",
      },
      {
        en: "Your training partners see your name, picture, streak and XP — that is the point of adding one — and nothing else. They cannot see your body statistics, your meals, your goals or your email.",
        ru: "Напарники видят твоё имя, фото, серию и опыт — ради этого их и добавляют — и больше ничего. Параметры тела, приёмы пищи, цели и почта им недоступны.",
        es: "Tus compañeros de entrenamiento ven tu nombre, foto, racha y XP —para eso se añade a alguien— y nada más. No pueden ver tus datos corporales, tus comidas, tus objetivos ni tu correo.",
        fr: "Vos partenaires d'entraînement voient votre nom, votre photo, votre série et vos XP — c'est tout l'intérêt d'en ajouter un — et rien d'autre. Ils ne peuvent voir ni vos données corporelles, ni vos repas, ni vos objectifs, ni votre e-mail.",
        zh: "你的训练搭档只能看到你的名字、头像、连续天数和经验值——添加搭档正是为此——除此之外看不到任何内容。他们看不到你的身体数据、餐食记录、目标或邮箱。",
      },
      {
        en: "We may also disclose information if we are legally required to, or where it is necessary to investigate abuse of the service.",
        ru: "Мы также можем раскрыть данные, если этого требует закон или если это необходимо для расследования злоупотреблений сервисом.",
        es: "También podemos revelar información si la ley nos obliga, o cuando sea necesario para investigar un uso abusivo del servicio.",
        fr: "Nous pouvons également divulguer des informations si la loi nous y oblige, ou lorsque cela est nécessaire pour enquêter sur un usage abusif du service.",
        zh: "如果法律要求，或为调查滥用服务的行为所必需，我们也可能披露相关信息。",
      },
    ],
  },
  {
    heading: {
      en: "International transfers",
      ru: "Международная передача данных",
      es: "Transferencias internacionales",
      fr: "Transferts internationaux",
      zh: "跨境传输",
    },
    blocks: [
      {
        en: `${SERVICE} is available worldwide. Your account and training data are stored in our database in ${DATA_REGION}, and the application itself is served from a global network so pages load close to you wherever you are.`,
        ru: `${SERVICE} доступен по всему миру. Аккаунт и данные тренировок хранятся в нашей базе в регионе ${DATA_REGION}, а само приложение раздаётся из глобальной сети, чтобы страницы грузились рядом с тобой.`,
        es: `${SERVICE} está disponible en todo el mundo. Tu cuenta y tus datos de entrenamiento se almacenan en nuestra base de datos en ${DATA_REGION}, y la aplicación se sirve desde una red global para que las páginas carguen cerca de ti estés donde estés.`,
        fr: `${SERVICE} est disponible dans le monde entier. Votre compte et vos données d'entraînement sont stockés dans notre base située en ${DATA_REGION}, et l'application elle-même est diffusée depuis un réseau mondial afin que les pages se chargent près de vous où que vous soyez.`,
        zh: `${SERVICE} 面向全球提供。你的账户和训练数据存储在我们位于 ${DATA_REGION} 的数据库中，应用本身则通过全球网络分发，以便无论你身在何处页面都能就近加载。`,
      },
      {
        en: "That means your data will usually be transferred out of the country you are in, including to countries whose data protection laws differ from your own. Where such a transfer is restricted by your local law — for example from the EEA or the UK — we rely on the standard contractual clauses and equivalent safeguards offered by our providers.",
        ru: "Это значит, что данные обычно передаются за пределы твоей страны, в том числе в страны с иным законодательством о защите данных. Там, где такая передача ограничена местным законом — например, из ЕЭЗ или Великобритании, — мы опираемся на стандартные договорные условия и равнозначные гарантии наших подрядчиков.",
        es: "Eso significa que tus datos normalmente saldrán del país en el que te encuentras, incluso hacia países cuyas leyes de protección de datos difieren de las tuyas. Cuando tal transferencia esté restringida por tu legislación local —por ejemplo desde el EEE o el Reino Unido—, nos apoyamos en las cláusulas contractuales tipo y salvaguardas equivalentes que ofrecen nuestros proveedores.",
        fr: "Cela signifie que vos données seront généralement transférées hors du pays où vous vous trouvez, y compris vers des pays dont les lois sur la protection des données diffèrent des vôtres. Lorsqu'un tel transfert est encadré par votre droit local — par exemple depuis l'EEE ou le Royaume-Uni —, nous nous appuyons sur les clauses contractuelles types et les garanties équivalentes proposées par nos prestataires.",
        zh: "这意味着你的数据通常会被传输到你所在国家之外，包括数据保护法律与你所在地不同的国家。当此类传输受你当地法律限制时——例如来自欧洲经济区或英国——我们依据服务商提供的标准合同条款及同等保障措施。",
      },
      {
        en: "By using the service you understand that these transfers take place. If you are not comfortable with that, please do not create an account.",
        ru: "Пользуясь сервисом, ты понимаешь, что такие передачи происходят. Если это тебя не устраивает, не создавай аккаунт.",
        es: "Al usar el servicio entiendes que estas transferencias ocurren. Si no te parece bien, por favor no crees una cuenta.",
        fr: "En utilisant le service, vous comprenez que ces transferts ont lieu. Si cela ne vous convient pas, veuillez ne pas créer de compte.",
        zh: "使用本服务即表示你了解这些传输会发生。如果你无法接受，请不要创建账户。",
      },
    ],
  },
  {
    heading: {
      en: "Data stored on your own device",
      ru: "Данные на твоём устройстве",
      es: "Datos guardados en tu propio dispositivo",
      fr: "Données stockées sur votre appareil",
      zh: "存储在你自己设备上的数据",
    },
    blocks: [
      {
        en: "The app keeps a copy of your training data in your browser so it loads instantly and keeps working when you are offline. That copy is synchronised with your account when you are signed in.",
        ru: "Приложение хранит копию данных тренировок в браузере, чтобы всё грузилось мгновенно и работало офлайн. Эта копия синхронизируется с аккаунтом, когда ты вошёл.",
        es: "La app guarda una copia de tus datos de entrenamiento en tu navegador para que cargue al instante y siga funcionando sin conexión. Esa copia se sincroniza con tu cuenta cuando has iniciado sesión.",
        fr: "L'application conserve une copie de vos données d'entraînement dans votre navigateur afin qu'elles se chargent instantanément et restent utilisables hors ligne. Cette copie est synchronisée avec votre compte lorsque vous êtes connecté.",
        zh: "应用会在你的浏览器中保留一份训练数据副本，以便即时加载并在离线时继续可用。登录后，该副本会与你的账户同步。",
      },
      {
        en: "We set four cookies. Every one is either required for the site to work or remembers a setting you chose:",
        ru: "Мы ставим четыре cookie. Каждая либо необходима для работы сайта, либо запоминает выбранную тобой настройку:",
        es: "Usamos cuatro cookies. Cada una es necesaria para que el sitio funcione o recuerda un ajuste que elegiste:",
        fr: "Nous déposons quatre cookies. Chacun est soit nécessaire au fonctionnement du site, soit destiné à mémoriser un réglage que vous avez choisi :",
        zh: "我们使用四个 Cookie。每一个要么是网站运行所必需，要么用于记住你选择的设置：",
      },
      [
        {
          en: "Supabase sign-in cookies (names begin with sb-) — keep you signed in as you move between pages and prove to our server that a request is really from you. Without them you would be signed out on every page load. They last for your session and refresh while you stay signed in.",
          ru: "Cookie входа Supabase (имена начинаются с sb-) — держат тебя авторизованным при переходах между страницами и подтверждают серверу, что запрос действительно от тебя. Без них ты выходил бы из аккаунта при каждой загрузке страницы. Живут в течение сессии и обновляются, пока ты остаёшься в аккаунте.",
          es: "Cookies de inicio de sesión de Supabase (sus nombres empiezan por sb-): te mantienen conectado al moverte entre páginas y demuestran a nuestro servidor que una petición viene realmente de ti. Sin ellas, se cerraría tu sesión en cada carga de página. Duran lo que tu sesión y se renuevan mientras sigas conectado.",
          fr: "Cookies de connexion Supabase (leurs noms commencent par sb-) — vous maintiennent connecté d'une page à l'autre et prouvent à notre serveur qu'une requête vient bien de vous. Sans eux, vous seriez déconnecté à chaque chargement de page. Ils durent le temps de votre session et se renouvellent tant que vous restez connecté.",
          zh: "Supabase 登录 Cookie（名称以 sb- 开头）——让你在页面间跳转时保持登录状态，并向我们的服务器证明请求确实来自你。没有它们，你每次加载页面都会被登出。它们在会话期间有效，并在你保持登录时刷新。",
        },
        {
          en: "rb_admin — set only on an administrator's own device after signing in to the private admin area, never on a normal user's device. It is signed, readable only by our server, and expires after 7 days.",
          ru: "rb_admin — ставится только на устройстве администратора после входа в закрытую админ-зону, никогда на устройстве обычного пользователя. Подписана, читается только нашим сервером и истекает через 7 дней.",
          es: "rb_admin: se establece únicamente en el dispositivo de un administrador tras iniciar sesión en el área privada de administración, nunca en el de un usuario normal. Está firmada, solo la puede leer nuestro servidor y caduca a los 7 días.",
          fr: "rb_admin — déposé uniquement sur l'appareil d'un administrateur après connexion à l'espace d'administration privé, jamais sur celui d'un utilisateur ordinaire. Il est signé, lisible uniquement par notre serveur, et expire au bout de 7 jours.",
          zh: "rb_admin——仅在管理员登录私有管理区域后设置在其本人设备上，绝不会设置在普通用户设备上。它经过签名，只有我们的服务器可读，7 天后过期。",
        },
        {
          en: "theme — remembers whether you chose light or dark mode, so the right one renders immediately instead of flashing the wrong one. Lasts one year.",
          ru: "theme — запоминает светлую или тёмную тему, чтобы сразу отрисовать нужную и не мигать не той. Живёт год.",
          es: "theme: recuerda si elegiste modo claro u oscuro, para mostrar el correcto de inmediato en lugar de parpadear con el otro. Dura un año.",
          fr: "theme — mémorise si vous avez choisi le mode clair ou sombre, afin d'afficher le bon immédiatement au lieu de faire clignoter l'autre. Durée : un an.",
          zh: "theme——记住你选择的浅色或深色模式，从而立即渲染正确的主题，避免闪现错误的一种。有效期一年。",
        },
        {
          en: "NEXT_LOCALE — remembers the language you selected. Lasts one year.",
          ru: "NEXT_LOCALE — запоминает выбранный язык. Живёт год.",
          es: "NEXT_LOCALE: recuerda el idioma que seleccionaste. Dura un año.",
          fr: "NEXT_LOCALE — mémorise la langue que vous avez choisie. Durée : un an.",
          zh: "NEXT_LOCALE——记住你选择的语言。有效期一年。",
        },
      ],
      {
        en: "That is the complete list. If we ever add a cookie, it will be described here before it is set.",
        ru: "Это полный список. Если мы когда-нибудь добавим cookie, она будет описана здесь до того, как её поставят.",
        es: "Esa es la lista completa. Si alguna vez añadimos una cookie, se describirá aquí antes de instalarla.",
        fr: "C'est la liste complète. Si nous ajoutons un jour un cookie, il sera décrit ici avant d'être déposé.",
        zh: "这就是完整名单。如果我们将来新增 Cookie，会在设置之前先在这里说明。",
      },
      {
        en: "To be explicit, because most sites do use these: there are no advertising or retargeting cookies, no third-party analytics (no Google Analytics, no Meta Pixel, no session recording), no social tracking pixels, no cross-site tracking, and no fingerprinting. We do not sell or share your browsing behaviour with anyone.",
        ru: "Скажем прямо, потому что большинство сайтов это использует: здесь нет рекламных и ретаргетинговых cookie, нет сторонней аналитики (ни Google Analytics, ни Meta Pixel, ни записи сессий), нет соцсетевых пикселей, нет межсайтового отслеживания и нет фингерпринтинга. Мы не продаём и не передаём никому твоё поведение в браузере.",
        es: "Por ser explícitos, ya que la mayoría de sitios sí las usan: no hay cookies publicitarias ni de retargeting, ni analítica de terceros (ni Google Analytics, ni Meta Pixel, ni grabación de sesiones), ni píxeles de seguimiento social, ni rastreo entre sitios, ni fingerprinting. No vendemos ni compartimos tu comportamiento de navegación con nadie.",
        fr: "Pour être explicites, car la plupart des sites en utilisent : il n'y a aucun cookie publicitaire ou de reciblage, aucune analyse tierce (ni Google Analytics, ni Meta Pixel, ni enregistrement de session), aucun pixel de suivi social, aucun suivi inter-sites et aucun fingerprinting. Nous ne vendons ni ne partageons votre comportement de navigation avec qui que ce soit.",
        zh: "明确说明，因为大多数网站确实在用这些：本站没有广告或再营销 Cookie，没有第三方分析（没有 Google Analytics、没有 Meta Pixel、没有会话录制），没有社交追踪像素，没有跨站追踪，也没有指纹识别。我们不会向任何人出售或共享你的浏览行为。",
      },
      {
        en: "Because these cookies are either strictly necessary to deliver a service you asked for, or simply remember a preference you set yourself, they do not require a consent banner under the ePrivacy rules. We do not set any other kind.",
        ru: "Поскольку эти cookie либо строго необходимы для запрошенного тобой сервиса, либо просто запоминают выбранную тобой настройку, баннер согласия по правилам ePrivacy для них не требуется. Никаких других мы не ставим.",
        es: "Como estas cookies son estrictamente necesarias para prestar un servicio que has solicitado, o simplemente recuerdan una preferencia que tú mismo fijaste, no requieren banner de consentimiento según las normas ePrivacy. No instalamos ninguna otra clase.",
        fr: "Comme ces cookies sont soit strictement nécessaires à la fourniture d'un service que vous avez demandé, soit destinés à mémoriser une préférence que vous avez vous-même définie, ils ne nécessitent pas de bandeau de consentement au titre des règles ePrivacy. Nous n'en déposons aucun autre type.",
        zh: "由于这些 Cookie 要么是提供你所请求服务所严格必需的，要么只是记住你自己设定的偏好，根据 ePrivacy 规则它们无需同意横幅。我们不设置任何其他类型的 Cookie。",
      },
      {
        en: "You can delete or block cookies in your browser settings. Blocking the sign-in cookies will stop you being able to log in — the Service cannot keep you authenticated without them. Blocking the preference cookies only means the site forgets your theme and language between visits.",
        ru: "Удалить или заблокировать cookie можно в настройках браузера. Блокировка cookie входа лишит тебя возможности авторизоваться — без них сервис не сможет держать сессию. Блокировка cookie настроек лишь означает, что сайт забудет тему и язык между визитами.",
        es: "Puedes borrar o bloquear cookies en los ajustes de tu navegador. Bloquear las de inicio de sesión te impedirá acceder: el Servicio no puede mantenerte autenticado sin ellas. Bloquear las de preferencias solo hace que el sitio olvide tu tema e idioma entre visitas.",
        fr: "Vous pouvez supprimer ou bloquer les cookies dans les réglages de votre navigateur. Bloquer les cookies de connexion vous empêchera de vous connecter : le Service ne peut pas vous maintenir authentifié sans eux. Bloquer les cookies de préférence signifie seulement que le site oubliera votre thème et votre langue d'une visite à l'autre.",
        zh: "你可以在浏览器设置中删除或屏蔽 Cookie。屏蔽登录 Cookie 会导致你无法登录——没有它们，本服务无法维持你的登录状态。屏蔽偏好 Cookie 只会让网站在两次访问之间忘记你的主题和语言。",
      },
      {
        en: "Clearing your browser storage removes the local copy of your training data; your account data stays on the server and syncs back when you sign in.",
        ru: "Очистка хранилища браузера удалит локальную копию данных тренировок; данные аккаунта останутся на сервере и синхронизируются обратно при входе.",
        es: "Borrar el almacenamiento del navegador elimina la copia local de tus datos de entrenamiento; los datos de tu cuenta permanecen en el servidor y vuelven a sincronizarse cuando inicias sesión.",
        fr: "Vider le stockage de votre navigateur supprime la copie locale de vos données d'entraînement ; les données de votre compte restent sur le serveur et se resynchronisent lorsque vous vous connectez.",
        zh: "清除浏览器存储会删除本地的训练数据副本；你的账户数据仍保留在服务器上，登录后会同步回来。",
      },
    ],
  },
  {
    heading: {
      en: "How long we keep it",
      ru: "Сколько мы это храним",
      es: "Cuánto tiempo lo conservamos",
      fr: "Combien de temps nous les conservons",
      zh: "我们保存多久",
    },
    blocks: [
      {
        en: "We keep your data for as long as your account exists, because the whole point of it is to show you progress over time.",
        ru: "Мы храним данные, пока существует аккаунт, — весь смысл в том, чтобы показывать прогресс во времени.",
        es: "Conservamos tus datos mientras exista tu cuenta, porque todo su sentido es mostrarte el progreso a lo largo del tiempo.",
        fr: "Nous conservons vos données tant que votre compte existe, car tout leur intérêt est de vous montrer votre progression dans le temps.",
        zh: "只要你的账户存在，我们就会保留你的数据，因为这些数据的意义正是展示你随时间的进步。",
      },
      {
        en: "You can delete your account yourself at any time, from your dashboard under Account. Doing so removes your profile, training history, progress, subscription record and sign-in from our database. It is immediate and it cannot be undone — we do not keep a backup copy to restore for you.",
        ru: "Удалить аккаунт можно самостоятельно в любой момент — в кабинете, раздел «Аккаунт». Это стирает из базы профиль, историю тренировок, прогресс, запись о подписке и данные входа. Происходит сразу и необратимо — резервной копии для восстановления мы не держим.",
        es: "Puedes eliminar tu cuenta tú mismo en cualquier momento, desde tu panel en Cuenta. Al hacerlo se borran de nuestra base de datos tu perfil, historial de entrenamiento, progreso, registro de suscripción e inicio de sesión. Es inmediato y no se puede deshacer: no guardamos una copia de seguridad para restaurártela.",
        fr: "Vous pouvez supprimer votre compte vous-même à tout moment, depuis votre tableau de bord, rubrique Compte. Cela supprime de notre base votre profil, votre historique d'entraînement, votre progression, votre abonnement et vos identifiants. C'est immédiat et irréversible : nous ne conservons pas de sauvegarde pour vous la restaurer.",
        zh: "你可以随时在面板的「账户」中自行删除账户。这会从我们的数据库中移除你的档案、训练历史、进度、订阅记录和登录信息。删除立即生效且无法撤销——我们不会保留备份供你恢复。",
      },
      {
        en: "If an account is closed by us for abuse of the service, the same data is deleted at the same time, and that deletion is equally permanent.",
        ru: "Если аккаунт закрываем мы — за злоупотребление сервисом, — те же данные удаляются одновременно, и это удаление так же необратимо.",
        es: "Si cerramos una cuenta por uso abusivo del servicio, esos mismos datos se eliminan al mismo tiempo, y ese borrado es igual de permanente.",
        fr: "Si un compte est fermé par nos soins pour usage abusif du service, les mêmes données sont supprimées au même moment, et cette suppression est tout aussi définitive.",
        zh: "如果我们因滥用服务而关闭某个账户，同样的数据会同时被删除，且删除同样是永久性的。",
      },
      {
        en: "Photos you submit for scanning are processed to generate your result and are not kept in your account afterwards. Our AI provider may retain them briefly for abuse monitoring under their own policy. A profile picture stays until you replace or remove it, and is deleted with your account.",
        ru: "Фото, отправленные на сканирование, обрабатываются для получения результата и после этого в аккаунте не хранятся. Наш ИИ-провайдер может недолго хранить их для контроля злоупотреблений по своей политике. Фото профиля хранится, пока ты его не заменишь или не удалишь, и удаляется вместе с аккаунтом.",
        es: "Las fotos que envías para escanear se procesan para generar tu resultado y después no se conservan en tu cuenta. Nuestro proveedor de IA puede retenerlas brevemente para vigilar abusos según su propia política. La foto de perfil permanece hasta que la sustituyas o la elimines, y se borra junto con tu cuenta.",
        fr: "Les photos que vous envoyez pour analyse sont traitées afin de générer votre résultat, puis ne sont pas conservées dans votre compte. Notre prestataire d'IA peut les conserver brièvement pour surveiller les abus, selon sa propre politique. Une photo de profil reste jusqu'à ce que vous la remplaciez ou la supprimiez, et disparaît avec votre compte.",
        zh: "你提交用于识别的照片会被处理以生成结果，之后不会保存在你的账户中。我们的 AI 服务商可能依据其自身政策短暂保留以监控滥用。头像会一直保留，直到你替换或删除它，并随账户一起删除。",
      },
      {
        en: "Support messages are kept while we are dealing with the matter and are deleted along with your account. Deleting your account also removes messages you sent us before signing in, matched on the address you wrote from.",
        ru: "Обращения в поддержку хранятся, пока мы разбираемся с вопросом, и удаляются вместе с аккаунтом. Удаление аккаунта также стирает сообщения, отправленные до входа, — по адресу, с которого ты писал.",
        es: "Los mensajes de soporte se conservan mientras gestionamos el asunto y se eliminan junto con tu cuenta. Borrar tu cuenta también elimina los mensajes que nos enviaste antes de iniciar sesión, identificados por la dirección desde la que escribiste.",
        fr: "Les messages d'assistance sont conservés le temps de traiter la demande et sont supprimés avec votre compte. La suppression de votre compte efface également les messages envoyés avant votre connexion, identifiés par l'adresse depuis laquelle vous avez écrit.",
        zh: "支持消息会在我们处理该事项期间保留，并随你的账户一起删除。删除账户也会移除你在登录前发送给我们的消息，依据你当时使用的地址匹配。",
      },
    ],
  },
  {
    heading: {
      en: "Your rights",
      ru: "Твои права",
      es: "Tus derechos",
      fr: "Vos droits",
      zh: "你的权利",
    },
    blocks: [
      {
        en: "Wherever you live, you can ask us to:",
        ru: "Где бы ты ни жил, ты можешь попросить нас:",
        es: "Vivas donde vivas, puedes pedirnos que:",
        fr: "Où que vous viviez, vous pouvez nous demander de :",
        zh: "无论你住在哪里，都可以要求我们：",
      },
      [
        {
          en: "Give you a copy of the data we hold about you, in a portable format.",
          ru: "Выдать копию хранящихся о тебе данных в переносимом формате.",
          es: "Te demos una copia de los datos que tenemos sobre ti, en un formato portable.",
          fr: "Vous remettre une copie des données que nous détenons sur vous, dans un format portable.",
          zh: "以可迁移的格式向你提供我们持有的关于你的数据副本。",
        },
        {
          en: "Correct anything that is wrong — most of it you can edit yourself in the app.",
          ru: "Исправить неверные данные — большую часть ты можешь отредактировать сам в приложении.",
          es: "Corrijamos cualquier cosa incorrecta; la mayoría puedes editarla tú mismo en la app.",
          fr: "Corriger toute information erronée — vous pouvez en modifier la plupart vous-même dans l'application.",
          zh: "更正任何有误的信息——其中大部分你可以在应用内自行编辑。",
        },
        {
          en: "Delete your account and the data attached to it. You can do this yourself from your dashboard, under Account, without asking us.",
          ru: "Удалить аккаунт и связанные с ним данные. Это можно сделать самому в кабинете, в разделе «Аккаунт», не обращаясь к нам.",
          es: "Eliminemos tu cuenta y los datos asociados. Puedes hacerlo tú mismo desde tu panel, en Cuenta, sin pedírnoslo.",
          fr: "Supprimer votre compte et les données qui y sont rattachées. Vous pouvez le faire vous-même depuis votre tableau de bord, rubrique Compte, sans nous solliciter.",
          zh: "删除你的账户及其关联数据。你可以在面板的「账户」中自行完成，无需向我们提出申请。",
        },
        {
          en: "Stop using your data for a particular purpose, or withdraw consent you previously gave.",
          ru: "Прекратить использование данных для конкретной цели или отозвать ранее данное согласие.",
          es: "Dejemos de usar tus datos para un fin concreto, o retires un consentimiento que diste antes.",
          fr: "Cesser d'utiliser vos données à une fin précise, ou retirer un consentement précédemment donné.",
          zh: "停止将你的数据用于某一特定目的，或撤回你先前给予的同意。",
        },
        {
          en: "Object to a particular use of your data, or ask us to restrict it while a dispute is resolved.",
          ru: "Возразить против конкретного использования данных или потребовать ограничить его на время спора.",
          es: "Te opongas a un uso concreto de tus datos, o nos pidas restringirlo mientras se resuelve una disputa.",
          fr: "Vous opposer à un usage précis de vos données, ou nous demander de le restreindre le temps qu'un litige soit résolu.",
          zh: "反对对你数据的某项特定使用，或要求我们在争议解决期间限制其使用。",
        },
      ],
      {
        en: `${contact.en} We will respond within ${REQUEST_DAYS} days, and we will not charge you for it or treat you differently for asking.`,
        ru: `${contact.ru} Мы ответим в течение ${REQUEST_DAYS} дней, не возьмём за это денег и не станем относиться к тебе иначе из-за обращения.`,
        es: `${contact.es} Responderemos en un plazo de ${REQUEST_DAYS} días, no te cobraremos por ello ni te trataremos de forma distinta por preguntar.`,
        fr: `${contact.fr} Nous répondrons sous ${REQUEST_DAYS} jours, sans frais et sans vous traiter différemment parce que vous avez demandé.`,
        zh: `${contact.zh} 我们会在 ${REQUEST_DAYS} 天内回复，不会为此收费，也不会因为你提出请求而区别对待你。`,
      },
      {
        en: "We honour these rights for everyone, not only for people in countries that require it. If your local law gives you more than the list above, that law applies to you too.",
        ru: "Мы соблюдаем эти права для всех, а не только там, где этого требует закон. Если местное законодательство даёт тебе больше перечисленного, оно тоже применяется.",
        es: "Respetamos estos derechos para todo el mundo, no solo para quienes viven en países que lo exigen. Si tu ley local te da más de lo que figura arriba, esa ley también se aplica.",
        fr: "Nous respectons ces droits pour tout le monde, et pas seulement pour les personnes situées dans des pays qui l'imposent. Si votre droit local vous accorde davantage que la liste ci-dessus, ce droit s'applique aussi.",
        zh: "我们对所有人都履行这些权利，而不仅限于法律有此要求的国家。如果你当地的法律赋予你的权利多于上述清单，该法律同样适用于你。",
      },
      {
        en: "Some regions add specific rights. If you are in the European Economic Area or the United Kingdom, our legal basis for processing your account and training data is the performance of our contract with you, and for optional AI features it is your consent, which you can withdraw at any time; you may also lodge a complaint with your national supervisory authority. If you are in California, we do not sell or share personal information as those terms are defined by the CCPA, and we do not offer financial incentives in exchange for it. If you are in Brazil, Canada, Australia, or another country with its own data protection statute, the equivalent rights under that statute apply.",
        ru: "В некоторых регионах есть дополнительные права. Если ты в Европейской экономической зоне или Великобритании, правовое основание обработки аккаунта и данных тренировок — исполнение договора с тобой, а для необязательных ИИ-функций — твоё согласие, которое можно отозвать в любой момент; ты также можешь подать жалобу в национальный надзорный орган. Если ты в Калифорнии, мы не продаём и не передаём персональные данные в том смысле, который придаёт этим терминам CCPA, и не предлагаем за них финансовых стимулов. Если ты в Бразилии, Канаде, Австралии или другой стране со своим законом о защите данных, применяются равнозначные права по этому закону.",
        es: "Algunas regiones añaden derechos específicos. Si estás en el Espacio Económico Europeo o el Reino Unido, nuestra base legal para tratar tu cuenta y tus datos de entrenamiento es la ejecución de nuestro contrato contigo, y para las funciones de IA opcionales es tu consentimiento, que puedes retirar en cualquier momento; también puedes presentar una reclamación ante tu autoridad de control nacional. Si estás en California, no vendemos ni compartimos información personal según define esos términos la CCPA, y no ofrecemos incentivos económicos a cambio. Si estás en Brasil, Canadá, Australia u otro país con su propia ley de protección de datos, se aplican los derechos equivalentes de esa ley.",
        fr: "Certaines régions ajoutent des droits spécifiques. Si vous êtes dans l'Espace économique européen ou au Royaume-Uni, notre base légale pour traiter votre compte et vos données d'entraînement est l'exécution de notre contrat avec vous, et pour les fonctionnalités d'IA facultatives, votre consentement, que vous pouvez retirer à tout moment ; vous pouvez également introduire une réclamation auprès de votre autorité de contrôle nationale. Si vous êtes en Californie, nous ne vendons ni ne partageons de données personnelles au sens du CCPA, et nous n'offrons aucune contrepartie financière en échange. Si vous êtes au Brésil, au Canada, en Australie ou dans un autre pays doté de sa propre loi sur la protection des données, les droits équivalents prévus par cette loi s'appliquent.",
        zh: "部分地区还有额外权利。如果你身处欧洲经济区或英国，我们处理你账户和训练数据的法律依据是履行与你的合同，而可选的 AI 功能则基于你的同意，你可随时撤回；你也可以向所在国的监管机构投诉。如果你在加利福尼亚州，我们不会按 CCPA 所定义的方式出售或共享个人信息，也不会以经济激励作为交换。如果你在巴西、加拿大、澳大利亚或其他有自身数据保护法的国家，该法下的同等权利适用。",
      },
    ],
  },
  {
    heading: {
      en: "Children",
      ru: "Дети",
      es: "Menores",
      fr: "Enfants",
      zh: "未成年人",
    },
    blocks: [
      {
        en: `${SERVICE} is not intended for anyone under ${MIN_AGE}, and the sign-up form will not accept an age below that. If you are under 18, please have a parent or guardian read this with you before you start training.`,
        ru: `${SERVICE} не предназначен для тех, кому меньше ${MIN_AGE}, и форма регистрации не примет меньший возраст. Если тебе нет 18, попроси родителя или опекуна прочитать это вместе с тобой до начала тренировок.`,
        es: `${SERVICE} no está pensado para menores de ${MIN_AGE} años, y el formulario de registro no aceptará una edad inferior. Si eres menor de 18, pide a un padre o tutor que lea esto contigo antes de empezar a entrenar.`,
        fr: `${SERVICE} n'est pas destiné aux personnes de moins de ${MIN_AGE} ans, et le formulaire d'inscription n'acceptera pas un âge inférieur. Si vous avez moins de 18 ans, faites lire ce document par un parent ou tuteur avant de commencer à vous entraîner.`,
        zh: `${SERVICE} 不面向 ${MIN_AGE} 岁以下人士，注册表单也不会接受低于该年龄的填写。如果你未满 18 岁，请在开始训练前让家长或监护人与你一起阅读本文件。`,
      },
      {
        en: "Where local law sets a higher age for consenting to this kind of processing, that higher age applies to you.",
        ru: "Если местный закон устанавливает более высокий возраст согласия на такую обработку, применяется он.",
        es: "Cuando la ley local fije una edad superior para consentir este tipo de tratamiento, se aplica esa edad más alta.",
        fr: "Lorsque le droit local fixe un âge plus élevé pour consentir à ce type de traitement, c'est cet âge qui s'applique.",
        zh: "如果当地法律对此类处理的同意年龄规定更高，则以该更高年龄为准。",
      },
      {
        en: "We do not knowingly collect data from children below the minimum age. If you believe a child has given us their information, contact us and we will delete it.",
        ru: "Мы сознательно не собираем данные детей младше минимального возраста. Если считаешь, что ребёнок передал нам свои данные, напиши — мы их удалим.",
        es: "No recopilamos conscientemente datos de menores por debajo de la edad mínima. Si crees que un menor nos ha dado su información, contáctanos y la eliminaremos.",
        fr: "Nous ne collectons pas sciemment de données d'enfants en dessous de l'âge minimal. Si vous pensez qu'un enfant nous a communiqué ses informations, contactez-nous et nous les supprimerons.",
        zh: "我们不会有意收集低于最低年龄的儿童数据。如果你认为有儿童向我们提供了信息，请联系我们，我们会予以删除。",
      },
    ],
  },
  {
    heading: {
      en: "Security",
      ru: "Безопасность",
      es: "Seguridad",
      fr: "Sécurité",
      zh: "安全",
    },
    blocks: [
      {
        en: "Your data is protected by database rules that allow each account to read and write only its own rows, enforced by the database itself rather than by application code. Passwords are hashed by our authentication provider. Traffic is encrypted in transit.",
        ru: "Данные защищены правилами базы, которые позволяют аккаунту читать и писать только свои строки, — это обеспечивает сама база, а не код приложения. Пароли хеширует провайдер аутентификации. Трафик шифруется при передаче.",
        es: "Tus datos están protegidos por reglas de base de datos que permiten a cada cuenta leer y escribir solo sus propias filas, aplicadas por la propia base de datos y no por el código de la aplicación. Las contraseñas las cifra mediante hash nuestro proveedor de autenticación. El tráfico va cifrado en tránsito.",
        fr: "Vos données sont protégées par des règles de base de données qui n'autorisent chaque compte à lire et écrire que ses propres lignes, appliquées par la base elle-même et non par le code applicatif. Les mots de passe sont hachés par notre fournisseur d'authentification. Le trafic est chiffré en transit.",
        zh: "你的数据受数据库规则保护，每个账户只能读写属于自己的记录，这一限制由数据库本身而非应用代码强制执行。密码由我们的身份验证服务商进行哈希处理。传输过程中的流量均已加密。",
      },
      {
        en: "No system is perfect. If you believe you have found a security problem, please report it to us rather than exploiting it, and we will address it.",
        ru: "Идеальных систем не бывает. Если ты нашёл проблему с безопасностью, сообщи нам, а не используй её — мы всё исправим.",
        es: "Ningún sistema es perfecto. Si crees haber encontrado un problema de seguridad, comunícanoslo en lugar de explotarlo, y lo resolveremos.",
        fr: "Aucun système n'est parfait. Si vous pensez avoir trouvé une faille de sécurité, signalez-la-nous plutôt que de l'exploiter, et nous la corrigerons.",
        zh: "没有系统是完美的。如果你认为发现了安全问题，请向我们报告而不是加以利用，我们会予以处理。",
      },
    ],
  },
  {
    heading: {
      en: "Changes to this policy",
      ru: "Изменения этой политики",
      es: "Cambios en esta política",
      fr: "Modifications de cette politique",
      zh: "本政策的变更",
    },
    blocks: [
      {
        en: "If we change how we handle your data, we will update this page and the date at the top of it. Continuing to use the service after a change means you accept the updated policy.",
        ru: "Если мы изменим порядок обработки данных, мы обновим эту страницу и дату вверху. Продолжая пользоваться сервисом после изменения, ты принимаешь обновлённую политику.",
        es: "Si cambiamos cómo tratamos tus datos, actualizaremos esta página y la fecha que aparece arriba. Seguir usando el servicio tras un cambio significa que aceptas la política actualizada.",
        fr: "Si nous modifions la manière dont nous traitons vos données, nous mettrons à jour cette page et la date qui figure en haut. Continuer à utiliser le service après une modification vaut acceptation de la politique mise à jour.",
        zh: "如果我们改变处理你数据的方式，会更新本页及页首的日期。变更后继续使用本服务，即表示你接受更新后的政策。",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title={{
        en: "Privacy Policy",
        ru: "Политика конфиденциальности",
        es: "Política de privacidad",
        fr: "Politique de confidentialité",
        zh: "隐私政策",
      }}
      intro={[
        {
          en: `This policy describes what ${SERVICE} collects about you, why we collect it, who else sees it, and what you can do about it.`,
          ru: `Эта политика описывает, что ${SERVICE} собирает о тебе, зачем, кто ещё это видит и что ты можешь с этим сделать.`,
          es: `Esta política describe qué recopila ${SERVICE} sobre ti, por qué lo hace, quién más lo ve y qué puedes hacer al respecto.`,
          fr: `Cette politique décrit ce que ${SERVICE} collecte à votre sujet, pourquoi, qui d'autre y a accès, et ce que vous pouvez faire.`,
          zh: `本政策说明 ${SERVICE} 收集你的哪些信息、为何收集、还有谁能看到，以及你可以做些什么。`,
        },
        {
          en: "It is written to be read, not to be skipped. If anything here is unclear, ask us and we will explain it.",
          ru: "Она написана, чтобы её читали, а не пролистывали. Если что-то непонятно — спроси, мы объясним.",
          es: "Está escrita para leerse, no para saltársela. Si algo no queda claro, pregúntanos y te lo explicamos.",
          fr: "Elle est écrite pour être lue, pas pour être sautée. Si quelque chose n'est pas clair, demandez-nous et nous vous l'expliquerons.",
          zh: "它是写来给人读的，不是让人跳过的。如果有任何不清楚的地方，问我们，我们会解释。",
        },
      ]}
      sections={SECTIONS}
    />
  );
}
