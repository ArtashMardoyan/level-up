package interview

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"level-up-backend/internal/shared"
)

// Status is the lifecycle of an interview session (docs/product/interview/004).
type Status string

const (
	StatusInProgress Status = "in_progress"
	StatusCompleted  Status = "completed"
	StatusFailed     Status = "failed"
)

// EvalStatus records whether a single answer was evaluated by the AI (docs/006).
type EvalStatus string

const (
	EvalOK     EvalStatus = "ok"
	EvalFailed EvalStatus = "failed"
)

// Difficulty and Language are stored as free TEXT; validated at the DTO layer.
const (
	LangEN = "en"
	LangRU = "ru"
	LangHY = "hy"
)

// StringList is a []string persisted as a jsonb column (strengths, weaknesses,
// recommendations, snapshot question ids). Same Scan/Value approach as the
// notifications module's Params.
type StringList []string

func (l StringList) Value() (driver.Value, error) {
	if l == nil {
		return "[]", nil
	}

	return json.Marshal(l)
}

func (l *StringList) Scan(src any) error {
	if src == nil {
		*l = StringList{}
		return nil
	}

	var bytes []byte
	switch v := src.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("interview: unsupported StringList scan type")
	}

	if len(bytes) == 0 {
		*l = StringList{}
		return nil
	}

	return json.Unmarshal(bytes, l)
}

// GeneratedQuestion is one AI-paraphrased question + its matching model answer,
// cached the first time it's generated so resume/review always show the exact
// text the candidate was asked (docs/product/interview/004/005). Reaction is the natural,
// score-free bridge from the previous answer into this question — empty for the
// interview's first question.
type GeneratedQuestion struct {
	Reaction    string `json:"reaction"`
	Question    string `json:"question"`
	ModelAnswer string `json:"modelAnswer"`
}

// GeneratedQuestions is a []GeneratedQuestion persisted as jsonb, parallel-indexed
// with Session.QuestionIDs: len(Generated) grows to i+1 once slot i has been shown.
type GeneratedQuestions []GeneratedQuestion

func (g GeneratedQuestions) Value() (driver.Value, error) {
	if g == nil {
		return "[]", nil
	}

	return json.Marshal(g)
}

func (g *GeneratedQuestions) Scan(src any) error {
	if src == nil {
		*g = GeneratedQuestions{}
		return nil
	}

	var bytes []byte
	switch v := src.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("interview: unsupported GeneratedQuestions scan type")
	}

	if len(bytes) == 0 {
		*g = GeneratedQuestions{}
		return nil
	}

	return json.Unmarshal(bytes, g)
}

// Session is one chat interview. QuestionIDs is the bank-question snapshot chosen
// at start so the set stays stable across refreshes; Generated caches each slot's
// AI-paraphrased text as it's shown (docs/004). CurrentIndex tracks chat progress.
type Session struct {
	shared.Base
	ID            string             `json:"id"            gorm:"primaryKey"`
	UserID        string             `json:"userId"        gorm:"column:userId"`
	CourseID      string             `json:"courseId"      gorm:"column:courseId"`
	Difficulty    string             `json:"difficulty"`
	Language      string             `json:"language"`
	Status        Status             `json:"status"`
	QuestionCount int                `json:"questionCount" gorm:"column:questionCount"`
	QuestionIDs   StringList         `json:"questionIds"   gorm:"column:questionIds;type:jsonb"`
	Generated     GeneratedQuestions `json:"-"             gorm:"column:generatedQuestions;type:jsonb"`
	CurrentIndex  int                `json:"currentIndex"  gorm:"column:currentIndex"`
	OverallScore  *int               `json:"overallScore"  gorm:"column:overallScore"`
	StartedAt     time.Time          `json:"startedAt"     gorm:"column:startedAt"`
	CompletedAt   *time.Time         `json:"completedAt"   gorm:"column:completedAt"`
}

func (Session) TableName() string { return "interview_sessions" }

func (s *Session) BeforeCreate(_ *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.NewString()
	}

	return nil
}

// QuestionResult is one evaluated answer (docs/product/interview/006/010). Scores are
// integers in 0–100. Feedback is shown as the AI's chat reply.
type QuestionResult struct {
	shared.Base
	ID            string     `json:"id"            gorm:"primaryKey"`
	InterviewID   string     `json:"interviewId"   gorm:"column:interviewId"`
	QuestionID    string     `json:"questionId"    gorm:"column:questionId"`
	UserAnswer    string     `json:"userAnswer"    gorm:"column:userAnswer"`
	Skipped       bool       `json:"skipped"`
	Score         int        `json:"score"`
	Correctness   int        `json:"correctness"`
	Depth         int        `json:"depth"`
	Communication int        `json:"communication"`
	Structure     int        `json:"structure"`
	Confidence    string     `json:"confidence"`
	Feedback      string     `json:"feedback"`
	Strengths     StringList `json:"strengths"     gorm:"type:jsonb"`
	Weaknesses    StringList `json:"weaknesses"    gorm:"type:jsonb"`
	EvalStatus    EvalStatus `json:"evalStatus"    gorm:"column:evalStatus"`
	EvalVersion   string     `json:"evalVersion"   gorm:"column:evalVersion"`
}

func (QuestionResult) TableName() string { return "question_results" }

func (r *QuestionResult) BeforeCreate(_ *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.NewString()
	}

	return nil
}

// FinalReport is the 1:1 aggregation built at completion (docs/product/interview/010).
type FinalReport struct {
	shared.Base
	ID              string     `json:"id"              gorm:"primaryKey"`
	InterviewID     string     `json:"interviewId"     gorm:"column:interviewId"`
	OverallScore    int        `json:"overallScore"    gorm:"column:overallScore"`
	Verdict         string     `json:"verdict"`
	Correctness     int        `json:"correctness"`
	Depth           int        `json:"depth"`
	Communication   int        `json:"communication"`
	Structure       int        `json:"structure"`
	Strengths       StringList `json:"strengths"       gorm:"type:jsonb"`
	Weaknesses      StringList `json:"weaknesses"      gorm:"type:jsonb"`
	Recommendations StringList `json:"recommendations" gorm:"type:jsonb"`
	GeneratedAt     time.Time  `json:"generatedAt"     gorm:"column:generatedAt"`
}

func (FinalReport) TableName() string { return "final_reports" }

func (r *FinalReport) BeforeCreate(_ *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.NewString()
	}

	return nil
}

// Confidence is how much data backs a topic's level (docs/product/interview/007) —
// it grows with the number of interviews that contributed, independent of the level.
const (
	ConfidenceLow    = "low"
	ConfidenceMedium = "medium"
	ConfidenceHigh   = "high"
)

// TopicProgress is the durable per-(user, course) knowledge map (docs/product/interview/007).
// Level is an EMA-smoothed 0-100 score updated after every completed interview, so it
// evolves gradually rather than jumping on one result; Samples counts the interviews
// that fed it (drives Confidence). Coarse MVP: topic = course.
type TopicProgress struct {
	shared.Base
	ID              string     `json:"id"              gorm:"primaryKey"`
	UserID          string     `json:"userId"          gorm:"column:userId"`
	CourseID        string     `json:"courseId"        gorm:"column:courseId"`
	Level           int        `json:"level"`
	Confidence      string     `json:"confidence"`
	Samples         int        `json:"samples"`
	LastPracticedAt *time.Time `json:"lastPracticedAt" gorm:"column:lastPracticedAt"`
	LastImprovedAt  *time.Time `json:"lastImprovedAt"  gorm:"column:lastImprovedAt"`
}

func (TopicProgress) TableName() string { return "topic_progress" }

func (p *TopicProgress) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}

	return nil
}
