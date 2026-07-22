package interview

import (
	"strings"
	"testing"
)

func TestParseGenStream(t *testing.T) {
	tests := []struct {
		name         string
		content      string
		wantErr      bool
		wantReaction string
		wantQuestion string
		wantAnswer   string
	}{
		{
			name:         "valid with reaction",
			content:      "Nice point on caching.\n" + genSepQuestion + "\nHow would you invalidate it?\n" + genSepAnswer + "\nUse a TTL and versioned keys.",
			wantReaction: "Nice point on caching.",
			wantQuestion: "How would you invalidate it?",
			wantAnswer:   "Use a TTL and versioned keys.",
		},
		{
			name:         "valid empty reaction (opening question)",
			content:      genSepQuestion + "\nWhat is a closure?\n" + genSepAnswer + "\nA function plus its captured scope.",
			wantReaction: "",
			wantQuestion: "What is a closure?",
			wantAnswer:   "A function plus its captured scope.",
		},
		{
			name:    "missing question separator",
			content: "just some prose without markers",
			wantErr: true,
		},
		{
			name:    "missing answer separator",
			content: genSepQuestion + "\nA question with no answer section",
			wantErr: true,
		},
		{
			name:    "empty question",
			content: genSepQuestion + "\n   \n" + genSepAnswer + "\nan answer",
			wantErr: true,
		},
		{
			name:    "empty answer",
			content: genSepQuestion + "\na question\n" + genSepAnswer + "\n  ",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseGenStream(tt.content)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got none")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Reaction != tt.wantReaction || got.Question != tt.wantQuestion || got.ModelAnswer != tt.wantAnswer {
				t.Errorf("got %+v, want reaction=%q question=%q answer=%q", got, tt.wantReaction, tt.wantQuestion, tt.wantAnswer)
			}
		})
	}
}

// TestGenVisibleStreaming feeds raw generation text one byte at a time — the worst
// case for sentinel boundaries split across chunks — and asserts the emitted deltas
// (a) only ever grow the visible prefix (never emit a partial separator or retract),
// and (b) sum to exactly the final reaction + question prose (docs/product/ai-chat/008).
func TestGenVisibleStreaming(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{
			name: "reaction + long question",
			raw:  "Good, you covered statelessness.\n" + genSepQuestion + "\nHow would you design idempotent write endpoints for a payments API?\n" + genSepAnswer + "\nUse an idempotency key stored server-side.",
			want: "Good, you covered statelessness.\n\nHow would you design idempotent write endpoints for a payments API?",
		},
		{
			name: "empty reaction",
			raw:  genSepQuestion + "\nExplain event loop phases in Node.js and where microtasks run.\n" + genSepAnswer + "\nTimers, pending, poll, check, close; microtasks between phases.",
			want: "Explain event loop phases in Node.js and where microtasks run.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var emittedBuf strings.Builder
			emitted := 0

			for i := 1; i <= len(tt.raw); i++ {
				vis := genVisible(tt.raw[:i], false)
				if len(vis) < emitted {
					t.Fatalf("visible prefix shrank at byte %d: had %d, now %d", i, emitted, len(vis))
				}
				if !strings.HasPrefix(tt.want, vis) {
					t.Fatalf("emitted a non-prefix of the final prose at byte %d: %q", i, vis)
				}
				if len(vis) > emitted {
					emittedBuf.WriteString(vis[emitted:])
					emitted = len(vis)
				}
			}

			// Final flush releases any tail withheld by the holdback.
			finalVis := genVisible(tt.raw, true)
			if len(finalVis) > emitted {
				emittedBuf.WriteString(finalVis[emitted:])
			}

			if emittedBuf.String() != tt.want {
				t.Errorf("streamed prose = %q, want %q", emittedBuf.String(), tt.want)
			}
		})
	}
}

func TestParseEval(t *testing.T) {
	tests := []struct {
		name    string
		content string
		wantErr bool
	}{
		{
			name:    "valid",
			content: `{"version":"2.0","score":84,"correctness":88,"depth":80,"communication":82,"structure":85,"confidence":"high","feedback":"Good answer.","strengths":["clear"],"weaknesses":["shallow"]}`,
		},
		{
			name:    "valid with code fence trimmed to raw",
			content: "  {\"score\":50,\"correctness\":50,\"depth\":50,\"communication\":50,\"structure\":50,\"feedback\":\"ok\",\"strengths\":[],\"weaknesses\":[]}  ",
		},
		{
			name:    "invalid json",
			content: `not json`,
			wantErr: true,
		},
		{
			name:    "score out of range",
			content: `{"score":140,"correctness":50,"depth":50,"communication":50,"structure":50,"feedback":"x"}`,
			wantErr: true,
		},
		{
			name:    "negative score",
			content: `{"score":-5,"correctness":50,"depth":50,"communication":50,"structure":50,"feedback":"x"}`,
			wantErr: true,
		},
		{
			name:    "empty feedback",
			content: `{"score":50,"correctness":50,"depth":50,"communication":50,"structure":50,"feedback":"  "}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseEval(tt.content)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got none")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Version != SchemaVersion {
				t.Errorf("version = %q, want %q", got.Version, SchemaVersion)
			}
			if got.Strengths == nil || got.Weaknesses == nil {
				t.Errorf("strengths/weaknesses must be non-nil slices")
			}
		})
	}
}

func TestParseGen(t *testing.T) {
	tests := []struct {
		name    string
		content string
		wantErr bool
	}{
		{
			name:    "valid",
			content: `{"question":"How would you handle a burst of concurrent requests?","modelAnswer":"Use a queue and backpressure..."}`,
		},
		{
			name:    "invalid json",
			content: `not json`,
			wantErr: true,
		},
		{
			name:    "empty question",
			content: `{"question":"  ","modelAnswer":"x"}`,
			wantErr: true,
		},
		{
			name:    "empty model answer",
			content: `{"question":"x","modelAnswer":""}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseGen(tt.content)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got none")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Question == "" || got.ModelAnswer == "" {
				t.Errorf("question/modelAnswer must be non-empty")
			}
		})
	}
}
