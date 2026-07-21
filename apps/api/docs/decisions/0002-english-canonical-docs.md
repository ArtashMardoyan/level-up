# ADR-0002 — English is the canonical documentation language

> **Status:** Accepted · **Date:** 2026-07-21 · **Deciders:** Backend Team Lead

## Context

The team communicates in Russian and Armenian, and some early docs were written in
Russian (`auth`, `deployment`) while the rest are English. Mixed-language
documentation means no single contributor can reliably read every document, and it
worsens as Mobile and AI engineers join.

## Decision

**English is the canonical language for all documentation** — PRDs, API references,
architecture, AI prompts, Frontend and Mobile docs. Team conversation may remain in
Russian or Armenian; the written, versioned record is English.

## Alternatives considered

- **Bilingual docs.** Doubles maintenance and drifts out of sync; rejected.
- **Whatever language the author prefers.** The current state — fragments readership.

## Consequences

- Any contributor can read any document; onboarding is uniform.
- The two Russian docs are translated to English during the M1 migration.
- Reviews reject non-English documentation.
