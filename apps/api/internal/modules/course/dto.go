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
	ByCourse       map[string]CourseProgressCountDTO `json:"byCourse"`
}
