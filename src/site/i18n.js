// Marketing-site strings, per language. EN is the source of truth; RU and HY are
// filled from the reviewed translations (website-i18n.json). Missing keys in RU/HY
// fall back to EN via mergeBundle, so a partial translation never blanks the page.
//
// Keep track names, brand, language sample words, codes, and the code snippet
// untranslated (see website-i18n.json instructions).

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

// RU / HY: paste the translated bundles here (same shape as EN). Empty for now —
// the site falls back to EN for any missing language or key.
export const RU = {}
export const HY = {}

// Deep-merge a partial override over the EN base (arrays are replaced wholesale when
// present in the override, so a translated list must keep EN's length/order).
function merge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base
  if (base && typeof base === 'object') {
    const out = {}
    for (const k of Object.keys(base)) out[k] = k in (over || {}) ? merge(base[k], over[k]) : base[k]
    return out
  }
  return over === undefined ? base : over
}

const BUNDLES = { en: EN, ru: RU, hy: HY }

export function siteStrings(language) {
  return merge(EN, BUNDLES[language] || {})
}
