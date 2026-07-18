package course

import (
	"time"

	"level-up-backend/internal/shared"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Course struct {
	shared.Base
	ID        string `json:"id"        gorm:"primaryKey"`
	Slug      string `json:"slug"      gorm:"uniqueIndex"`
	Title     string `json:"title"`
	Subtitle  string `json:"subtitle"`
	Emoji     string `json:"emoji"`
	Accent    string `json:"accent"`
	SortOrder int    `json:"sortOrder" gorm:"column:sortOrder"`
}

func (Course) TableName() string { return "courses" }

func (c *Course) BeforeCreate(_ *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.NewString()
	}

	return nil
}

type Question struct {
	shared.Base
	ID           string                `json:"id"        gorm:"primaryKey"`
	CourseID     string                `json:"courseId"  gorm:"column:courseId"`
	Ref          string                `json:"ref"`
	Module       string                `json:"module"`
	Difficulty   string                `json:"difficulty" gorm:"column:difficulty;default:medium"`
	SortOrder    int                   `json:"sortOrder" gorm:"column:sortOrder"`
	Translations []QuestionTranslation `json:"-"         gorm:"foreignKey:QuestionID"`
}

func (Question) TableName() string { return "questions" }

func (q *Question) BeforeCreate(_ *gorm.DB) error {
	if q.ID == "" {
		q.ID = uuid.NewString()
	}

	return nil
}

type QuestionTranslation struct {
	shared.Base
	ID         string `json:"id"         gorm:"primaryKey"`
	QuestionID string `json:"questionId" gorm:"column:questionId"`
	Lang       string `json:"lang"`
	Question   string `json:"question"`
	Answer     string `json:"answer"`
	Bonus      string `json:"bonus"`
	Audio      string `json:"audio"`
}

func (QuestionTranslation) TableName() string { return "question_translations" }

func (t *QuestionTranslation) BeforeCreate(_ *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}

	return nil
}

type UserQuestionProgress struct {
	shared.Base
	ID         string     `json:"id"         gorm:"primaryKey"`
	UserID     string     `json:"userId"     gorm:"column:userId"`
	QuestionID string     `json:"questionId" gorm:"column:questionId"`
	Reviewed   bool       `json:"reviewed"`
	Favorite   bool       `json:"favorite"`
	ReviewedAt *time.Time `json:"reviewedAt" gorm:"column:reviewedAt"`
}

func (UserQuestionProgress) TableName() string { return "user_question_progress" }

func (p *UserQuestionProgress) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}

	return nil
}
