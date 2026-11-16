# ReStartHer: AI-Powered Career Re-Entry Ecosystem for Women in Tech

<div align="center">

![ReStartHer Banner](https://img.shields.io/badge/ReStartHer-AI--Powered%20Career%20Re--Entry-4F46E5?style=for-the-badge&logo=sparkles&logoColor=white)

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind%20CSS-38BDF8?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL%20%7C%20SQLite-00E599?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![AI Squad](https://img.shields.io/badge/AI%20Coaches-6%20Specialized%20Agents-EC4899?style=flat-square&logo=openai&logoColor=white)]()
[![Mentorship](https://img.shields.io/badge/Mentorship-WebRTC%20Live%20Video%20Room-10B981?style=flat-square&logo=webrtc&logoColor=white)]()
[![Tests](https://img.shields.io/badge/Tests-103%20Passed%20%7C%20100%25-brightgreen?style=flat-square&logo=pytest&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**"Your career. Your comeback. Your future."**

*A production-grade, agentic career re-entry platform that erases the career break penalty for women in technology through autonomous multi-agent coaching, adaptive daily micro-learning, interactive mentor video sessions, and verified returnship opportunity intelligence.*

[Explore Features](#-key-capabilities--innovations) • [AI Coaching Squad](#-the-6-autonomous-ai-coaching-squad) • [12 Comeback Tracks](#-the-12-career-comeback-tracks) • [Live Mentorship Video](#-interactive-1-on-1-mentorship-video-room) • [Quick Start](#-quick-start-guide) • [Deploy to Cloud](#-production-deployment-guide)

</div>

---

## 🌟 Key Capabilities & Innovations

A career pause for caregiving, maternity, relocation, or recovery is **not a handicap**—it is a season of real-world leadership, emotional intelligence, multitasking, and crisis resolution. ReStartHer replaces traditional hiring rejections with an empathetic, supportive, AI-powered accelerator:

- 🤖 **6 Specialized AI Agents**: A synchronized coaching squad guiding every re-entry milestone—from zero-penalty background intake and 2026 tech benchmarking to Socratic coding tutoring, confidence mock interviews, returnship scouting, and application drafting.
- 🎯 **12 Modern Technology Tracks**: Structured curriculums with 2026 benchmarks spanning Backend (Java 21/Spring Boot 3), Full Stack, Frontend, Data Analytics, QA Automation, Cloud/DevOps, Data Engineering, AI/ML, Cybersecurity, Mobile, TPM, and UI/UX.
- 📹 **Built-In Mentorship Video Room**: Browser WebRTC 1-on-1 video call room with real camera/microphone streaming, screen sharing, live mentor observation notes, and instant Google Meet / Jitsi integration.
- 👥 **Three Role-Based Portals**:
  - **Learner Hub (`/app`)**: Dynamic daily comeback roadmap, on-demand AI coaching chatbots, diagnostic quizzes, interview practice, and returnship match scoring.
  - **Trainer & Mentor Portal (`/trainer`)**: Mentee caseload management, customized task assignment, progress tracking, private notes, and live 1-on-1 video rooms.
  - **Admin Governance (`/admin`)**: User & role provisioning, interactive Recharts telemetry, database connection health, and audit logs.
- ⚡ **Dual Persistence Engine**: Native serverless **Neon PostgreSQL** with resilient connection pooling (`pool_pre_ping=True`, `pool_recycle=300`) alongside zero-config local **SQLite** fallback.
- 🛡️ **Empathetic Human-in-the-Loop Safeguards**:
  - **Zero Auto-Submission**: Applications and outreach letters are generated for the candidate, but the candidate always retains full control to edit and submit.
  - **Zero Score Penalty**: Scoring engines completely normalize career pause duration.
  - **Full Privacy**: Complete self-service profile deletion and data export.

---

## 🤖 The 6 Autonomous AI Coaching Squad

Each agent operates with specialized domain intelligence and verified 2026 industry knowledge to guide learners through every step of their return-to-work journey:

| Agent | Theme | Domain and Role | Core Strengths |
| :--- | :---: | :--- | :--- |
| **Profile Intake AI** | `Aqua` | **Onboarding & Background Intelligence** | • Normalizes 1–10+ year career pauses with zero penalty<br>• Discovers transferable skills and prior project history<br>• Identifies ideal daily commitment (1–2 hrs/day) and track match |
| **Skill Gap Explainer AI** | `Tangerine` | **2026 Industry Benchmark Diagnostic** | • Explains ecosystem shifts (Java 8 → 21, Spring Boot 2 → 3, React Hooks)<br>• Categorizes gaps into Critical Refresh, Benchmark, and Bonus Edge<br>• Erases tech intimidation with plain-language context |
| **Tutor Coach AI** | `Lime` | **Socratic Coding Tutor & Doubt Solver** | • 24/7 patient code explanations with runnable examples<br>• Step-by-step guidance on Docker, Kubernetes, SQL Window Functions, APIs<br>• Encouraging, supportive tone designed for returning professionals |
| **Interview Coach AI** | `Strawberry` | **Mock Prep & Confidence Builder** | • "Zero-Apology" career break framing scripts (STAR + C formula)<br>• Technical and behavioral mock interview drills across all 12 tracks<br>• Multi-metric feedback scoring across Technical Depth, Clarity, and Poise |
| **Job Scout AI** | `Blueberry` | **Returnships & Opportunity Matcher** | • Curated catalog of verified corporate returnship programmes<br>• Transparent percentage-based skill match scoring (e.g. 94% Match)<br>• Compliant live search links for LinkedIn, Naukri, and Internshala |
| **Application Assistant AI** | `Grape` | **Materials & Framing Drafter** | • Generates Hybrid Returnee Resumes (competencies before gap)<br>• Google XYZ accomplishment bullets adapted for returners<br>• Tailored returnship cover letters and recruiter cold outreach notes |

---

## 📹 Interactive 1-on-1 Mentorship Video Room

ReStartHer includes a built-in virtual mentorship room so mentors and learners can connect directly within the application without relying on broken external links:

- **WebRTC Camera & Microphone**: Connects to the local webcam and audio hardware with smooth stream controls (toggle camera on/off, mute/unmute).
- **Graceful Fallback Mode**: If no webcam is attached or permission is withheld, an interactive animated live mentor avatar activates seamlessly.
- **Simulated Returnee Stream**: Features live participant feedback, speaking audio wave animation, and agenda indicators.
- **Screen Sharing**: One-click display capture (`getDisplayMedia`) to review code, architecture diagrams, and resume drafts live.
- **Live Mentor Notes Scratchpad**: In-call notepad for observational feedback that saves directly to the learner's profile.
- **Instant External Meeting Links**: Also provides one-click direct links to **Google Meet** (`meet.google.com/new`) and **Jitsi WebRTC** (`meet.jit.si`) for flexibility.

---

## 🎯 The 12 Career Comeback Tracks

ReStartHer provides end-to-end benchmarks, curriculums, assessment quizzes, and interview banks tailored for 12 technology careers:

| # | Comeback Track | Modern 2026 Tech Stack & Focus Areas |
| :-: | :--- | :--- |
| **1** | **Backend Developer** | Java 21 LTS, Spring Boot 3 (`jakarta.*`), RESTful Microservices, SQL, Docker, Kafka |
| **2** | **Full Stack Developer** | React 18/19, TypeScript, Node.js/Express, Next.js, Prisma ORM, PostgreSQL |
| **3** | **Frontend Developer** | React 19, TypeScript, Tailwind CSS, Vite, Core Web Vitals (LCP, INP, CLS), WCAG |
| **4** | **Data Analyst** | Advanced SQL Window Functions (`ROW_NUMBER`, `DENSE_RANK`, `LEAD`), Pandas 2.x, Power BI, Tableau |
| **5** | **QA Automation / SDET** | Playwright (TypeScript/Python), Selenium 4, REST-Assured API Testing, CI/CD Pipelines |
| **6** | **Cloud & DevOps Engineer** | Docker Multi-Stage Builds, Kubernetes Pods/Services, AWS/Azure, GitHub Actions, Terraform |
| **7** | **Data Engineer** | Python ETL, Apache Spark (PySpark), Kafka Event Streaming, Airflow DAGs, Snowflake |
| **8** | **AI & Machine Learning** | Python, PyTorch, Generative AI & Large Language Models (LLMs), RAG Pipelines, Vector DBs |
| **9** | **Cybersecurity Analyst** | Network Defense, OWASP Top 10 remediation, Linux Hardening, IAM Least-Privilege, SIEM |
| **10** | **Mobile App Developer** | React Native, Flutter (Dart), TypeScript, Mobile REST Integration, App Store Deployment |
| **11** | **Technical Product Manager** | Product Strategy, Agile/Scrum Ceremonies, User Stories, Jira, Data Metrics, Technical PRDs |
| **12** | **UI/UX Designer** | Figma Component Variants & Auto-Layout, Design Systems, Usability Testing, Tailwind Tokens |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph UI["Modern Web Experience (React 18 + Vite + Tailwind CSS)"]
        LP["Landing Page & Auth (/login)"]
        LW["Learner Workspace (/app)"]
        TW["Trainer Workspace (/trainer)"]
        AW["Admin Workspace (/admin)"]
        VR["WebRTC Mentorship Video Room"]
    end

    subgraph API["FastAPI Backend Service (/api)"]
        Auth["JWT Authentication & RBAC Guards"]
        Orch["Career Orchestrator (StateGraph Engine)"]
        Readiness["Readiness Diagnostic Engine"]
        TaskEngine["Adaptive Task & Progress Engine"]
    end

    subgraph Squad["6 Synchronized AI Coaching Agents"]
        A1["Profile Intake AI"]
        A2["Skill Gap Explainer AI"]
        A3["Tutor Coach AI"]
        A4["Interview Coach AI"]
        A5["Job Scout AI"]
        A6["Application Assistant AI"]
    end

    subgraph DB["Dual Persistence Engine"]
        PG["Neon Serverless PostgreSQL (Production)"]
        SQL["SQLite (Local Zero-Config Fallback)"]
    end

    LP --> Auth
    LW --> Orch
    TW --> TaskEngine
    TW --> VR
    AW --> API
    LW --> Squad
    Orch --> Readiness
    API --> DB
```

---

## 🔑 Pre-Seeded Demo Accounts

The database automatically seeds 3 comprehensive role-based accounts for instant evaluation:

| Role | Email | Password | Access Route | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Learner (Priya Raman)** | `priya@restarther.org` | `PriyaSecure123!` | `/app` | 4.5 yrs Java exp, 3.5-yr break, Spring Boot 3 comeback track |
| **Trainer / Mentor** | `trainer@restarther.org` | `TrainerSecure123!` | `/trainer` | Cohort caseload, task assignments, 1-on-1 video mentorship room |
| **Platform Admin** | `admin@restarther.org` | `AdminSecure123!` | `/admin` | Complete system governance, user provisioning, database status |

*(One-click demo quick-fill buttons are available on the login page when `DEMO_MODE=true`.)*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**
- **Git**

### 2. Backend Setup
```powershell
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (auto-creates tables and seeds reference data)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/health`

### 3. Frontend Setup
```powershell
# In a separate terminal from project root:
cd frontend

# Install Node packages
npm install

# Start Vite dev server
npm run dev
```
- **Web Application**: `http://localhost:5173`

---

## 🗄️ Neon Serverless PostgreSQL Configuration

ReStartHer connects seamlessly to **Neon Serverless PostgreSQL** while supporting local SQLite for offline development:

1. Configure your `DATABASE_URL` in `.env` or `backend/.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
2. **Connection Pooling Benefits**:
   - `pool_pre_ping=True`: Detects and recovers from stale connections during serverless cold starts.
   - `pool_recycle=300`: Refreshes connections every 5 minutes to prevent idle disconnects.
   - **URI Normalization**: Automatically converts legacy `postgres://` to `postgresql://`.

---

## ☁️ Production Deployment Guide

### Deploy Backend on Render

| Configuration Field | Value |
| :--- | :--- |
| **Service Type** | Web Service |
| **Repository** | `https://github.com/sathwik27-ai/AI-powered-career-re-entry-ecosystem` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/api/health` |

**Required Render Environment Variables**:
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
ENVIRONMENT=production
DEMO_MODE=false
SECRET_KEY=your_64_character_generated_secret_key
ADMIN_EMAIL=admin@restarther.org
ADMIN_PASSWORD=SetAStrongPassword123!
CORS_ORIGINS=https://ai-powered-career-re-entry-ecosystem.vercel.app,http://localhost:5173
```

### Deploy Frontend on Vercel

1. Import the repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variable:
   ```env
   VITE_API_BASE_URL=https://your-render-service.onrender.com
   ```
5. Deploy! Vercel SPA routing is already configured via [frontend/vercel.json](file:///c:/Users/Sathw/k-hacks/frontend/vercel.json).

---

## 🧪 Automated Testing & Verification

The project includes an automated test suite verifying all critical business workflows:

```powershell
# Run the complete test suite (103 tests)
python -m pytest backend/tests -v
```
**Results**: `103 passed, 0 failed` (100% test pass rate).

### Frontend Production Build
```powershell
cd frontend
npm run build
```
**Results**: Clean production bundle built in ~9s with zero TypeScript or bundling errors.

---

## 📂 Project Structure

```
├── backend/
│   ├── agents/                  # The 6 core agents (Profile, Skill Gap, Learning, etc.)
│   ├── api/
│   │   ├── routes/              # Modular REST routes (auth, users, admin, trainers, etc.)
│   │   └── dependencies.py      # Auth, database session, and role security injection
│   ├── database/
│   │   └── session.py           # Engine setup with Neon pooling & SQLite auto-migration
│   ├── knowledge/               # Versioned domain banks (12 roles, 35+ skills, quizzes, etc.)
│   ├── models/                  # SQLAlchemy ORM models (Users, Profiles, Roadmaps, Tasks)
│   ├── orchestrator/            # Career Orchestrator StateGraph workflow engine
│   ├── services/                # JWT auth, readiness scoring, PDF parser, database seeding
│   ├── tests/                   # Pytest automated test suite (103 tests)
│   ├── config.py                # Environment configuration loader
│   ├── requirements.txt         # Pinned backend dependencies
│   └── main.py                  # FastAPI application entrypoint
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client and contract interfaces
│   │   ├── components/          # Reusable UI widgets, layout shells, and video room
│   │   │   └── trainer/         # VideoCallModal (WebRTC 1-on-1 Mentorship Room)
│   │   ├── context/             # AuthContext (user session, role, token management)
│   │   ├── pages/
│   │   │   ├── admin/           # Admin portal (dashboard, telemetry, user management)
│   │   │   ├── auth/            # Sign in, registration, forgot password, unauthorized
│   │   │   ├── learner/         # Learner portal (dashboard, journey, skills, interviews)
│   │   │   └── trainer/         # Trainer portal (caseload, assignments, reports, sessions)
│   │   ├── theme/               # Theme context and palette standards
│   │   ├── App.tsx              # React router configuration and role guards
│   │   └── main.tsx             # Application bootstrap
│   ├── vercel.json              # Vercel SPA rewrite rule
│   ├── package.json
│   ├── tailwind.config.js       # Custom palette and design tokens
│   └── vite.config.ts
├── .env.example                 # Production environment variable template
├── .gitignore                   # Secure ignore rules for secrets and databases
└── README.md                    # This document
```

---

## 📜 License & Author

- **Platform Architect & Developer**: [sathwik27-ai](https://github.com/sathwik27-ai)
- **Repository**: [AI-powered-career-re-entry-ecosystem](https://github.com/sathwik27-ai/AI-powered-career-re-entry-ecosystem)
- **License**: MIT License
