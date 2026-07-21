package interview

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// StreamSink receives a streamed interview turn: zero or more prose Deltas, then
// exactly one terminal Done (the next question, or finished) or Fail. The service
// depends only on this interface, not the wire format, so a WebSocket sink can
// implement it later without touching the engine (docs/product/ai-chat/006).
//
// Phase 2 emits no Deltas — the next question is still produced by the blocking
// Generate and delivered whole in Done. Token-by-token Deltas arrive in Phase 4
// (docs/product/ai-chat/008/012).
type StreamSink interface {
	// Delta streams one chunk of user-visible question prose.
	Delta(text string) error
	// Done is the terminal success event: the next question, or finished=true when
	// the interview has no more questions (next is nil in that case).
	Done(next *QuestionView, finished bool) error
	// Fail is the terminal error event. recoverable tells the client whether a
	// re-fetch (GET /interviews/:id) can recover the turn (docs/product/ai-chat/011).
	Fail(cause error, recoverable bool) error
}

// SSE event names (docs/product/ai-chat/005).
const (
	sseEventDelta = "delta"
	sseEventDone  = "done"
	sseEventError = "error"
)

type streamDeltaPayload struct {
	Text string `json:"text"`
}

type streamDonePayload struct {
	Next     *QuestionView `json:"next"`
	Finished bool          `json:"finished"`
}

type streamErrorPayload struct {
	Message     string `json:"message"`
	Recoverable bool   `json:"recoverable"`
}

// writeSSEEvent formats one Server-Sent Event frame (`event:`/`data:` + a blank
// line) with a JSON data payload and writes it to w. Split out from the sink so
// the frame format is unit-testable without a live HTTP response.
func writeSSEEvent(w io.Writer, name string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = fmt.Fprintf(w, "event: %s\ndata: %s\n\n", name, data)

	return err
}

// sseSink writes StreamSink events as SSE frames over a gin response, flushing
// after each so the client renders them as they arrive. Headers are written
// lazily on the first event: until then the handler can still return a normal
// JSON error (pre-stream failures — docs/product/ai-chat/006/011).
type sseSink struct {
	c       *gin.Context
	started bool
}

func newSSESink(c *gin.Context) *sseSink {
	return &sseSink{c: c}
}

// start commits the SSE response headers + 200 status on the first event only.
func (s *sseSink) start() {
	if s.started {
		return
	}
	s.started = true

	h := s.c.Writer.Header()
	h.Set("Content-Type", "text/event-stream")
	h.Set("Cache-Control", "no-cache")
	h.Set("Connection", "keep-alive")
	// Ask any intermediary proxy (nginx / App Runner front) not to buffer, so
	// frames flush promptly (docs/product/ai-chat/005/013 — verify on the real service).
	h.Set("X-Accel-Buffering", "no")

	s.c.Writer.WriteHeader(http.StatusOK)
	s.c.Writer.Flush()
}

func (s *sseSink) event(name string, payload any) error {
	s.start()

	if err := writeSSEEvent(s.c.Writer, name, payload); err != nil {
		return err
	}
	s.c.Writer.Flush()

	return nil
}

func (s *sseSink) Delta(text string) error {
	return s.event(sseEventDelta, streamDeltaPayload{Text: text})
}

func (s *sseSink) Done(next *QuestionView, finished bool) error {
	return s.event(sseEventDone, streamDonePayload{Next: next, Finished: finished})
}

func (s *sseSink) Fail(_ error, recoverable bool) error {
	// The cause is logged by the caller; the wire message stays generic so no
	// internal detail leaks (same policy as shared.Error copy).
	return s.event(sseEventError, streamErrorPayload{Message: "something went wrong", Recoverable: recoverable})
}

// observedSink decorates a StreamSink to record one turn's streaming metrics —
// time-to-first-token, delta count, total duration, and terminal outcome — logged
// as a single structured line when the turn ends (docs/product/ai-chat/011). These are the
// signals that tell us whether streaming is healthy in prod (e.g. TTFT under App
// Runner, and how often turns degrade vs. stream cleanly — docs/product/ai-chat/013 B1).
type observedSink struct {
	inner   StreamSink
	label   string
	start   time.Time
	firstAt time.Time
	deltas  int
}

func newObservedSink(inner StreamSink, label string) *observedSink {
	return &observedSink{inner: inner, label: label, start: time.Now()}
}

func (o *observedSink) Delta(text string) error {
	if o.deltas == 0 {
		o.firstAt = time.Now()
	}
	o.deltas++

	return o.inner.Delta(text)
}

func (o *observedSink) Done(next *QuestionView, finished bool) error {
	o.report("done", finished, nil)

	return o.inner.Done(next, finished)
}

func (o *observedSink) Fail(cause error, recoverable bool) error {
	o.report("fail", false, cause)

	return o.inner.Fail(cause, recoverable)
}

func (o *observedSink) report(outcome string, finished bool, cause error) {
	var ttft time.Duration
	if !o.firstAt.IsZero() {
		ttft = o.firstAt.Sub(o.start)
	}

	log.Printf(
		"interview stream %s: outcome=%s deltas=%d ttft=%dms total=%dms finished=%v cause=%v",
		o.label, outcome, o.deltas, ttft.Milliseconds(), time.Since(o.start).Milliseconds(), finished, cause,
	)
}
