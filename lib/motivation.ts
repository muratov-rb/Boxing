import { RANKS } from "./onboarding";
import type { I18nText } from "./exercises";

/* ===========================================================================
   RINGBORNN — the corner between rounds.

   Static text, deliberately. This is the one place in the app where a
   language model would be the obvious choice and the wrong one: it would cost
   money on every session, take a second to arrive, and — worst — drift into
   the same four platitudes about "pushing through", which is exactly the
   repetition it would be there to avoid. Written lines cost nothing, appear
   instantly, and each one can be checked by someone who boxes.

   Fifteen per rank across eleven ranks, five of each kind. What a Novice
   needs to hear ("just come back tomorrow") is not what a Professional needs
   to hear ("your recovery is the training"), so the ladder is the axis.

   English and Russian only, matching lib/exercises.ts — every other locale
   falls back to English, the same way the lesson content already does.
   =========================================================================== */

export type MotivationKind = "motivation" | "advice" | "tactic";

export interface MotivationItem {
  kind: MotivationKind;
  text: I18nText;
}

/** [kind, English, Russian] — a tuple purely so 165 entries stay readable. */
type Entry = [MotivationKind, string, string];

const M = "motivation" as const;
const A = "advice" as const;
const T = "tactic" as const;

const RAW: Entry[][] = [
  /* ---------------------------------------------------------- 0 · Novice -- */
  [
    [M, "Everyone in every gym was once exactly where you are. The difference is they came back the next day.", "Каждый в любом зале когда-то был ровно там, где ты сейчас. Разница только в том, что они пришли на следующий день."],
    [M, "You are not bad at boxing. You are new at boxing. Those are completely different problems, and only one of them lasts.", "Ты не плох в боксе. Ты новичок в боксе. Это совершенно разные проблемы, и только одна из них надолго."],
    [M, "The first two weeks feel clumsy for absolutely everyone. Feeling clumsy is not a sign to stop — it is the sign that you started.", "Первые две недели неуклюже абсолютно у всех. Неуклюжесть — не сигнал бросить, а признак того, что ты начал."],
    [M, "Three short sessions a week will beat one heroic session a month, every time. Boxing rewards the regular, not the dramatic.", "Три коротких тренировки в неделю всегда обыграют одну героическую раз в месяц. Бокс вознаграждает регулярных, а не эффектных."],
    [M, "Nobody is watching you train. That is the good news — you are free to be a beginner for as long as it takes.", "Никто не смотрит, как ты тренируешься. И это хорошая новость: ты можешь быть новичком столько, сколько нужно."],
    [A, "Learn the stance before you learn the punch. Everything you throw later is built on where your feet are now.", "Сначала стойка, потом удар. Всё, что ты будешь бить потом, стоит на том, где сейчас твои ноги."],
    [A, "Breathe out on every punch. Holding your breath is what makes a round feel twice as long as it is.", "Выдыхай на каждом ударе. Именно задержка дыхания делает раунд вдвое длиннее, чем он есть."],
    [A, "Keep your shoulders down and loose. Tension is the fastest way to be exhausted after ninety seconds.", "Держи плечи опущенными и расслабленными. Зажатость — самый быстрый способ выдохнуться за полторы минуты."],
    [A, "Shadowbox in front of a mirror. It is the cheapest coach you will ever have, and it never lies to you.", "Работай с тенью перед зеркалом. Это самый дешёвый тренер в твоей жизни, и он никогда не врёт."],
    [A, "Wrap your hands properly, every single time. Wrist injuries end more beginners than hard sparring ever does.", "Бинтуй руки правильно, каждый раз. Травмы запястья заканчивают карьеру новичков чаще, чем жёсткие спарринги."],
    [T, "The jab is the most important punch in boxing. It is not the one that ends fights, it is the one that starts everything.", "Джеб — самый важный удар в боксе. Он не заканчивает бой, но начинает всё."],
    [T, "Your chin stays down and behind your lead shoulder. That one habit prevents more damage than any block.", "Подбородок опущен и спрятан за передним плечом. Эта единственная привычка спасает больше, чем любой блок."],
    [T, "Never cross your feet. Once your legs tangle you cannot punch, and you cannot escape.", "Никогда не перекрещивай ноги. Как только они запутались, ты не можешь ни бить, ни уйти."],
    [T, "Every hand that goes out must come straight back to your face. A punch that stays out is an invitation.", "Каждая рука, ушедшая вперёд, обязана вернуться к лицу. Оставленный впереди кулак — это приглашение."],
    [T, "Look at the middle of the chest, not at the hands. From there you see both shoulders move before the punch does.", "Смотри в центр груди, а не на руки. Оттуда видно оба плеча раньше, чем пойдёт удар."],
  ],

  /* --------------------------------------------------------- 1 · Amateur -- */
  [
    [M, "You have stopped thinking about your feet. That is a real milestone, and most people quit before reaching it.", "Ты перестал думать о ногах. Это настоящая веха, и большинство бросает, не дойдя до неё."],
    [M, "The basics are not the boring part you get through. They are the part that never stops mattering.", "База — это не скучный этап, который надо пережить. Это то, что не перестаёт иметь значение никогда."],
    [M, "Progress at this stage is invisible day to day and obvious month to month. Trust the month.", "На этом этапе прогресс невиден день ко дню и очевиден месяц к месяцу. Верь месяцу."],
    [M, "The session you least want to do is usually the one that moves you the furthest.", "Тренировка, которую меньше всего хочется делать, обычно двигает дальше всех остальных."],
    [M, "You are now better than the version of you that started. Keep that comparison, and drop every other one.", "Ты уже лучше того себя, который начинал. Оставь это сравнение и выброси все остальные."],
    [A, "Slow down. Almost every beginner throws faster than their technique can hold, and speed built on a flaw is a faster flaw.", "Сбавь скорость. Почти все новички бьют быстрее, чем держит техника, а скорость поверх ошибки — это быстрая ошибка."],
    [A, "Film one round of your shadowboxing a month. You will see things no amount of feeling can tell you.", "Снимай один раунд работы с тенью раз в месяц. Увидишь то, чего никакие ощущения не подскажут."],
    [A, "Skipping rope is not a warm-up, it is footwork training. Treat it like the real work it is.", "Скакалка — это не разминка, а тренировка работы ног. Относись к ней как к настоящей работе."],
    [A, "Train your legs. Punching power comes from the floor up, and a boxer with no legs has no power in round three.", "Тренируй ноги. Сила удара идёт от пола вверх, и боксёр без ног в третьем раунде остаётся без силы."],
    [A, "Sleep is when the technique you practised actually gets written down. Short nights waste good sessions.", "Сон — это когда отработанная техника действительно записывается. Короткие ночи обесценивают хорошие тренировки."],
    [T, "Double the jab. One is information, two is a problem, and the second one lands far more often than the first.", "Сдваивай джеб. Один — это разведка, два — уже проблема, и второй заходит куда чаще первого."],
    [T, "Punch through the target, not at it. Aim your fist a hand's width behind where you are hitting.", "Бей сквозь цель, а не в цель. Целься на ладонь дальше той точки, куда бьёшь."],
    [T, "Turn your rear heel out on the cross. If that heel stays planted, you are punching with your arm only.", "Разворачивай заднюю пятку на кроссе. Если пятка стоит на месте, ты бьёшь только рукой."],
    [T, "After every combination, move. Standing still to admire your work is how you get caught.", "После каждой комбинации — движение. Стоять и любоваться своей работой — лучший способ пропустить."],
    [T, "Keep your stance width the same when you step. If it widens or narrows, you cannot punch until it resets.", "Сохраняй ширину стойки при шаге. Если она сузилась или расширилась, бить нельзя, пока не вернёшь."],
  ],

  /* -------------------------------------------------------- 2 · Prospect -- */
  [
    [M, "Combinations are starting to flow without being counted. That is the engine you built, working.", "Комбинации начинают идти без подсчёта. Это работает тот двигатель, который ты построил."],
    [M, "Plateaus are normal and they are temporary. The body consolidates before it climbs again.", "Плато — это нормально и временно. Тело закрепляет достигнутое, прежде чем подняться снова."],
    [M, "You have enough skill now to notice how much you do not know. That discomfort is progress, not failure.", "У тебя уже достаточно навыка, чтобы заметить, сколького ты не знаешь. Этот дискомфорт — прогресс, а не провал."],
    [M, "Conditioning is a decision you make weeks before you need it.", "Функционалка — это решение, которое принимаешь за недели до того, как она понадобится."],
    [M, "Nobody is coming to make you train today. That has always been true, and you have handled it so far.", "Никто не придёт заставлять тебя тренироваться сегодня. Так было всегда, и до сих пор ты справлялся."],
    [A, "Work rounds on the clock, not by feel. Three real minutes teaches pacing that an untimed session never will.", "Работай раунды по часам, а не по ощущению. Три настоящие минуты учат распределять силы так, как никогда не научит тренировка без таймера."],
    [A, "Alternate hard days and easy days. Training hard every day is how people stall and get hurt.", "Чередуй тяжёлые и лёгкие дни. Тренироваться тяжело каждый день — так и упираются в потолок, и травмируются."],
    [A, "Drill one weakness per week rather than everything at once. Narrow beats broad at this stage.", "Отрабатывай одну слабость в неделю, а не всё сразу. На этом этапе узкое побеждает широкое."],
    [A, "Learn to relax between punches, not just between rounds. That is where real endurance hides.", "Учись расслабляться между ударами, а не только между раундами. Именно там прячется настоящая выносливость."],
    [A, "Eat like the training matters. You cannot out-train a diet that leaves you empty in round four.", "Ешь так, будто тренировки важны. Нельзя перетренировать питание, которое оставляет тебя пустым в четвёртом раунде."],
    [T, "Change levels between punches. Head, body, head — the body shot is what lowers the guard for the next head shot.", "Меняй уровни между ударами. Голова, корпус, голова — именно удар по корпусу опускает руки под следующий в голову."],
    [T, "Finish combinations with the hand that leaves you covered. What you end on decides what they can answer with.", "Заканчивай комбинации той рукой, которая оставляет тебя закрытым. Чем закончил, тем и определяется, чем тебе ответят."],
    [T, "Vary the rhythm, not just the punches. A predictable tempo is easier to time than a predictable combination.", "Меняй ритм, а не только удары. Предсказуемый темп читается легче, чем предсказуемая комбинация."],
    [T, "Step off at an angle after your combination, not straight back. Straight back keeps you exactly where they aimed.", "После комбинации уходи под углом, а не назад. Назад — значит остаться ровно там, куда целились."],
    [T, "Feint with your legs and shoulders, not only your hands. The whole body sells a lie the hands cannot.", "Финти ногами и плечами, а не только руками. Всё тело продаёт обман так, как руки не смогут."],
  ],

  /* ------------------------------------------------------- 3 · Contender -- */
  [
    [M, "You can hold your own now. That is not the finish line — it is where the interesting part begins.", "Теперь ты можешь постоять за себя. Это не финиш, а место, где начинается самое интересное."],
    [M, "Getting hit is information, not humiliation. Fighters who learn that improve twice as fast.", "Пропущенный удар — это информация, а не унижение. Те, кто это понял, растут вдвое быстрее."],
    [M, "The gap between knowing a technique and owning it is measured in repetitions, not in understanding.", "Разрыв между «знаю технику» и «владею техникой» измеряется повторениями, а не пониманием."],
    [M, "Bad sessions are part of the average. You cannot judge a month by its worst day.", "Плохие тренировки входят в среднее. Нельзя судить о месяце по его худшему дню."],
    [M, "Confidence is a memory of work done, not a feeling you summon on the day.", "Уверенность — это память о проделанной работе, а не чувство, которое вызываешь в нужный день."],
    [A, "Spar to learn, not to win. The person trying to win every round in the gym learns the least.", "Спаррингуй, чтобы учиться, а не чтобы побеждать. Кто пытается выиграть каждый раунд в зале, учится меньше всех."],
    [A, "Pick one thing to work on per sparring round. Trying to do everything means practising nothing.", "Выбирай одну задачу на раунд спарринга. Пытаться делать всё — значит не отрабатывать ничего."],
    [A, "Ask the person who just outboxed you what they saw. It is the most useful question in the sport.", "Спроси того, кто тебя только что переиграл, что он видел. Это самый полезный вопрос в этом спорте."],
    [A, "Protect your head outside the gym too. Sleep, hydration and no unnecessary hard sparring are part of the job.", "Береги голову и вне зала. Сон, вода и отказ от лишних жёстких спаррингов — часть работы."],
    [A, "Warm up properly or you will spend more time injured than training.", "Разминайся как следует, иначе проведёшь больше времени в травмах, чем в тренировках."],
    [T, "Counter after their punch, not before. The safest moment to hit someone is when their hand is coming back.", "Контратакуй после их удара, а не до. Самый безопасный момент ударить — когда их рука возвращается."],
    [T, "Control distance with your lead hand. Whoever decides the range decides the fight.", "Контролируй дистанцию передней рукой. Кто выбирает дистанцию, тот выбирает и ход боя."],
    [T, "Cut the ring, do not chase it. Chasing follows them; cutting takes their space away.", "Режь ринг, а не гонись. Погоня идёт за соперником, а нарезка отбирает у него пространство."],
    [T, "When you are hurt, hold and breathe. Panic punches are how a bad moment becomes a bad night.", "Когда потрясло — держись и дыши. Паническая размашка превращает плохой момент в плохой вечер."],
    [T, "Attack the body early. It pays interest in the later rounds when the head is harder to reach.", "Работай по корпусу рано. Это приносит проценты в поздних раундах, когда голова уже труднодоступна."],
  ],

  /* ---------------------------------------------------- 4 · Good Fighter -- */
  [
    [M, "Clean technique under fatigue is the real test. Anyone looks sharp in round one.", "Чистая техника на усталости — вот настоящая проверка. В первом раунде хорошо выглядят все."],
    [M, "You are past the stage where effort alone improves you. From here it is precision.", "Ты прошёл этап, где рост даёт одно усилие. Дальше решает точность."],
    [M, "The fundamentals you drilled two years ago are the reason today felt easy.", "База, которую ты отрабатывал два года назад, — причина того, что сегодня было легко."],
    [M, "Discipline is choosing the boring session over the fun one when the boring one is what you need.", "Дисциплина — это выбрать скучную тренировку вместо интересной, когда нужна именно скучная."],
    [M, "Skill fades slower than fitness. If you have to lose one for a while, keep the skill work.", "Навык уходит медленнее формы. Если приходится чем-то жертвовать на время, сохраняй работу над техникой."],
    [A, "Train the round you are worst in. Most fighters practise the round they enjoy.", "Тренируй тот раунд, в котором ты хуже всего. Большинство отрабатывает тот, который нравится."],
    [A, "Recovery is training. The adaptation happens in the rest, not in the effort.", "Восстановление — это тренировка. Адаптация происходит в отдыхе, а не в усилии."],
    [A, "Keep a training log. Memory flatters you; a notebook does not.", "Веди дневник тренировок. Память тебе льстит, а тетрадь — нет."],
    [A, "Do not add volume to fix a technique problem. More repetitions of a flaw make the flaw permanent.", "Не решай проблему техники объёмом. Больше повторений ошибки делают ошибку постоянной."],
    [A, "Strength work twice a week is enough. You are building a boxer, not a powerlifter.", "Силовой работы дважды в неделю достаточно. Ты строишь боксёра, а не пауэрлифтера."],
    [T, "Set traps. Show the same pattern three times, then break it on the fourth.", "Ставь ловушки. Покажи один и тот же рисунок трижды, а на четвёртый — сломай его."],
    [T, "Punch on the way in and on the way out. Most fighters only remember the way in.", "Бей и на входе, и на выходе. Большинство помнит только про вход."],
    [T, "Hand speed is mostly relaxation. Tight arms are slow arms, no matter how strong they are.", "Скорость рук — это в основном расслабление. Зажатые руки медленные, какими бы сильными они ни были."],
    [T, "Learn to fight going backwards. A fighter who can only come forward has one gear.", "Учись работать на отходе. Боксёр, умеющий только идти вперёд, имеет одну передачу."],
    [T, "Break the clinch first and punch as you break. The separation is the opening.", "Разрывай клинч первым и бей на разрыве. Именно разрыв и есть момент для удара."],
  ],

  /* --------------------------------------------------- 5 · Sweet Fighter -- */
  [
    [M, "Being hard to hit is a skill you built deliberately. Most people never bother.", "Быть неудобной мишенью — навык, который ты строил осознанно. Большинство даже не пробует."],
    [M, "Defence is not the absence of offence. It is the thing that lets your offence happen for free.", "Защита — это не отсутствие атаки. Это то, что позволяет твоей атаке проходить бесплатно."],
    [M, "The best fighters look unhurried. That calm is not talent, it is a thousand rounds of practice.", "Лучшие бойцы выглядят неторопливо. Это спокойствие — не талант, а тысяча отработанных раундов."],
    [M, "You have earned the right to be selective. Not every exchange is worth taking.", "Ты заслужил право выбирать. Не каждый размен стоит того, чтобы в него входить."],
    [M, "Style is what is left after you stop copying people. Yours is showing now.", "Стиль — это то, что остаётся, когда перестаёшь копировать. Твой уже виден."],
    [A, "Drill defence with a partner throwing at real speed. Slow-motion defence builds slow-motion habits.", "Отрабатывай защиту с партнёром, который бьёт в реальной скорости. Медленная защита строит медленные привычки."],
    [A, "Do not slip the same way twice in a row. A pattern is a gift to whoever is watching.", "Не уходи дважды подряд в одну сторону. Закономерность — это подарок тому, кто смотрит."],
    [A, "Move your head even when nothing is coming. Stillness is a habit and so is movement.", "Двигай головой, даже когда ничего не летит. Неподвижность — привычка, и движение тоже."],
    [A, "Keep your eyes open through every slip and roll. Closing them turns defence into guessing.", "Держи глаза открытыми на каждом нырке и уклоне. Закрыл — и защита превратилась в угадывание."],
    [A, "Train the counter, not just the escape. Getting out of the way is only half the point.", "Отрабатывай контратаку, а не только уход. Убраться с линии — только половина смысла."],
    [T, "Roll under the hook, do not lean back from it. Leaning back leaves your legs behind and your chin high.", "Ныряй под хук, а не отклоняйся назад. Отклон оставляет ноги позади, а подбородок высоко."],
    [T, "Parry with the smallest movement that works. A big parry opens a bigger hole than the punch would have made.", "Отбивай минимальным движением. Большая подставка открывает дыру больше, чем сделал бы сам удар."],
    [T, "Make them miss by an inch, not a foot. A wide miss is a wasted counter opportunity.", "Пусть промахнутся на сантиметр, а не на полметра. Широкий промах — упущенная контратака."],
    [T, "Every slip should end with your weight on the punching side. Defence that does not load a shot is only survival.", "Каждый нырок должен заканчиваться весом на бьющей стороне. Защита, не заряжающая удар, — это только выживание."],
    [T, "Catch, then answer immediately. The window after a caught punch closes in half a second.", "Поймал — сразу отвечай. Окно после пойманного удара закрывается за полсекунды."],
  ],

  /* --------------------------------------------------- 6 · Great Fighter -- */
  [
    [M, "A complete boxer has no round they are afraid of. That took years and it shows.", "У полного боксёра нет раунда, которого он боится. На это ушли годы, и это видно."],
    [M, "Ring IQ is pattern recognition built from volume. You cannot shortcut the volume.", "Ринг-интеллект — это распознавание рисунка, построенное на объёме. Объём не сократить."],
    [M, "At this level the difference between fighters is preparation, not ability.", "На этом уровне разница между бойцами — в подготовке, а не в способностях."],
    [M, "You are now good enough that your bad habits are the only thing holding you back.", "Ты уже настолько хорош, что тебя тормозят только собственные вредные привычки."],
    [M, "Power without timing is noise. You have both — use the timing first.", "Сила без тайминга — это шум. У тебя есть и то и другое: сначала используй тайминг."],
    [A, "Study opponents, not just techniques. Boxing is a problem set, and each one is different.", "Изучай соперников, а не только техники. Бокс — это набор задач, и каждая своя."],
    [A, "Have a plan B before you need it. Everyone has a plan A, and plan A rarely survives round two.", "Готовь план Б до того, как он понадобится. План А есть у всех, и он редко доживает до второго раунда."],
    [A, "Peak for the date, do not live at the peak. Nobody holds top condition all year.", "Выходи на пик к дате, а не живи на пике. Никто не держит лучшую форму круглый год."],
    [A, "Fix the small technical leaks now. At your level they are the only thing left that costs rounds.", "Закрывай мелкие технические течи сейчас. На твоём уровне только они и стоят раундов."],
    [A, "Rest properly between hard weeks. Overtraining looks exactly like being out of form.", "Отдыхай как следует между тяжёлыми неделями. Перетрен выглядит ровно как потеря формы."],
    [T, "Win the first thirty seconds of every round. Judges and opponents both form opinions early.", "Выигрывай первые тридцать секунд каждого раунда. И судьи, и соперник составляют мнение рано."],
    [T, "Change the plan when it is not working, not when it has failed.", "Меняй план, когда он не работает, а не когда он уже провалился."],
    [T, "Use the ring, not just the opponent. Position wins rounds that punches do not.", "Используй ринг, а не только соперника. Позиция выигрывает раунды, которые не выигрывают удары."],
    [T, "Take rounds off inside a round. Thirty seconds of low output at the right moment buys you the last minute.", "Отдыхай внутри раунда. Тридцать секунд низкой активности в нужный момент покупают тебе последнюю минуту."],
    [T, "Punch in threes and fours, then reset. Long exchanges favour whoever is fresher, not whoever is better.", "Бей сериями по три-четыре и разрывай. Долгие размены выгодны тому, кто свежее, а не тому, кто лучше."],
  ],

  /* ---------------------------------------------------- 7 · Professional -- */
  [
    [M, "Belonging under the lights is not a feeling. It is the sum of the mornings nobody saw.", "Право быть под софитами — это не чувство. Это сумма утр, которых никто не видел."],
    [M, "The work does not get more exciting at this level. It gets more precise.", "На этом уровне работа не становится интереснее. Она становится точнее."],
    [M, "Everyone here is talented. What separates them is who handles the boring parts best.", "Здесь все талантливы. Разделяет их то, кто лучше справляется со скучной частью."],
    [M, "Your body is your business now. Treat sleep and food as work, because they are.", "Твоё тело теперь — твой бизнес. Относись ко сну и еде как к работе, потому что это она и есть."],
    [M, "Pressure is a privilege. It only arrives when something is actually at stake.", "Давление — это привилегия. Оно приходит только тогда, когда действительно есть что терять."],
    [A, "Recovery is the training at this level. Everything else is just the stimulus.", "На этом уровне восстановление и есть тренировка. Всё остальное — только стимул."],
    [A, "Keep your weight close to fighting weight year round. Big cuts cost more than they ever save.", "Держи вес близко к боевому круглый год. Большие сгонки отнимают больше, чем когда-либо дают."],
    [A, "Have people around you who will tell you the truth. Yes-men end careers quietly.", "Держи рядом людей, которые скажут правду. Соглашатели тихо заканчивают карьеры."],
    [A, "Do not spar hard year round. Save the wars for when they buy you something.", "Не спаррингуй жёстко круглый год. Береги войны для тех случаев, когда они что-то дают."],
    [A, "Write down what worked after every fight, while it is still fresh and honest.", "Записывай, что сработало, сразу после каждого боя — пока свежо и честно."],
    [T, "Establish the jab before anything else, every single time. It is the map for everything after it.", "Ставь джеб раньше всего остального, каждый раз. Это карта для всего, что будет дальше."],
    [T, "Fight the fight in front of you, not the one you prepared for.", "Веди тот бой, который перед тобой, а не тот, к которому готовился."],
    [T, "Score clearly. Punches that land but do not look like they landed do not count.", "Набирай очки чисто. Удары, которые дошли, но не выглядят дошедшими, не считаются."],
    [T, "Control the pace and you control the outcome. Whoever sets the tempo is rarely the one who tires first.", "Контролируешь темп — контролируешь результат. Тот, кто задаёт темп, редко устаёт первым."],
    [T, "The last thirty seconds of a close round are worth more than the first two minutes.", "Последние тридцать секунд равного раунда стоят дороже первых двух минут."],
  ],

  /* -------------------------------------------------------- 8 · Champion -- */
  [
    [M, "Getting there is one problem. Staying there is a different one, and harder.", "Дойти — одна задача. Удержаться — другая, и она сложнее."],
    [M, "The room is now full of people trying to take what you have. That is the job, not an insult.", "Зал теперь полон людей, которые хотят забрать твоё. Это работа, а не оскорбление."],
    [M, "Complacency arrives disguised as confidence. Check the difference often.", "Самоуспокоенность приходит под видом уверенности. Проверяй разницу почаще."],
    [M, "You are allowed to still be learning. The day you stop is the day someone catches up.", "Тебе всё ещё можно учиться. День, когда перестанешь, — день, когда тебя догонят."],
    [M, "The best in the room got there by treating every room the same.", "Лучший в зале стал таким потому, что относился ко всем залам одинаково."],
    [A, "Keep training the basics. Champions lose to fundamentals more often than to brilliance.", "Продолжай тренировать базу. Чемпионы проигрывают базе чаще, чем гениальности."],
    [A, "Guard your health harder than your record. One protects the other; it does not work in reverse.", "Береги здоровье сильнее, чем рекорд. Первое защищает второе, а не наоборот."],
    [A, "Change something in camp every cycle. The body adapts to sameness and then stops.", "Меняй что-то в сборах каждый цикл. Тело адаптируется к однообразию и перестаёт расти."],
    [A, "Delegate what you can. Your only irreplaceable job is training and recovering.", "Делегируй, что можешь. Твоя единственная незаменимая работа — тренироваться и восстанавливаться."],
    [A, "Watch your own losses more than your wins. They are the only free coaching you get.", "Пересматривай свои поражения чаще побед. Это единственный бесплатный тренер, который у тебя есть."],
    [T, "Adjust between rounds, not between fights. Sixty seconds is enough to change everything.", "Корректируй между раундами, а не между боями. Шестидесяти секунд хватает, чтобы изменить всё."],
    [T, "Never let a hungry fighter dictate the pace. Take it in the first round or spend the night chasing.", "Не давай голодному сопернику задавать темп. Забери его в первом раунде или будешь догонять весь вечер."],
    [T, "Respect the unknown opponent most. Reputation does not land punches.", "Больше всего уважай неизвестного соперника. Репутация ударов не наносит."],
    [T, "When you are winning clearly, take fewer risks, not more. The lead is the plan now.", "Когда явно выигрываешь, рискуй меньше, а не больше. Теперь преимущество и есть план."],
    [T, "Finish rounds strong even when you are ahead. Judges remember endings.", "Заканчивай раунды мощно, даже когда ведёшь. Судьи запоминают концовки."],
  ],

  /* ---------------------------------------------------------- 9 · Legend -- */
  [
    [M, "Longevity is its own achievement. Most careers end long before the talent does.", "Долголетие — само по себе достижение. Большинство карьер заканчивается задолго до таланта."],
    [M, "What you pass on will outlast what you won.", "То, что ты передашь, переживёт то, что ты выиграл."],
    [M, "Being remembered is not the goal. Being worth remembering is.", "Цель не в том, чтобы тебя помнили. Цель — быть достойным памяти."],
    [M, "The hardest opponent at this stage is your own history. Do not fight the fighter you were.", "Самый трудный соперник на этом этапе — собственная история. Не дерись с тем собой, каким ты был."],
    [M, "Greatness is consistency stretched over an unreasonable length of time.", "Величие — это постоянство, растянутое на неразумно долгий срок."],
    [A, "Train smarter as you get older, not less. Volume comes down; precision goes up.", "С возрастом тренируйся умнее, а не меньше. Объём снижается, точность растёт."],
    [A, "Teach what you know. Explaining a technique is how you find the parts you never understood.", "Учи тому, что знаешь. Объясняя технику, находишь то, чего сам не понимал."],
    [A, "Listen to your body over your schedule. At this point it is a better coach than the calendar.", "Слушай тело, а не расписание. На этом этапе оно тренер получше календаря."],
    [A, "Know what you are still doing this for. The answer keeps people healthy or gets them hurt.", "Знай, ради чего ты всё ещё это делаешь. От ответа зависит, сохранишь ты здоровье или потеряешь."],
    [A, "Leave before the sport makes the decision for you.", "Уходи раньше, чем спорт примет это решение за тебя."],
    [T, "Experience beats speed if you make the fight happen where you want it.", "Опыт бьёт скорость, если бой идёт там, где ты хочешь."],
    [T, "Economy of motion is the old fighter's advantage. Do less, but do it earlier.", "Экономия движения — преимущество возрастного бойца. Делай меньше, но раньше."],
    [T, "Read the fight two punches ahead. That is the part that does not slow down with age.", "Читай бой на два удара вперёд. Именно это с возрастом не замедляется."],
    [T, "Make them fight your fight in the first round, before they find their own.", "Заставь их вести твой бой в первом раунде, пока они не нашли свой."],
    [T, "The simplest punch, thrown at the right moment, still ends nights.", "Самый простой удар в нужный момент по-прежнему заканчивает вечера."],
  ],

  /* -------------------------------------------------------- 10 · Immortal -- */
  [
    [M, "You are training because you want to, not because you have to. That is the rarest position in the sport.", "Ты тренируешься, потому что хочешь, а не потому что должен. Это самое редкое положение в спорте."],
    [M, "The work never ends, and by now that is the good news.", "Работа не заканчивается никогда, и к этому моменту это хорошая новость."],
    [M, "Every fighter who ever mattered started exactly where your beginners are starting.", "Каждый боксёр, который что-то значил, начинал ровно там, где сейчас начинают твои новички."],
    [M, "Untouchable is a description of the past. Today still has to be earned.", "Неприкасаемый — это про прошлое. Сегодняшний день всё ещё нужно заслужить."],
    [M, "The measure now is not what you can still do. It is what you leave behind.", "Мера теперь не в том, что ты ещё можешь. А в том, что после тебя останется."],
    [A, "Keep moving daily, even lightly. Bodies that stop do not restart easily.", "Двигайся каждый день, пусть и легко. Тело, которое остановилось, тяжело запускается снова."],
    [A, "Pass on the small details. Anyone can teach a jab; almost nobody teaches how to breathe on it.", "Передавай мелочи. Джебу научит любой, а дышать на нём — почти никто."],
    [A, "Stay curious about the sport. It keeps changing, and so should you.", "Сохраняй любопытство к спорту. Он продолжает меняться, и тебе стоит тоже."],
    [A, "Look after the head you fought with. That care is not optional at any age.", "Береги голову, которой ты дрался. Эта забота не опциональна ни в каком возрасте."],
    [A, "Train for life now, not for the fight. The goal changed; the discipline does not have to.", "Теперь тренируйся для жизни, а не для боя. Цель изменилась, дисциплина — не обязана."],
    [T, "Timing never leaves. Everything else is negotiable.", "Тайминг не уходит никогда. Всё остальное обсуждаемо."],
    [T, "Balance is the last thing to go and the first thing to train.", "Баланс уходит последним и тренируется первым."],
    [T, "The best defence you ever had was not being there. It still is.", "Лучшая защита, что у тебя была, — это не быть на линии. Она такой и осталась."],
    [T, "Show the young ones the mistake before they make it. That is worth more than any highlight.", "Покажи молодым ошибку до того, как они её совершат. Это дороже любой нарезки лучших моментов."],
    [T, "Simple, sharp, on time. That was always the whole sport.", "Просто, чётко, вовремя. В этом всегда и был весь спорт."],
  ],
];

/* Content must line up with the ladder — a rank with no lines would render an
   empty corner, and a stray block would never be seen by anyone. */
if (RAW.length !== RANKS.length) {
  throw new Error(`motivation: ${RAW.length} blocks for ${RANKS.length} ranks`);
}

export const MOTIVATION: MotivationItem[][] = RAW.map((block) =>
  block.map(([kind, en, ru]) => ({ kind, text: { en, ru } })),
);

/* --------------------------------------------------------------------------
   picking the day's lines
   -------------------------------------------------------------------------- */

/** Days since the epoch — the seed, so everyone on the same day sees the same
    corner and it changes at midnight without any state being stored. */
function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

/**
 * One line of each kind for the day.
 *
 * Deterministic on purpose: no storage, no randomness to resync, and two
 * people at the same rank can talk about the same line.
 *
 * The three kinds advance like an odometer rather than together. Motivation
 * turns over every day, advice once the motivation column has been all the way
 * round, tactics once advice has. With five of each that is 5 x 5 x 5 = 125
 * distinct mornings instead of 5.
 *
 * Worth spelling out because the obvious version is wrong: giving each kind a
 * different multiplier (1, 2, 3) still leaves all three a function of
 * `day % 5`, so the trio repeats every five days while looking like it
 * shuffles. The divisor is what actually decorrelates them.
 */
export function motivationForDay(
  rankIndex: number,
  date: Date = new Date(),
): MotivationItem[] {
  const block = MOTIVATION[Math.min(Math.max(rankIndex, 0), MOTIVATION.length - 1)];
  const day = dayNumber(date);
  const out: MotivationItem[] = [];
  let divisor = 1;

  for (const kind of ["motivation", "advice", "tactic"] as MotivationKind[]) {
    const of = block.filter((i) => i.kind === kind);
    if (!of.length) continue;
    out.push(of[Math.floor(day / divisor) % of.length]);
    divisor *= of.length; // this column only turns once the previous wraps
  }

  return out;
}

/** Everything written for a rank, for a "more like this" view later on. */
export function motivationForRank(rankIndex: number): MotivationItem[] {
  return MOTIVATION[Math.min(Math.max(rankIndex, 0), MOTIVATION.length - 1)];
}
