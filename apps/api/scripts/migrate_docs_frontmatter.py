#!/usr/bin/env python3
"""Migrate standardized doc metadata from the blockquote header into YAML front matter.

Conservative and deterministic (documentation portal, M4 phase P2):

- Moves ONLY the ``> **Status:** …`` header line into YAML front matter.
- Leaves everything else untouched — including any ``> **Derived from: …**`` line,
  which stays visible in the body.
- Idempotent: a file that already begins with front matter is skipped.
- Self-validating: for every file it asserts that the document body (everything after
  the front matter) is byte-for-byte the original body with just the metadata line
  (and one trailing blank line) removed — so no functional content can change.

Usage:
    python3 scripts/migrate_docs_frontmatter.py --check [paths…]   # dry run, writes nothing
    python3 scripts/migrate_docs_frontmatter.py         [paths…]   # apply

With no paths, processes every ``*.md`` under ``docs/``.
"""

from __future__ import annotations

import glob
import re
import sys

FIELD_MAP = {
    "Status": "status",
    "Owner": "owner",
    "Reviewers": "reviewers",
    "Last updated": "last_updated",
    "Date": "date",
    "Deciders": "deciders",
}
LIST_FIELDS = {"reviewers", "deciders"}
ORDER = ["status", "owner", "reviewers", "date", "deciders", "last_updated"]
META_RE = re.compile(r"^>\s*\*\*Status:\*\*")


def yaml_str(value: str) -> str:
    """Quote a scalar as a YAML double-quoted string (keeps dates/placeholders as text)."""
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def parse_meta(line: str) -> dict:
    body = line.lstrip(">").strip()
    fields: dict = {}
    for segment in body.split("·"):
        m = re.match(r"\s*\*\*([^:*]+):\*\*\s*(.*)", segment.strip())
        if not m:
            continue
        key, val = m.group(1).strip(), m.group(2).strip()
        fm = FIELD_MAP.get(key)
        if not fm:
            continue
        if fm in LIST_FIELDS:
            fields[fm] = [v.strip() for v in val.split(",") if v.strip()]
        else:
            fields[fm] = val
    return fields


def build_frontmatter(fields: dict) -> str:
    lines = ["---"]
    for key in ORDER:
        if key not in fields:
            continue
        value = fields[key]
        if isinstance(value, list):
            lines.append(f"{key}:")
            lines.extend(f"  - {yaml_str(item)}" for item in value)
        else:
            lines.append(f"{key}: {yaml_str(value)}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def migrate_text(text: str):
    """Return (new_text, fields) or (None, reason)."""
    if text.startswith("---\n") or text.startswith("---\r\n"):
        return None, "already-frontmatter"

    lines = text.splitlines(keepends=True)
    start = next((i for i, ln in enumerate(lines[:10]) if META_RE.match(ln)), None)
    if start is None:
        return None, "no-metadata-header"

    # Consume consecutive blockquote lines that hold metadata fields. Metadata may span
    # more than one `>` line (e.g. Status/Owner on one, Reviewers/Last updated on the
    # next). Stop at the first `>` line with no known fields — e.g. `> **Derived from:
    # …**` — which is kept as visible content.
    fields: dict = {}
    end = start
    while end < len(lines) and lines[end].lstrip().startswith(">"):
        parsed = parse_meta(lines[end])
        if not parsed:
            break
        fields.update(parsed)
        end += 1

    if "status" not in fields:
        return None, "unparseable-header"

    # Remove the metadata block and one immediately-following blank line, so spacing
    # stays clean in both cases (with and without a following "Derived from" line).
    del lines[start:end]
    if start < len(lines) and lines[start].strip() == "":
        del lines[start]
    body = "".join(lines)

    new_text = build_frontmatter(fields) + body

    # Self-validation: stripping the front matter must reproduce the body exactly.
    stripped = re.sub(r"^---\n.*?\n---\n\n", "", new_text, count=1, flags=re.DOTALL)
    assert stripped == body, "body changed during migration — aborting"

    return new_text, fields


def main() -> int:
    args = sys.argv[1:]
    check = "--check" in args
    paths = [a for a in args if not a.startswith("--")]
    files = sorted(paths) if paths else sorted(glob.glob("docs/**/*.md", recursive=True))

    migrated = skipped = 0
    for path in files:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        new_text, info = migrate_text(text)
        if new_text is None:
            skipped += 1
            continue
        migrated += 1
        fieldset = ", ".join(f"{k}={info[k]}" for k in ORDER if k in info)
        print(f"  {'WOULD MIGRATE' if check else 'migrated'}: {path}")
        print(f"      -> {fieldset}")
        if not check:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new_text)

    print(f"\n{'[check] ' if check else ''}migrated: {migrated} · skipped: {skipped}")
    return 1 if (check and migrated) else 0


if __name__ == "__main__":
    raise SystemExit(main())
