import qaQuestions from './courses/qa/en.json'
import goQuestions from './courses/go/en.json'
import ruGoQuestions from './courses/go/ru.json'
import ruQaQuestions from './courses/qa/ru.json'
import reactQuestions from './courses/react/en.json'
import devopsQuestions from './courses/devops/en.json'
import nodejsQuestions from './courses/nodejs/en.json'
import nextjsQuestions from './courses/nextjs/en.json'
import ruReactQuestions from './courses/react/ru.json'
import ruDevopsQuestions from './courses/devops/ru.json'
import ruNodejsQuestions from './courses/nodejs/ru.json'
import ruNextjsQuestions from './courses/nextjs/ru.json'
import frontendQuestions from './courses/frontend/en.json'
import ruBackendQuestions from './courses/backend/ru.json'
import ruFrontendQuestions from './courses/frontend/ru.json'
import backendSeniorQuestions from './courses/backend/en.json'

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
  nextjs: ruNextjsQuestions,
  nodejs: ruNodejsQuestions,
  devops: ruDevopsQuestions,
  react: ruReactQuestions,
  qa: ruQaQuestions,
  go: ruGoQuestions
}

function mergeQuestions(enQuestions, ruQuestions) {
  if (!ruQuestions?.length) return enQuestions
  const ruById = new Map(ruQuestions.map((q) => [q.id, q]))
  return enQuestions.map((q) => {
    const ru = ruById.get(q.id)
    if (!ru) return q
    const merged = { ...q, question: ru.question || q.question, answer: ru.answer || q.answer }
    if (q.bonus && ru.bonus) merged.bonus = ru.bonus
    // Audio is per-language: use the ru keys, or none (don't inherit en audio).
    if (ru.audio) merged.audio = ru.audio
    else delete merged.audio
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
