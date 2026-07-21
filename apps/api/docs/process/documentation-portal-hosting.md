---
status: "Approved"
owner: "Backend Team Lead"
last_updated: "2026-07-21"
visibility: "internal"
---

# Documentation Portal — Hosting & Deployment (M4 · P4)

How the portal is built and published. The build/validate pipeline is live in CI
(`.github/workflows/docs.yml`); **deployment is guarded and inert until hosting is
provisioned** — no secrets are fabricated and nothing publishes by accident. This doc
records what runs today and the one-time manual steps to turn deployment on, mirroring
how the App Runner deploy is documented in [`../engineering/deployment/`](../engineering/deployment/).

## What runs today (no setup needed)

On every push to `master` and every PR touching docs, CI:

1. installs the pinned docs toolchain (`requirements-docs.txt`),
2. runs a **strict** build of each audience — `full`, `internal`, `public` — which fails
   on any broken link or warning (a real quality gate on documentation), and
3. uploads the built `internal` and `public` sites as CI artifacts for review.

This needs no host, no secrets, and no classification decisions — it works now.

## Deployment (guarded — enable after provisioning)

Two tiers, two hosts. Deployment jobs stay dormant until the matching repo variable is
set, so the pipeline is complete but safe.

### Public site — GitHub Pages

- **Host:** GitHub Pages (public by nature — appropriate because only `public`-tagged
  docs are ever built into it; the visibility filter drops everything else).
- **Enable:** set repo variable `DOCS_PUBLISH_PUBLIC = "true"`. The `deploy-public` job
  in `docs.yml` then builds `DOCS_AUDIENCE=public` and publishes via the standard Pages
  actions (same pattern as the frontend repo).
- **Precondition:** at least one doc classified `public`. Until the classification
  proposal is approved, the public build is intentionally empty, so keep this off.

### Internal site — auth-gated host (NOT GitHub Pages)

- **Why not Pages:** GitHub Pages is public; publishing the `internal` build there would
  expose internal documentation. The internal site must sit behind authentication.
- **Recommended host:** Cloudflare Pages + Cloudflare Access (email/domain-gated), or an
  equivalent SSO/password-gated static host.
- **One-time manual provisioning** (the human step — like attaching an App Runner role):
  1. Create the host project (e.g. a Cloudflare Pages project) and its access policy
     (allowed emails/domain).
  2. Add the host's deploy token to repo **secrets** and set a repo variable
     `DOCS_PUBLISH_INTERNAL = "true"`.
  3. Wire the internal deploy against that host's action (kept out of `docs.yml` until
     the host is chosen, so we don't commit to a vendor prematurely).
- **Build command the host runs:** `DOCS_AUDIENCE=internal mkdocs build --strict`.

### Private docs

`private`-tagged docs are excluded from both the public and internal builds by default.
If a restricted internal build is ever needed, it is a further-gated deployment decided
at that time; nothing is built for `private` today.

## Domains (decide at enablement)

A docs subdomain/subpath per tier, e.g. `docs.<domain>` (public) and
`docs-internal.<domain>` (gated). Exact naming chosen when hosting is provisioned.

## Reversibility

Hosting is the only platform-external dependency and is deliberately swappable (ADR-0005
§10): the build produces plain static output that runs on any static host, so changing
host is a config/secret change, not a documentation change.
