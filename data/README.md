# Data Folder

- Put source documents for ingestion under `data/documents/`.
- Subfolders are allowed and included automatically.
- Supported formats: `.pdf`, `.txt`, `.md`.

Quick start on Windows PowerShell:

```
# Ensure virtualenv is activated and env vars set (.env)
uv run python -m ingestion.cli
```

To target specific files or folders:

```
uv run python -m ingestion.cli --pattern "data/documents/Insurance/**/*.pdf" --pattern "data/documents/**/*.md"
```
