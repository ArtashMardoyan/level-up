# 008 - OpenAI Streaming

How the server-side OpenAI calls change from blocking to streaming — and, crucially, **which call
streams and which stays structured.** All OpenAI calls remain **server-side** in Go (`openai-go`);
the API key never reaches the browser (`config.go:129`, `ai.go:117`).

## Today (blocking, JSON-object mode)

`ai.go` calls `e.client.Chat.Completions.New(ctx, params)` — the **non-streaming** method — with
`ResponseFormat: JSONObject` for both `Generate` (`ai.go:250`, temp 0.7) and `Evaluate`
(`ai.go:138`, temp 0.2), plus Whisper for `Transcribe` (`ai.go:322`). Each returns the whole
completion at once; the service parses the JSON and returns it (`003`).

## The key insight: JSON-object mode and token streaming don't mix well

Streaming a response that is a **single JSON object** gives you tokens like `{"reaction":"Great,` —
partial JSON that isn't renderable and isn't parseable until complete. Two clean ways to stream:

- **(A) Stream a prose field, keep structure out of the stream.** Have the model stream the
  user-visible **question prose** directly (not wrapped in JSON), and obtain the structured bits
  (`modelAnswer`, and any metadata) separately or at the end.
- **(B) Stream JSON and parse incrementally** with a tolerant/partial JSON parser, extracting the
  `question` field's growing value. More fragile; needs careful handling of escaping and field order.

**Recommendation: (A).** Because the only thing the chat renders is `reaction` + `question`
(`004`), we can split the generation into "streamable prose" and "structured extras":

| Field | Purpose | Streaming approach |
|---|---|---|
| `reaction` + `question` | The chat bubble | **Streamed as prose**, token-by-token |
| `modelAnswer` | Sample-answer button (on demand) | Not streamed — request separately when the button is pressed, or return in the terminal `done` frame |
| `reaction` special-casing (greeting / skip) | Deterministic, Go-side | Unchanged — computed in `ensureGenerated` (`service.go:456`), **not** from the model |

The deterministic overrides already exist and stay: the first-question greeting and the skip
reaction are forced in Go (`service.go:457`/`:462`, `report.go` `greeting`/`skippedReaction`), never
trusted to the model. Streaming doesn't change that — those are emitted as a leading delta before any
model tokens, or as the whole bubble when there's nothing to generate.

## Proposed streaming generator

Add a streaming sibling to the `Generator` interface (`ai.go:83`), leaving `Generate` intact:

```go
type StreamGenerator interface {
    // GenerateStream streams the question prose via onDelta and returns the fully
    // assembled QuestionView-worth of fields when done. Same GenInput as Generate.
    GenerateStream(ctx context.Context, in *GenInput, onDelta func(string)) (GenResult, error)
}
```

Implementation notes:
- Use `openai-go`'s streaming API (`Chat.Completions.NewStreaming(ctx, params)` — the streaming
  counterpart to the current `.New`), iterating the delta chunks and calling `onDelta(chunk)` for
  each content delta.
- **Prompt change:** either (a) keep JSON-object mode but stream only the `question` value by
  prompting the model to emit the question first / on its own, or (b) drop JSON mode for generation
  and prompt for plain prose, obtaining `modelAnswer` via a second small (non-streamed) call or a
  clearly-delimited section. Decide during Phase 4 (`014`); (a) preserves the current single-call
  economy, (b) is simplest to stream. The `questionSystemPrompt` (`ai.go:219`) is reworded either
  way; bump `SchemaVersion` (`ai.go:18`) when the contract changes.
- **Retry semantics.** The current "one call + one retry" (`ai.go:169`) can't retry *after* tokens
  have been flushed to the client. Policy: retry only if the stream fails **before the first
  delta**; once streaming has started, a mid-stream failure degrades (emit `Fail` / fall back —
  `011`), it does not silently restart.
- **Timeout.** A streamed generation may run longer than a blocking one; consider a dedicated
  `OPENAI_STREAM_TIMEOUT_SECONDS` (`006`).

## Evaluate stays non-streamed

`Evaluate` (`ai.go:138`) produces the rubric JSON that feeds the **Results** screen, not the chat
(`docs/interview/STATUS.md` — per-answer score bubbles were removed). There is **no user-facing prose
to stream**, and the scores must be validated as a whole (range checks at `ai.go:199`) before
persisting. So `Evaluate` keeps JSON-object mode and its blocking call — it just runs **concurrently
in the background** during the streaming turn instead of blocking it (`006`/`010`). Its result
persists to `question_results` when it lands.

## Transcribe (voice-in) — unchanged for now

Whisper transcription (`ai.go:322`) is a one-shot request returning a short string; streaming it
buys nothing for the current "record → transcript fills composer" flow (`003`). It stays as-is
through the text phases. **Realtime voice** (Phase 7+) replaces this with the OpenAI Realtime API
(streaming speech-to-speech), evaluated in `005`/`012`, not here.

## OpenAI Realtime API (Phases 7–8, forward-looking)

For true low-latency voice, the Go backend becomes a **broker**: it holds the client WebSocket
(`005`) and a server-side connection to OpenAI Realtime, relaying audio/text both ways. This keeps
the key server-side and lets the same session/ownership/degrade rules apply. It supersedes the
separate Whisper-transcribe call for the realtime mode (the blocking transcribe endpoint can remain
for the non-realtime "record an answer" affordance). Detailed design is deferred to the voice phases.

## Summary

- **Stream:** the next-question prose (`reaction` + `question`) via a new `GenerateStream`.
- **Don't stream:** the evaluation JSON (structured, Results-only) — run it concurrently in the
  background; and Whisper (one-shot) — unchanged.
- **Preserve:** server-side key, deterministic greeting/skip overrides, degrade-to-bank-text,
  one-retry-before-first-token.
- **Bump** `SchemaVersion` and update prompts when the generation contract changes.
