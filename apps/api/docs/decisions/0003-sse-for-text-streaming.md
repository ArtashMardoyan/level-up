# ADR-0003 — SSE for text streaming; WebSocket reserved for voice

> **Status:** Accepted · **Date:** 2026-07-21 · **Deciders:** Backend Team Lead

## Context

The AI Chat migration streams the next interview question token-by-token. Text
streaming is one-directional (server → client). The app authenticates with an
`Authorization: Bearer` header from `localStorage`, and the backend runs on AWS App
Runner. See `product/ai-chat/005-websocket-strategy.md`.

## Decision

Use **Server-Sent Events framing delivered over `fetch` + `ReadableStream`** for text
streaming. Reserve **WebSocket** (and possibly the OpenAI Realtime API) for the later
voice/realtime phases, where the channel must be bidirectional.

## Alternatives considered

- **Native `EventSource`.** Cannot set an `Authorization` header — would force a
  query-string token (logged in URLs) or a cookie. Rejected.
- **WebSocket for text too.** Bidirectional, but overkill for one-way token streaming;
  adds a dependency, an upgrade handshake, a connection registry, and heartbeats for
  no benefit the text chat needs.
- **Raw chunked HTTP.** Works, but you re-invent SSE's framing and reconnect for nothing.

## Consequences

- The existing Bearer-header auth is reused unchanged; no token in URLs.
- No new backend dependency; Gin streams with flush.
- App Runner's SSE behavior (buffering, timeouts) must be verified on a real deploy
  before enabling streaming by default — the open gate tracked in the ai-chat STATUS.
- Adopting WebSocket later for voice is clean: a new endpoint beside the SSE one.
