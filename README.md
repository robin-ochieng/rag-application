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

```bash
# Add a new dependency
## Deploying the Gradio UI Online

### Render (Blueprint)

This repo includes a `render.yaml` that defines two web services: the FastAPI backend and a Gradio UI.

1. Push your changes to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Add missing environment variables as protected secrets for both services:
    - `OPENAI_API_KEY`, `PINECONE_API_KEY2`, `INDEX_NAME2` (required)
    - `PUBLIC_CLIENT_ORIGIN` and `BACKEND_API_KEY` (backend optional)
4. Deploy. Render will build two services:
    - `insurance-act-rag-api` (FastAPI)
    - `insurance-act-gradio` (Gradio, served on port `7860`)

The Gradio service will get a public URL like `https://insurance-act-gradio.onrender.com` that you can share.

### Google Cloud Run (alternative)

```powershell
uv add package-name

# Add development dependency
uv add --dev package-name
```

### Running Tests


### Hugging Face Spaces (alternative)

1. Create a new Space (Gradio) and point it to this repo or upload `gradio_app.py` and `requirements.txt`.
2. Set Space Secrets: `OPENAI_API_KEY`, `PINECONE_API_KEY2`, `INDEX_NAME2`.
3. The Space URL is public by default and can be shared with colleagues.

```bash
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
2. For Image, set:
   `ghcr.io/<OWNER>/<REPO>/insurance-act-rag-api:latest`
3. Add environment variables as documented above.
4. Under “Deploy Script”, leave default because the image already starts via `CMD`.
5. Authentication: If your GHCR is private, provide a deploy key or a registry auth token; public images need no auth.

Alternatively, you can let Render auto-build from this repo (as previously described) and ignore GHCR.
```

## 📥 Ingestion (Add Documents)

- Put source files under `data/documents/` (subfolders OK). Supported: `.pdf`, `.txt`, `.md`.
- The pipeline splits, deduplicates by content hash, and upserts to Pinecone with deterministic IDs.
- Existing `InsuranceAct.pdf` is included automatically (from repo root or `www/`).

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
