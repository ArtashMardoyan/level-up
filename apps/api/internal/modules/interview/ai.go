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

// SchemaVersion is the AI response schema version (docs/product/interview/006). Bump it
// alongside the prompt when the contract changes.
const SchemaVersion = "2.0"

// EvalInput is everything the AI needs to score one answer (docs/product/interview/005).
type EvalInput struct {
	CourseTitle string
	Difficulty  string
	Language    string // "en" | "ru" — the AI writes feedback in this language
	Question    string
	Answer      string
	IdealAnswer string
}

// EvalResult is the validated AI evaluation of one answer (docs/product/interview/006).
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
// the service degrades gracefully when it returns an error (docs/product/interview/006).
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
// clean question text (docs/product/interview/011).
type GenResult struct {
	Reaction    string `json:"reaction"`
	Question    string `json:"question"`
	ModelAnswer string `json:"modelAnswer"`
}

// Generator writes one natural interview question (no bank numbering/labels) from
// a reference bank entry. The service degrades to the raw bank text when this
// returns an error or is nil (docs/product/interview/004).
type Generator interface {
	Generate(ctx context.Context, in *GenInput) (GenResult, error)
	// GenerateStream is the streaming counterpart to Generate (docs/product/ai-chat/008).
	// It streams the user-visible prose (reaction, then question) via onVisible as
	// the model produces it, and returns the fully-assembled GenResult when done.
	// The model answer is never streamed (it isn't shown live — it backs the
	// Sample-answer button and anchors grading). Same one-retry + degrade policy as
	// Generate, except a failure is not retried once any visible token has been
	// emitted (docs/product/ai-chat/008/011).
	GenerateStream(ctx context.Context, in *GenInput, onVisible func(string)) (GenResult, error)
}

// Transcriber converts a recorded answer into text (docs/product/interview/005). Backed
// by Whisper — a fixed model, independent of the chat model (OPENAI_MODEL).
// language is the session language (ISO-639-1: en/ru/hy) so Whisper transcribes
// in the spoken language instead of guessing (a short Russian clip otherwise
// often comes back as English); empty lets Whisper auto-detect.
type Transcriber interface {
	Transcribe(ctx context.Context, audio io.Reader, filename, language string) (string, error)
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

	userPrompt := fmt.Sprintf(
		"Interview language: %s\nCourse: %s\nDifficulty: %s\n\nQuestion:\n%s\n\nIdeal answer (reference):\n%s\n\nCandidate's answer:\n%s",
		languageName(in.Language), in.CourseTitle, in.Difficulty, in.Question, fallback(in.IdealAnswer, "(none provided)"), fallback(in.Answer, "(empty)"),
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

	// One call + one retry on transport or validation failure (docs/product/interview/006).
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

// questionGuidance is the shared interviewer instruction for both the blocking
// (JSON) and streaming (sentinel) generation prompts, so the two paths stay in
// sync — only the output-format instruction appended below differs (docs/product/ai-chat/008).
const questionGuidance = `You are a real, professional technical interviewer conducting a live mock interview.
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
(1-2 sentence) natural "reaction" that acknowledges the answer just given — the way a real
interviewer keeps a conversation moving, e.g. affirming a specific point they made or noting a gap.
The reaction ONLY looks back at the answer just given: it must NOT itself ask a question, pose or
preview the next question, hint at what you are about to ask, name or introduce the topic/subject of
the next question, or end with a question mark. Do NOT announce the next topic (no "let's talk about
X", "let's move on to X", "shifting to X") — introducing the new subject is the job of the "question"
field alone, so the topic is never named twice across the reaction and the question. All questioning
belongs solely in the separate "question" field — the reaction is purely a look-back bridge, never a
question or a topic announcement. An internal quality signal (0-100, never shown to the candidate) is given
only so you can calibrate tone. The reaction must NEVER state, imply, or hint at a score, grade,
percentage, or the words "correct"/"incorrect"/"score"/"points" — a real interviewer doesn't grade out
loud mid-chat.
If the candidate skipped, react naturally to moving on, with no judgment. If there is no previous
question (this is the interview's opening question), leave "reaction" as an empty string.`

// questionSystemPrompt is the blocking generation prompt: guidance + a single-JSON
// output contract (unchanged from before the streaming work).
const questionSystemPrompt = questionGuidance + `

Respond with a SINGLE JSON object and nothing else, matching exactly:
{"reaction":"<string, can be empty>","question":"<string>","modelAnswer":"<string>"}`

// Sentinel markers delimiting the three sections of the streaming generation
// response (docs/product/ai-chat/008). Chosen to be extremely unlikely in natural prose;
// the prompt forbids their use anywhere but as the section separators.
const (
	genSepQuestion = "###QUESTION###"
	genSepAnswer   = "###ANSWER###"
)

// questionStreamSystemPrompt is the streaming generation prompt: the same guidance
// as the blocking path, but a plain-text, sentinel-delimited output contract so the
// user-visible prose (reaction + question) can be streamed token-by-token while the
// model answer is parsed off the tail (docs/product/ai-chat/008).
const questionStreamSystemPrompt = questionGuidance + `

Respond with EXACTLY three sections, in this order, each separated by a line containing only the
marker shown, and NOTHING else (no JSON, no code fences, no extra commentary):
<reaction, or empty if there is no previous question>
` + genSepQuestion + `
<the question>
` + genSepAnswer + `
<the model answer>
Do NOT use the markers ` + genSepQuestion + ` or ` + genSepAnswer + ` anywhere except as the two separators.`

func (e *openAIClient) Generate(ctx context.Context, in *GenInput) (GenResult, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	userPrompt := genUserPrompt(in)

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

// GenerateStream streams the sentinel-delimited generation response (docs/product/ai-chat/008),
// forwarding the visible prose (reaction + question) to onVisible as it arrives and
// parsing the three sections when complete. Retries once only if the stream fails
// before any visible token was emitted; after that a failure is returned (a partial
// bubble can't be un-shown — the service degrades to the bank text and the client
// reconciles on done, docs/product/ai-chat/011).
func (e *openAIClient) GenerateStream(ctx context.Context, in *GenInput, onVisible func(string)) (GenResult, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	// Plain-text streaming: no JSON ResponseFormat (we stream prose, not an object).
	params := openai.ChatCompletionNewParams{
		Model:       openai.ChatModel(e.model),
		Temperature: openai.Float(0.7),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(questionStreamSystemPrompt),
			openai.UserMessage(genUserPrompt(in)),
		},
	}

	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		result, emitted, err := e.runGenerateStream(ctx, &params, onVisible)
		if err != nil {
			lastErr = err
			if emitted {
				return GenResult{}, err // never retry once tokens are on the wire
			}

			continue
		}

		return result, nil
	}

	return GenResult{}, lastErr
}

// runGenerateStream performs one streaming attempt. It returns whether any visible
// token was emitted so the caller can decide whether a retry is still safe.
func (e *openAIClient) runGenerateStream(ctx context.Context, params *openai.ChatCompletionNewParams, onVisible func(string)) (GenResult, bool, error) {
	stream := e.client.Chat.Completions.NewStreaming(ctx, *params)
	defer func() { _ = stream.Close() }()

	var full strings.Builder
	emitted := 0

	flush := func(final bool) {
		vis := genVisible(full.String(), final)
		if len(vis) > emitted {
			onVisible(vis[emitted:])
			emitted = len(vis)
		}
	}

	for stream.Next() {
		chunk := stream.Current()
		if len(chunk.Choices) == 0 {
			continue
		}
		full.WriteString(chunk.Choices[0].Delta.Content)
		flush(false)
	}

	if err := stream.Err(); err != nil {
		return GenResult{}, emitted > 0, err
	}

	parsed, err := parseGenStream(full.String())
	if err != nil {
		return GenResult{}, emitted > 0, err
	}

	// Flush any tail withheld by the mid-stream holdback now that parsing confirmed
	// a well-formed response.
	flush(true)

	return parsed, emitted > 0, nil
}

// parseGenStream splits a completed sentinel-delimited generation response into its
// three sections and validates them, mirroring parseGen's contract.
func parseGenStream(content string) (GenResult, error) {
	qi := strings.Index(content, genSepQuestion)
	if qi < 0 {
		return GenResult{}, fmt.Errorf("interview: streamed generation missing question separator")
	}

	rest := content[qi+len(genSepQuestion):]

	ai := strings.Index(rest, genSepAnswer)
	if ai < 0 {
		return GenResult{}, fmt.Errorf("interview: streamed generation missing answer separator")
	}

	r := GenResult{
		Reaction:    strings.TrimSpace(content[:qi]),
		Question:    strings.TrimSpace(rest[:ai]),
		ModelAnswer: strings.TrimSpace(rest[ai+len(genSepAnswer):]),
	}
	if r.Question == "" || r.ModelAnswer == "" {
		return GenResult{}, fmt.Errorf("interview: AI question or model answer empty")
	}

	return r, nil
}

// genVisible returns the user-visible prose (reaction + question) that is safe to
// have shown given the raw sentinel-delimited text accumulated so far. It is a
// monotonically growing prefix: the caller emits only the part beyond what it has
// already sent (docs/product/ai-chat/008/010).
//
// The reaction is withheld until the question separator is seen (so no partial
// separator ever reaches the client and the reaction never needs re-trimming). The
// question is then streamed, left-trimmed and, until final, right-held-back by
// len(genSepAnswer)-1 bytes so a partial answer separator is never emitted. final
// releases the withheld tail once the response is known complete + well-formed.
func genVisible(raw string, final bool) string {
	qi := strings.Index(raw, genSepQuestion)
	if qi < 0 {
		return "" // still buffering the reaction; nothing safe to show yet
	}

	reaction := strings.TrimSpace(raw[:qi])
	rest := raw[qi+len(genSepQuestion):]

	var question string
	if ai := strings.Index(rest, genSepAnswer); ai >= 0 {
		question = strings.TrimSpace(rest[:ai])
	} else {
		// No answer separator yet. Hold back the last len(genSepAnswer)-1 raw bytes
		// so a partial separator is never shown, then trim: trailing whitespace here
		// is the newline before the upcoming separator, not part of the question.
		// (final releases the whole remainder.) Trimming both ends stays a
		// monotonically growing prefix as more text arrives.
		q := rest
		if !final {
			if hold := len(genSepAnswer) - 1; len(q) > hold {
				q = q[:len(q)-hold]
			} else {
				q = ""
			}
		}
		question = strings.TrimSpace(q)
	}

	if reaction == "" {
		return question
	}
	if question == "" {
		return reaction
	}

	return reaction + "\n\n" + question
}

// Transcribe converts a recorded voice answer to text via Whisper (docs/005).
// Unlike Evaluate/Generate this never degrades silently — a caller with no
// transcript to show has nothing useful to fall back to, so the error is
// returned as-is for the handler to surface.
func (e *openAIClient) Transcribe(ctx context.Context, audio io.Reader, filename, language string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	params := openai.AudioTranscriptionNewParams{
		File:  openai.File(audio, filename, "application/octet-stream"),
		Model: openai.AudioModelWhisper1,
	}
	// Pin the spoken language when we know it (session language), so Whisper
	// doesn't mis-detect a short clip; empty = auto-detect.
	if language != "" {
		params.Language = openai.String(language)
	}

	res, err := e.client.Audio.Transcriptions.New(ctx, params)
	if err != nil {
		return "", fmt.Errorf("interview: transcription failed: %w", err)
	}

	text := strings.TrimSpace(res.Text)
	if text == "" {
		return "", fmt.Errorf("interview: empty transcription")
	}

	return text, nil
}

// languageName maps a session language code to the English name used in prompts.
func languageName(lang string) string {
	switch lang {
	case LangRU:
		return "Russian"
	case LangHY:
		return "Armenian"
	default:
		return "English"
	}
}

// genUserPrompt builds the generation user prompt shared by Generate and
// GenerateStream, so the blocking and streaming paths ground the model on an
// identical prompt (and therefore grade against the same reference).
func genUserPrompt(in *GenInput) string {
	return fmt.Sprintf(
		"Interview language: %s\nCourse: %s\nDifficulty: %s\nModule: %s\n\nReference question:\n%s\n\nReference answer:\n%s%s",
		languageName(in.Language), in.CourseTitle, in.Difficulty, in.Module, in.RefQuestion, fallback(in.RefAnswer, "(none provided)"),
		prevTurnPrompt(in),
	)
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

	// A negative PrevScore means "not scored yet" — the streaming path grades the
	// answer in the background, so the score isn't available when the next question
	// is generated. Omit the calibration signal rather than imply a 0, which would
	// read as a failed answer (docs/product/ai-chat/008/010). The blocking path always passes
	// a real 0–100 score and keeps the signal.
	if in.PrevScore < 0 {
		return fmt.Sprintf(
			"\n\nPrevious question:\n%s\n\nCandidate's answer:\n%s",
			in.PrevQuestion, fallback(in.PrevAnswer, "(empty)"),
		)
	}

	return fmt.Sprintf(
		"\n\nPrevious question:\n%s\n\nCandidate's answer:\n%s\n\nInternal quality signal (0-100, never show this number): %d",
		in.PrevQuestion, fallback(in.PrevAnswer, "(empty)"), in.PrevScore,
	)
}
