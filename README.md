# ReStartHer

**Your career. Your comeback. Your future.**

ReStartHer is an agentic AI platform designed for women returning to work after a career break. It bridges the return-to-work gap by combining deterministic skill evaluation, adaptive learning roadmaps, human-in-the-loop job scouting, and autonomous AI agents embedded across dedicated workspaces for **Learners**, **Trainers**, and **Administrators**.

---

## 🌟 Key Highlights & National-Level Hackathon Features

1. **Three Dedicated Role-Based Workspaces**:
   - **Learner / Listener (`/app`)**: Personalized daily roadmap, practice challenges, deterministic quizzes, 6 Jotform AI coaches, interview prep, job match analytics, and tailored application drafts.
   - **Trainer / Mentor (`/trainer`)**: Caseload management, learner progress tracking, custom task assignment, private mentoring observations, and cohort readiness telemetry.
   - **Administrator (`/admin`)**: Platform governance, user and mentor provisioning, Recharts cohort analytics, live Neon Postgres & SQLite health telemetry, and AI agent health checks.

2. **6 Verified Autonomous Jotform AI Agents**:
   - **Profile Intake AI** (`01a1de02216070008ef9ea7886d80c2c3a1d`, Aqua `#2FC9E3`): Friendly interview-style onboarding and career break context intake.
   - **Skill Gap Explainer AI** (`01a1de36f0e8700086166b4a851c6cc3ee54`, Tangerine `#FF9A3D`): Deep-dive into technical gap analysis and industry benchmark demands.
   - **Tutor Coach AI** (`01a1de4d9d9870008b817a17a82f4df6c01f`, Lime `#43D98C`): 24/7 Socratic coding tutor grounded in the learner's active roadmap.
   - **Interview Coach AI** (`01a1de720200700080d531f4ede929161334`, Strawberry `#FF5C8A`): Behavioral and technical mock interview prep with structured rubric feedback.
   - **Job Scout AI** (`01a1de9d73187000802c8a3d7e9646b202f9`, Blueberry `#4D8DFF`): Returnship opportunities, skill-fit ranking, and legitimate search link generation.
   - **Application Assistant AI** (`01a1dea7df10700086de70a71d70390e6a24`, Grape `#8E5CFF`): Tailored cover letter and resume summaries framed around transferable strengths.

3. **Dual Persistence Architecture**:
   - **Zero-Config Local SQLite**: Instant setup with zero external dependencies (`backend/storage/restarther.db`).
   - **Serverless Neon PostgreSQL**: Cloud-native production readiness with automatic protocol sanitization (`postgres://` → `postgresql://`) and connection pooling.

4. **Guaranteed Human-in-the-Loop & Safety**:
   - **Zero Auto-Submissions**: Applications are never auto-submitted. The user reviews drafts, clicks "Apply" which opens the employer's page in a new tab, and self-reports status.
   - **No LinkedIn Scraping**: Generates compliant LinkedIn and Google search links that the learner opens herself.
   - **Deterministic Grading**: All skill mastery scores are computed by deterministic code (never hallucinated by LLMs).

---

## 🔑 Pre-Seeded Demo Credentials

The platform seeds ready-to-test accounts on first run:

| Role | Email | Password | Access Path | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@restarther.org` | `AdminSecure123!` | `/admin` | Full platform governance, user management, telemetry |
| **Trainer** | `trainer@restarther.org` | `TrainerSecure123!` | `/trainer` | Mentor dashboard, caseload tracking, task assignment |
| **Learner** | `priya@restarther.org` | `PriyaSecure123!` | `/app` | Priya Raman (5 yrs Java, 4 yr break, Backend roadmap) |

*(Quick-fill buttons for these accounts are available directly on the login page at `/login` when `DEMO_MODE=true`.)*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 2. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run database seed and start API server
python -m uvicorn main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Interactive OpenAPI docs: `http://localhost:8000/docs`

### 3. Frontend Setup & Run

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
- Frontend will be accessible at: `http://localhost:5173`

---

## 🧪 Testing & Verification

The backend has a comprehensive test suite of **101 tests** covering auth, role-based route guards, agent workflows, resume extraction, adaptive replanning, and readiness scoring.

```bash
# Run full test suite
python -m pytest backend/tests -q
```
**Result:** `101 passed in 175s` (100% pass rate).

### Frontend Build Verification

```bash
# Run TypeScript type check and production bundle
cd frontend
npm run build
```
**Result:** Built cleanly with 0 TypeScript and Vite bundling errors.

---

## 🏗️ Architecture & Component Flow

```mermaid
flowchart TD
    subgraph UI["Jelly UI Layer (React 18 + Tailwind)"]
        LP["Landing Page & Auth (/login)"]
        LW["Learner Workspace (/app)"]
        TW["Trainer Workspace (/trainer)"]
        AW["Admin Workspace (/admin)"]
    end

    subgraph API["FastAPI Backend (/api)"]
        Auth["JWT Auth & Role Guard"]
        Orch["Career Orchestrator (StateGraph)"]
        Registry["AI Agent Registry"]
        Readiness["Readiness Engine (Deterministic)"]
    end

    subgraph Agents["6 Jotform AI CDN Agents"]
        J1["Profile Intake AI"]
        J2["Skill Gap Explainer AI"]
        J3["Tutor Coach AI"]
        J4["Interview Coach AI"]
        J5["Job Scout AI"]
        J6["Application Assistant AI"]
    end

    subgraph Storage["Dual Persistence Engine"]
        SQL["SQLite (Default) / Neon PostgreSQL"]
    end

    LP --> Auth
    LW --> Orch
    TW --> API
    AW --> API
    LW --> Agents
    API --> Storage
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the repository root or `backend/`:

```env
# Database (SQLite default or Neon PostgreSQL)
DATABASE_URL=sqlite:///backend/storage/restarther.db
# DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require

# JWT Authentication
SECRET_KEY=restarther-super-secret-jwt-key-2026-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Admin Seed
ADMIN_EMAIL=admin@restarther.org
ADMIN_PASSWORD=AdminSecure123!
DEMO_MODE=true

# AI Provider ("auto", "demo", or "llm")
AI_MODE=auto
ANTHROPIC_API_KEY=
```

---

## 🛡️ Security, Privacy & Design System

- **Bright Jelly Design System**: Built with rich pastel gradients (`#FFF7FC` to `#F1F4FF`), translucent glass cards, squishy responsive buttons, and WCAG AA accessible contrast in both Light and Dark plum modes.
- **Data Privacy**: Resume uploads are strictly scoped to the learner. A "Delete My Data" endpoint is provided. No resume text is ever logged.
- **Isolated Agent Widgets**: Custom script and iframe wrappers prevent multi-widget pollution and DOM collisions between Jotform CDN agents.

---

*Built with passion for returning women in technology.*
