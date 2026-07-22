// Marketing-site strings, per language. EN is the source of truth and defines the
// shape (including non-translatable data like card icons, step key/done flags, track
// names, and language flags/codes). RU and HY carry only the translatable fields;
// mergeBundle deep-merges them over EN element-by-element, so anything a translation
// omits (icons, flags, track names, key/done) is inherited from EN.
//
// Untranslated on purpose: brand, track names, sample words (Hello/Привет/Բарև),
// language codes, the score, and the code snippet.

export const EN = {
  faq: {
    items: [
      { a: 'Yes — Level Up is free to use right now.', q: 'Is Level Up free?' },
      {
        a: 'No — and it’s built not to be. The AI coaches you before the interview: it asks questions, scores your answers, and shows you how to improve. It never feeds you answers to use live in a real one. It makes you more prepared, not less honest.',
        q: 'Is Level Up a way to cheat in a real interview?'
      },
      {
        a: 'Treat it as coaching, not a verdict. Every answer is scored on a clear rubric — correctness, depth, structure, and communication — with written notes and a model answer to compare against. It’s there to show you where to improve, and it gets more useful the more you practice.',
        q: 'Can I trust the AI’s feedback?'
      },
      {
        a: 'Today you type your answers in a chat, one question at a time. Spoken interviews are part of where we’re headed — but they aren’t here yet.',
        q: 'Do I type my answers or speak them?'
      },
      {
        a: 'You can run a full mock interview — questions, your answers, and AI feedback — in English, Russian, or Armenian, and the app interface is available in all three. If you’re interviewing in a second language, the practice also helps you get used to explaining your answers clearly.',
        q: 'What languages can I use?'
      },
      {
        a: 'Eight tracks today — by role (Backend, Frontend, DevOps, QA) and by stack (Node.js, Go, React, Next.js), from junior to senior. More tracks are coming.',
        q: 'Which roles and tracks are covered?'
      },
      {
        a: 'Today, yes — interview preparation is what it does. The bigger goal is a career-preparation platform that grows with you (see our Vision).',
        q: 'Is Level Up only for interviews?'
      }
    ],
    intro: 'Straight answers to the things people ask before they start.',
    title: 'Questions & answers',
    eyebrow: 'FAQ'
  },
  vision: {
    beliefs: [
      {
        body: 'You get better by rehearsing, not by watching. Practice comes first; theory fills the gaps.',
        title: 'Learn by doing'
      },
      {
        body: 'Every answer should give you a signal you can act on — a score, and a clear way to improve.',
        title: 'Feedback on everything'
      },
      {
        body: 'It questions, evaluates, and coaches you. It never hands you answers to use in a real interview.',
        title: 'The AI is a coach, not a cheat sheet'
      },
      {
        body: 'Preparation should organize around what you’re actually working toward, and adapt as you go.',
        title: 'Start from your goal'
      }
    ],
    closing:
      'Level Up starts with technical interviews. The bigger goal is a career-preparation platform for engineers — one that knows what you’re preparing for and coaches you through it, at any stage. Spoken interviews, more personalized preparation, and more fields to prepare for are the direction we’re building toward.',
    body: 'Most ways to prepare are passive: you read, watch, and study, then hope it’s enough. We think that’s backwards. Real readiness comes from doing the thing, getting honest feedback, and improving — again and again. Level Up exists to make that loop something every engineer can actually run.',
    lead: 'We believe preparation should be something you can practice, measure, and improve — not just consume.',
    title: 'Preparation should be something you can practice.',
    eyebrow: 'Our vision'
  },
  roadmap: {
    steps: [
      { goal: '“Pass a Senior Backend interview in 30 days.”', title: 'Your goal' },
      { body: 'Level Up keeps your preparation focused on that goal.', title: 'Focused on your goal' },
      { body: 'Focus on the topics the goal actually calls for.', title: 'Learn what matters' },
      { body: 'Rehearse your answers as you go.', title: 'Practice' },
      { body: 'A realistic AI interview, one question at a time.', title: 'Mock interview', key: true },
      { body: 'Every answer scored, with clear notes on what to improve.', title: 'Feedback', key: true },
      { body: 'Work the gaps, then go again — each round raising the next result.', title: 'Improve' },
      { title: 'Interview-ready.', done: true }
    ],
    lead: 'It starts with your goal. Level Up organizes your preparation around it, then walks you through it — step by step.',
    title: 'From your goal to interview-ready.',
    eyebrow: 'How it works',
    cta: 'Start practicing'
  },
  who: {
    lead: 'Whether it’s your first interview or your next senior loop — if you’re getting ready for a technical interview, Level Up is for you.',
    eslFlags: [
      { flag: '🇬🇧', code: 'ENG' },
      { flag: '🇷🇺', code: 'RUS' },
      { flag: '🇦🇲', code: 'ARM' }
    ],
    esl: 'Practice in the language you’ll interview in — it builds how you communicate under pressure, not just what you know.',
    tracks: { role: ['Backend', 'Frontend', 'DevOps', 'QA'], stack: ['Node.js', 'Go', 'React', 'Next.js'] },
    title: 'For software engineers preparing to interview.',
    tracksTitle: 'You’re preparing for one of our tracks',
    eslTitle: 'You’re interviewing in a second language',
    levels: 'You’re anywhere from junior to senior',
    levelBars: ['Junior', 'Mid', 'Senior'],
    tracksNote: 'More tracks coming.',
    eyebrow: 'Who it’s for',
    byStack: 'By stack',
    byRole: 'By role'
  },
  inside: {
    cards: [
      {
        body: 'Practice full interviews for your track, the way they really run.',
        title: 'Realistic mock interviews',
        icon: 'calendar'
      },
      {
        body: 'A clear score on what matters — correctness, depth, structure, and communication — plus a model answer to learn from.',
        title: 'Feedback on every answer',
        icon: 'star'
      },
      {
        body: 'Study the questions that actually come up, organized by track.',
        title: 'A focused question bank',
        icon: 'message'
      },
      {
        body: 'Track your scores over time, and keep your momentum with streaks and badges.',
        title: 'Progress you can see',
        icon: 'chart'
      }
    ],
    title: 'Realistic mock interviews — scored, coached, and tracked.',
    eyebrow: 'What’s inside'
  },
  gap: {
    items: [
      {
        body: 'You re-read answers, but you never practice giving them one at a time, on the spot, the way an interview actually asks.',
        title: 'No realistic rehearsal'
      },
      {
        body: 'You can’t tell how strong an answer really was, or how it would land with an interviewer.',
        title: 'No real feedback'
      },
      {
        body: 'You can know an answer cold and still struggle to say it clearly, under pressure — and studying never builds that.',
        title: 'Explaining your answers is its own skill'
      }
    ],
    leadFade: 'Most preparation builds what you know — not how you perform when it counts.',
    lead: 'Knowing the material isn’t the same as being ready for the interview.'
  },
  language: {
    langs: [
      { name: 'English', word: 'Hello', flag: '🇬🇧', code: 'ENG' },
      { name: 'Russian', word: 'Привет', flag: '🇷🇺', code: 'RUS' },
      { name: 'Armenian', flag: '🇦🇲', word: 'Բարև', code: 'ARM' }
    ],
    lead: 'Run a full mock interview — questions, your answers, and AI feedback — in English, Russian, or Armenian.',
    note: 'The app interface is available in all three, too.',
    title: 'Interview in the language you’ll actually use.',
    eyebrow: 'Speak your language'
  },
  heroCard: {
    question: 'Explain how you’d prevent a race condition when two requests update the same row.',
    answerPost: ' inside a transaction, or an optimistic version column…',
    answerPre: 'I’d use row-level locking with ',
    communicationValue: 'Add a trade-off',
    answerCode: 'SELECT … FOR UPDATE',
    tab: 'mock interview · backend',
    questionLabel: 'Question 3 / 8',
    communication: 'Communication',
    correctness: 'Correctness',
    correctnessValue: 'Strong'
  },
  loop: {
    caption:
      'Study feeds your practice. Practice produces feedback. Feedback shows you what to study next. Each lap raises your next score — all of it turning around your goal.',
    stages: ['Study', 'Practice', 'Feedback', 'Progress'],
    takeaway: 'Each time around, you get more ready.',
    title: 'Four parts. One loop.',
    center: 'Your goal'
  },
  ui: {
    seeHow: 'See how it works',
    cta: 'Start practicing',
    menu: 'Menu & settings',
    free: 'Free to start',
    language: 'Language',
    signIn: 'Sign in',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark'
  },
  hero: {
    sub: 'Practice realistic mock interviews with an AI coach. It scores every answer and shows you what to improve — before the real one.',
    eyebrow: 'For software engineers',
    title: 'Get interview-ready.'
  },
  footer: {
    tag: 'Get interview-ready.',
    copyright: '© Level Up',
    explore: 'Explore',
    company: 'Company',
    privacy: 'Privacy',
    legal: 'Legal',
    about: 'About',
    terms: 'Terms'
  },
  finalCta: {
    sub: 'Run your first mock interview today.',
    title: 'Get interview-ready.',
    cta: 'Start practicing',
    free: 'Free to start'
  },
  nav: { features: 'Features', how: 'How it works', vision: 'Vision', faq: 'FAQ' }
}

export const RU = {
  faq: {
    items: [
      { a: 'Да — сейчас Level Up можно использовать бесплатно.', q: 'Level Up бесплатен?' },
      {
        a: 'Нет — и он специально так устроен. ИИ помогает до интервью: задаёт вопросы, оценивает ответы и показывает, как улучшиться. Он никогда не подсказывает ответы для использования во время настоящего интервью. Он делает вас более подготовленными, а не менее честными.',
        q: 'Level Up — это способ жульничать на настоящем интервью?'
      },
      {
        a: 'Воспринимайте её как наставничество, а не как окончательный вердикт. Каждый ответ оценивается по понятным критериям — корректность, глубина, структура и коммуникация — с письменными комментариями и образцом ответа для сравнения. Это помогает увидеть, что улучшить, и становится полезнее по мере практики.',
        q: 'Можно ли доверять обратной связи ИИ?'
      },
      {
        a: 'Сейчас вы печатаете ответы в чате, по одному вопросу за раз. Устные интервью — часть нашего направления, но пока их нет.',
        q: 'Я печатаю ответы или говорю?'
      },
      {
        a: 'Вы можете пройти полное пробное интервью — вопросы, ваши ответы и обратную связь ИИ — на английском, русском или армянском. Интерфейс приложения также доступен на всех трёх языках. Если вы проходите интервью на втором языке, практика поможет привыкнуть ясно объяснять свои ответы.',
        q: 'Какие языки доступны?'
      },
      {
        a: 'Сейчас доступны восемь треков: по ролям (Backend, Frontend, DevOps, QA) и по стеку (Node.js, Go, React, Next.js), от junior до senior. Скоро появятся новые треки.',
        q: 'Какие роли и треки поддерживаются?'
      },
      {
        a: 'Сегодня — да: он помогает готовиться к интервью. Более масштабная цель — платформа карьерной подготовки, которая развивается вместе с вами (см. наше Видение).',
        q: 'Level Up только для интервью?'
      }
    ],
    intro: 'Прямые ответы на то, о чём обычно спрашивают перед началом.',
    title: 'Вопросы и ответы',
    eyebrow: 'FAQ'
  },
  vision: {
    beliefs: [
      {
        body: 'Вы становитесь лучше, репетируя, а не наблюдая. Сначала практика, теория закрывает пробелы.',
        title: 'Учитесь через практику'
      },
      {
        body: 'Каждый ответ должен давать сигнал, по которому можно действовать: оценку и понятный путь к улучшению.',
        title: 'Обратная связь на всё'
      },
      {
        body: 'Он задаёт вопросы, оценивает и помогает вам. Он никогда не даёт готовых ответов для использования на настоящем интервью.',
        title: 'ИИ — наставник, а не шпаргалка'
      },
      {
        body: 'Подготовка должна строиться вокруг того, к чему вы действительно стремитесь, и адаптироваться по ходу.',
        title: 'Начинайте с цели'
      }
    ],
    body: 'Большинство способов подготовки пассивны: вы читаете, смотрите и учитесь, а потом надеетесь, что этого достаточно. Мы считаем, что это неверный подход. Настоящая готовность приходит через действие, честную обратную связь и постоянное улучшение. Level Up существует, чтобы этот цикл был доступен каждому инженеру.',
    closing:
      'Level Up начинает с технических интервью. Более масштабная цель — платформа карьерной подготовки для инженеров, которая понимает, к чему вы готовитесь, и помогает на любом этапе. Устные интервью, более персонализированная подготовка и больше направлений — вектор, в котором мы развиваемся.',
    lead: 'Мы считаем, что подготовку нужно практиковать, измерять и улучшать, а не просто потреблять.',
    title: 'Подготовка должна быть тем, что можно практиковать.',
    eyebrow: 'Наше видение'
  },
  roadmap: {
    steps: [
      { goal: '«Пройти интервью на Senior Backend за 30 дней.»', title: 'Ваша цель' },
      { body: 'Level Up помогает не терять фокус на этой цели.', title: 'Фокус на вашей цели' },
      { body: 'Сосредоточьтесь на темах, которые действительно нужны для вашей цели.', title: 'Изучайте важное' },
      { body: 'Репетируйте ответы по ходу подготовки.', title: 'Практика' },
      { body: 'Реалистичное ИИ-интервью — по одному вопросу за раз.', title: 'Пробное интервью' },
      { body: 'Каждый ответ получает оценку и понятные рекомендации по улучшению.', title: 'Обратная связь' },
      { body: 'Закрывайте пробелы и пробуйте снова — каждый раунд повышает следующий результат.', title: 'Улучшайте' },
      { title: 'Готовы к интервью.' }
    ],
    lead: 'Всё начинается с вашей цели. Level Up выстраивает подготовку вокруг неё и ведёт вас шаг за шагом.',
    title: 'От цели — к готовности к интервью.',
    eyebrow: 'Как это работает',
    cta: 'Начать практику'
  },
  gap: {
    items: [
      {
        body: 'Вы перечитываете ответы, но не тренируетесь давать их по одному, сразу и в том формате, в каком вопросы задают на настоящем интервью.',
        title: 'Нет реалистичной репетиции'
      },
      {
        body: 'Трудно понять, насколько сильным был ответ на самом деле и как его воспримет интервьюер.',
        title: 'Нет настоящей обратной связи'
      },
      {
        body: 'Можно отлично знать ответ и всё равно с трудом сформулировать его ясно под давлением — а обычная учёба этого не развивает.',
        title: 'Умение объяснять ответы — отдельный навык'
      }
    ],
    leadFade: 'Большинство способов подготовки развивают знания, но не то, как вы проявите себя в решающий момент.',
    lead: 'Знать материал — не то же самое, что быть готовым к интервью.'
  },
  inside: {
    cards: [
      {
        body: 'Практикуйте полные интервью по своему треку — так, как они проходят на самом деле.',
        title: 'Реалистичные пробные интервью'
      },
      {
        body: 'Понятная оценка того, что важно: корректности, глубины, структуры и коммуникации — плюс образец ответа для изучения.',
        title: 'Обратная связь по каждому ответу'
      },
      {
        body: 'Изучайте вопросы, которые действительно встречаются на интервью, организованные по трекам.',
        title: 'Сфокусированный банк вопросов'
      },
      { body: 'Отслеживайте оценки со временем и поддерживайте темп сериями и значками.', title: 'Наглядный прогресс' }
    ],
    title: 'Реалистичные пробные интервью — с оценкой, наставничеством и отслеживанием прогресса.',
    eyebrow: 'Что внутри'
  },
  who: {
    esl: 'Практикуйтесь на языке, на котором будете проходить интервью: это развивает не только знания, но и умение общаться под давлением.',
    lead: 'Будь то ваше первое интервью или следующий senior-раунд — если вы готовитесь к техническому интервью, Level Up для вас.',
    title: 'Для software-инженеров, готовящихся к интервью.',
    tracksTitle: 'Вы готовитесь по одному из наших треков',
    eslTitle: 'Вы проходите интервью на втором языке',
    levels: 'Ваш уровень — от junior до senior',
    tracksNote: 'Скоро появятся новые треки.',
    levelBars: ['Junior', 'Middle', 'Senior'],
    eyebrow: 'Для кого это',
    byStack: 'По стеку',
    byRole: 'По роли'
  },
  heroCard: {
    question: 'Объясните, как вы предотвратите race condition, когда два запроса обновляют одну и ту же строку.',
    answerPost: ' внутри транзакции или оптимистичную колонку версии…',
    answerPre: 'Я бы использовал блокировку на уровне строки с ',
    communicationValue: 'Добавьте компромисс',
    tab: 'пробное интервью · backend',
    questionLabel: 'Вопрос 3 / 8',
    communication: 'Коммуникация',
    correctness: 'Корректность',
    correctnessValue: 'Отлично'
  },
  language: {
    lead: 'Пройдите полное пробное интервью — вопросы, ваши ответы и обратную связь ИИ — на английском, русском или армянском.',
    title: 'Проходите интервью на языке, которым действительно будете пользоваться.',
    langs: [{ name: 'Английский' }, { name: 'Русский' }, { name: 'Армянский' }],
    note: 'Интерфейс приложения тоже доступен на всех трёх языках.',
    eyebrow: 'Говорите на своём языке'
  },
  loop: {
    caption:
      'Изучение подпитывает практику. Практика даёт обратную связь. Обратная связь показывает, что изучать дальше. Каждый круг повышает следующий результат — и всё это вращается вокруг вашей цели.',
    stages: ['Изучение', 'Практика', 'Обратная связь', 'Прогресс'],
    takeaway: 'С каждым кругом вы всё лучше готовы.',
    title: 'Четыре части. Один цикл.',
    center: 'Ваша цель'
  },
  ui: {
    seeHow: 'Посмотреть, как это работает',
    free: 'Бесплатно для начала',
    menu: 'Меню и настройки',
    cta: 'Начать практику',
    light: 'Светлая',
    language: 'Язык',
    signIn: 'Войти',
    dark: 'Тёмная',
    theme: 'Тема'
  },
  hero: {
    sub: 'Практикуйтесь на реалистичных пробных интервью с ИИ-наставником. Он оценивает каждый ответ и показывает, что улучшить — до настоящего интервью.',
    title: 'Будьте готовы к интервью.',
    eyebrow: 'Для software-инженеров'
  },
  footer: {
    tag: 'Будьте готовы к интервью.',
    privacy: 'Конфиденциальность',
    legal: 'Правовая информация',
    copyright: '© Level Up',
    company: 'Компания',
    explore: 'Разделы',
    terms: 'Условия',
    about: 'О нас'
  },
  finalCta: {
    sub: 'Пройдите своё первое пробное интервью уже сегодня.',
    title: 'Будьте готовы к интервью.',
    free: 'Бесплатно для начала',
    cta: 'Начать практику'
  },
  nav: { how: 'Как это работает', features: 'Возможности', vision: 'Видение', faq: 'FAQ' }
}

export const HY = {
  faq: {
    items: [
      { a: 'Այո՛, այս պահին Level Up-ն անվճար է օգտագործելու համար։', q: 'Level Up-ն անվճա՞ր է։' },
      {
        a: 'Ո՛չ, և այն հենց այդպես էլ կառուցված չէ։ ԱԲ-ն մարզում է ձեզ հարցազրույցից առաջ՝ հարցնում է, գնահատում պատասխաններն ու ցույց տալիս՝ ինչպես բարելավել։ Այն երբեք պատրաստի պատասխաններ չի տալիս իրական հարցազրույցում օգտագործելու համար։ Այն ձեզ դարձնում է ավելի պատրաստ, ոչ թե պակաս ազնիվ։',
        q: 'Level Up-ը հնարավո՞ր է օգտագործել իրական հարցազրույցում խաբելու համար։'
      },
      {
        a: 'Ընդունեք այն որպես մարզում, ոչ թե վերջնական դատավճիռ։ Յուրաքանչյուր պատասխան գնահատվում է հստակ չափանիշներով՝ ճշտություն, խորություն, կառուցվածք և հաղորդակցում, գրավոր նշումներով ու համեմատելու օրինակելի պատասխանով։ Այն ցույց է տալիս՝ ինչ բարելավել, և ավելի օգտակար է դառնում, որքան շատ եք վարժվում։',
        q: 'Կարո՞ղ եմ վստահել ԱԲ-ի հետադարձ կապին։'
      },
      {
        a: 'Այսօր պատասխանները գրում եք չատում՝ մեկ հարցը մեկ անգամ։ Բանավոր հարցազրույցները մեր հաջորդ ուղղություններից են, բայց դեռ հասանելի չեն։',
        q: 'Պատասխաններս գրո՞ւմ եմ, թե՞ ասում։'
      },
      {
        a: 'Կարող եք անցնել ամբողջական փորձնական հարցազրույց՝ հարցերը, ձեր պատասխաններն ու ԱԲ հետադարձ կապը՝ անգլերեն, ռուսերեն կամ հայերեն։ Հավելվածի միջերեսը նույնպես հասանելի է երեք լեզվով։ Եթե հարցազրույցն անցկացնում եք երկրորդ լեզվով, փորձարկումը կօգնի հստակ բացատրել ձեր պատասխանները։',
        q: 'Ի՞նչ լեզուներ կարող եմ օգտագործել։'
      },
      {
        a: 'Այսօր՝ ութ թրեք․ ըստ դերի (Backend, Frontend, DevOps, QA) և ըստ stack-ի (Node.js, Go, React, Next.js), junior-ից մինչև senior։ Շուտով՝ նոր թրեքներ։',
        q: 'Ի՞նչ դերեր և թրեքներ են ընդգրկված։'
      },
      {
        a: 'Այսօր՝ այո․ այն օգնում է պատրաստվել հարցազրույցի։ Ավելի մեծ նպատակը կարիերային պատրաստման հարթակն է, որը զարգանում է ձեզ հետ (տես՝ Մեր տեսլականը)։',
        q: 'Level Up-ը միայն հարցազրույցների համա՞ր է։'
      }
    ],
    intro: 'Ուղիղ պատասխաններ այն հարցերին, որոնք մարդիկ տալիս են սկսելուց առաջ։',
    title: 'Հարցեր և պատասխաններ',
    eyebrow: 'FAQ'
  },
  vision: {
    beliefs: [
      {
        body: 'Դուք լավանում եք վարժվելով, ոչ թե դիտելով։ Սկզբում՝ փորձարկում, տեսությունը լրացնում է բացերը։',
        title: 'Սովորեք գործելով'
      },
      {
        body: 'Յուրաքանչյուր պատասխան պետք է տա գործնական ազդակ՝ գնահատական և բարելավման հստակ ուղի։',
        title: 'Հետադարձ կապ՝ ամեն ինչի համար'
      },
      {
        body: 'Այն հարցնում, գնահատում և մարզում է ձեզ։ Այն երբեք չի տալիս պատրաստի պատասխաններ իրական հարցազրույցում օգտագործելու համար։',
        title: 'ԱԲ-ն մարզիչ է, ոչ թե հուշաթերթ'
      },
      {
        body: 'Պատրաստումը պետք է կառուցվի այն բանի շուրջ, ինչին իսկապես ձգտում եք, և հարմարվի ընթացքում։',
        title: 'Սկսեք նպատակից'
      }
    ],
    body: 'Պատրաստվելու շատ եղանակներ պասիվ են․ կարդում եք, դիտում և սովորում, ապա հույս ունենում, որ դա բավական է։ Մենք կարծում ենք՝ դա հակառակ մոտեցումն է։ Իրական պատրաստվածությունը գալիս է գործելուց, ազնիվ հետադարձ կապից և անընդհատ բարելավումից։ Level Up-ը ստեղծվել է, որպեսզի յուրաքանչյուր ինժեներ կարողանա իրականում անցնել այդ շրջանը։',
    closing:
      'Level Up-ը սկսում է տեխնիկական հարցազրույցներից։ Ավելի մեծ նպատակը ինժեներների կարիերային պատրաստման հարթակն է, որը հասկանում է՝ ինչի եք պատրաստվում և ուղեկցում է ձեզ ցանկացած փուլում։ Բանավոր հարցազրույցները, ավելի անհատական պատրաստումը և նոր ուղղությունները մեր զարգացման հաջորդ քայլերն են։',
    lead: 'Մենք հավատում ենք, որ պատրաստումը պետք է կարելի լինի փորձարկել, չափել և բարելավել, ոչ միայն սպառել։',
    title: 'Պատրաստումը պետք է հնարավոր լինի փորձարկել։',
    eyebrow: 'Մեր տեսլականը'
  },
  roadmap: {
    steps: [
      { goal: '«30 օրում անցնել Senior Backend հարցազրույցը»։', title: 'Ձեր նպատակը' },
      { body: 'Level Up-ը պահում է ձեր պատրաստման կենտրոնը նպատակի վրա։', title: 'Կենտրոնացում նպատակի վրա' },
      { body: 'Կենտրոնացեք այն թեմաների վրա, որոնք իսկապես պահանջում է նպատակը։', title: 'Սովորեք կարևորն' },
      { body: 'Ընթացքում վարժեք ձեր պատասխանները։', title: 'Փորձարկում' },
      { body: 'Իրականին մոտ ԱԲ հարցազրույց՝ մեկ հարցը մեկ անգամ։', title: 'Փորձնական հարցազրույց' },
      { body: 'Յուրաքանչյուր պատասխան՝ գնահատականով և հստակ բարելավման նշումներով։', title: 'Հետադարձ կապ' },
      { body: 'Լրացրեք բացերը և նորից փորձեք․ ամեն փուլը բարձրացնում է հաջորդ արդյունքը։', title: 'Բարելավում' },
      { title: 'Պատրաստ եք հարցազրույցին։' }
    ],
    lead: 'Ամեն ինչ սկսվում է ձեր նպատակից։ Level Up-ը կազմակերպում է պատրաստումը դրա շուրջ և ուղեկցում ձեզ քայլ առ քայլ։',
    title: 'Նպատակից՝ հարցազրույցի պատրաստ։',
    eyebrow: 'Ինչպես է աշխատում',
    cta: 'Սկսել փորձարկումը'
  },
  inside: {
    cards: [
      {
        body: 'Ամբողջական հարցազրույցներ ձեր թրեքի համար՝ այնպես, ինչպես դրանք իրականում են անցնում։',
        title: 'Իրականին մոտ հարցազրույցներ'
      },
      {
        body: 'Հստակ գնահատական կարևորի համար՝ ճշտություն, խորություն, կառուցվածք և հաղորդակցում, նաև օրինակելի պատասխան։',
        title: 'Կապ՝ յուրաքանչյուր պատասխանի համար'
      },
      {
        body: 'Սովորեք այն հարցերը, որոնք իրականում հանդիպում են՝ կազմակերպված ըստ թրեքի։',
        title: 'Թիրախային հարցերի բանկ'
      },
      { body: 'Հետևեք ձեր գնահատականներին և պահեք տեմպը շարքերով ու նշաններով։', title: 'Տեսանելի առաջընթաց' }
    ],
    title: 'Իրականին մոտ փորձնական հարցազրույցներ՝ գնահատմամբ, ուղեցույցով և առաջընթացով։',
    eyebrow: 'Ինչ կա ներսում'
  },
  gap: {
    items: [
      {
        body: 'Դուք վերընթերցում եք պատասխանները, բայց չեք վարժվում դրանք տեղում՝ մեկ առ մեկ տալուն, ինչպես իրական հարցազրույցում։',
        title: 'Իրական փորձ չկա'
      },
      {
        body: 'Դժվար է հասկանալ, թե պատասխանն իրականում որքան ուժեղ էր և ինչպես այն կընդունի հարցազրուցավարը։',
        title: 'Իրական հետադարձ կապ չկա'
      },
      {
        body: 'Կարող եք հիանալի իմանալ պատասխանը, բայց ճնշման տակ դժվարանալ այն պարզ ձևակերպել․ սովորելը միայնակ դա չի զարգացնում։',
        title: 'Բացատրելը առանձին հմտություն է'
      }
    ],
    leadFade: 'Պատրաստման մեծ մասը զարգացնում է ձեր գիտելիքը, բայց ոչ՝ վճռական պահին ձեր դրսևորումը։',
    lead: 'Նյութն իմանալը դեռ չի նշանակում պատրաստ լինել հարցազրույցին։'
  },
  who: {
    esl: 'Փորձարկեք այն լեզվով, որով անցնելու եք հարցազրույցը․ դա զարգացնում է ճնշման տակ հաղորդակցվելու հմտությունը, ոչ միայն գիտելիքը։',
    lead: 'Անկախ՝ առաջին հարցազրույցն է, թե հաջորդ senior փուլը, եթե պատրաստվում եք տեխնիկական հարցազրույցի, Level Up-ը ձեզ համար է։',
    title: 'Հարցազրույցի պատրաստվող ծրագրային ինժեներների համար։',
    tracksTitle: 'Դուք պատրաստվում եք մեր թրեքներից մեկով',
    eslTitle: 'Հարցազրույցն անցկացնում եք երկրորդ լեզվով',
    levelBars: ['Junior', 'Mid', 'Senior'],
    tracksNote: 'Շուտով՝ նոր թրեքներ։',
    levels: 'Junior-ից մինչև senior',
    eyebrow: 'Ում համար է',
    byStack: 'Ըստ stack-ի',
    byRole: 'Ըստ դերի'
  },
  heroCard: {
    question: 'Բացատրեք, թե ինչպես կկանխեիք race condition-ը, երբ երկու հարցում թարմացնում են նույն տողը։',
    answerPost: '-ով, գործարքի ներսում, կամ լավատեսական տարբերակի սյունակ…',
    answerPre: 'Կօգտագործեի տողի մակարդակի արգելափակում՝ ',
    tab: 'փորձնական հարցազրույց · backend',
    communicationValue: 'Նշեք փոխզիջումը',
    communication: 'Հաղորդակցում',
    questionLabel: 'Հարց 3 / 8',
    correctness: 'Ճշտություն',
    correctnessValue: 'Լավ'
  },
  language: {
    lead: 'Անցեք ամբողջական փորձնական հարցազրույց՝ հարցերը, ձեր պատասխաններն ու ԱԲ հետադարձ կապը՝ անգլերեն, ռուսերեն կամ հայերեն։',
    langs: [{ name: 'Անգլերեն' }, { name: 'Ռուսերեն' }, { name: 'Հայերեն' }],
    title: 'Հարցազրույցն անցկացրեք այն լեզվով, որն իսկապես կօգտագործեք։',
    note: 'Հավելվածի միջերեսը նույնպես հասանելի է երեք լեզվով։',
    eyebrow: 'Խոսեք ձեր լեզվով'
  },
  loop: {
    caption:
      'Սովորելը սնուցում է փորձարկումը։ Փորձարկումը տալիս է հետադարձ կապ։ Այն ցույց է տալիս՝ ինչ սովորել հետո։ Ամեն շրջանը բարձրացնում է հաջորդ արդյունքը՝ ձեր նպատակի շուրջ։',
    stages: ['Սովորել', 'Փորձարկել', 'Հետադարձ կապ', 'Առաջընթաց'],
    takeaway: 'Ամեն շրջանից հետո ավելի պատրաստ եք։',
    title: 'Չորս մաս։ Մեկ շրջան։',
    center: 'Ձեր նպատակը'
  },
  hero: {
    sub: 'Փորձարկեք իրականին մոտ հարցազրույցներ ԱԲ մարզչի հետ։ Այն գնահատում է յուրաքանչյուր պատասխանը և ցույց տալիս՝ ինչն է պետք բարելավել՝ մինչ իրական հարցազրույցը։',
    eyebrow: 'Ծրագրային ինժեներների համար',
    title: 'Պատրաստ եղեք հարցազրույցին։'
  },
  ui: {
    seeHow: 'Տեսնել՝ ինչպես է աշխատում',
    menu: 'Մենյու և կարգավորումներ',
    cta: 'Սկսել փորձարկումը',
    signIn: 'Մուտք գործել',
    free: 'Սկսել՝ անվճար',
    language: 'Լեզու',
    theme: 'Թեմա',
    light: 'Բաց',
    dark: 'Մուգ'
  },
  footer: {
    tag: 'Պատրաստ եղեք հարցազրույցին։',
    privacy: 'Գաղտնիություն',
    company: 'Ընկերություն',
    copyright: '© Level Up',
    explore: 'Բացահայտել',
    about: 'Մեր մասին',
    terms: 'Պայմաններ',
    legal: 'Իրավական'
  },
  finalCta: {
    sub: 'Անցեք ձեր առաջին փորձնական հարցազրույցն այսօր։',
    title: 'Պատրաստ եղեք հարցազրույցին։',
    cta: 'Սկսել փորձարկումը',
    free: 'Սկսել՝ անվճար'
  },
  nav: { features: 'Հնարավորություններ', how: 'Ինչպես է աշխատում', vision: 'Տեսլական', faq: 'FAQ' }
}

// Deep-merge an override over the EN base. Objects merge key-by-key over EN's keys;
// arrays of equal length merge element-by-element (so a translated list item inherits
// EN's non-translated fields — icons, key/done flags, flags/codes); a primitive or a
// different-length array in the override replaces the base.
function merge(base, over) {
  if (over === undefined) return base
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base
    if (over.length === base.length) return base.map((item, i) => merge(item, over[i]))
    return over
  }
  if (base && typeof base === 'object') {
    const out = {}
    for (const k of Object.keys(base)) out[k] = k in (over || {}) ? merge(base[k], over[k]) : base[k]
    return out
  }
  return over
}

const BUNDLES = { en: EN, ru: RU, hy: HY }

export function siteStrings(language) {
  return merge(EN, BUNDLES[language] || {})
}
