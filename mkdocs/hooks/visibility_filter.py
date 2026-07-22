"""Filter documentation pages by audience at build time (M4 phase P3).

Access control is a build-and-hosting concern, not an SSG feature (ADR-0005 F1).
Each doc declares ``visibility: public | internal | private`` in its front matter;
this hook drops pages not permitted for the target build, so restricted content is
**never emitted** into a lower-audience artifact (defense in depth, not CSS-hiding).

The target audience is read from the ``DOCS_AUDIENCE`` environment variable:

    public    -> only `public` pages                (the public site)
    internal  -> `public` + `internal` pages         (the auth-gated internal site)
    full      -> everything, incl. `private`         (default; local dev + private build)

A page with no ``visibility`` (e.g. the chapter files that inherit ownership from
their folder README) is treated as ``internal`` — the safe default.
"""

import os
import re

_ALLOWED = {
    "public": {"public"},
    "internal": {"public", "internal"},
    "full": {"public", "internal", "private"},
}
_DEFAULT_PAGE_VISIBILITY = "internal"
_VISIBILITY_RE = re.compile(r'^visibility:\s*"?([a-z]+)"?\s*$', re.MULTILINE)


def _audience() -> str:
    return os.environ.get("DOCS_AUDIENCE", "full").strip().lower()


def _visibility_of(file) -> str:
    """Read the visibility field straight from the source file's front matter.

    Read from disk (not page.meta) because on_files runs before pages are rendered,
    so meta is not yet populated.
    """
    try:
        with open(file.abs_src_path, encoding="utf-8") as fh:
            head = fh.read(4096)
    except OSError:
        return _DEFAULT_PAGE_VISIBILITY
    if not head.startswith("---\n"):
        return _DEFAULT_PAGE_VISIBILITY
    end = head.find("\n---\n", 4)
    front = head[4:end] if end != -1 else head
    m = _VISIBILITY_RE.search(front)
    return m.group(1) if m else _DEFAULT_PAGE_VISIBILITY


def on_files(files, config, **kwargs):
    allowed = _ALLOWED.get(_audience(), _ALLOWED["full"])
    if allowed == _ALLOWED["full"]:
        return files  # nothing to filter

    kept = []
    dropped = 0
    for f in files:
        if not f.is_documentation_page():
            kept.append(f)
            continue
        if _visibility_of(f) in allowed:
            kept.append(f)
        else:
            dropped += 1

    if dropped:
        print(f"  [visibility] audience={_audience()}: dropped {dropped} page(s) not in {sorted(allowed)}")

    return type(files)(kept)
