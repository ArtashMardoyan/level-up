package interview

import (
	"context"
	"errors"
	"math"
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

// Service is the interview engine (docs/interview/004). The AI client may be nil
// (no OpenAI key) — evaluation then degrades to a failed placeholder, and question
// generation degrades to the raw bank text.
type Service struct {
	repo    Repository
	content ContentReader
	ai      AI
}

func NewService(repo Repository, content ContentReader, ai AI) *Service {
	return &Service{repo: repo, content: content, ai: ai}
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
	if len(all) == 0 {
		return SessionView{}, ErrNoQuestions
	}

	// The bank isn't tagged by difficulty (docs/004) — difficulty is applied as a
	// generation instruction to the AI instead of filtering the pool (ensureGenerated).
	chosen := pickQuestions(all, req.QuestionCount)

	session := &Session{
		UserID:        userID,
		CourseID:      c.ID,
		Difficulty:    req.Difficulty,
		Language:      req.Language,
		Status:        StatusInProgress,
		QuestionCount: len(chosen),
		QuestionIDs:   idsOf(chosen),
		Generated:     GeneratedQuestions{},
		CurrentIndex:  0,
		StartedAt:     time.Now(),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return SessionView{}, err
	}

	first, err := s.ensureGenerated(ctx, session, 0, &chosen[0], nil)
	if err != nil {
		return SessionView{}, err
	}

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
		view := cachedView(&q, i, session.Language, session.Generated)

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

	asked, err := s.ensureGenerated(ctx, &session, idx, &q, nil)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	result := s.evaluateAnswer(ctx, &session, asked.Module, asked.Question, asked.ModelAnswer, questionID, req)
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
		prev := &prevTurn{Question: asked.Question, Answer: req.Answer, Skipped: req.Skipped, Score: result.Score}
		if nq, err := s.content.FindQuestionByIDWithTranslations(ctx, nextID); err == nil {
			if nv, err := s.ensureGenerated(ctx, &session, session.CurrentIndex, &nq, prev); err == nil {
				resp.Next = &nv
			}
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

	if s.ai == nil {
		return degraded(&result, session.Language)
	}

	eval, err := s.ai.Evaluate(ctx, &EvalInput{
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

// Summary aggregates the user's completed interviews for the profile page.
func (s *Service) Summary(ctx context.Context, userID string) (SummaryView, error) {
	total, avg, best, last, err := s.repo.SummaryByUser(ctx, userID)
	if err != nil {
		return SummaryView{}, err
	}

	view := SummaryView{
		TotalCompleted: total,
		AvgScore:       int(math.Round(avg)),
		BestScore:      int(math.Round(best)),
	}

	if last != nil {
		view.LastSession = &LastSessionView{
			ID:           last.ID,
			CourseID:     last.CourseID,
			Difficulty:   last.Difficulty,
			Language:     last.Language,
			OverallScore: *last.OverallScore,
			CompletedAt:  *last.CompletedAt,
		}
	}

	return view, nil
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
		view := cachedView(&q, i, session.Language, session.Generated)

		items = append(items, ReviewItem{
			QuestionID:  qid,
			Index:       i,
			Question:    view.Question,
			ModelAnswer: view.ModelAnswer,
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

// prevTurn is the previous turn's context, passed to ensureGenerated so the AI
// can write a natural transition into the new question. nil for the interview's
// first question, where there is no previous turn.
type prevTurn struct {
	Question string
	Answer   string
	Skipped  bool
	Score    int
}

// ensureGenerated returns slot idx's question view, generating (and permanently
// caching on the session) its AI paraphrase the first time this slot is shown.
// Already-cached slots are a pure read, so calling this again for the current
// question (e.g. on submit) never re-triggers the AI. A nil AI client or a failed
// generation degrades to the bank's raw text (docs/interview/004) — same policy
// as answer evaluation.
func (s *Service) ensureGenerated(ctx context.Context, session *Session, idx int, q *course.Question, prev *prevTurn) (QuestionView, error) {
	if idx < len(session.Generated) {
		return generatedView(q, idx, session.Language, session.Generated[idx]), nil
	}

	view := questionView(q, idx, session.Language)
	if s.ai != nil {
		refQ, refA, module := translate(q, session.Language)
		in := &GenInput{
			CourseTitle: module,
			Difficulty:  session.Difficulty,
			Language:    session.Language,
			Module:      module,
			RefQuestion: refQ,
			RefAnswer:   refA,
		}
		if prev != nil {
			in.PrevQuestion, in.PrevAnswer, in.PrevSkipped, in.PrevScore = prev.Question, prev.Answer, prev.Skipped, prev.Score
		}

		gen, err := s.ai.Generate(ctx, in)
		if err == nil {
			view.Question, view.ModelAnswer = gen.Question, gen.ModelAnswer
			switch {
			case prev == nil:
				// No previous turn to react to — force-empty rather than trust the
				// model's judgment, since it sometimes invents one anyway despite
				// the prompt instruction.
				view.Reaction = ""
			case prev.Skipped:
				// The model isn't reliable about honoring a skip either (it has
				// reacted as if a real answer was given) — use a deterministic,
				// judgment-free transition instead of trusting its output.
				view.Reaction = skippedReaction(session.Language)
			default:
				view.Reaction = gen.Reaction
			}
		}
	}

	session.Generated = append(session.Generated, GeneratedQuestion{
		Reaction: view.Reaction, Question: view.Question, ModelAnswer: view.ModelAnswer,
	})
	if err := s.repo.UpdateSession(ctx, session); err != nil {
		return QuestionView{}, err
	}

	return view, nil
}

// cachedView is the read-only counterpart used on resume/review: never calls the
// AI or writes, it just returns the cached paraphrase if the slot already has one.
func cachedView(q *course.Question, idx int, lang string, cache GeneratedQuestions) QuestionView {
	if idx < len(cache) {
		return generatedView(q, idx, lang, cache[idx])
	}

	return questionView(q, idx, lang)
}

func generatedView(q *course.Question, idx int, lang string, g GeneratedQuestion) QuestionView {
	_, _, module := translate(q, lang)

	return QuestionView{
		QuestionID: q.ID, Index: idx, Module: module, Reaction: g.Reaction, Question: g.Question, ModelAnswer: g.ModelAnswer,
	}
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
