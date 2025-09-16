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
   ```bash
   git clone https://github.com/robin-ochieng/langchain-langgraph-projects.git
   cd langchain-langgraph-projects
   ```

2. **Set up the environment:**
   ```bash
   # UV will automatically create a virtual environment
   uv sync
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your API keys
   # OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the main application:**
   ```bash
   uv run main.py
   ```

5. **Start Jupyter for interactive development:**
   ```bash
   uv run jupyter notebook
   ```

## 📁 Project Structure

```
langchain-langgraph-projects/
├── main.py                 # Main entry point
├── src/                    # Source code modules
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
- Prompt Templates and Chains
- Memory and Context Management

### 2. LangGraph Workflows
- Building State Machines
- Creating Multi-Agent Systems
- Workflow Orchestration
- Error Handling and Retry Logic

### 3. AI Agent Development
- Agent Architecture Patterns
- Tool Integration
- Memory Systems
- Planning and Reasoning

## 🔧 Development

### Adding Dependencies

```bash
# Add a new dependency
uv add package-name

# Add development dependency
uv add --dev package-name
```

### Running Tests

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
```
