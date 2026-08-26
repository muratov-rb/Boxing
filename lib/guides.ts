/* ===========================================================================
   GUIDES — the coaching that isn't a movement.

   The lesson library answers "how do I throw a hook". None of it answers the
   questions that actually decide whether someone keeps going: what to do the
   week of a fight, how to breathe, what to eat before training, when NOT to
   train, what to do about nerves. A corner does not only shout combinations.

   Written as text on purpose. This is the half of the app that reads like a
   coach rather than a timer, and prose is the right shape for it.
   =========================================================================== */

export const GUIDE_CATS = ["prep", "session", "fuel", "recovery", "mind", "safety"] as const;
export type GuideCat = (typeof GUIDE_CATS)[number];

export interface GuideSection {
  heading: [en: string, ru: string];
  /** Paragraphs. A nested array renders as a bullet list. */
  body: ([en: string, ru: string] | [en: string, ru: string][])[];
}

export interface Guide {
  id: string;
  cat: GuideCat;
  title: [en: string, ru: string];
  summary: [en: string, ru: string];
  readMins: number;
  sections: GuideSection[];
}

const g = (x: Guide): Guide => x;

export const GUIDES: Guide[] = [
  g({
    id: "before-a-session",
    cat: "session",
    readMins: 3,
    title: ["Before you start: the warm-up that matters", "Перед началом: разминка, которая работает"],
    summary: [
      "Five minutes that decide whether the session is any good — and whether you finish it uninjured.",
      "Пять минут, которые решают, будет ли толк от тренировки и закончишь ли ты её целым.",
    ],
    sections: [
      {
        heading: ["Move, don't stretch", "Двигайся, а не тянись"],
        body: [
          [
            "Long static stretches before training make you looser and temporarily weaker — the opposite of what you want before throwing punches. Save them for after.",
            "Долгая статическая растяжка перед тренировкой делает тебя расслабленнее и временно слабее — ровно наоборот тому, что нужно перед ударами. Оставь её на потом.",
          ],
          [
            "What you want is heat and range: joints moving through the shapes the session will ask for, heart rate climbing, shoulders and hips awake.",
            "Нужны тепло и амплитуда: суставы проходят те траектории, которые понадобятся, пульс растёт, плечи и таз просыпаются.",
          ],
        ],
      },
      {
        heading: ["Five minutes, in order", "Пять минут, по порядку"],
        body: [
          [
            [
              "One minute: skip, jog on the spot, or fast feet. Just get warm.",
              "Минута: скакалка, бег на месте или частые ноги. Просто согрейся.",
            ],
            [
              "One minute: arm circles and shoulder rolls, forward and back.",
              "Минута: круги руками и вращения плечами, вперёд и назад.",
            ],
            [
              "One minute: hip circles, leg swings, deep squat holds.",
              "Минута: круги тазом, махи ногами, удержание глубокого приседа.",
            ],
            [
              "One minute: slow shadowboxing — full range, no power.",
              "Минута: медленный бой с тенью — полная амплитуда, без силы.",
            ],
            [
              "One minute: shadowboxing at half speed, adding snap.",
              "Минута: бой с тенью в полскорости, добавляя щелчок.",
            ],
          ],
        ],
      },
      {
        heading: ["The tell", "Признак"],
        body: [
          [
            "You are warm when you have broken a light sweat and your first hard punch does not feel like a surprise to your shoulder. If it does, you needed two more minutes.",
            "Ты разогрет, когда выступил лёгкий пот, а первый сильный удар не становится сюрпризом для плеча. Если стал — не хватило двух минут.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "how-to-breathe",
    cat: "session",
    readMins: 3,
    title: ["How to breathe when you fight", "Как дышать в бою"],
    summary: [
      "The single fastest improvement available to most beginners, and it costs nothing.",
      "Самое быстрое улучшение, доступное большинству новичков, и оно ничего не стоит.",
    ],
    sections: [
      {
        heading: ["Exhale on every shot", "Выдох на каждый удар"],
        body: [
          [
            "A sharp breath out as the punch lands does three things: it braces your core so the shot carries weight, it stops you holding your breath, and it means a body shot arriving at the same moment does far less damage.",
            "Резкий выдох в момент удара делает три вещи: напрягает корпус, чтобы удар был тяжёлым, не даёт задержать дыхание и сильно снижает урон от встречного удара по корпусу.",
          ],
          [
            "It should be short and audible — a hiss or a sh, not a shout. One breath per punch, four punches, four breaths.",
            "Он должен быть коротким и слышным — шипение, а не крик. Один выдох на удар: четыре удара — четыре выдоха.",
          ],
        ],
      },
      {
        heading: ["Breathe through the nose between exchanges", "Между разменами дыши носом"],
        body: [
          [
            "When you are not throwing, breathe in and out through the nose, making the exhale longer than the inhale. It brings the heart rate down faster than gulping through the mouth, and it stops the panic-breathing that empties a beginner in round two.",
            "Когда не бьёшь — вдох и выдох носом, выдох длиннее вдоха. Пульс падает быстрее, чем при заглатывании воздуха ртом, и это не даёт начаться панике, которая опустошает новичка ко второму раунду.",
          ],
          [
            "Practise it in the rest minute of every round you ever do. It has to be automatic before it is useful.",
            "Отрабатывай это в минуту отдыха каждого раунда. Пока не станет автоматом — толку не будет.",
          ],
        ],
      },
      {
        heading: ["The mistake everyone makes", "Ошибка, которую делают все"],
        body: [
          [
            "Holding your breath through a flurry. It feels like effort and it costs you the next thirty seconds. If you finish a combination and have to gasp, you held it.",
            "Задержка дыхания на серии. Кажется, что это усилие, а стоит следующих тридцати секунд. Если после комбинации приходится хватать воздух — значит, задержал.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "fight-week",
    cat: "prep",
    readMins: 4,
    title: ["Fight week: what to do and what to stop doing", "Неделя боя: что делать и что прекратить"],
    summary: [
      "The week before a fight is not the week to get fit. It is the week to arrive fresh.",
      "Неделя перед боем — не время набирать форму. Это время прийти свежим.",
    ],
    sections: [
      {
        heading: ["Training comes down, not up", "Нагрузка идёт вниз, а не вверх"],
        body: [
          [
            "Nothing you do in the last seven days makes you fitter — adaptation takes longer than that. Everything you do can make you more tired. Volume drops sharply; intensity stays sharp but brief.",
            "Ничто из сделанного за последние семь дней не добавит формы — адаптация идёт дольше. А вот усталости добавить может всё. Объём резко падает, интенсивность остаётся острой, но короткой.",
          ],
          [
            "Hard sparring stops. Short, sharp pad work and movement keep you connected to the timing without draining you.",
            "Жёсткий спарринг прекращается. Короткая острая работа на лапах и движение держат чувство тайминга, не выжимая тебя.",
          ],
        ],
      },
      {
        heading: ["Making weight", "Сгонка веса"],
        body: [
          [
            "If you are more than a couple of kilos out with a week to go, you did not plan the cut — you are now improvising with your own health. Cutting hard and late costs you the fight you were cutting for.",
            "Если за неделю до боя не хватает больше пары килограммов — сгонка не спланирована, и ты импровизируешь собственным здоровьем. Резкая поздняя сгонка стоит того самого боя, ради которого ты её делаешь.",
          ],
          [
            "A safe cut is gradual and mostly food, not water. Anything involving saunas, bin bags or not drinking belongs under the supervision of someone qualified, and this app is not that.",
            "Безопасная сгонка — постепенная и в основном за счёт еды, а не воды. Всё, что связано с сауной, плёнкой и отказом от воды, требует контроля квалифицированного человека — а это приложение им не является.",
          ],
        ],
      },
      {
        heading: ["The last 48 hours", "Последние 48 часов"],
        body: [
          [
            [
              "Sleep is the only performance drug that works. Bank it early — the night before, you may not sleep well and that is normal.",
              "Сон — единственный работающий допинг. Копи его заранее: в ночь перед боем ты можешь спать плохо, и это нормально.",
            ],
            [
              "Nothing new. Not food, not kit, not a supplement, not a warm-up you have never done.",
              "Ничего нового. Ни еды, ни экипировки, ни добавок, ни разминки, которую ты никогда не делал.",
            ],
            [
              "Eat what you have eaten before training all camp. Fight day is not the day to discover something disagrees with you.",
              "Ешь то, что ел перед тренировками весь сбор. День боя — не время выяснять, что тебе что-то не подходит.",
            ],
            [
              "Write the day out hour by hour. A plan is what you fall back on when the nerves arrive.",
              "Распиши день по часам. План — это то, на что опираешься, когда приходит мандраж.",
            ],
          ],
        ],
      },
      {
        heading: ["Warming up on the day", "Разминка в день боя"],
        body: [
          [
            "Build gradually so that you hit one hard round about thirty minutes before you walk. Then keep moving and stay covered up — a body that cools down has to be warmed twice.",
            "Наращивай постепенно, чтобы примерно за тридцать минут до выхода отработать один жёсткий раунд. Потом продолжай двигаться и не раздевайся — остывшее тело придётся разогревать дважды.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "nerves",
    cat: "mind",
    readMins: 3,
    title: ["Nerves before you compete", "Мандраж перед выступлением"],
    summary: [
      "Everyone gets them, including the people who look like they don't. What to do about it.",
      "Он есть у всех, включая тех, по кому не скажешь. Что с этим делать.",
    ],
    sections: [
      {
        heading: ["It is not a problem to be fixed", "Это не проблема, которую надо лечить"],
        body: [
          [
            "Nerves are your body preparing: heart rate up, blood to the muscles, senses sharpening. That is the same chemistry as being ready. Fighters who feel nothing before a fight usually perform worse, not better.",
            "Мандраж — это подготовка тела: пульс растёт, кровь идёт к мышцам, чувства обостряются. Это та же химия, что и готовность. Те, кто ничего не чувствует перед боем, обычно выступают хуже, а не лучше.",
          ],
          [
            "The goal is not to feel calm. It is to be able to work while feeling that.",
            "Цель — не быть спокойным. Цель — уметь работать, чувствуя это.",
          ],
        ],
      },
      {
        heading: ["A routine is the anchor", "Рутина — это якорь"],
        body: [
          [
            "Uncertainty is what turns nerves into anxiety. If you know what you are doing at every point of the day — when you eat, when you wrap, when you warm up, what your first thirty seconds look like — there is far less room for the mind to invent things.",
            "Тревогу из мандража делает неопределённость. Если ты знаешь, что делаешь в каждый момент дня — когда есть, когда бинтоваться, когда разминаться, как выглядят твои первые тридцать секунд — уму почти негде выдумывать.",
          ],
          [
            "Use the same routine in training. A ritual invented on the day is not a ritual.",
            "Используй ту же рутину на тренировках. Ритуал, придуманный в день боя, — не ритуал.",
          ],
        ],
      },
      {
        heading: ["Two things that work in the moment", "Две вещи, работающие прямо сейчас"],
        body: [
          [
            [
              "Slow the exhale. Four counts in, six or eight out, for a minute. It is the fastest lever you have on your own heart rate.",
              "Замедли выдох. Четыре счёта вдох, шесть-восемь выдох, в течение минуты. Это самый быстрый рычаг к собственному пульсу.",
            ],
            [
              "Narrow the task. Not \"win the fight\" — \"land the jab in the first ten seconds\". A small job you can actually do gives the mind somewhere to go.",
              "Сузь задачу. Не «выиграть бой», а «попасть джебом в первые десять секунд». Маленькое выполнимое дело даёт уму, куда идти.",
            ],
          ],
        ],
      },
    ],
  }),

  g({
    id: "eating-around-training",
    cat: "fuel",
    readMins: 3,
    title: ["What to eat before and after training", "Что есть до и после тренировки"],
    summary: [
      "Timing matters less than most people think, and more than nothing.",
      "Тайминг важен меньше, чем принято думать, но не совсем неважен.",
    ],
    sections: [
      {
        heading: ["Before", "До"],
        body: [
          [
            "Two to three hours out: a normal meal with carbohydrate and some protein. Rice and chicken, pasta, oats and eggs — whatever you actually eat.",
            "За два-три часа: обычный приём пищи с углеводами и белком. Рис с курицей, паста, овсянка с яйцами — то, что ты реально ешь.",
          ],
          [
            "Thirty to sixty minutes out, if you need anything at all: something small and mostly carbohydrate. A banana, toast and honey. Fat and heavy fibre this close to training sit in the stomach and make body shots miserable.",
            "За тридцать-шестьдесят минут, если вообще нужно: что-то маленькое и в основном углеводное. Банан, тост с мёдом. Жир и грубая клетчатка так близко к тренировке лежат в желудке и делают удары по корпусу невыносимыми.",
          ],
          [
            "Training in the morning without eating is fine for most people if the session is under an hour. If you feel dizzy or the last round collapses, it is not fine for you.",
            "Тренироваться утром натощак нормально для большинства, если тренировка меньше часа. Если кружится голова или последний раунд разваливается — значит, для тебя не нормально.",
          ],
        ],
      },
      {
        heading: ["After", "После"],
        body: [
          [
            "The one-hour \"anabolic window\" was oversold. What matters is that you get a proper meal with protein at some point after training, and that your total intake across the day is right.",
            "«Анаболическое окно» в один час сильно преувеличено. Важно, что после тренировки ты нормально поешь с белком — и что общий дневной рацион в порядке.",
          ],
          [
            "If you train twice a day, or the next session is within a few hours, then eat sooner rather than later — that is the case where timing genuinely counts.",
            "Если тренируешься дважды в день или следующая тренировка через несколько часов — ешь скорее раньше, чем позже. Вот здесь тайминг действительно важен.",
          ],
        ],
      },
      {
        heading: ["Water", "Вода"],
        body: [
          [
            "Drink through the day, not all at once before training. Arriving already hydrated works; drinking half a litre in the changing room does not.",
            "Пей в течение дня, а не всё сразу перед тренировкой. Прийти уже напившимся работает; выпить пол-литра в раздевалке — нет.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "recovery",
    cat: "recovery",
    readMins: 3,
    title: ["Recovery: the part everyone skips", "Восстановление: то, что все пропускают"],
    summary: [
      "You do not get fitter during training. You get fitter recovering from it.",
      "Форма растёт не на тренировке. Она растёт, пока ты восстанавливаешься после неё.",
    ],
    sections: [
      {
        heading: ["Sleep first, everything else second", "Сначала сон, всё остальное потом"],
        body: [
          [
            "Nothing on the recovery shelf — no supplement, no ice bath, no massage gun — comes close to an extra hour of sleep. If you are training hard and sleeping six hours, you do not have a recovery problem you can buy your way out of.",
            "Ничто с полки восстановления — ни добавки, ни ледяная ванна, ни массажный пистолет — не сравнится с лишним часом сна. Если ты жёстко тренируешься и спишь шесть часов, эту проблему не купить.",
          ],
        ],
      },
      {
        heading: ["Soreness is not the scoreboard", "Крепатура — не показатель"],
        body: [
          [
            "Being sore means you did something unfamiliar, not something effective. A session that leaves you wrecked for three days cost you two sessions.",
            "Болит — значит, ты сделал непривычное, а не эффективное. Тренировка, после которой ты разбит три дня, стоила тебе двух тренировок.",
          ],
          [
            "Light movement on a sore day helps more than lying still: walk, skip easy, shadowbox slowly.",
            "Лёгкое движение в день крепатуры помогает больше, чем лежание: пройдись, лёгкая скакалка, медленный бой с тенью.",
          ],
        ],
      },
      {
        heading: ["Rest days are training days", "Дни отдыха — тоже тренировочные дни"],
        body: [
          [
            "One full day off a week, minimum. Not because you are soft, but because the adaptation you are chasing happens on that day and not on the others.",
            "Минимум один полный выходной в неделю. Не потому что ты слабый, а потому что нужная адаптация происходит именно в этот день, а не в остальные.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "wraps-and-hands",
    cat: "safety",
    readMins: 3,
    title: ["Your hands: wraps, and why they matter", "Твои руки: бинты и зачем они"],
    summary: [
      "Hand injuries end more amateur boxing than head shots do. Most are avoidable.",
      "Травмы кистей заканчивают любительский бокс чаще, чем удары в голову. Большинство из них можно избежать.",
    ],
    sections: [
      {
        heading: ["What wraps actually do", "Что на самом деле делают бинты"],
        body: [
          [
            "They hold the small bones of the hand together and support the wrist. They are not padding — the glove is the padding. A wrap that is soft and loose is decoration.",
            "Они держат мелкие кости кисти вместе и поддерживают запястье. Это не амортизация — амортизирует перчатка. Мягкий свободный бинт — украшение.",
          ],
          [
            "Wrap for the bag and for sparring, every time. The injury does not come from the hard session you were ready for; it comes from the casual one you were not.",
            "Бинтуйся на мешок и на спарринг всегда. Травма приходит не с жёсткой тренировки, к которой ты готов, а со случайной, к которой не готовился.",
          ],
        ],
      },
      {
        heading: ["The order", "Порядок"],
        body: [
          [
            [
              "Loop over the thumb, then three turns around the wrist. This is the part that stops sprains.",
              "Петля на большой палец, затем три оборота вокруг запястья. Именно это предотвращает растяжения.",
            ],
            [
              "Three turns around the palm, below the knuckles.",
              "Три оборота вокруг ладони, под костяшками.",
            ],
            [
              "Between the fingers, one at a time, returning across the palm each time.",
              "Между пальцами по одному, каждый раз возвращаясь через ладонь.",
            ],
            [
              "Back down to the wrist, finish there, and fasten.",
              "Обратно к запястью, там и закончи, застегни.",
            ],
            [
              "Make a fist. It should tighten, not pinch. If your fingers tingle, start again.",
              "Сожми кулак. Он должен затянуться, а не пережать. Если пальцы покалывает — перебинтуйся.",
            ],
          ],
        ],
      },
      {
        heading: ["Punching form saves hands too", "Техника удара тоже бережёт руки"],
        body: [
          [
            "Land on the first two knuckles with a straight wrist. Most broken hands are a bent wrist or a hook landing on the little-finger side.",
            "Попадай первыми двумя костяшками при прямом запястье. Большинство переломов — это согнутое запястье или хук, пришедший стороной мизинца.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "when-not-to-train",
    cat: "safety",
    readMins: 2,
    title: ["When not to train", "Когда не тренироваться"],
    summary: [
      "Short, and the most important thing in this section.",
      "Коротко — и это самое важное в разделе.",
    ],
    sections: [
      {
        heading: ["After a head knock, stop", "После удара в голову — стоп"],
        body: [
          [
            "If you have been dropped, wobbled, or feel foggy, headachy, sick or off-balance after a shot: you are done for the day, and you see a doctor before you spar again. A second head injury before the first has healed is the one that does permanent damage.",
            "Если тебя роняли, шатало, если после удара туман, головная боль, тошнота или нарушено равновесие — на сегодня всё, и к спаррингу только после врача. Именно вторая травма головы до заживления первой наносит необратимый вред.",
          ],
          [
            "This is not caution. It is the single rule in combat sports that is not negotiable.",
            "Это не осторожность. Это единственное правило в единоборствах, которое не обсуждается.",
          ],
        ],
      },
      {
        heading: ["The rest of the list", "Остальной список"],
        body: [
          [
            [
              "Fever, or anything below the neck — chest, stomach, aching all over. Train through a head cold if you must; never through a fever.",
              "Температура или всё, что ниже шеи — грудь, живот, ломота. Лёгкий насморк — можно; температуру — никогда.",
            ],
            [
              "Sharp pain, as opposed to ache. Sharp means stop and find out why.",
              "Резкая боль, в отличие от ноющей. Резкая — значит, стоп и разбираться.",
            ],
            [
              "Pain in a joint that is still there the next morning.",
              "Боль в суставе, которая осталась на следующее утро.",
            ],
            [
              "Three nights of bad sleep in a row. Train light or not at all — you will not get anything out of it anyway.",
              "Три ночи плохого сна подряд. Тренируйся легко или никак — толку всё равно не будет.",
            ],
          ],
        ],
      },
    ],
  }),

  g({
    id: "first-sparring",
    cat: "prep",
    readMins: 3,
    title: ["Your first spar", "Твой первый спарринг"],
    summary: [
      "What it is for, what it is not for, and how not to embarrass yourself.",
      "Зачем он нужен, зачем не нужен и как не опозориться.",
    ],
    sections: [
      {
        heading: ["It is not a fight", "Это не бой"],
        body: [
          [
            "Sparring is practice with a live opponent. The person opposite you is a training partner, not a threat, and their job is to make you better. Yours is the same.",
            "Спарринг — это отработка с живым партнёром. Напротив тебя партнёр, а не угроза, и его задача — сделать тебя лучше. Твоя — та же.",
          ],
          [
            "Anyone who treats a first spar as a chance to hurt a beginner is telling you something about themselves. Say so to the coach.",
            "Тот, кто видит в первом спарринге шанс покалечить новичка, рассказывает о себе. Скажи об этом тренеру.",
          ],
        ],
      },
      {
        heading: ["What to actually do", "Что делать на деле"],
        body: [
          [
            [
              "Breathe. Almost everyone holds their breath and is exhausted in ninety seconds.",
              "Дыши. Почти все задерживают дыхание и выдыхаются за полторы минуты.",
            ],
            [
              "Jab and move. One clean jab beats a wild flurry that leaves you open.",
              "Джеб и движение. Один чистый джеб лучше дикой серии, после которой ты открыт.",
            ],
            [
              "Keep your eyes open and look at the chest, not the hands. Punches come from there.",
              "Держи глаза открытыми и смотри на грудь, а не на руки. Удары идут оттуда.",
            ],
            [
              "Hands back to the chin every time. Every time.",
              "Руки возвращаются к подбородку каждый раз. Каждый.",
            ],
          ],
        ],
      },
      {
        heading: ["Afterwards", "После"],
        body: [
          [
            "You will remember almost none of it, and you will have done better than you think. Ask your partner what they saw — it is the most useful feedback you will get all month.",
            "Ты почти ничего не вспомнишь и сработал лучше, чем тебе кажется. Спроси партнёра, что он видел, — это самая полезная обратная связь за месяц.",
          ],
        ],
      },
    ],
  }),

  g({
    id: "staying-consistent",
    cat: "mind",
    readMins: 3,
    title: ["Training when you don't feel like it", "Тренировки, когда не хочется"],
    summary: [
      "Motivation is not the thing that keeps people training. This is what does.",
      "Мотивация — не то, что удерживает людей в зале. Удерживает вот что.",
    ],
    sections: [
      {
        heading: ["Lower the bar to something you cannot fail", "Опусти планку до невозможности провалиться"],
        body: [
          [
            "On a bad day, do not negotiate about the full session. Commit to the warm-up alone. Most days you will carry on once you are moving, and on the days you do not, you still trained — which keeps the streak and the habit alive.",
            "В плохой день не торгуйся про полную тренировку. Договорись только на разминку. Чаще всего ты продолжишь, когда уже двигаешься, а если нет — ты всё равно потренировался, и цепочка с привычкой уцелели.",
          ],
        ],
      },
      {
        heading: ["Never miss twice", "Никогда не пропускай дважды"],
        body: [
          [
            "One missed session is life. Two in a row is the start of a new pattern. If you miss, the only thing that matters is the very next one.",
            "Один пропуск — это жизнь. Два подряд — начало новой привычки. Если пропустил, значение имеет только следующая тренировка.",
          ],
        ],
      },
      {
        heading: ["Judge the month, not the day", "Оценивай месяц, а не день"],
        body: [
          [
            "Single sessions feel like nothing, because they are nothing on their own. Progress in boxing is invisible day to day and obvious over eight weeks. If you keep score daily, you will quit before the evidence arrives.",
            "Отдельная тренировка ощущается пустотой, потому что сама по себе она и есть пустота. Прогресс в боксе незаметен изо дня в день и очевиден за восемь недель. Если считать по дням — бросишь раньше, чем появятся доказательства.",
          ],
        ],
      },
    ],
  }),
];

export function guideById(id: string): Guide | undefined {
  return GUIDES.find((x) => x.id === id);
}

export function guidesByCat(cat: GuideCat | "all"): Guide[] {
  return cat === "all" ? GUIDES : GUIDES.filter((x) => x.cat === cat);
}
