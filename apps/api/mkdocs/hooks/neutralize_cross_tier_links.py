"""Neutralize links to pages filtered out of the current audience build (M4 · P4).

When the visibility filter drops a page (e.g. an `internal` Product Model on the
`public` build), other retained pages may still link to it — a public doc citing its
`Derived from: Product Model §…` provenance, for instance. Left alone those become
broken links (and fail --strict).

This hook rewrites **only** Markdown links whose target is a local `.md` document that
is not present in the current build, turning `[text](missing.md)` into plain `text`.
Links whose target *is* in the build are untouched, so:

- the full and internal builds keep every link clickable,
- GitHub keeps rendering the Markdown source with working links (source is unchanged),
- the public build simply drops the dead cross-tier link to plain text — no 404s.

Directory-style links (`product/`) and external links are never touched.
"""

import os
import re

_MD_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def on_page_markdown(markdown, page, config, files):
    present = {f.src_uri for f in files if f.is_documentation_page()}
    page_dir = os.path.dirname(page.file.src_uri)

    def repl(match):
        text, target = match.group(1), match.group(2)
        # Only consider local links to a .md document (optionally with an #anchor).
        if target.startswith(("http://", "https://", "mailto:", "#", "/")):
            return match.group(0)
        path = target.split("#", 1)[0]
        if not path.endswith(".md"):
            return match.group(0)  # directory-style / non-doc link — leave as is
        resolved = os.path.normpath(os.path.join(page_dir, path))
        if resolved in present:
            return match.group(0)  # target is in this build — keep the link
        return text  # target filtered out — neutralize to plain text

    return _MD_LINK.sub(repl, markdown)
