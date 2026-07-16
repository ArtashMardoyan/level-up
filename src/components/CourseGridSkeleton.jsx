// Shimmer placeholder for the course grid while content loads from the backend.
// Mirrors the real .course-card layout so the grid doesn't shift when data lands.
const CARDS = Array.from({ length: 6 })
const BODY_LINES = [{ width: '58%', height: 18 }, { width: '100%' }, { width: '80%' }]

export default function CourseGridSkeleton() {
  return (
    <div className="course-grid" aria-hidden="true">
      {CARDS.map((_, cardIndex) => (
        <div className="course-card skel-card" key={cardIndex}>
          <div className="course-tile-row">
            <span className="skeleton skel-tile" />
          </div>
          <div className="course-card-body">
            {BODY_LINES.map((line, lineIndex) => (
              <span className="skeleton skel-line" key={lineIndex} style={line} />
            ))}
          </div>
          <div className="course-card-footer">
            <span className="skeleton skel-line" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
