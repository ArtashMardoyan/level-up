package interview

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/shared"
)

// SchemaVersion is the AI response schema version (docs/interview/006). Bump it
// alongside the prompt when the contract changes.
const SchemaVersion = "2.0"

// EvalInput is everything the AI needs to score one answer (docs/interview/005).
type EvalInput struct {
	CourseTitle string
	Difficulty  string
	Language    string // "en" | "ru" — the AI writes feedback in this language
	Question    string
	Answer      string
	IdealAnswer string
}

// EvalResult is the validated AI evaluation of one answer (docs/interview/006).
type EvalResult struct {
	Version       string   `json:"version"`
	Score         int      `json:"score"`
	Correctness   int      `json:"correctness"`
	Depth         int      `json:"depth"`
	Communication int      `json:"communication"`
	Structure     int      `json:"structure"`
	Confidence    string   `json:"confidence"`
	Feedback      string   `json:"feedback"`
	Strengths     []string `json:"strengths"`
	Weaknesses    []string `json:"weaknesses"`
}

// Evaluator scores a single interview answer. Implemented by the OpenAI client;
// the service degrades gracefully when it returns an error (docs/interview/006).
type Evaluator interface {
	Evaluate(ctx context.Context, in *EvalInput) (EvalResult, error)
}

// GenInput grounds one AI-written interview question in a real bank Q&A pair, so
// grading stays anchored to a concrete reference answer even though the question
// text and model answer shown to the candidate are freshly written (docs/004).
// PrevQuestion/PrevAnswer/PrevSkipped/PrevScore are the previous turn's context,
// used only to write a natural transition — empty for the interview's first
// question, when there is no previous turn.
type GenInput struct {
	CourseTitle  string
	Difficulty   string
	Language     string
	Module       string
	RefQuestion  string
	RefAnswer    string
	PrevQuestion string
	PrevAnswer   string
	PrevSkipped  bool
	PrevScore    int
}

// GenResult is one AI-written question + its matching model answer, plus an
// optional natural-language Reaction to the previous answer (empty when there
// was no previous turn). Reaction never states a score — it's chat flavor, kept
// separate from Question so grading and the Review screen stay anchored to the
// clean question text (docs/interview/011).
type GenResult struct {
	Reaction    string `json:"reaction"`
	Question    string `json:"question"`
	ModelAnswer string `json:"modelAnswer"`
}

// Generator writes one natural interview question (no bank numbering/labels) from
// a reference bank entry. The service degrades to the raw bank text when this
// returns an error or is nil (docs/interview/004).
type Generator interface {
	Generate(ctx context.Context, in *GenInput) (GenResult, error)
}

// Transcriber converts a recorded answer into text (docs/interview/005). Backed
// by Whisper — a fixed model, independent of the chat model (OPENAI_MODEL).
type Transcriber interface {
	Transcribe(ctx context.Context, audio io.Reader, filename string) (string, error)
}

// AI is the combined OpenAI-backed surface the service depends on.
type AI interface {
	Evaluator
	Generator
	Transcriber
}

type openAIClient struct {
	client  openai.Client
	model   string
	timeout time.Duration
}

// NewAI builds an OpenAI-backed evaluator + question generator. Returns nil when
// apiKey is empty so the module can start without a key (both then degrade).
func NewAI(apiKey, model string, timeout time.Duration) AI {
	if apiKey == "" {
		return nil
	}

	return &openAIClient{
		client:  openai.NewClient(option.WithAPIKey(apiKey)),
		model:   model,
		timeout: timeout,
	}
}

const systemPrompt = `You are a strict but encouraging technical interviewer for software engineers.
Evaluate ONLY the candidate's answer to the given question, using the ideal answer as reference.
Score four axes as integers from 0 to 100:
- correctness: is the answer technically right vs. the ideal answer?
- depth: how thoroughly are the important details covered?
- communication: is it clear and easy to follow?
- structure: is the reasoning organized (setup -> detail -> conclusion)?
Also give an overall "score" (0-100) for the answer.
Write "feedback" (one short coaching paragraph), "strengths" and "weaknesses" (short bullet strings)
in the interview language specified below. Do not invent facts. Do not penalize minor wording.
Respond with a SINGLE JSON object and nothing else, matching exactly:
{"version":"2.0","score":<int>,"correctness":<int>,"depth":<int>,"communication":<int>,
"structure":<int>,"confidence":"low|medium|high","feedback":"<string>",
"strengths":["<string>"],"weaknesses":["<string>"]}`

func (e *openAIClient) Evaluate(ctx context.Context, in *EvalInput) (EvalResult, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	langName := "English"
	switch in.Language {
	case LangRU:
		langName = "Russian"
	case LangHY:
		langName = "Armenian"
	}

	userPrompt := fmt.Sprintf(
		"Interview language: %s\nCourse: %s\nDifficulty: %s\n\nQuestion:\n%s\n\nIdeal answer (reference):\n%s\n\nCandidate's answer:\n%s",
		langName, in.CourseTitle, in.Difficulty, in.Question, fallback(in.IdealAnswer, "(none provided)"), fallback(in.Answer, "(empty)"),
	)

	params := openai.ChatCompletionNewParams{
		Model:       openai.ChatModel(e.model),
		Temperature: openai.Float(0.2),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(systemPrompt),
			openai.UserMessage(userPrompt),
		},
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONObject: &shared.ResponseFormatJSONObjectParam{},
		},
	}

	// One call + one retry on transport or validation failure (docs/interview/006).
	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		res, err := e.client.Chat.Completions.New(ctx, params)
		if err != nil {
			lastErr = err
			continue
		}
		if len(res.Choices) == 0 {
			lastErr = fmt.Errorf("interview: empty AI response")
			continue
		}

		parsed, err := parseEval(res.Choices[0].Message.Content)
		if err != nil {
			lastErr = err
			continue
		}

		return parsed, nil
	}

	return EvalResult{}, lastErr
}

// parseEval unmarshals and validates the AI JSON against schema v2.
func parseEval(content string) (EvalResult, error) {
	var r EvalResult
	if err := json.Unmarshal([]byte(strings.TrimSpace(content)), &r); err != nil {
		return EvalResult{}, fmt.Errorf("interview: invalid AI JSON: %w", err)
	}

	for _, s := range []int{r.Score, r.Correctness, r.Depth, r.Communication, r.Structure} {
		if s < 0 || s > 100 {
			return EvalResult{}, fmt.Errorf("interview: AI score out of range: %d", s)
		}
	}
	if strings.TrimSpace(r.Feedback) == "" {
		return EvalResult{}, fmt.Errorf("interview: AI feedback empty")
	}

	r.Version = SchemaVersion
	if r.Strengths == nil {
		r.Strengths = []string{}
	}
	if r.Weaknesses == nil {
		r.Weaknesses = []string{}
	}

	return r, nil
}

const questionSystemPrompt = `You are a real, professional technical interviewer conducting a live mock interview.
You are given one topic from the interview's internal question bank: a module name, a reference
question, and its reference answer. Do NOT quote the reference question verbatim and NEVER include
any numbering or label like "Question 12." — a real interviewer never says that out loud.
Write ONE natural, conversational interview question on this topic, phrased the way a real
interviewer would ask it, calibrated to the requested difficulty:
- easy: a single foundational concept, generously framed
- medium: connects 2-3 concepts, or asks for a short concrete example
- hard: open-ended, probes trade-offs, edge cases, or "what would you do if..." scenarios
Also write a strong model answer to the question YOU wrote (matching its exact scope — not a copy of
the reference answer). Write both in the interview language specified below.

If a previous question and the candidate's answer to it are provided below, also write a short
(1-2 sentence) natural "reaction" bridging from that answer into your new question — the way a real
interviewer keeps a conversation moving, e.g. acknowledging a specific point they made, or noting a
gap before pivoting. The reaction ONLY looks back at the answer just given: it must NOT itself ask a
question, pose or preview the next question, hint at what you are about to ask, or end with a question
mark. All questioning belongs solely in the separate "question" field — the reaction is purely a
bridge, never a question. An internal quality signal (0-100, never shown to the candidate) is given
only so you can calibrate tone. The reaction must NEVER state, imply, or hint at a score, grade,
percentage, or the words "correct"/"incorrect"/"score"/"points" — a real interviewer doesn't grade out
loud mid-chat.
If the candidate skipped, react naturally to moving on, with no judgment. If there is no previous
question (this is the interview's opening question), leave "reaction" as an empty string.

Respond with a SINGLE JSON object and nothing else, matching exactly:
{"reaction":"<string, can be empty>","question":"<string>","modelAnswer":"<string>"}`

func (e *openAIClient) Generate(ctx context.Context, in *GenInput) (GenResult, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	langName := "English"
	switch in.Language {
	case LangRU:
		langName = "Russian"
	case LangHY:
		langName = "Armenian"
	}

	userPrompt := fmt.Sprintf(
		"Interview language: %s\nCourse: %s\nDifficulty: %s\nModule: %s\n\nReference question:\n%s\n\nReference answer:\n%s%s",
		langName, in.CourseTitle, in.Difficulty, in.Module, in.RefQuestion, fallback(in.RefAnswer, "(none provided)"),
		prevTurnPrompt(in),
	)

	params := openai.ChatCompletionNewParams{
		Model:       openai.ChatModel(e.model),
		Temperature: openai.Float(0.7),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(questionSystemPrompt),
			openai.UserMessage(userPrompt),
		},
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONObject: &shared.ResponseFormatJSONObjectParam{},
		},
	}

	// One call + one retry on transport or validation failure, same policy as Evaluate.
	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		res, err := e.client.Chat.Completions.New(ctx, params)
		if err != nil {
			lastErr = err
			continue
		}
		if len(res.Choices) == 0 {
			lastErr = fmt.Errorf("interview: empty AI response")
			continue
		}

		parsed, err := parseGen(res.Choices[0].Message.Content)
		if err != nil {
			lastErr = err
			continue
		}

		return parsed, nil
	}

	return GenResult{}, lastErr
}

// parseGen unmarshals and validates the AI's generated question.
func parseGen(content string) (GenResult, error) {
	var r GenResult
	if err := json.Unmarshal([]byte(strings.TrimSpace(content)), &r); err != nil {
		return GenResult{}, fmt.Errorf("interview: invalid AI JSON: %w", err)
	}
	if strings.TrimSpace(r.Question) == "" || strings.TrimSpace(r.ModelAnswer) == "" {
		return GenResult{}, fmt.Errorf("interview: AI question or model answer empty")
	}

	return r, nil
}

// Transcribe converts a recorded voice answer to text via Whisper (docs/005).
// Unlike Evaluate/Generate this never degrades silently — a caller with no
// transcript to show has nothing useful to fall back to, so the error is
// returned as-is for the handler to surface.
func (e *openAIClient) Transcribe(ctx context.Context, audio io.Reader, filename string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	res, err := e.client.Audio.Transcriptions.New(ctx, openai.AudioTranscriptionNewParams{
		File:  openai.File(audio, filename, "application/octet-stream"),
		Model: openai.AudioModelWhisper1,
	})
	if err != nil {
		return "", fmt.Errorf("interview: transcription failed: %w", err)
	}

	text := strings.TrimSpace(res.Text)
	if text == "" {
		return "", fmt.Errorf("interview: empty transcription")
	}

	return text, nil
}

func fallback(s, alt string) string {
	if strings.TrimSpace(s) == "" {
		return alt
	}

	return s
}

// prevTurnPrompt appends the previous turn's context for the "reaction" the AI
// writes bridging into the new question — omitted entirely for the interview's
// first question, where GenInput.PrevQuestion is empty.
func prevTurnPrompt(in *GenInput) string {
	if strings.TrimSpace(in.PrevQuestion) == "" {
		return ""
	}
	if in.PrevSkipped {
		return fmt.Sprintf("\n\nPrevious question:\n%s\n\nThe candidate skipped this one.", in.PrevQuestion)
	}

	return fmt.Sprintf(
		"\n\nPrevious question:\n%s\n\nCandidate's answer:\n%s\n\nInternal quality signal (0-100, never show this number): %d",
		in.PrevQuestion, fallback(in.PrevAnswer, "(empty)"), in.PrevScore,
	)
}
