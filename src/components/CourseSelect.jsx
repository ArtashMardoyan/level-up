import CourseIcon from './CourseIcon'

export default function CourseSelect({ onSelect, courses }) {
  return (
    <div className="course-grid">
      {courses.map((course) => {
        const available = course.questions?.length > 0
        return (
          <button
            className={'course-card' + (available ? '' : ' disabled')}
            onClick={() => available && onSelect(course.id)}
            disabled={!available}
            key={course.id}
          >
            {!available && <span className="course-badge">Coming soon</span>}
            <div className="course-emoji">
              <CourseIcon courseId={course.id} emoji={course.emoji} />
            </div>
            <div className="course-title">{course.title}</div>
            <div className="course-subtitle">{course.subtitle}</div>
            {available && <div className="course-count">{course.questions.length} questions</div>}
          </button>
        )
      })}
    </div>
  )
}
