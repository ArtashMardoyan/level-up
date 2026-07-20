package interview

import "time"

// CreateInterviewRequest starts a session (docs/interview/004/013). Course is
// referenced by slug (stable, human-readable) — the content bank keys on it.
type CreateInterviewRequest struct {
	CourseSlug    string `json:"courseSlug"    binding:"required"`
	Difficulty    string `json:"difficulty"    binding:"required,oneof=easy medium hard"`
	Language      string `json:"language"      binding:"required,oneof=en ru hy"`
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
// "Sample answer" (docs/interview/011). Reaction is the natural, score-free
// bridge from the previous answer (empty for the first question) — the chat
// folds it into the same bubble as Question; Review/grading use Question alone.
type QuestionView struct {
	QuestionID  string `json:"questionId"`
	Index       int    `json:"index"`
	Module      string `json:"module"`
	Reaction    string `json:"reaction"`
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

// LastSessionView is the lean shape of the most recently completed session, for
// the profile page's "latest session" card (course/difficulty/language + score;
// the client already has course titles/accents from /courses/full and maps by
// courseId, same as the interview history list).
type LastSessionView struct {
	ID           string    `json:"id"`
	CourseID     string    `json:"courseId"`
	Difficulty   string    `json:"difficulty"`
	Language     string    `json:"language"`
	OverallScore int       `json:"overallScore"`
	CompletedAt  time.Time `json:"completedAt"`
}

// TranscribeResponse is the transcript of a recorded voice answer, for the
// frontend to prefill (and let the candidate edit) the composer (docs/005).
type TranscribeResponse struct {
	Transcript string `json:"transcript"`
}

// SummaryView aggregates a user's completed interviews for the profile page
// (docs/interview/011 "Interview performance"): total count, average and best
// score, and the latest session. Zero values (no completed interviews yet) are
// valid — LastSession is nil in that case.
type SummaryView struct {
	TotalCompleted int              `json:"totalCompleted"`
	AvgScore       int              `json:"avgScore"`
	BestScore      int              `json:"bestScore"`
	LastSession    *LastSessionView `json:"lastSession"`
}
