import qaQuestions from './courses/qa.json'
import goQuestions from './courses/go.json'
import reactQuestions from './courses/react.json'
import devopsQuestions from './courses/devops.json'
import nodejsQuestions from './courses/nodejs.json'
import nextjsQuestions from './courses/nextjs.json'
import frontendQuestions from './courses/frontend.json'
import backendSeniorQuestions from './courses/backend.json'

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
