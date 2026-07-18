package interview

// CreateInterviewRequest starts a session (docs/interview/004/013). Course is
// referenced by slug (stable, human-readable) — the content bank keys on it.
type CreateInterviewRequest struct {
	CourseSlug    string `json:"courseSlug"    binding:"required"`
	Difficulty    string `json:"difficulty"    binding:"required,oneof=easy medium hard"`
	Language      string `json:"language"      binding:"required,oneof=en ru"`
	QuestionCount int    `json:"questionCount" binding:"required,min=1,max=20"`
}

// SubmitAnswerRequest saves + evaluates one answer. A skipped answer scores 0
// and skips the AI call (docs/interview/004).
type SubmitAnswerRequest struct {
	Answer  string `json:"answer"`
	Skipped bool   `json:"skipped"`
}

// QuestionView is a single question as the chat needs it, in the session
// language. ModelAnswer backs both the Review "Model answer" and the composer's
// "Sample answer" (docs/interview/011).
type QuestionView struct {
	QuestionID  string `json:"questionId"`
	Index       int    `json:"index"`
	Module      string `json:"module"`
	Question    string `json:"question"`
	ModelAnswer string `json:"modelAnswer"`
}

// ChatTurn is one answered question with its evaluation, for rebuilding the chat
// on resume (docs/interview/012).
type ChatTurn struct {
	Question QuestionView   `json:"question"`
	Result   QuestionResult `json:"result"`
}

// SessionView is the resume payload: the session, the answered turns so far, and
// the current unanswered question (nil when finished).
type SessionView struct {
	Session  Session       `json:"session"`
	History  []ChatTurn    `json:"history"`
	Current  *QuestionView `json:"current"`
	Finished bool          `json:"finished"`
}

// SubmitAnswerResponse returns the evaluation for the chat plus what comes next.
type SubmitAnswerResponse struct {
	Result   QuestionResult `json:"result"`
	Next     *QuestionView  `json:"next"`
	Finished bool           `json:"finished"`
}

// ReviewItem is one per-question card on the Review screen (docs/interview/011).
type ReviewItem struct {
	QuestionID  string     `json:"questionId"`
	Index       int        `json:"index"`
	Question    string     `json:"question"`
	ModelAnswer string     `json:"modelAnswer"`
	UserAnswer  string     `json:"userAnswer"`
	Skipped     bool       `json:"skipped"`
	Score       int        `json:"score"`
	Strengths   StringList `json:"strengths"`
	Weaknesses  StringList `json:"weaknesses"`
}

// ReportView is the Results + Review payload (docs/interview/011).
type ReportView struct {
	Report  FinalReport  `json:"report"`
	Session Session      `json:"session"`
	Review  []ReviewItem `json:"review"`
}
