# LangChain & LangGraph Course Project

A comprehensive course project for learning to develop intelligent AI agents using LangChain and LangGraph frameworks. This repository contains hands-on examples, practical implementations, and best practices for building production-ready AI applications.

## 🚀 Features

- **LangChain Integration**: Learn the fundamentals of LangChain for building LLM applications
- **LangGraph Workflows**: Master advanced workflow orchestration with LangGraph
- **AI Agent Development**: Build sophisticated AI agents with memory and reasoning capabilities
- **Production Ready**: Environment configuration and best practices included
- **Jupyter Notebooks**: Interactive learning with comprehensive examples

## 🛠️ Technologies Used

- **Python 3.13+**: Latest Python features and performance improvements
- **LangChain**: Framework for building LLM applications
- **LangGraph**: Advanced workflow orchestration for AI agents
- **UV**: Ultra-fast Python package manager and environment management
- **Jupyter**: Interactive development environment
- **OpenAI API**: GPT integration for AI capabilities

## 📋 Prerequisites

- Python 3.13 or higher
- UV package manager
- OpenAI API key (or other LLM provider API key)
- Git for version control

## 🚀 Quick Start

1. **Clone the repository:**
   ```

   uv sync
   ```

   # Edit .env and add your API keys
   # OPENAI_API_KEY=your_openai_api_key_here
   ```

   ```

5. **Start Jupyter for interactive development:**
   ```bash
   uv run jupyter notebook
   ```

## 📁 Project Structure

```
├── notebooks/              # Jupyter notebooks with examples
├── examples/               # Standalone example scripts
├── pyproject.toml          # Project configuration and dependencies
├── uv.lock                 # Dependency lock file
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore patterns
└── README.md              # This file
```

## 📚 Course Modules

### 1. LangChain Basics
- Setting up LangChain
- Working with LLMs and Chat Models
### 2. LangGraph Workflows
- Building State Machines

### 3. AI Agent Development
- Agent Architecture Patterns
- Tool Integration
- Memory Systems
- Planning and Reasoning

## 🔧 Development

### Adding Dependencies

```powershell
# Add a new dependency (example)
uv add package-name

# Add a development dependency
uv add --dev package-name
```

### Running Tests

```powershell
# Run tests (when test suite is added)
uv run pytest
```

### Code Formatting

```bash
# Format code (when formatter is added)
uv run ruff format
```

## 📖 Learning Resources

- [LangChain Documentation](https://python.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Robin Ochieng**
- GitHub: [@robin-ochieng](https://github.com/robin-ochieng)

## 🙏 Acknowledgments

- LangChain team for the amazing framework
- OpenAI for providing powerful LLM APIs
- The open-source community for inspiration and tools

## 📞 Support

If you have any questions or need help getting started, please open an issue or reach out through GitHub discussions.

---

⭐ **Star this repository if you find it helpful!**

## 🚢 Deploying the API to Render

This repo includes a Dockerfile and a `render.yaml` for deploying the FastAPI backend.

### 1) Create a new Web Service
- Go to https://dashboard.render.com and click "New" → "Web Service".
- Choose "Build and deploy from a Git repository" and select this repo.
- Render will auto-detect Docker via the `Dockerfile`.

### 2) Configure service settings
- Name: `insurance-act-rag-api`
- Region/Plan: choose your preferred region and the Free plan (as in `render.yaml`).
- Health Check Path: `/healthz`

### 3) Environment variables
Add the following Environment Variables in the Render dashboard:
- `OPENAI_API_KEY` (Secret) — your OpenAI API key
- `PINECONE_API_KEY2` (Secret) — your Pinecone API key
- `INDEX_NAME2` — your Pinecone index name
- `PUBLIC_CLIENT_ORIGIN` — the exact URL of your frontend (e.g., `https://your-frontend-domain.com`). Use `*` only for local testing.
- `BACKEND_API_KEY` (Secret, optional) — if set, all requests must include `X-API-KEY: <value>`.

Alternatively, connect `render.yaml` as a Blueprint and Render will prompt for missing variables with `sync: false`.

### 4) Deploy
- Click "Create Web Service". Render builds the image and deploys it.
- After deploy, visit `https://<your-service>.onrender.com/healthz` to verify.
- POST `https://<your-service>.onrender.com/chat` with JSON `{ "message": "..." }` to query the RAG. If `BACKEND_API_KEY` is set, include header `X-API-KEY`.

### Local Docker test (optional)
```bash
docker build -t insurance-act-rag-api:local .
docker run --rm -p 8080:8080 --env-file .env insurance-act-rag-api:local
curl -s http://localhost:8080/healthz
curl -s -X POST http://localhost:8080/chat -H "content-type: application/json" -d '{"message":"What is the scope of the Insurance Act?"}'

## 🔒 Security & Limits

- CORS is locked to `PUBLIC_CLIENT_ORIGIN`.
- Optional header auth via `BACKEND_API_KEY` and `X-API-KEY` header.
- Rate limiting: 10 requests/min per client IP (SlowAPI).

Example with API key header:

```bash
curl -s -X POST http://localhost:8080/chat \
   -H "content-type: application/json" \
   -H "X-API-KEY: $BACKEND_API_KEY" \
   -d '{"message":"Summarize the Insurance Act"}'
```

## 🐳 Publishing Docker Image to GHCR

This repo includes a GitHub Actions workflow that builds and publishes the image to GitHub Container Registry (GHCR).

- File: `.github/workflows/docker.yml`
- Triggers: push to `main` (build + push), PRs to `main` (build only)
- Image name: `ghcr.io/<OWNER>/<REPO>/insurance-act-rag-api:latest`

### How it works
- Logs in to GHCR using `GITHUB_TOKEN`.
- Caches `pip` and uses Buildx GHA cache for faster builds.
- Push occurs only on push events to `main`.

### Render using GHCR (optional)
Instead of auto-building from the repo, you can point Render at the GHCR image:

1. Create a Web Service on Render and choose “Docker” as environment.
2. For Image, set: `ghcr.io/<OWNER>/<REPO>/insurance-act-rag-api:latest`
3. Add environment variables as documented above.
4. Under “Deploy Script”, leave default because the image already starts via `CMD`.
5. Authentication: If your GHCR is private, provide a deploy key or a registry auth token; public images need no auth.

Alternatively, you can let Render auto-build from this repo and ignore GHCR.
```

## 📥 Ingestion (Add Documents)

- Put source files under `data/documents/` (subfolders OK). Supported: `.pdf`, `.txt`, `.md`.
- The pipeline splits, deduplicates by content hash, and upserts to Pinecone with deterministic IDs.
  

PowerShell quick start:

```powershell
# Ensure your virtualenv is active and .env has keys
# Required: OPENAI_API_KEY, PINECONE_API_KEY2, INDEX_NAME2
uv run python -m ingestion.cli
```

Target specific files or folders:

```powershell
uv run python -m ingestion.cli --pattern "data/documents/**/*.pdf" --pattern "data/documents/**/*.md"
```

Notes:
- Uses OpenAI `text-embedding-3-large` to match the RAG setup.
- Aborts if Pinecone index dimension does not match the embedding size.
- Metadata includes `source` (relative path), `page`, and chunk `sha1` for traceability.

## Ingestion & Namespace Audit Guide

This project supports multiple Pinecone namespaces (e.g. `insurance-act`, `ifrs-17`). Below is the robust workflow for adding new document sets and verifying they are fully ingested.

### 1. Install / Update Dependencies

`cryptography` is required for some PDFs (object streams / encryption). Ensure your virtualenv is active and run:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Ingest a Namespace

```powershell
python -m ingestion.cli --namespace ifrs-17 --pattern "data/ifrs-17/*.pdf"
```

Output example:
```
Created 812 chunks; upserted 790 unique chunks to Pinecone (namespace='ifrs-17').
Wrote manifest to data/_manifests/ifrs-17.json
```

If you see a failure referencing `cryptography`, ensure it is installed and retry.

### 3. Manifest

Each ingestion run writes `data/_manifests/<namespace>.json` containing per-file chunk counts and a timestamp. Commit this if you want traceability.

### 4. Quick Retrieval Sanity Check

Use `quick_check.py` to see which files surface for one or more queries:

```powershell
python quick_check.py --queries "IFRS 17 simplified approach,CSM calculation" --k 40
```

Absence of some files here does not necessarily mean they weren’t ingested (it’s relevance ranked).

### 5. Namespace Audit Script

For a deeper check (sampling-based) run:

```powershell
python scripts/audit_namespace.py --namespace ifrs-17 --expect-pattern "data/ifrs-17/*.pdf" --top-k 40
```

It compares:
- Manifest file list
- Sampled retrieval metadata (multiple broad probe queries)
- Files on disk matching the pattern

If any expected file is entirely absent from both the manifest and sampled retrieval results, the script exits non-zero.

### 6. Environment Variables for Multi-Namespace Retrieval

Set `INDEX_NAMESPACES` to a comma-separated list to allow queries across multiple namespaces:

```powershell
$env:INDEX_NAMESPACES = "insurance-act,ifrs-17"
```

The retrieval code splits the requested `k_total` across namespaces and merges results with simple de-duplication.

### 7. Re-Ingestion / Updates

If you replace PDFs, re-run the ingestion command. Chunks are keyed by content hash so unchanged text won’t duplicate.

### 8. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `pypdf.errors.DependencyError: cryptography>=3.1 is required` | Missing cryptography | Install dependency and retry |
| Zero matches from a namespace | Wrong namespace or no docs ingested | Verify manifest existence and ingestion output |
| Duplicated file names in retrieval | Multiple ranked chunks from same file | Normal behavior |
| File missing from quick check but present in manifest | Query not relevant enough | Increase `--k` or broaden queries |

### 9. CI / Future Automation

You can wire `scripts/audit_namespace.py` into CI to block merges if ingestion drifts from expected source files.

