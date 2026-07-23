package course

type QuestionDTO struct {
	ID       string `json:"id"`
	Ref      string `json:"ref"`
	Module   string `json:"module"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Bonus    string `json:"bonus,omitempty"`
	Audio    string `json:"audio,omitempty"`
}

type VersionDTO struct {
	Version string `json:"version"`
}

type CourseListItemDTO struct {
	ID            string `json:"id"`
	Slug          string `json:"slug"`
	Title         string `json:"title"`
	Subtitle      string `json:"subtitle"`
	Emoji         string `json:"emoji"`
	Accent        string `json:"accent"`
	QuestionCount int    `json:"questionCount"`
}

type CourseDetailDTO struct {
	ID        string        `json:"id"`
	Slug      string        `json:"slug"`
	Title     string        `json:"title"`
	Subtitle  string        `json:"subtitle"`
	Emoji     string        `json:"emoji"`
	Accent    string        `json:"accent"`
	Questions []QuestionDTO `json:"questions"`
}

// UpsertProgressDTO uses pointers so an omitted field is left unchanged,
// letting the client toggle "reviewed" and "favorite" independently.
type UpsertProgressDTO struct {
	Reviewed *bool `json:"reviewed" binding:"omitempty"`
	Favorite *bool `json:"favorite" binding:"omitempty"`
	// Timezone (IANA, e.g. Asia/Yerevan) sent by the client so the streak day
	// boundary is computed in the user's local time. Optional; falls back to UTC.
	Timezone string `json:"timezone" binding:"omitempty"`
}

type BulkProgressDTO struct {
	ReviewedIDs []string `json:"reviewedIds" binding:"omitempty,dive,required"`
	FavoriteIDs []string `json:"favoriteIds" binding:"omitempty,dive,required"`
}

type ProgressResponseDTO struct {
	ReviewedIDs []string `json:"reviewedIds"`
	FavoriteIDs []string `json:"favoriteIds"`
}

type ProgressStateDTO struct {
	QuestionID string `json:"questionId"`
	Reviewed   bool   `json:"reviewed"`
	Favorite   bool   `json:"favorite"`
}

type CourseProgressCountDTO struct {
	Reviewed  int `json:"reviewed"`
	Favorites int `json:"favorites"`
}

type ProgressSummaryDTO struct {
	TotalReviewed  int                               `json:"totalReviewed"`
	TotalFavorites int                               `json:"totalFavorites"`
	CurrentStreak  int                               `json:"currentStreak"`
	LongestStreak  int                               `json:"longestStreak"`
	ByCourse       map[string]CourseProgressCountDTO `json:"byCourse"`
}

// SavedQuestionDTO is one favorited question for the profile "Saved questions"
// list — enough to display it and to deep-link into the course (slug + ref).
// The gorm column tags let the progress query scan straight into it.
type SavedQuestionDTO struct {
	CourseSlug  string `json:"courseSlug"  gorm:"column:courseSlug"`
	CourseTitle string `json:"courseTitle" gorm:"column:courseTitle"`
	Accent      string `json:"accent"      gorm:"column:accent"`
	Ref         string `json:"ref"         gorm:"column:ref"`
	Module      string `json:"module"      gorm:"column:module"`
	Question    string `json:"question"    gorm:"column:question"`
}
