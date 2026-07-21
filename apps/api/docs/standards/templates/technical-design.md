---
status: "Draft"
owner: "<engineer/team>"
reviewers:
  - "<stacks affected>"
last_updated: "YYYY-MM-DD"
---

# <Feature> — Technical Design

<!-- Template: how the feature is built. Pairs with the PRD (the why). Delete comments. -->

## Overview

The approach in a paragraph. Link the PRD it implements.

## Architecture

Components and how they fit the existing system (module layout, dependency direction).
A diagram or a short list.

## Data model

Entities, key columns, migrations. Note constraints and cascades.

## Contracts

Endpoints / interfaces / payload shapes (or link to the API reference / Postman).

## Key decisions

Significant or irreversible choices → record each as an ADR in `decisions/` and link it.

## Risks & trade-offs

What could go wrong; what we chose not to optimize and why.

## Rollout

Phases, flags, migration/backfill, and how it degrades on failure.
