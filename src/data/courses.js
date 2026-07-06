import qaQuestions from './courses/qa.json'
import goQuestions from './courses/go.json'
import ruQaQuestions from './courses/ru/qa.json'
import reactQuestions from './courses/react.json'
import devopsQuestions from './courses/devops.json'
import nodejsQuestions from './courses/nodejs.json'
import nextjsQuestions from './courses/nextjs.json'
import frontendQuestions from './courses/frontend.json'
import ruDevopsQuestions from './courses/ru/devops.json'
import ruNodejsQuestions from './courses/ru/nodejs.json'
import ruBackendQuestions from './courses/ru/backend.json'
import backendSeniorQuestions from './courses/backend.json'
import ruFrontendQuestions from './courses/ru/frontend.json'

export const COURSES = [
  {
    subtitle: 'NodeJS, APIs, databases, AWS & infrastructure',
    questions: backendSeniorQuestions,
    title: 'Backend Developer',
    id: 'backend',
    emoji: '🛠️'
  },
  {
    subtitle: 'React, browser internals, performance',
    questions: frontendQuestions,
    title: 'Frontend Developer',
    id: 'frontend',
    emoji: '🎨'
  },
  {
    subtitle: 'CI/CD, containers, cloud infrastructure',
    questions: devopsQuestions,
    title: 'DevOps Engineer',
    id: 'devops',
    emoji: '⚙️'
  },
  {
    subtitle: 'Testing strategy, automation, bug reports',
    questions: qaQuestions,
    title: 'QA Engineer',
    emoji: '🔍',
    id: 'qa'
  },
  {
    subtitle: 'Runtime internals, streams, npm ecosystem',
    questions: nodejsQuestions,
    title: 'NodeJS',
    id: 'nodejs',
    emoji: '🟢'
  },
  {
    subtitle: 'Goroutines, channels, standard library',
    questions: goQuestions,
    title: 'Go',
    emoji: '🐹',
    id: 'go'
  },
  {
    subtitle: 'Hooks, state management, component patterns',
    questions: reactQuestions,
    title: 'React',
    id: 'react',
    emoji: '⚛️'
  },
  {
    subtitle: 'SSR/SSG, App Router, API routes',
    questions: nextjsQuestions,
    title: 'Next.js',
    id: 'nextjs',
    emoji: '▲'
  }
]

export function getCourse(id) {
  return COURSES.find((c) => c.id === id) || null
}

const RU_QUESTIONS = {
  frontend: ruFrontendQuestions,
  backend: ruBackendQuestions,
  nodejs: ruNodejsQuestions,
  devops: ruDevopsQuestions,
  qa: ruQaQuestions
}

// Russian files carry question/answer/bonus only; id, module and everything else
// always come from the canonical English entry, with per-field English fallback.
function mergeQuestions(enQuestions, ruQuestions) {
  if (!ruQuestions?.length) return enQuestions
  const ruById = new Map(ruQuestions.map((q) => [q.id, q]))
  return enQuestions.map((q) => {
    const ru = ruById.get(q.id)
    if (!ru) return q
    const merged = { ...q, question: ru.question || q.question, answer: ru.answer || q.answer }
    if (q.bonus && ru.bonus) merged.bonus = ru.bonus
    return merged
  })
}

const localizedCoursesCache = new Map()

export function getLocalizedCourses(language) {
  if (language === 'en') return COURSES
  let localized = localizedCoursesCache.get(language)
  if (!localized) {
    localized = COURSES.map((course) => ({
      ...course,
      questions: mergeQuestions(course.questions, RU_QUESTIONS[course.id])
    }))
    localizedCoursesCache.set(language, localized)
  }
  return localized
}

export function getLocalizedCourse(id, language) {
  return getLocalizedCourses(language).find((course) => course.id === id) || null
}
