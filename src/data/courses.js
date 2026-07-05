import backendSeniorQuestions from './courses/backend.json'
import frontendQuestions from './courses/frontend.json'
import devopsQuestions from './courses/devops.json'
import qaQuestions from './courses/qa.json'
import nodejsQuestions from './courses/nodejs.json'
import goQuestions from './courses/go.json'
import reactQuestions from './courses/react.json'
import nextjsQuestions from './courses/nextjs.json'

export const COURSES = [
  {
    id: 'backend',
    title: 'Backend Developer',
    subtitle: 'Node.js, APIs, databases, AWS & infrastructure',
    emoji: '🛠️',
    questions: backendSeniorQuestions,
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    subtitle: 'React, browser internals, performance',
    emoji: '🎨',
    questions: frontendQuestions,
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    subtitle: 'CI/CD, containers, cloud infrastructure',
    emoji: '⚙️',
    questions: devopsQuestions,
  },
  {
    id: 'qa',
    title: 'QA Engineer',
    subtitle: 'Testing strategy, automation, bug reports',
    emoji: '🔍',
    questions: qaQuestions,
  },
  {
    id: 'nodejs',
    title: 'Node.js',
    subtitle: 'Runtime internals, streams, npm ecosystem',
    emoji: '🟢',
    questions: nodejsQuestions,
  },
  {
    id: 'go',
    title: 'Go',
    subtitle: 'Goroutines, channels, standard library',
    emoji: '🐹',
    questions: goQuestions,
  },
  {
    id: 'react',
    title: 'React',
    subtitle: 'Hooks, state management, component patterns',
    emoji: '⚛️',
    questions: reactQuestions,
  },
  {
    id: 'nextjs',
    title: 'Next.js',
    subtitle: 'SSR/SSG, App Router, API routes',
    emoji: '▲',
    questions: nextjsQuestions,
  },
]

export function getCourse(id) {
  return COURSES.find((c) => c.id === id) || null
}
