# 🤖 DevPilot AI

> **Autonomous Software Debugging & Code Intelligence Platform**  
> Final-Year Engineering Project | FastAPI · React · OpenAI GPT-4o · ChromaDB · RAG

[![CI/CD](https://github.com/Rushibhosale18/DevPilot-AI/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Rushibhosale18/DevPilot-AI/actions)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 What is DevPilot AI?

DevPilot AI is a full-stack AI platform that understands your **entire GitHub codebase** and provides:

| Feature | Description |
|---|---|
| 🐛 **Bug Detection** | Finds logic errors, null dereferences, race conditions with root-cause analysis |
| 🔐 **Security Audit** | OWASP Top 10 scanner — SQL injection, XSS, hardcoded secrets |
| 📋 **Code Review** | Senior engineer's perspective on quality, SOLID, architecture |
| 🧪 **Test Generation** | Auto-generates comprehensive pytest/jest unit tests |
| 💡 **Code Explanation** | Plain-English breakdown of complex code with complexity analysis |
| 🔧 **Fix Suggestions** | Corrected code snippets with before/after comparison |
| 🔀 **PR Review** | Auto-posts AI review comment when a pull request is opened |
| 💬 **AI Chat** | RAG-powered Q&A about your entire codebase |

---

## 🏗️ Architecture

```
devpilot-ai/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # REST endpoints
│   │   │   ├── auth.py        # JWT + GitHub OAuth
│   │   │   ├── repositories.py# Repo CRUD + background indexing
│   │   │   ├── analysis.py    # All 8 AI analysis types
│   │   │   └── github_webhooks.py # PR auto-review webhook
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic settings
│   │   │   ├── database.py    # SQLAlchemy setup
│   │   │   └── security.py    # JWT/bcrypt
│   │   ├── engines/
│   │   │   ├── rag_engine.py  # ChromaDB vector store + OpenAI embeddings
│   │   │   └── debug_engine.py# LLM orchestration (8 analysis modes)
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── services/
│   │   │   └── github_service.py # Clone, extract, PR diffs (PyGithub)
│   │   └── main.py            # FastAPI app entry point
│   ├── tests/                 # pytest test suite
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                  # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardPage.tsx   # Repo management
│   │   │   ├── RepositoryPage.tsx  # File browser + analysis launcher
│   │   │   ├── AnalysisPage.tsx    # Results display (all types)
│   │   │   └── ChatPage.tsx        # RAG-powered chat UI
│   │   ├── services/api.ts         # Axios API client
│   │   ├── store/authStore.ts      # Zustand auth state
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── .github/workflows/ci-cd.yml    # GitHub Actions CI/CD
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, Python 3.11, Uvicorn |
| **AI / LLM** | OpenAI GPT-4o-mini / GPT-4o |
| **Vector DB** | ChromaDB (local persistent, cosine similarity) |
| **Embeddings** | OpenAI text-embedding-3-small |
| **GitHub** | PyGithub, Git clone (subprocess) |
| **Database** | SQLite (dev) / PostgreSQL (prod) via SQLAlchemy |
| **Auth** | JWT (python-jose) + bcrypt + GitHub OAuth |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | Zustand + TanStack Query |
| **Charts** | Recharts |
| **CI/CD** | GitHub Actions |
| **Deploy** | Docker + Render (backend) + Vercel (frontend) |

---

## 🛠️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git
- OpenAI API key ([get one here](https://platform.openai.com))

### 1. Clone the repo
```bash
git clone https://github.com/Rushibhosale18/DevPilot-AI.git
cd DevPilot-AI
```

### 2. Backend setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — add your OPENAI_API_KEY and GITHUB_TOKEN

# Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/api/docs

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

App available at: http://localhost:3000

### 4. Run with Docker (optional)
```bash
# From project root
docker-compose up --build
```

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `GITHUB_TOKEN` | GitHub PAT (repo + read:user scope) | Recommended |
| `SECRET_KEY` | 32-byte random hex for JWT | ✅ |
| `DATABASE_URL` | SQLite or PostgreSQL URL | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | For OAuth login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App secret | For OAuth login |
| `LLM_MODEL` | `gpt-4o-mini` (cheap) or `gpt-4o` | Optional |

---

## 🌐 Deployment

### Backend → Render.com
1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables in Render dashboard
6. Add deploy hook URL to GitHub Secrets as `RENDER_DEPLOY_HOOK`

### Frontend → Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add `VITE_GITHUB_CLIENT_ID` environment variable
4. Add Vercel token to GitHub Secrets as `VERCEL_TOKEN`

---

## 🧠 How the RAG System Works

```
GitHub Repo
    │
    ▼
Clone (git shallow)
    │
    ▼
Extract code files (.py, .js, .ts, .java, ...)
    │
    ▼
Chunk into 80-line overlapping windows
    │
    ▼
Embed via OpenAI text-embedding-3-small
    │
    ▼
Store in ChromaDB (cosine similarity index)
    │
    ▼  (at query time)
User Query → Embed → Top-K semantic search
    │
    ▼
Relevant chunks + user query → GPT-4o → Structured JSON response
```

---

## 📊 Interview Talking Points

> Use these when explaining the project to interviewers:

1. **RAG Architecture** — Explain chunking, embedding, vector search, context injection
2. **Prompt Engineering** — 8 specialized system prompts, JSON mode, confidence scoring
3. **Background Processing** — FastAPI BackgroundTasks for async repo indexing
4. **Security** — JWT auth, bcrypt passwords, path traversal prevention, webhook HMAC verification
5. **GitHub Integration** — OAuth, PAT-authenticated cloning, PR diff parsing, comment posting
6. **Full-Stack Design** — REST API design, Zustand state management, optimistic UI, polling
7. **Testing Strategy** — Unit tests with mocked LLM/DB, integration tests with TestClient
8. **DevOps** — Docker multi-stage build, GitHub Actions CI/CD, Render + Vercel deployment

---

## 📄 License

MIT License — feel free to use and modify for your own projects.

---

*Built with ❤️ as a final-year engineering project | Targeting 10–20+ LPA fresher roles*
