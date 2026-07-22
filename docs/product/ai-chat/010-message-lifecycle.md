# 010 - Message Lifecycle

One message from keystroke to persisted turn — **today vs. streaming target** — side by side, so an
implementer can see exactly what moves.

## Today (blocking) — recap of `003`

```
keystroke → Enter
 → optimistic answer bubble + thinking dots
 → POST answer (one connection held open)
 → server: Evaluate (blocking) → persist result → advance index → Generate next (blocking) → cache
 → one JSON body returns { result, next }
 → answer bubble already shown; next-question bubble appears whole; dots vanish
```
Perceived latency = Evaluate + Generate in series (`003`).

## Streaming target

```
keystroke → Enter
 → optimistic answer bubble + thinking dots (until first token)
 → POST answer/stream (SSE connection opens)
 ├─ server persists the answer + advances currentIndex          (committed immediately)
 ├─ server starts Evaluate in a BACKGROUND goroutine            (not on the critical path)
 └─ server streams the NEXT question:
       deterministic reaction (greeting/skip) emitted first, if any   → delta
       model prose tokens                                              → delta, delta, delta…
   client: replace thinking dots with a live bubble; append each delta
 → server finishes generation → caches the turn → sends `done` (canonical text)
   client: reconcile bubble to canonical text; set current=next; enable composer
 → (meanwhile) Evaluate lands → persist question_results         (feeds Results, not the chat)
```
Perceived latency = **time-to-first-token of Generate** (~500 ms), not Evaluate + Generate.

## Step-by-step (streaming)

| # | Where | Action | Notes |
|---|---|---|---|
| 1 | `InterviewChat` submit | Append answer bubble, open SSE via `requestStream` | Same optimistic step as today (`:145`) |
| 2 | Handler | Auth + ownership + "in progress" checks | Unchanged from `SubmitAnswer` |
| 3 | Service | Persist answer, advance `currentIndex`, `UpdateSession` | **Committed before generation** — makes cancel/reconnect safe (`009`) |
| 4 | Service (goroutine) | `Evaluate(...)` → `UpsertResult` | Concurrent; degrades on error (`011`); never blocks the stream |
| 5 | Service (main) | Emit deterministic `reaction` delta if greeting/skip | From Go, not the model (`service.go:456`) |
| 6 | AI | `GenerateStream(...)` → `onDelta(token)` → `sink.Delta` | New streaming path (`008`) |
| 7 | Client | Append each delta to the live bubble; auto-scroll | Reuses the near-bottom scroll effect (`:94`) |
| 8 | Service | Assemble final turn, cache in `generatedQuestions`, `sink.Done(view)` | Same cache the blocking path writes (`service.go:469`) |
| 9 | Client | Reconcile bubble to `done`'s canonical text; `current=next` | Guards against delta loss |
| 10 | Service | (async) Evaluate result persisted | Available next time Results is opened |

## Reconciliation: why `done` carries the whole turn

Streamed deltas are best-effort UI; the **authoritative** text is what the server persisted. The
terminal `done` frame includes the final `reaction`/`question`/`questionId`/`index`, and the client
**replaces** its assembled bubble with that canonical text (step 9). If deltas and canonical text
match (the normal case), the swap is invisible; if a delta was dropped, the bubble self-heals. This
is the same principle as "the chat rebuilds from the server" (`009`), applied per-message.

## Persistence parity (critical)

The streaming path must write the **same rows** as the blocking path so `GET /interviews/:id`
reconstructs an identical session regardless of how a turn was delivered:
- `interview_sessions.currentIndex` advanced (step 3) — same as `service.go:169`.
- `interview_sessions.generatedQuestions[idx]` cached (step 8) — same as `service.go:469`.
- `question_results` upserted with the evaluation (step 4/10) — same as `service.go:165`.

An implementer can verify parity by running a blocking submit and a streaming submit on two identical
sessions and diffing the resulting rows — they should be equal.

## The first question (start)

`Start` (`service.go:51`) generates question 1 (a single blocking Generate today). The streaming
variant (`POST /interviews/stream`, optional — `006`) streams that first question the same way,
prefixed by the deterministic greeting delta (`greeting()`, `report.go:199`). Lower priority than the
submit path since "start" happens once per interview vs. once per turn.

## Skipped and empty answers

Unchanged logic (`service.evaluateAnswer`, `service.go:206`): a skipped/empty answer scores 0, skips
the Evaluate call, and gets the deterministic skip feedback. In streaming, the skip reaction
(`skippedReaction`, `report.go:188`) is the leading `reaction` delta (step 5); generation of the next
question still streams.

## Failure points and their handling (detail in `011`)

- Fail before first token → emit bank text as `done` (invisible degrade).
- Fail mid-stream → `error` frame → client falls back to `GET /interviews/:id`.
- Client disconnects → request `ctx` cancels → stream + OpenAI call stop; committed state (steps 3/4)
  survives; the un-cached next question regenerates on resume.
