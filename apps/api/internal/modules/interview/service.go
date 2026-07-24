package interview

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"strings"
	"time"

	"level-up-backend/internal/modules/course"
	"level-up-backend/internal/shared"
)

// Sentinel errors mapped to HTTP status by the handler.
var (
	ErrActiveSession    = errors.New("interview: user already has an active session")
	ErrCourseNotFound   = errors.New("interview: course not found")
	ErrNoQuestions      = errors.New("interview: no questions available for this course")
	ErrNotEditable      = errors.New("interview: session is not in progress")
	ErrQuestionNotIn    = errors.New("interview: question is not part of this session")
	ErrNoResults        = errors.New("interview: no answers to evaluate")
	ErrVoiceUnavailable = errors.New("interview: voice transcription unavailable")
)

// BadgeAwarder grants interview badges (completed-interview count + score) when a
// session completes, without depending on the badge package (badge.Service
// satisfies it). It returns the IDs newly earned this call so the results screen
// can celebrate them. Best-effort: a nil awarder or an error never blocks Complete.
type BadgeAwarder interface {
	AwardInterviewComplete(ctx context.Context, userID string, score, total int) ([]string, error)
}

// Service is the interview engine (docs/product/interview/004). The AI client may be nil
// (no OpenAI key) — evaluation then degrades to a failed placeholder, and question
// generation degrades to the raw bank text.
type Service struct {
	repo    Repository
	content ContentReader
	ai      AI
	badges  BadgeAwarder
}

func NewService(repo Repository, content ContentReader, ai AI, badges BadgeAwarder) *Service {
	return &Service{repo: repo, content: content, ai: ai, badges: badges}
}

// Start creates a session, snapshots the chosen questions, and returns the first
// question (docs/product/interview/004).
// resolveKind maps a request to its session kind and question-pick parameters. A
// placement (M3) is server-fixed — short and uniform (non-adaptive) for a broad
// first read — so the client can't tune its length or weighting; a regular
// interview honors the request's questionCount/adaptive.
func resolveKind(req *CreateInterviewRequest) (kind Kind, count int, adaptive bool) {
	if req.Kind == string(KindPlacement) {
		return KindPlacement, PlacementQuestionCount, false
	}

	return KindInterview, req.QuestionCount, req.Adaptive
}

func (s *Service) Start(ctx context.Context, userID, userName string, req *CreateInterviewRequest) (SessionView, error) {
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

	kind, count, adaptive := resolveKind(req)

	// The bank isn't tagged by difficulty (docs/004) — difficulty is applied as a
	// generation instruction to the AI instead of filtering the pool (ensureGenerated).
	//
	// Adaptive interviews weight the pick toward the user's weak modules in this
	// course (docs/product/interview/007); a nil map (non-adaptive, or no history)
	// falls back to a uniform pick.
	var moduleAvg map[string]float64
	if adaptive {
		if moduleAvg, err = s.repo.ModuleScoresByUserCourse(ctx, userID, c.ID); err != nil {
			return SessionView{}, err
		}
	}

	chosen := pickQuestions(all, count, moduleAvg)

	session := &Session{
		UserID:        userID,
		CourseID:      c.ID,
		Kind:          kind,
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

	first, err := s.ensureGenerated(ctx, session, 0, &chosen[0], nil, userName)
	if err != nil {
		return SessionView{}, err
	}

	return SessionView{Session: *session, History: []ChatTurn{}, Current: &first}, nil
}

// Get rebuilds the resume payload: the answered turns plus the current question
// (docs/product/interview/012).
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
// evaluation plus the next question (docs/product/interview/004).
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

	asked, err := s.ensureGenerated(ctx, &session, idx, &q, nil, "")
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
			if nv, err := s.ensureGenerated(ctx, &session, session.CurrentIndex, &nq, prev, ""); err == nil {
				resp.Next = &nv
			}
		}
	} else {
		resp.Finished = true
	}

	return resp, nil
}

// SubmitAnswerStream is the streaming sibling of SubmitAnswer (docs/product/ai-chat/006/010).
// Same checks and same persisted rows, but the next question is delivered over a
// StreamSink and answer evaluation is moved off the critical path:
//
//   - The answer is persisted immediately (a preliminary, un-scored row) and
//     currentIndex advanced, so a reconnect via GET /interviews/:id already shows
//     the turn as answered.
//   - For a mid-interview turn the evaluation runs in a background goroutine on a
//     detached context (it must finish even if the client disconnects — the score
//     feeds the Results screen), concurrently with generating the next question.
//   - For the final turn there is no next question to overlap with, so evaluation
//     runs inline before Done — guaranteeing the score is persisted before the
//     client can call complete (parity with the blocking path).
//
// Pre-stream failures (checks, and the synchronous answer/index writes) are returned
// as errors with the sink untouched, so the handler can still emit a normal JSON
// error. Once streaming begins, every outcome goes through the sink and the method
// returns nil.
func (s *Service) SubmitAnswerStream(ctx context.Context, userID, id, questionID string, req SubmitAnswerRequest, sink StreamSink) error {
	session, err := s.load(ctx, userID, id)
	if err != nil {
		return err
	}
	if session.Status != StatusInProgress {
		return ErrNotEditable
	}

	idx := indexOf(session.QuestionIDs, questionID)
	if idx < 0 {
		return ErrQuestionNotIn
	}

	q, err := s.content.FindQuestionByIDWithTranslations(ctx, questionID)
	if err != nil {
		return ErrQuestionNotIn
	}

	asked, err := s.ensureGenerated(ctx, &session, idx, &q, nil, "")
	if err != nil {
		return err
	}

	// Persist the answer immediately (un-scored for a real answer; complete for a
	// skip/empty), then advance the chat position. Committed before any streaming so
	// a reconnect sees the turn as answered.
	prelim := preliminaryResult(&session, questionID, req)
	if err := s.repo.UpsertResult(ctx, &prelim); err != nil {
		return err
	}

	if idx+1 > session.CurrentIndex {
		session.CurrentIndex = idx + 1
		if err := s.repo.UpdateSession(ctx, &session); err != nil {
			return err
		}
	}

	realAnswer := !prelim.Skipped
	finished := session.CurrentIndex >= len(session.QuestionIDs)

	// Observe the stream from here on (all sink use flows through the wrapper), so
	// one structured line records TTFT / delta count / outcome per turn (docs/product/ai-chat/011).
	sink = newObservedSink(sink, fmt.Sprintf("session=%s idx=%d", session.ID, session.CurrentIndex))

	if finished {
		// No next question to overlap generation with — evaluate inline so the
		// result is persisted before the client can call complete.
		if realAnswer {
			result := s.evaluateAnswer(ctx, &session, asked.Module, asked.Question, asked.ModelAnswer, questionID, req)
			if err := s.repo.UpsertResult(ctx, &result); err != nil {
				_ = sink.Fail(err, true)

				return nil
			}
		}
		_ = sink.Done(nil, true)

		return nil
	}

	// Mid-interview: grade in the background while we generate the next question.
	if realAnswer {
		s.evaluateInBackground(&session, asked.Module, asked.Question, asked.ModelAnswer, questionID, req)
	}

	nextID := session.QuestionIDs[session.CurrentIndex]
	nq, err := s.content.FindQuestionByIDWithTranslations(ctx, nextID)
	if err != nil {
		log.Printf("interview: stream next-question lookup failed (session %s): %v", session.ID, err)
		_ = sink.Fail(err, true)

		return nil
	}

	// PrevScore is -1: the real score is still being computed in the background, and
	// -1 tells the generator to omit the tone-calibration signal rather than imply a
	// 0 (a failed answer) — docs/product/ai-chat/008/010.
	prev := &prevTurn{Question: asked.Question, Answer: req.Answer, Skipped: req.Skipped, Score: -1}
	nv, err := s.ensureGeneratedStream(ctx, &session, session.CurrentIndex, &nq, prev, sink)
	if err != nil {
		log.Printf("interview: stream next-question generation failed (session %s): %v", session.ID, err)
		_ = sink.Fail(err, true)

		return nil
	}

	_ = sink.Done(&nv, false)

	return nil
}

// preliminaryResult is the answer persisted at submit time, before the AI score is
// known (docs/product/ai-chat/010). A skip/empty answer is fully resolved here (no AI).
// A real answer is stored in the existing "failed" degrade state so that IF the
// background evaluation never lands (e.g. process restart) the answer still counts
// and reads sensibly; the background eval upserts the real score over it.
func preliminaryResult(session *Session, questionID string, req SubmitAnswerRequest) QuestionResult {
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

	return degraded(&result, session.Language)
}

// evaluateInBackground grades one answer off the request's critical path. It runs
// on a detached context (context.Background, bounded by the AI client's own
// per-call timeout) so grading completes even if the client disconnects mid-turn —
// the score is needed for the Results screen regardless (docs/product/ai-chat/010). It
// snapshots the session so the goroutine never races the caller's later mutations
// of it. Best-effort: a failure leaves the preliminary degraded row in place.
func (s *Service) evaluateInBackground(session *Session, topic, question, ideal, questionID string, req SubmitAnswerRequest) {
	if s.ai == nil {
		return
	}

	snapshot := *session

	go func() {
		result := s.evaluateAnswer(context.Background(), &snapshot, topic, question, ideal, questionID, req)
		if err := s.repo.UpsertResult(context.Background(), &result); err != nil {
			log.Printf("interview: background eval upsert failed (session %s, question %s): %v", snapshot.ID, questionID, err)
		}
	}()
}

// evaluateAnswer builds a QuestionResult, calling the AI unless the answer is
// skipped. A nil evaluator or an AI failure degrades to a failed placeholder
// (docs/product/interview/006).
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

	firstCompletion := session.Status != StatusCompleted
	if firstCompletion {
		now := time.Now()
		score := report.OverallScore
		session.Status = StatusCompleted
		session.OverallScore = &score
		session.CompletedAt = &now
		if err := s.repo.UpdateSession(ctx, &session); err != nil {
			return ReportView{}, err
		}

		// Blend this result into the durable knowledge map (docs/product/interview/007).
		// Best-effort: a failure is logged, never fails the report.
		s.updateTopicProgress(ctx, &session, report.OverallScore)
	}

	review, err := s.buildReview(ctx, &session, results)
	if err != nil {
		return ReportView{}, err
	}

	// Award interview badges only on the first completion (count + score), so a
	// re-completion doesn't re-run awarding. Best-effort: never fail the report.
	var newBadges []string
	if firstCompletion && s.badges != nil {
		if total, _, _, _, err := s.repo.SummaryByUser(ctx, userID); err == nil {
			newBadges, _ = s.badges.AwardInterviewComplete(ctx, userID, report.OverallScore, total)
		}
	}

	return ReportView{Report: report, Session: session, Review: review, NewBadges: newBadges}, nil
}

// Report returns a completed interview's report + review (docs/product/interview/011).
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

// List returns the caller's interview history (docs/product/interview/011).
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

// Insights aggregates the user's evaluated answers into per-topic averages
// (weakest first) and an overall rubric with its weakest axis. Read-only over the
// per-question scores already captured on every interview (docs/product/interview/009).
func (s *Service) Insights(ctx context.Context, userID string) (InsightsView, error) {
	rows, err := s.repo.InsightTopicsByUser(ctx, userID)
	if err != nil {
		return InsightsView{}, err
	}

	view := InsightsView{Topics: make([]TopicInsightView, 0, len(rows))}

	var total int
	var sumC, sumD, sumComm, sumS float64
	for _, row := range rows {
		view.Topics = append(view.Topics, TopicInsightView{
			CourseSlug:  row.CourseSlug,
			CourseTitle: row.CourseTitle,
			Accent:      row.Accent,
			AvgScore:    int(math.Round(row.AvgScore)),
			Answered:    row.Answered,
		})

		// Weight each axis average by the topic's answer count so the overall
		// rubric is a true per-answer mean, not a mean of per-topic means.
		n := float64(row.Answered)
		total += row.Answered
		sumC += row.Correctness * n
		sumD += row.Depth * n
		sumComm += row.Communication * n
		sumS += row.Structure * n
	}

	view.TotalAnswered = total
	if total > 0 {
		f := float64(total)
		view.Rubric = RubricInsightView{
			Correctness:   int(math.Round(sumC / f)),
			Depth:         int(math.Round(sumD / f)),
			Communication: int(math.Round(sumComm / f)),
			Structure:     int(math.Round(sumS / f)),
		}
		view.Rubric.Weakest = weakestAxis(view.Rubric)
	}

	return view, nil
}

// weakestAxis returns the name of the lowest-scoring rubric axis (ties resolve to
// the earlier axis in the canonical order).
func weakestAxis(r RubricInsightView) string {
	axes := []struct {
		name  string
		value int
	}{
		{"correctness", r.Correctness},
		{"depth", r.Depth},
		{"communication", r.Communication},
		{"structure", r.Structure},
	}

	weakest := axes[0]
	for _, a := range axes[1:] {
		if a.value < weakest.value {
			weakest = a
		}
	}

	return weakest.name
}

// Transcribe converts a recorded voice answer to text, so the candidate can
// review/edit it in the composer before submitting like any typed answer
// (docs/product/interview/005). The transcript never touches grading directly — it's
// just text that lands in the same SubmitAnswerRequest.Answer field either way.
func (s *Service) Transcribe(ctx context.Context, audio io.Reader, filename, language string) (string, error) {
	if s.ai == nil {
		return "", ErrVoiceUnavailable
	}

	return s.ai.Transcribe(ctx, audio, filename, language)
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
// generation degrades to the bank's raw text (docs/product/interview/004) — same policy
// as answer evaluation.
func (s *Service) ensureGenerated(ctx context.Context, session *Session, idx int, q *course.Question, prev *prevTurn, userName string) (QuestionView, error) {
	if idx < len(session.Generated) {
		return generatedView(q, idx, session.Language, session.Generated[idx]), nil
	}

	view := questionView(q, idx, session.Language)
	if s.ai != nil {
		gen, err := s.ai.Generate(ctx, buildGenInput(session, q, prev))
		if err == nil {
			view.Question, view.ModelAnswer = gen.Question, gen.ModelAnswer
			view.Reaction = resolveReaction(gen.Reaction, prev, userName, session.Language)
		}
	}

	if err := s.cacheGenerated(ctx, session, &view); err != nil {
		return QuestionView{}, err
	}

	return view, nil
}

// ensureGeneratedStream is the streaming counterpart to ensureGenerated: for a
// not-yet-generated slot it streams the visible prose (reaction + question) to the
// sink as the model writes it, then caches and returns the canonical view. An
// already-cached slot returns without streaming (the caller's done frame carries
// it). A nil AI client or a generation failure degrades to the bank text and caches
// it exactly like ensureGenerated (docs/product/ai-chat/008/011); when a failure happens
// mid-stream the client's partial bubble is reconciled by the caller's done frame.
// Only used mid-interview, so prev is never nil (no greeting branch).
func (s *Service) ensureGeneratedStream(ctx context.Context, session *Session, idx int, q *course.Question, prev *prevTurn, sink StreamSink) (QuestionView, error) {
	if idx < len(session.Generated) {
		return generatedView(q, idx, session.Language, session.Generated[idx]), nil
	}

	view := questionView(q, idx, session.Language)
	if s.ai != nil {
		gen, err := s.ai.GenerateStream(ctx, buildGenInput(session, q, prev), func(delta string) {
			_ = sink.Delta(delta)
		})
		switch {
		case err == nil:
			view.Question, view.ModelAnswer = gen.Question, gen.ModelAnswer
			view.Reaction = resolveReaction(gen.Reaction, prev, "", session.Language)
		case ctx.Err() != nil:
			// Client disconnected / cancelled mid-generation — expected, not a fault.
			log.Printf("interview: stream generation cancelled (session %s idx %d): %v", session.ID, idx, ctx.Err())
		default:
			// Real generation failure — degrade to the raw bank text (docs/product/ai-chat/011).
			log.Printf("interview: stream generation degraded to bank text (session %s idx %d): %v", session.ID, idx, err)
		}
	}

	if err := s.cacheGenerated(ctx, session, &view); err != nil {
		return QuestionView{}, err
	}

	return view, nil
}

// buildGenInput assembles the AI generation input for a slot in the session's
// language, carrying the previous turn's context when present (shared by the
// blocking and streaming generation paths).
func buildGenInput(session *Session, q *course.Question, prev *prevTurn) *GenInput {
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

	return in
}

// resolveReaction picks the reaction actually shown, overriding the model for the
// two cases it isn't trusted on: the opening question (deterministic greeting) and a
// skipped previous answer (deterministic, judgment-free transition). Otherwise the
// model's reaction is used (docs/product/interview/004).
func resolveReaction(modelReaction string, prev *prevTurn, userName, lang string) string {
	switch {
	case prev == nil:
		return greeting(userName, lang)
	case prev.Skipped:
		return skippedReaction(lang)
	default:
		return modelReaction
	}
}

// cacheGenerated appends the freshly generated view to the session's parallel cache
// and persists it, so resume/review always show the exact text originally asked.
func (s *Service) cacheGenerated(ctx context.Context, session *Session, view *QuestionView) error {
	session.Generated = append(session.Generated, GeneratedQuestion{
		Reaction: view.Reaction, Question: view.Question, ModelAnswer: view.ModelAnswer,
	})

	return s.repo.UpdateSession(ctx, session)
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

// Adaptive-pick tuning (docs/product/interview/007). A question's weight is
// pickWeightFloor + (100 - moduleAvg): the floor keeps even a mastered module in
// play (variety), and the (100 - avg) term makes weaker modules proportionally more
// likely. A module the user hasn't answered gets pickWeightNeutral — mid-scale, so
// it's discoverable without dominating.
const (
	pickWeightFloor   = 30.0
	pickWeightNeutral = 80.0
)

// pickQuestions selects `count` distinct questions. With a nil/empty moduleAvg every
// question weighs the same, so it's a uniform random subset (the non-adaptive
// default). With per-module averages it's a weighted sample without replacement that
// leans toward weak modules while still mixing in the rest (docs/product/interview/007).
func pickQuestions(pool []course.Question, count int, moduleAvg map[string]float64) []course.Question {
	remaining := make([]course.Question, len(pool))
	copy(remaining, pool)

	if count > len(remaining) {
		count = len(remaining)
	}

	chosen := make([]course.Question, 0, count)
	for len(chosen) < count && len(remaining) > 0 {
		var total float64
		for i := range remaining {
			total += moduleWeight(remaining[i].Module, moduleAvg)
		}

		target := rand.Float64() * total //nolint:gosec // G404: non-crypto question shuffling, not security-sensitive
		pick := len(remaining) - 1
		for i := range remaining {
			target -= moduleWeight(remaining[i].Module, moduleAvg)
			if target <= 0 {
				pick = i
				break
			}
		}

		chosen = append(chosen, remaining[pick])
		remaining = append(remaining[:pick], remaining[pick+1:]...)
	}

	return chosen
}

// moduleWeight is a question's selection weight from its module's average score.
func moduleWeight(module string, moduleAvg map[string]float64) float64 {
	avg, ok := moduleAvg[module]
	if !ok {
		return pickWeightNeutral
	}

	return pickWeightFloor + (100 - avg)
}

// topicEMAAlpha weights the newest interview when blending into a topic's level. At
// 0.4 the level tracks recent results while still smoothing over history, so it
// evolves gradually rather than jumping on one interview (docs/product/interview/007).
const topicEMAAlpha = 0.4

// updateTopicProgress blends this interview's overall score into the durable
// per-(user, course) knowledge map with an exponential moving average
// (docs/product/interview/007). The first interview seeds the level directly; later
// ones move it toward the new score. Best-effort: a load/write error is logged and
// swallowed so it never fails Complete.
func (s *Service) updateTopicProgress(ctx context.Context, session *Session, score int) {
	prev, found, err := s.repo.FindTopicProgress(ctx, session.UserID, session.CourseID)
	if err != nil {
		log.Printf("interview: load topic progress: %v", err)
		return
	}

	now := time.Now()
	tp := TopicProgress{
		UserID:          session.UserID,
		CourseID:        session.CourseID,
		LastPracticedAt: &now,
	}

	if found {
		tp.ID = prev.ID
		tp.CreatedAt = prev.CreatedAt
		tp.Samples = prev.Samples + 1
		tp.Level = emaLevel(prev.Level, score)
		tp.LastImprovedAt = prev.LastImprovedAt
		if tp.Level > prev.Level {
			tp.LastImprovedAt = &now
		}
	} else {
		tp.Samples = 1
		tp.Level = score
		tp.LastImprovedAt = &now
	}

	tp.Confidence = confidenceFor(tp.Samples)

	if err := s.repo.UpsertTopicProgress(ctx, &tp); err != nil {
		log.Printf("interview: upsert topic progress: %v", err)
	}
}

func emaLevel(prev, score int) int {
	return int(math.Round(topicEMAAlpha*float64(score) + (1-topicEMAAlpha)*float64(prev)))
}

// confidenceFor grows with the number of interviews that fed a topic's level.
func confidenceFor(samples int) string {
	switch {
	case samples >= 4:
		return ConfidenceHigh
	case samples >= 2:
		return ConfidenceMedium
	default:
		return ConfidenceLow
	}
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
