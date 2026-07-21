package interview

import (
	"bytes"
	"context"
	"errors"
	"io"
	"strings"
	"sync"
	"testing"
	"time"

	"level-up-backend/internal/modules/course"
	"level-up-backend/internal/shared"
)

// ---- SSE frame format ----

func TestWriteSSEEvent(t *testing.T) {
	var buf bytes.Buffer
	if err := writeSSEEvent(&buf, sseEventDone, streamDonePayload{Finished: true}); err != nil {
		t.Fatalf("writeSSEEvent: %v", err)
	}

	got := buf.String()
	if !strings.HasPrefix(got, "event: done\n") {
		t.Errorf("frame must start with the event line, got %q", got)
	}
	if !strings.Contains(got, `data: {"next":null,"finished":true}`) {
		t.Errorf("frame must carry the JSON payload on a data line, got %q", got)
	}
	if !strings.HasSuffix(got, "\n\n") {
		t.Errorf("frame must end with a blank line, got %q", got)
	}
}

// ---- preliminaryResult ----

func TestPreliminaryResult(t *testing.T) {
	session := &Session{Language: LangEN}
	session.ID = "s1"

	t.Run("skipped is fully resolved without AI", func(t *testing.T) {
		r := preliminaryResult(session, "q1", SubmitAnswerRequest{Skipped: true})
		if !r.Skipped || r.EvalStatus != EvalOK {
			t.Errorf("skipped answer must be resolved EvalOK, got skipped=%v status=%v", r.Skipped, r.EvalStatus)
		}
		if r.Feedback == "" {
			t.Errorf("skipped answer must carry the skip feedback")
		}
	})

	t.Run("empty answer is treated as skipped", func(t *testing.T) {
		r := preliminaryResult(session, "q1", SubmitAnswerRequest{Answer: "   "})
		if !r.Skipped || r.EvalStatus != EvalOK {
			t.Errorf("empty answer must resolve as skipped, got skipped=%v status=%v", r.Skipped, r.EvalStatus)
		}
	})

	t.Run("real answer is stored in the degrade state until graded", func(t *testing.T) {
		r := preliminaryResult(session, "q1", SubmitAnswerRequest{Answer: "a real answer"})
		if r.Skipped {
			t.Errorf("real answer must not be marked skipped")
		}
		if r.EvalStatus != EvalFailed {
			t.Errorf("preliminary real answer must sit in the failed/degrade state, got %v", r.EvalStatus)
		}
		if r.UserAnswer != "a real answer" {
			t.Errorf("preliminary must persist the answer text, got %q", r.UserAnswer)
		}
		if r.Score != 0 {
			t.Errorf("preliminary score must be 0 before grading, got %d", r.Score)
		}
	})
}

// ---- SubmitAnswerStream ----

func TestSubmitAnswerStreamMidInterview(t *testing.T) {
	sess := twoQuestionSession()
	repo := newStubRepo(&sess)
	svc := NewService(repo, stubContent{}, stubAI{score: 77}, nil)
	sink := &fakeSink{}

	err := svc.SubmitAnswerStream(context.Background(), "user-1", "s1", "q0",
		SubmitAnswerRequest{Answer: "my answer"}, sink)
	if err != nil {
		t.Fatalf("SubmitAnswerStream: %v", err)
	}

	// The next question streams as visible-prose deltas, then a Done carrying the
	// canonical turn (docs/product/ai-chat/010).
	if len(sink.deltas) == 0 {
		t.Errorf("streaming path must emit visible deltas for the next question")
	}
	if joined := strings.Join(sink.deltas, ""); joined != "Nice.\n\nGen(Bank q1)" {
		t.Errorf("streamed prose must be reaction + question, got %q", joined)
	}
	if !sink.done || sink.failed || sink.finished {
		t.Fatalf("want a non-final Done, got done=%v failed=%v finished=%v", sink.done, sink.failed, sink.finished)
	}
	if sink.doneNext == nil || sink.doneNext.QuestionID != "q1" {
		t.Fatalf("Done must carry the next question q1, got %+v", sink.doneNext)
	}
	if sink.doneNext.Question != "Gen(Bank q1)" {
		t.Errorf("next question must be the generated text, got %q", sink.doneNext.Question)
	}

	// The answer was persisted immediately and the chat position advanced.
	if got := repo.session().CurrentIndex; got != 1 {
		t.Errorf("currentIndex must advance to 1, got %d", got)
	}
	prelim := repo.upsert(0) // first upsert = preliminary
	if prelim.EvalStatus != EvalFailed || prelim.UserAnswer != "my answer" {
		t.Errorf("first upsert must be the preliminary answer row, got %+v", prelim)
	}

	// The background evaluation lands the real score over the preliminary row.
	final := repo.waitForUpsert(t, 2, 2*time.Second)
	if final.EvalStatus != EvalOK || final.Score != 77 {
		t.Errorf("background eval must upsert the graded row, got status=%v score=%d", final.EvalStatus, final.Score)
	}
	if final.QuestionID != "q0" {
		t.Errorf("graded row must key the answered question q0, got %q", final.QuestionID)
	}
}

func TestSubmitAnswerStreamFinalQuestion(t *testing.T) {
	session := twoQuestionSession()
	session.CurrentIndex = 1 // answering the last question
	repo := newStubRepo(&session)
	svc := NewService(repo, stubContent{}, stubAI{score: 90}, nil)
	sink := &fakeSink{}

	err := svc.SubmitAnswerStream(context.Background(), "user-1", "s1", "q1",
		SubmitAnswerRequest{Answer: "final answer"}, sink)
	if err != nil {
		t.Fatalf("SubmitAnswerStream: %v", err)
	}

	if !sink.done || sink.doneNext != nil || !sink.finished {
		t.Fatalf("final question must Done(nil, finished=true), got next=%v finished=%v", sink.doneNext, sink.finished)
	}

	// On the final turn grading is inline, so the graded row is already persisted
	// (no background race with a later complete).
	final := repo.upsert(repo.count() - 1)
	if final.EvalStatus != EvalOK || final.Score != 90 {
		t.Errorf("final answer must be graded inline before Done, got status=%v score=%d", final.EvalStatus, final.Score)
	}
}

func TestSubmitAnswerStreamSkip(t *testing.T) {
	sess := twoQuestionSession()
	repo := newStubRepo(&sess)
	svc := NewService(repo, stubContent{}, stubAI{score: 77}, nil)
	sink := &fakeSink{}

	err := svc.SubmitAnswerStream(context.Background(), "user-1", "s1", "q0",
		SubmitAnswerRequest{Skipped: true}, sink)
	if err != nil {
		t.Fatalf("SubmitAnswerStream: %v", err)
	}

	if !sink.done || sink.doneNext == nil || sink.finished {
		t.Fatalf("skip mid-interview must still stream the next question, got %+v finished=%v", sink.doneNext, sink.finished)
	}
	// A skip is fully resolved by the single preliminary upsert — no grading call.
	if repo.count() != 1 {
		t.Errorf("skip must persist exactly one (preliminary, resolved) row, got %d upserts", repo.count())
	}
	if r := repo.upsert(0); r.EvalStatus != EvalOK || !r.Skipped {
		t.Errorf("skip row must be resolved EvalOK + skipped, got status=%v skipped=%v", r.EvalStatus, r.Skipped)
	}
}

func TestSubmitAnswerStreamRejectsOtherUsersSession(t *testing.T) {
	sess := twoQuestionSession() // owned by user-1
	repo := newStubRepo(&sess)
	svc := NewService(repo, stubContent{}, stubAI{score: 77}, nil)
	sink := &fakeSink{}

	err := svc.SubmitAnswerStream(context.Background(), "attacker", "s1", "q0",
		SubmitAnswerRequest{Answer: "x"}, sink)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("a non-owner must get ErrNotFound, got %v", err)
	}
	// A pre-stream error must leave the sink untouched so the handler can still
	// write a normal JSON error.
	if sink.done || sink.failed || len(sink.deltas) != 0 {
		t.Errorf("pre-stream error must not touch the sink, got done=%v failed=%v deltas=%d", sink.done, sink.failed, len(sink.deltas))
	}
	if repo.count() != 0 {
		t.Errorf("a rejected submit must persist nothing, got %d upserts", repo.count())
	}
}

// ---- fixtures & stubs ----

func twoQuestionSession() Session {
	s := Session{
		UserID:        "user-1",
		CourseID:      "course-1",
		Difficulty:    "medium",
		Language:      LangEN,
		Status:        StatusInProgress,
		QuestionCount: 2,
		QuestionIDs:   StringList{"q0", "q1"},
		Generated:     GeneratedQuestions{{Question: "Generated Q0", ModelAnswer: "Model A0"}},
		CurrentIndex:  0,
	}
	s.ID = "s1"

	return s
}

// fakeSink records the events the service emits.
type fakeSink struct {
	deltas   []string
	done     bool
	doneNext *QuestionView
	finished bool
	failed   bool
}

func (f *fakeSink) Delta(text string) error { f.deltas = append(f.deltas, text); return nil }

func (f *fakeSink) Done(next *QuestionView, finished bool) error {
	f.done, f.doneNext, f.finished = true, next, finished

	return nil
}

func (f *fakeSink) Fail(_ error, _ bool) error { f.failed = true; return nil }

// stubRepo is an in-memory Repository recording every UpsertResult in order (a
// buffered channel so the caller never blocks, and the background goroutine's
// write can be awaited).
type stubRepo struct {
	mu       sync.Mutex
	sess     Session
	upserts  []QuestionResult
	upsertCh chan QuestionResult
}

func newStubRepo(s *Session) *stubRepo {
	return &stubRepo{sess: *s, upsertCh: make(chan QuestionResult, 8)}
}

func (r *stubRepo) FindSession(_ context.Context, _ string) (Session, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	return r.sess, nil
}

func (r *stubRepo) UpdateSession(_ context.Context, s *Session) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sess = *s

	return nil
}

func (r *stubRepo) UpsertResult(_ context.Context, res *QuestionResult) error {
	r.mu.Lock()
	r.upserts = append(r.upserts, *res)
	r.mu.Unlock()
	r.upsertCh <- *res

	return nil
}

func (r *stubRepo) session() Session {
	r.mu.Lock()
	defer r.mu.Unlock()

	return r.sess
}

func (r *stubRepo) count() int {
	r.mu.Lock()
	defer r.mu.Unlock()

	return len(r.upserts)
}

// upsert returns the i-th recorded upsert (0-based). Caller must know it exists.
func (r *stubRepo) upsert(i int) QuestionResult {
	r.mu.Lock()
	defer r.mu.Unlock()

	return r.upserts[i]
}

// waitForUpsert blocks until at least n upserts have been recorded (n is 1-based),
// returning the n-th, or fails the test on timeout — used to await the background
// evaluation's write.
func (r *stubRepo) waitForUpsert(t *testing.T, n int, timeout time.Duration) QuestionResult {
	t.Helper()
	deadline := time.After(timeout)
	for {
		if r.count() >= n {
			return r.upsert(n - 1)
		}
		select {
		case <-r.upsertCh:
		case <-deadline:
			t.Fatalf("timed out waiting for upsert #%d (have %d)", n, r.count())
		}
	}
}

// Unused Repository methods (SubmitAnswerStream doesn't touch them).
func (*stubRepo) CreateSession(context.Context, *Session) error { return nil }

func (*stubRepo) FindActiveByUser(context.Context, string) (Session, bool, error) {
	return Session{}, false, nil
}
func (*stubRepo) FindResults(context.Context, string) ([]QuestionResult, error) { return nil, nil }
func (*stubRepo) SaveReport(context.Context, *FinalReport) error                { return nil }
func (*stubRepo) FindReport(context.Context, string) (FinalReport, error) {
	return FinalReport{}, ErrNotFound
}

func (*stubRepo) ListByUser(context.Context, string, shared.PaginationQuery) (shared.PaginatedResult[Session], error) {
	return shared.PaginatedResult[Session]{}, nil
}

func (*stubRepo) SummaryByUser(context.Context, string) (total int, avgScore, bestScore float64, lastCompleted *Session, err error) {
	return 0, 0, 0, nil, nil
}

// stubContent serves synthetic bank questions with an English translation.
type stubContent struct{}

func (stubContent) FindQuestionByIDWithTranslations(_ context.Context, id string) (course.Question, error) {
	return course.Question{
		ID:     id,
		Module: "module-x",
		Translations: []course.QuestionTranslation{
			{Lang: LangEN, Question: "Bank " + id, Answer: "Bank answer " + id},
		},
	}, nil
}

func (stubContent) FindCourseBySlug(context.Context, string) (course.Course, error) {
	return course.Course{}, nil
}

func (stubContent) FindQuestionsByCourse(context.Context, string) ([]course.Question, error) {
	return nil, nil
}

// stubAI returns deterministic generation + a fixed evaluation score.
type stubAI struct{ score int }

func (stubAI) Generate(_ context.Context, in *GenInput) (GenResult, error) {
	return GenResult{Reaction: "Nice.", Question: "Gen(" + in.RefQuestion + ")", ModelAnswer: "Model for " + in.RefQuestion}, nil
}

func (stubAI) GenerateStream(_ context.Context, in *GenInput, onVisible func(string)) (GenResult, error) {
	res := GenResult{Reaction: "Nice.", Question: "Gen(" + in.RefQuestion + ")", ModelAnswer: "Model for " + in.RefQuestion}
	// Emit the visible prose in two chunks to exercise the delta path.
	onVisible(res.Reaction + "\n\n")
	onVisible(res.Question)

	return res, nil
}

func (a stubAI) Evaluate(_ context.Context, _ *EvalInput) (EvalResult, error) {
	return EvalResult{
		Version: SchemaVersion, Score: a.score,
		Correctness: a.score, Depth: a.score, Communication: a.score, Structure: a.score,
		Feedback: "graded", Strengths: []string{}, Weaknesses: []string{},
	}, nil
}

func (stubAI) Transcribe(context.Context, io.Reader, string, string) (string, error) {
	return "", nil
}
