package interview

import (
	"context"
	"encoding/json"
	"fmt"
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

type openAIEvaluator struct {
	client  openai.Client
	model   string
	timeout time.Duration
}

// NewEvaluator builds an OpenAI-backed evaluator. Returns nil when apiKey is
// empty so the module can start without a key (evaluation then degrades).
func NewEvaluator(apiKey, model string, timeout time.Duration) Evaluator {
	if apiKey == "" {
		return nil
	}

	return &openAIEvaluator{
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

func (e *openAIEvaluator) Evaluate(ctx context.Context, in *EvalInput) (EvalResult, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	langName := "English"
	if in.Language == LangRU {
		langName = "Russian"
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

func fallback(s, alt string) string {
	if strings.TrimSpace(s) == "" {
		return alt
	}

	return s
}
