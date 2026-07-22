"""Treat each folder's README.md as its section index at build time.

Our documentation standard uses README.md as the entry point of every folder (so
GitHub renders it automatically). MkDocs uses index.md as a section index instead.
This hook publishes each README.md at its section's index URL **without renaming the
source file** — the docs source stays unchanged and portable (ADR-0005 §10).
"""

import os

from mkdocs.structure.files import File, Files

_README = "README.md"


def on_files(files, config, **kwargs):
    remapped = []
    for f in files:
        if f.is_documentation_page() and os.path.basename(f.src_uri) == _README:
            index_uri = f.src_uri[: -len(_README)] + "index.md"
            new_file = File(
                index_uri,
                config["docs_dir"],
                config["site_dir"],
                config["use_directory_urls"],
            )
            # Read the real README.md content while publishing at the index URL.
            new_file.abs_src_path = f.abs_src_path
            remapped.append(new_file)
        else:
            remapped.append(f)

    return Files(remapped)
