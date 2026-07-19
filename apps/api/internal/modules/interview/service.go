package interview

import (
	"context"
	"errors"
	"math/rand"
	"strings"
	"time"

	"level-up-backend/internal/modules/course"
	"level-up-backend/internal/shared"
)

// Sentinel errors mapped to HTTP status by the handler.
var (
	ErrActiveSession  = errors.New("interview: user already has an active session")
	ErrCourseNotFound = errors.New("interview: course not found")
	ErrNoQuestions    = errors.New("interview: no questions available for this course")
	ErrNotEditable    = errors.New("interview: session is not in progress")
	ErrQuestionNotIn  = errors.New("interview: question is not part of this session")
	ErrNoResults      = errors.New("interview: no answers to evaluate")
)

// Service is the interview engine (docs/interview/004). The evaluator may be nil
// (no OpenAI key) — evaluation then degrades to a failed placeholder.
type Service struct {
	repo      Repository
	content   ContentReader
	evaluator Evaluator
}

func NewService(repo Repository, content ContentReader, evaluator Evaluator) *Service {
	return &Service{repo: repo, content: content, evaluator: evaluator}
}

// Start creates a session, snapshots the chosen questions, and returns the first
// question (docs/interview/004).
func (s *Service) Start(ctx context.Context, userID string, req CreateInterviewRequest) (SessionView, error) {
	if _, active, err := s.repo.FindActiveByUser(ctx, userID); err != nil {
		return SessionView{}, err
	} else if active {
		return SessionView{}, ErrActiveSession
	}

	c, err := s.content.FindCourseBySlug(ctx, req.CourseSlug)
	if err != nil {
		return SessionView{}, ErrCourseNotFound
	}

	all, err := s.content.FindQuestionsByCourse(ctx, c.ID)
	if err != nil {
		return SessionView{}, err
	}

	pool := filterByDifficulty(all, req.Difficulty)
	if len(pool) == 0 {
		// Until the bank is tagged, easy/hard may be empty — fall back to the
		// whole course so interviews still work (docs/interview/004).
		pool = all
	}
	if len(pool) == 0 {
		return SessionView{}, ErrNoQuestions
	}

	chosen := pickQuestions(pool, req.QuestionCount)

	session := &Session{
		UserID:        userID,
		CourseID:      c.ID,
		Difficulty:    req.Difficulty,
		Language:      req.Language,
		Status:        StatusInProgress,
		QuestionCount: len(chosen),
		QuestionIDs:   idsOf(chosen),
		CurrentIndex:  0,
		StartedAt:     time.Now(),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return SessionView{}, err
	}

	first := questionView(&chosen[0], 0, req.Language)

	return SessionView{Session: *session, History: []ChatTurn{}, Current: &first}, nil
}

// Get rebuilds the resume payload: the answered turns plus the current question
// (docs/interview/012).
func (s *Service) Get(ctx context.Context, userID, id string) (SessionView, error) {
	session, err := s.load(ctx, userID, id)
	if err != nil {
		return SessionView{}, err
	}

	results, err := s.repo.FindResults(ctx, id)
	if err != nil {
		return SessionView{}, err
	}
	byQuestion := indexResults(results)

	history := make([]ChatTurn, 0, len(session.QuestionIDs))
	var current *QuestionView

	for i, qid := range session.QuestionIDs {
		q, err := s.content.FindQuestionByIDWithTranslations(ctx, qid)
		if err != nil {
			continue
		}
		view := questionView(&q, i, session.Language)

		if res, ok := byQuestion[qid]; ok {
			history = append(history, ChatTurn{Question: view, Result: res})
			continue
		}
		if current == nil {
			v := view
			current = &v
		}
	}

	finished := current == nil

	return SessionView{Session: session, History: history, Current: current, Finished: finished}, nil
}

// SubmitAnswer saves one answer, evaluates it (unless skipped), and returns the
// evaluation plus the next question (docs/interview/004).
func (s *Service) SubmitAnswer(ctx context.Context, userID, id, questionID string, req SubmitAnswerRequest) (SubmitAnswerResponse, error) {
	session, err := s.load(ctx, userID, id)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}
	if session.Status != StatusInProgress {
		return SubmitAnswerResponse{}, ErrNotEditable
	}

	idx := indexOf(session.QuestionIDs, questionID)
	if idx < 0 {
		return SubmitAnswerResponse{}, ErrQuestionNotIn
	}

	q, err := s.content.FindQuestionByIDWithTranslations(ctx, questionID)
	if err != nil {
		return SubmitAnswerResponse{}, ErrQuestionNotIn
	}
	qText, idealAnswer, module := translate(&q, session.Language)

	result := s.evaluateAnswer(ctx, &session, module, qText, idealAnswer, questionID, req)
	if err := s.repo.UpsertResult(ctx, &result); err != nil {
		return SubmitAnswerResponse{}, err
	}

	if idx+1 > session.CurrentIndex {
		session.CurrentIndex = idx + 1
		if err := s.repo.UpdateSession(ctx, &session); err != nil {
			return SubmitAnswerResponse{}, err
		}
	}

	resp := SubmitAnswerResponse{Result: result}
	if session.CurrentIndex < len(session.QuestionIDs) {
		nextID := session.QuestionIDs[session.CurrentIndex]
		if nq, err := s.content.FindQuestionByIDWithTranslations(ctx, nextID); err == nil {
			nv := questionView(&nq, session.CurrentIndex, session.Language)
			resp.Next = &nv
		}
	} else {
		resp.Finished = true
	}

	return resp, nil
}

// evaluateAnswer builds a QuestionResult, calling the AI unless the answer is
// skipped. A nil evaluator or an AI failure degrades to a failed placeholder
// (docs/interview/006).
func (s *Service) evaluateAnswer(ctx context.Context, session *Session, topic, question, ideal, questionID string, req SubmitAnswerRequest) QuestionResult {
	result := QuestionResult{
		InterviewID: session.ID,
		QuestionID:  questionID,
		UserAnswer:  req.Answer,
		Skipped:     req.Skipped,
		EvalVersion: SchemaVersion,
		Strengths:   StringList{},
		Weaknesses:  StringList{},
	}

	if req.Skipped || strings.TrimSpace(req.Answer) == "" {
		result.Skipped = true
		result.EvalStatus = EvalOK
		result.Feedback = skippedFeedback(session.Language)

		return result
	}

	if s.evaluator == nil {
		return degraded(&result, session.Language)
	}

	eval, err := s.evaluator.Evaluate(ctx, &EvalInput{
		CourseTitle: topic,
		Difficulty:  session.Difficulty,
		Language:    session.Language,
		Question:    question,
		Answer:      req.Answer,
		IdealAnswer: ideal,
	})
	if err != nil {
		return degraded(&result, session.Language)
	}

	result.EvalStatus = EvalOK
	result.Score = eval.Score
	result.Correctness = eval.Correctness
	result.Depth = eval.Depth
	result.Communication = eval.Communication
	result.Structure = eval.Structure
	result.Confidence = eval.Confidence
	result.Feedback = eval.Feedback
	result.Strengths = eval.Strengths
	result.Weaknesses = eval.Weaknesses

	return result
}

// Complete aggregates the per-answer results into a final report (docs/004/009).
// It calls no AI. Idempotent: re-completing returns the existing report.
func (s *Service) Complete(ctx context.Context, userID, id string) (ReportView, error) {
	session, err := s.load(ctx, userID, id)
	if err != nil {
		return ReportView{}, err
	}

	results, err := s.repo.FindResults(ctx, id)
	if err != nil {
		return ReportView{}, err
	}
	if len(results) == 0 {
		return ReportView{}, ErrNoResults
	}

	report := aggregate(&session, results)
	if err := s.repo.SaveReport(ctx, &report); err != nil {
		return ReportView{}, err
	}

	if session.Status != StatusCompleted {
		now := time.Now()
		score := report.OverallScore
		session.Status = StatusCompleted
		session.OverallScore = &score
		session.CompletedAt = &now
		if err := s.repo.UpdateSession(ctx, &session); err != nil {
			return ReportView{}, err
		}
	}

	review, err := s.buildReview(ctx, &session, results)
	if err != nil {
		return ReportView{}, err
	}

	return ReportView{Report: report, Session: session, Review: review}, nil
}

// Report returns a completed interview's report + review (docs/interview/011).
func (s *Service) Report(ctx context.Context, userID, id string) (ReportView, error) {
	session, err := s.load(ctx, userID, id)
	if err != nil {
		return ReportView{}, err
	}

	report, err := s.repo.FindReport(ctx, id)
	if err != nil {
		return ReportView{}, err
	}

	results, err := s.repo.FindResults(ctx, id)
	if err != nil {
		return ReportView{}, err
	}

	review, err := s.buildReview(ctx, &session, results)
	if err != nil {
		return ReportView{}, err
	}

	return ReportView{Report: report, Session: session, Review: review}, nil
}

// List returns the caller's interview history (docs/interview/011).
func (s *Service) List(ctx context.Context, userID string, q shared.PaginationQuery) (shared.PaginatedResult[Session], error) {
	q.Normalize()

	return s.repo.ListByUser(ctx, userID, q)
}

func (s *Service) buildReview(ctx context.Context, session *Session, results []QuestionResult) ([]ReviewItem, error) {
	byQuestion := indexResults(results)
	items := make([]ReviewItem, 0, len(session.QuestionIDs))

	for i, qid := range session.QuestionIDs {
		res, ok := byQuestion[qid]
		if !ok {
			continue
		}
		q, err := s.content.FindQuestionByIDWithTranslations(ctx, qid)
		if err != nil {
			continue
		}
		qText, ideal, _ := translate(&q, session.Language)

		items = append(items, ReviewItem{
			QuestionID:  qid,
			Index:       i,
			Question:    qText,
			ModelAnswer: ideal,
			UserAnswer:  res.UserAnswer,
			Skipped:     res.Skipped,
			Score:       res.Score,
			Strengths:   res.Strengths,
			Weaknesses:  res.Weaknesses,
		})
	}

	return items, nil
}

// load fetches a session and enforces caller ownership (returns ErrNotFound to
// avoid leaking other users' session ids).
func (s *Service) load(ctx context.Context, userID, id string) (Session, error) {
	session, err := s.repo.FindSession(ctx, id)
	if err != nil {
		return Session{}, err
	}
	if session.UserID != userID {
		return Session{}, ErrNotFound
	}

	return session, nil
}

// ---- helpers ----

func filterByDifficulty(qs []course.Question, difficulty string) []course.Question {
	out := make([]course.Question, 0, len(qs))
	for i := range qs {
		if qs[i].Difficulty == difficulty {
			out = append(out, qs[i])
		}
	}

	return out
}

func pickQuestions(pool []course.Question, count int) []course.Question {
	shuffled := make([]course.Question, len(pool))
	copy(shuffled, pool)
	rand.Shuffle(len(shuffled), func(i, j int) { shuffled[i], shuffled[j] = shuffled[j], shuffled[i] })

	if count > len(shuffled) {
		count = len(shuffled)
	}

	return shuffled[:count]
}

func idsOf(qs []course.Question) StringList {
	ids := make(StringList, len(qs))
	for i := range qs {
		ids[i] = qs[i].ID
	}

	return ids
}

func indexOf(ids StringList, id string) int {
	for i, v := range ids {
		if v == id {
			return i
		}
	}

	return -1
}

func indexResults(results []QuestionResult) map[string]QuestionResult {
	m := make(map[string]QuestionResult, len(results))
	for i := range results {
		m[results[i].QuestionID] = results[i]
	}

	return m
}

// translate returns (question, idealAnswer, module) in the requested language,
// falling back to English then any available translation.
func translate(q *course.Question, lang string) (question, answer, module string) {
	var enQ, enA, anyQ, anyA string
	for i := range q.Translations {
		t := &q.Translations[i]
		if t.Lang == lang {
			return t.Question, t.Answer, q.Module
		}
		if t.Lang == LangEN {
			enQ, enA = t.Question, t.Answer
		}
		if anyQ == "" {
			anyQ, anyA = t.Question, t.Answer
		}
	}
	if enQ != "" {
		return enQ, enA, q.Module
	}

	return anyQ, anyA, q.Module
}

func questionView(q *course.Question, index int, lang string) QuestionView {
	text, ideal, module := translate(q, lang)

	return QuestionView{
		QuestionID:  q.ID,
		Index:       index,
		Module:      module,
		Question:    text,
		ModelAnswer: ideal,
	}
}
