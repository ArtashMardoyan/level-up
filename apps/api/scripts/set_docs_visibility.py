#!/usr/bin/env python3
"""Add a ``visibility`` field to each doc's YAML front matter (default: internal).

Deterministic and idempotent (documentation portal, M4 phase P3). It only *inserts*
the field when it is absent; it never changes an existing value or any other content.
Docs without front matter (the chapter files that inherit ownership from their folder
README) are left untouched — the visibility filter treats them as ``internal`` by default.

Usage:
    python3 scripts/set_docs_visibility.py --check [paths…]   # dry run
    python3 scripts/set_docs_visibility.py         [paths…]   # apply
"""

from __future__ import annotations

import glob
import sys

DEFAULT_VISIBILITY = "internal"


def add_visibility(text: str, value: str):
    if not text.startswith("---\n"):
        return None, "no-frontmatter"
    end = text.find("\n---\n", 4)
    if end == -1:
        return None, "malformed-frontmatter"
    fm = text[4:end]
    if any(line.strip().startswith("visibility:") for line in fm.splitlines()):
        return None, "already-set"
    return text[:end] + f'\nvisibility: "{value}"' + text[end:], "added"


def main() -> int:
    args = sys.argv[1:]
    check = "--check" in args
    paths = [a for a in args if not a.startswith("--")]
    files = sorted(paths) if paths else sorted(glob.glob("docs/**/*.md", recursive=True))

    added = skipped = 0
    for path in files:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        new, info = add_visibility(text, DEFAULT_VISIBILITY)
        if new is None:
            skipped += 1
            continue
        added += 1
        print(f"  {'would add' if check else 'added'}: {path}")
        if not check:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new)

    print(f"\n{'[check] ' if check else ''}visibility added: {added} · skipped: {skipped}")
    return 1 if (check and added) else 0


if __name__ == "__main__":
    raise SystemExit(main())
