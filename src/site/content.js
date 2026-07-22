// All public-website copy as data, so pages stay content-driven and easy to edit.
// English only for V1; structured so it can later move behind the i18n layer.
// Source of truth: the approved Website Copy V1 (Product Model — goal-driven).

export const HOME = {
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
  who: {
    lead: 'Whether it’s your first interview or your next senior loop — if you’re getting ready for a technical interview, Level Up is for you.',
    tracks: {
      role: ['Backend', 'Frontend', 'DevOps', 'QA'],
      stack: ['Node.js', 'Go', 'React', 'Next.js']
    },
    esl: 'The practice builds how you communicate under pressure — not just what you know.',
    eslTitle: 'You’re interviewing in English as a second language',
    title: 'For software engineers preparing to interview.',
    tracksTitle: 'You’re preparing for one of our tracks',
    levels: 'You’re anywhere from junior to senior',
    eyebrow: 'Who it’s for'
  },
  visionTeaser: {
    body: [
      'Our ambition is to grow into a long-term career-preparation platform for software engineers — with practice, feedback, and coaching that adapt as your goals evolve.',
      'Spoken interviews and more fields to prepare for are on that path.'
    ],
    title: 'Interview prep is where we start.',
    eyebrow: 'Where we’re headed',
    link: 'Read the full vision'
  },
  hero: {
    sub: 'Practice realistic mock interviews with an AI coach. It scores every answer and shows you what to improve — before the real one.',
    eyebrow: 'For software engineers',
    title: 'Get interview-ready.',
    secondary: 'See how it works',
    primary: 'Start practicing',
    note: 'Free to start'
  },
  finalCta: {
    sub: 'Run your first mock interview today.',
    title: 'Get interview-ready.',
    primary: 'Start practicing',
    note: 'Free to start'
  }
}

export const VISION = {
  believe: {
    items: [
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
    title: 'What we believe'
  },
  why: {
    body: 'Most ways to prepare are passive: you read, watch, and study, then hope it’s enough. We think that’s backwards. Real readiness comes from doing the thing, getting honest feedback, and improving — again and again. Level Up exists to make that loop something every engineer can actually run.',
    lead: 'We believe preparation should be something you can practice, measure, and improve — not just consume.',
    title: 'Why we exist'
  },
  going: {
    body: [
      'Level Up starts with technical interviews. The bigger goal is a career-preparation platform for engineers — one that knows what you’re preparing for and coaches you through it, at any stage.',
      'Spoken interviews, more personalized preparation, and more fields to prepare for are the direction we’re building toward.'
    ],
    title: 'Where we’re going'
  },
  hero: {
    sub: 'Level Up exists to make getting ready — for an interview today, and your career tomorrow — a loop you can actually run: practice, get honest feedback, improve, repeat.',
    title: 'Preparation should be something you can practice.',
    eyebrow: 'Our vision'
  },
  close: { title: 'The best way to understand it is to try it.', primary: 'Start practicing', note: 'Free to start' }
}

export const FEATURES = {
  capabilities: [
    {
      body: 'The AI asks one question at a time, follows your track and level, and responds like an interviewer would — so you rehearse the real experience: out loud, on the spot, one answer at a time.',
      title: 'Practice a real interview, not a quiz.'
    },
    {
      body: 'The moment you answer, you get a score on what matters — correctness, depth, structure, and communication — plus written coaching and a model answer to learn from. No guessing how it went.',
      title: 'A score and coaching on every answer.'
    },
    {
      body: 'A curated question bank for each track, organized so you can focus on what the interview will test. Read or listen to each one as you go.',
      title: 'The questions your track actually asks.'
    },
    {
      body: 'Every session is scored and saved, so you can see your results improve over time. Streaks and badges keep the momentum going between interviews.',
      title: 'Watch your results climb.'
    }
  ],
  loop: {
    caption:
      'Study feeds your practice. Practice produces feedback. Feedback shows you what to study next. Each lap raises your next score — all of it turning around your goal.',
    stages: ['Study', 'Practice', 'Feedback', 'Progress'],
    takeaway: 'Each time around, you get more ready.',
    title: 'Four parts. One loop.',
    center: 'Your goal'
  },
  hero: {
    sub: 'Every part of Level Up feeds the next: what you study shapes your practice, your practice produces feedback, and your feedback shapes what to do next — all organized around the interview you’re preparing for.',
    title: 'Not a bundle of tools — one system built around your goal.',
    eyebrow: 'Features'
  },
  close: { title: 'See it in your track.', primary: 'Start practicing', note: 'Free to start' }
}

export const FAQ = {
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
      a: 'You can practice interviews in English or Russian, and the app itself is in English, Russian, and Armenian. If you’re interviewing in English as a second language, the practice also helps you get used to explaining your answers clearly.',
      q: 'What languages can I use?'
    },
    {
      a: 'Eight tracks today — by role (Backend, Frontend, DevOps, QA) and by stack (Node.js, Go, React, Next.js), from junior to senior.',
      q: 'Which roles and tracks are covered?'
    },
    {
      a: 'Today, yes — interview preparation is what it does. The bigger goal is a career-preparation platform that grows with you (see our Vision).',
      q: 'Is Level Up only for interviews?'
    }
  ],
  cta: { title: 'Still curious? Try it.', primary: 'Start practicing', note: 'Free to start' },
  intro: 'Straight answers to the things people ask before they start.'
}
