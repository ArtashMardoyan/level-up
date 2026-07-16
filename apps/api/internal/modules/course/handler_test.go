package course_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"level-up-backend/internal/modules/course"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type stubCourseRepo struct {
	course    course.Course
	questions []course.Question
}

func (s *stubCourseRepo) FindAllCourses(context.Context) ([]course.Course, error) {
	return []course.Course{s.course}, nil
}

func (s *stubCourseRepo) CountQuestionsByCourse(context.Context) (map[string]int, error) {
	return map[string]int{s.course.ID: len(s.questions)}, nil
}

func (*stubCourseRepo) ContentVersion(context.Context) (string, error) {
	return "test-version", nil
}

func (s *stubCourseRepo) FindCourseBySlug(_ context.Context, slug string) (course.Course, error) {
	if slug == s.course.Slug {
		return s.course, nil
	}

	return course.Course{}, gorm.ErrRecordNotFound
}

func (s *stubCourseRepo) FindQuestionsByCourse(context.Context, string) ([]course.Question, error) {
	return s.questions, nil
}

func (*stubCourseRepo) FindQuestionByID(context.Context, string) (course.Question, error) {
	return course.Question{}, gorm.ErrRecordNotFound
}

type stubProgressRepo struct{}

func (stubProgressRepo) FindByUser(context.Context, string) ([]course.UserQuestionProgress, error) {
	return nil, nil
}

func (stubProgressRepo) FindByUserAndCourse(context.Context, string, string) ([]course.UserQuestionProgress, error) {
	return nil, nil
}

func (stubProgressRepo) SummaryByUser(context.Context, string) ([]course.CourseProgressStat, error) {
	return nil, nil
}

func (stubProgressRepo) FindOne(context.Context, string, string) (course.UserQuestionProgress, error) {
	return course.UserQuestionProgress{}, gorm.ErrRecordNotFound
}

func (stubProgressRepo) Create(context.Context, *course.UserQuestionProgress) error { return nil }
func (stubProgressRepo) Save(context.Context, *course.UserQuestionProgress) error   { return nil }

func newTestRouter(repo course.CourseRepository) *gin.Engine {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	handler := course.NewHandler(course.NewService(repo, stubProgressRepo{}))
	handler.RegisterRoutes(r, func(*gin.Context) {})

	return r
}

// TestGetCourseLocalization checks the outward shape and the en-fallback rules:
// a requested-language field falls back to English when empty, and audio is
// per-language (kept from English only when there is no overlay for the language).
func TestGetCourseLocalization(t *testing.T) {
	repo := &stubCourseRepo{
		course: course.Course{ID: "uuid-go", Slug: "go", Title: "Go"},
		questions: []course.Question{
			{
				ID: "uuid-1", Ref: "q1", Module: "M1",
				Translations: []course.QuestionTranslation{
					{Lang: "en", Question: "EN q1", Answer: "EN a1", Bonus: "EN b1", Audio: "audio/en/q1.mp3"},
					{Lang: "ru", Question: "RU q1", Answer: "", Bonus: "", Audio: "audio/ru/q1.mp3"},
				},
			},
			{
				ID: "uuid-2", Ref: "q2", Module: "M1",
				Translations: []course.QuestionTranslation{
					{Lang: "en", Question: "EN q2", Answer: "EN a2", Audio: "audio/en/q2.mp3"},
				},
			},
		},
	}

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/courses/go?lang=ru", http.NoBody)
	rec := httptest.NewRecorder()
	newTestRouter(repo).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body struct {
		Data course.CourseDetailDTO `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode body: %v", err)
	}

	if len(body.Data.Questions) != 2 {
		t.Fatalf("expected 2 questions, got %d", len(body.Data.Questions))
	}

	q1 := body.Data.Questions[0]
	if q1.ID != "uuid-1" || q1.Ref != "q1" {
		t.Errorf("q1 identity: got id=%q ref=%q", q1.ID, q1.Ref)
	}
	if q1.Question != "RU q1" {
		t.Errorf("q1 question: expected RU override, got %q", q1.Question)
	}
	if q1.Answer != "EN a1" {
		t.Errorf("q1 answer: expected en fallback (ru empty), got %q", q1.Answer)
	}
	if q1.Bonus != "EN b1" {
		t.Errorf("q1 bonus: expected en fallback (ru empty), got %q", q1.Bonus)
	}
	if q1.Audio != "audio/ru/q1.mp3" {
		t.Errorf("q1 audio: expected ru audio, got %q", q1.Audio)
	}

	q2 := body.Data.Questions[1]
	if q2.Question != "EN q2" {
		t.Errorf("q2 question: expected en (no ru overlay), got %q", q2.Question)
	}
	if q2.Audio != "audio/en/q2.mp3" {
		t.Errorf("q2 audio: expected en audio kept (no ru overlay), got %q", q2.Audio)
	}
}

func TestGetCourseNotFound(t *testing.T) {
	repo := &stubCourseRepo{course: course.Course{ID: "uuid-go", Slug: "go", Title: "Go"}}

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/courses/missing", http.NoBody)
	rec := httptest.NewRecorder()
	newTestRouter(repo).ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}
}
