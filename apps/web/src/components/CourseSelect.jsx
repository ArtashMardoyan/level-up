import { ArrowRight } from 'lucide-react'

import CourseIcon from './CourseIcon'
import { useLanguage } from '../hooks/useLanguage'

export default function CourseSelect({ onSelect, courses }) {
  const { t } = useLanguage()

  return (
    <div className="course-grid">
      {courses.map((course) => {
        const available = course.questions?.length > 0
        return (
          <button
            className={'course-card' + (available ? '' : ' disabled')}
            style={{ '--card-accent': course.accent || '#818cf8' }}
            onClick={() => available && onSelect(course.id)}
            disabled={!available}
            key={course.id}
          >
            <span className="course-card-glow" aria-hidden="true" />
            {!available && <span className="course-badge">{t('comingSoon')}</span>}
            <span className="course-tile">
              <CourseIcon courseId={course.id} emoji={course.emoji} size={22} />
            </span>
            <span className="course-card-body">
              <span className="course-title">{course.title}</span>
              <span className="course-subtitle">{course.subtitle}</span>
            </span>
            <span className="course-card-footer">
              <span className="course-count">
                {available ? t('questionsCount', { n: course.questions.length }) : t('comingSoon')}
              </span>
              <ArrowRight className="course-arrow" aria-hidden="true" size={18} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
