# SWAROOP (स्वरूप) — “Resume nahi, hunar hai.”

> **HackShift 2.0 | Team PRAHAAR**  
> Voice-first, assisted-access trust and discovery platform for informal skilled workers (electricians, plumbers, masons, painters, AC technicians, and carpenters).

---

## 📌 Project Overview

Millions of skilled informal trade workers across India do not have traditional LinkedIn profiles, resumes, or credit histories. **SWAROOP** bridges this trust deficit:
1. **Voice-First & Vernacular Onboarding**: Workers describe their experience in Hindi, Hinglish, or English via audio or text. AI maps spoken claims to an explicit skill taxonomy (zero hallucination).
2. **Dynamic Skill Passport**: A public, shareable link (`/w/:slug`) with a scannable QR code showcasing verified skills and work evidence without exposing personal contact details to the open internet.
3. **Truthful 3-Tier Trust Ladder**:
   - **Level 1 (Self-declared)**: Basic profile creation and declared trade experience.
   - **Level 2 (Evidence-backed)**: Worksite photos uploaded with AI-assisted trade-consistency verification.
   - **Level 3 (Independently Assessed)**: Strictly certified in-person by an authorized facilitator at a local *Sewa Kendra*. AI is never permitted to grant Level 3 unilaterally.
4. **Transparent Customer Discovery**: Explainable match score (0–100) combining geographic proximity (Haversine distance across Delhi NCR) and skill compatibility.
5. **Itemised Quotation & Booking Flow**: Formal digital estimates and booking statuses to eliminate billing disputes.

---

## 🛠️ Verified Tech Stack

### Frontend (`client/`)
- **Framework**: React 18 (`react`, `react-dom` v18.3.1)
- **Tooling & Dev Server**: Vite 6 (`@vitejs/plugin-react` v4.3.4)
- **Language**: TypeScript 5 (`typescript` v5.7.2)
- **Styling**: Tailwind CSS v3 (`tailwindcss` v3.4.17, `postcss`, `autoprefixer`)
- **Icons & UI**: Lucide React (`lucide-react` v1.16.0)
- **QR Engine**: QR Code (`qrcode`, `@types/qrcode`)
- **API Proxy**: Configured in `client/vite.config.ts` (`/api` and `/uploads` proxy to `http://127.0.0.1:8000`)

### Backend (`server/`)
- **Framework**: FastAPI (`fastapi` >= 0.110.0)
- **ASGI Server**: Uvicorn (`uvicorn[standard]` >= 0.28.0)
- **Configuration & Validation**: Pydantic v2 & Pydantic Settings (`pydantic`, `pydantic-settings`)
- **Database**: MongoDB Atlas (`pymongo[srv]` >= 4.6.0) with an automatic deterministic in-memory demo store fallback when `MONGODB_URI` is unset or unreachable.
- **File Uploads**: `python-multipart`
- **Speech-to-Text / AI**: Sarvam AI (`saaras:v3` / `saaras:v2` API via `requests`) with grounded regex/taxonomy extraction (`server/app/shared/ai/extractor.py`).

### Testing & Verification
- **Backend Tests**: Pytest 9 (`pytest`, `httpx` for `TestClient`) configured with `pytest.ini`.
- **Frontend Quality**: TypeScript compiler (`tsc --noEmit` via `npm run typecheck` and `npm run lint`).

---

## 📂 Project Structure

```text
Swaroop-HackShift/
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions (venv, node_modules, caches, secrets)
├── package.json              # Root orchestrator scripts (setup, dev, build, lint)
├── pytest.ini                # Pytest configuration (pythonpath = .)
├── requirements.txt          # Python dependencies manifest
├── README.md                 # Project documentation
│
├── client/                   # Frontend React + Vite application
│   ├── index.html            # Single page app entrypoint
│   ├── package.json          # Frontend dependencies & scripts
│   ├── tailwind.config.js    # Tailwind configuration & theme tokens
│   ├── tsconfig.json         # TypeScript strict configuration
│   ├── vite.config.ts        # Vite config with backend API reverse proxy
│   └── src/
│       ├── App.tsx           # Main application router and state
│       ├── main.tsx          # React DOM mounting
│       └── components/       # UI Components (Passport, Onboarding, Discovery, etc.)
│
├── server/                   # Backend FastAPI application
│   ├── requirements.txt      # Backend dependencies manifest mirror
│   └── app/
│       ├── main.py           # FastAPI routes, middleware, and entrypoint
│       ├── config/
│       │   └── settings.py   # Pydantic Settings and environment variable binding
│       └── shared/
│           ├── db.py         # DB store alias
│           ├── mongodb.py    # MongoStore with Atlas driver & in-memory demo store
│           ├── seed_data.py  # Deterministic seed data (Delhi NCR areas, trades, personas)
│           └── ai/
│               ├── extractor.py # Grounded taxonomy extraction engine
│               └── sarvam.py    # Sarvam AI STT client with fallback
│
├── tests/                    # Backend API test suite
│   └── test_core_flow.py     # Health, passport privacy, search, and booking tests
│
├── tools/                    # Node.js orchestration and developer CLI utilities
│   ├── setup.mjs             # Automated environment initializer (creates .env, installs client)
│   ├── dev.mjs               # Concurrent development runner (FastAPI + Vite)
│   ├── run-server.mjs        # Standalone FastAPI server launcher with auto-venv detection
│   ├── health.mjs            # Backend health check ping script
│   └── demo-reset.mjs        # 1-click demo state reset trigger
│
└── docs/                     # Architectural decision records and feature specifications
    ├── DECISIONS.md          # Architecture Decision Records (ADRs)
    ├── STATUS.md             # Implementation matrix and feature completeness
    └── progress.md           # Implementation milestones and log
```

---

## ⚡ Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on `v24.11.0`, npm `v11.6.1`)
- **Python**: `3.10` to `3.13` (verified on `Python 3.13.5`)
- **OS**: Windows, macOS, or Linux (PowerShell or Bash)

---

## 🚀 Quickstart & Setup Guide

### 1. Automated Setup

Run the automated setup utility from the project root:

```bash
npm run setup
```

This automated script:
1. Copies `.env.example` to `.env` if `.env` does not already exist.
2. Ensures the `server/uploads/` local directory exists.
3. Installs all frontend dependencies (`npm --prefix client install`).
4. Checks your Python environment.

---

### 2. Python Backend Virtual Environment

Create and activate a virtual environment, then install the verified backend dependencies:

**Windows (PowerShell):**
```powershell
# Create virtual environment in root .venv
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

### 3. Environment Configuration (`.env`)

The `.env` file controls demo mode, database connectivity, and external APIs:

```ini
APP_ENV=local
DEMO_MODE=true
DEMO_OTP=123456
DEMO_STAFF_PASSWORD=change-me-demo

# MongoDB Atlas Connection
# Leave placeholder or empty to use the built-in deterministic demo store
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/
MONGODB_DATABASE=swaroop

# Security & CORS
JWT_SECRET=replace_with_a_random_secret
JWT_TTL_MINUTES=120
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Voice / AI Services
AI_MODE=mock
SARVAM_API_KEY=your_sarvam_api_key_here
GEMINI_API_KEY=

# Storage & Endpoints
STORAGE_BACKEND=local
UPLOAD_DIR=server/uploads
VITE_API_BASE=/api/v1
VITE_DEMO_TOOLS=true
```

> **Security Note**: Never commit `.env` or paste real credentials into chat or public pull requests. `.gitignore` is pre-configured to strictly ignore `.env` and `.env*.local`.

---

## 💻 Running the Application

### Option A: Run Full Stack Concurrently (Recommended)

Starts both the FastAPI backend (`http://127.0.0.1:8000`) and the Vite React client (`http://localhost:5173`):

```bash
npm run dev
```

*(The runner automatically detects `.venv` Python without needing manual activation).*

### Option B: Run Services Separately

**Terminal 1 — FastAPI Backend:**
```bash
npm run dev:server
# Alternatively:
# .\.venv\Scripts\python.exe -m uvicorn server.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- OpenAPI JSON: [http://127.0.0.1:8000/api/v1/openapi.json](http://127.0.0.1:8000/api/v1/openapi.json)

**Terminal 2 — React Client:**
```bash
npm run dev:client
```
Access the application at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Verification Commands

| Command | Target | Description | Verified Status |
|---|---|---|---|
| `npm run api:health` | Backend | Tests if the FastAPI server is reachable at `/api/v1/health` | **PASSED** (HTTP 200) |
| `npm run typecheck` | Frontend | Typechecks TypeScript across `client/src` without emitting JS | **PASSED** (0 errors) |
| `npm run lint` | Frontend | Validates client source code types | **PASSED** (0 errors) |
| `npm run build` | Frontend | Builds production static bundle into `client/dist/` | **PASSED** (`vite build` in ~2s) |
| `pytest` | Backend | Runs unit and integration tests in `tests/` | **5 Passed / 4 Requiring Live Atlas** |
| `npm run demo:reset` | Full Stack | Resets worker states and bookings to deterministic seeds | **PASSED** |

### Backend Test Suite Breakdown (`tests/test_core_flow.py`)
Run with:
```powershell
.\.venv\Scripts\pytest.exe
```
- **Passed Checks**:
  - `test_privacy_no_phone_in_public_passport`: Asserts worker phone numbers are never leaked in public passport endpoints (`/api/v1/public/workers/:slug`).
  - `test_unknown_public_passport_returns_not_found`: Correct 404 response for non-existent profiles.
  - `test_matching_search_breakdown`: Category & location search score breakdown (skill score <= 40, location <= 25).
  - `test_contractor_project_and_squad`: Project creation and squad aggregation.
  - `test_evidence_file_upload_multipart`: Multipart file upload handling.
- **Tests Requiring Live Atlas Connection**:
  - `test_health_check_mongodb`: Asserts `database_connected == True`. When running locally in demo mode without a configured `MONGODB_URI`, the server safely falls back to the in-memory store (`database_connected == False`). Provide a live Atlas URI in `.env` to pass this test.
  - Teammate-owned endpoints under active development on `feature/Utkarsh-api-testing`.

---

## 🔒 Security Best Practices

1. **Zero Secret Leaks**: `.gitignore` comprehensively excludes `.env`, `.env.local`, `.venv/`, `__pycache__/`, `dist/`, `.pytest_cache/`, and uploaded media files.
2. **Privacy by Default**: Public Skill Passports (`/api/v1/public/workers/:slug`) strip phone numbers and private user IDs.
3. **Taxonomy Grounding**: AI profile extraction matches user input against hardcoded Delhi NCR areas and trades in `seed_data.py`. No unverified skills can be hallucinated into worker profiles.
4. **Human-in-the-Loop Gate**: Level 3 trust certification can only be submitted through the facilitator endpoint; AI algorithms are strictly blocked from granting Level 3.

---

## 👥 HackShift Team Roles & Git Workflow

- **Branching Strategy**:
  - `main`: Production-ready, protected branch.
  - `feature/siddhant-project-setup-docs`: Project setup, tech-stack verification, `.gitignore`, dependency manifests, setup automation, and documentation.
  - `feature/shreyas-worker-ux`: Worker onboarding UX, vernacular voice flows, and audio capture.
  - `feature/Utkarsh-api-testing`: Backend API testing, test suites, and integration tests.
- **Contribution Rules**:
  - Never push directly or force-push to `main`.
  - Always submit a Pull Request from the feature branch into `main` for review.
