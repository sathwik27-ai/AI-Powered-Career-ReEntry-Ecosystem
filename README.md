# ReStartHer: AI-Powered Career Re-Entry Ecosystem for Women in Tech

[![CI Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/React%2018-Vite%20%7C%20Tailwind%20CSS-blue.svg)]()
[![Backend](https://img.shields.io/badge/FastAPI-Python%203.11-green.svg)]()
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL%20%7C%20SQLite-purple.svg)]()
[![AI Agents](https://img.shields.io/badge/Jotform%20AI-6%20Autonomous%20Coaches-pink.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

> **"Your career. Your comeback. Your future."**  
> ReStartHer is a comprehensive, production-grade agentic AI career comeback platform created to erase the career break penalty for women in technology. It combines an autonomous multi-agent coaching squad, deterministic 2026 industry benchmark diagnostics, adaptive 1–2 hour/day micro-learning roadmaps, and verified returnship opportunity intelligence across 12 modern technology specializations.

---

## 🌟 Executive Summary & Core Innovations

A career break for maternity, family caregiving, health recovery, or relocation is **not a step backward**—it is a period of real-life leadership, crisis management, multitasking, and emotional resilience. ReStartHer replaces the traditional barrier-filled hiring funnel with an empathetic, human-in-the-loop ecosystem:

1. **6 Autonomous Jotform AI Agents**: Dedicated specialized chatbots embedded into the platform to guide every stage of re-entry—from empathetic intake and market benchmarking to Socratic coding doubt-solving, mock interview prep, returnship scouting, and application drafting.
2. **12 Comprehensive Career Comeback Tracks**: Full support from scratch to advanced level for Backend, Full Stack, Frontend, Data Analyst, QA Automation, Cloud & DevOps, Data Engineering, AI & Machine Learning, Cybersecurity, Mobile Development, Technical Product Management (TPM), and UI/UX Design.
3. **Three Role-Based Workspaces**:
   - **Learners (`/app`)**: Dynamic daily roadmap, on-demand AI coaching widgets, interactive quizzes, mock interview scoring, and returnship applications.
   - **Trainers & Mentors (`/trainer`)**: Cohort caseload management, direct task assignment, quiz evaluation, and private mentoring observations.
   - **Platform Administrators (`/admin`)**: User & role provisioning, real-time Recharts telemetry, database connection health, and AI agent monitoring.
4. **Dual Persistence Architecture**: Plug-and-play support for serverless **Neon PostgreSQL** (with built-in connection pooling and pre-ping resilience) alongside zero-config local **SQLite**.
5. **Strict Human-in-the-Loop & Privacy Guarantees**:
   - **Zero Auto-Submission**: The platform drafts materials, but the user always reviews and submits them directly.
   - **Zero Gap Stigma**: Re-entry plans normalize career pauses with zero score penalties.
   - **Data Rights & Account Deletion**: Full self-service account and data deletion for complete privacy.

---

## 🏗️ System Architecture & Workflow Flow

```mermaid
flowchart TD
    subgraph UI["Light Palette Web Layer (React 18 + Vite + Tailwind)"]
        LP["Landing Page & Auth (/login)"]
        LW["Learner Workspace (/app)"]
        TW["Trainer Workspace (/trainer)"]
        AW["Admin Workspace (/admin)"]
    end

    subgraph API["FastAPI Backend Service (/api)"]
        Auth["JWT Auth, Role RBAC & Women Verification"]
        Orch["Career Orchestrator (LangGraph Engine)"]
        Readiness["Readiness Assessment Engine (Deterministic)"]
        TaskEngine["Dynamic Task & Progress Engine"]
    end

    subgraph Agents["6 Connected Jotform AI Agents"]
        J1["Profile Intake AI (#2FC9E3)"]
        J2["Skill Gap Explainer AI (#FF9A3D)"]
        J3["Tutor Coach AI (#43D98C)"]
        J4["Interview Coach AI (#FF5C8A)"]
        J5["Job Scout AI (#4D8DFF)"]
        J6["Application Assistant AI (#8E5CFF)"]
    end

    subgraph DB["Dual Persistence Engine"]
        PG["Neon Serverless PostgreSQL (Production)"]
        SQL["SQLite (Local Zero-Config Fallback)"]
    end

    LP --> Auth
    LW --> Orch
    TW --> TaskEngine
    AW --> API
    LW --> Agents
    Orch --> Readiness
    API --> DB
```

---

## 🤖 The 6 Autonomous Jotform AI Coaching Squad

Each agent runs with its own specialized domain prompt and verified knowledge base, trained across all 12 tracks:

| Agent & Embed ID | Theme Color | Role & Responsibility | Key Capabilities | Training Doc |
| :--- | :--- | :--- | :--- | :---: |
| **Agent 1: Profile Intake**<br>`01a1de02216070008ef9ea7886d80c2c3a1d` | **Aqua**<br>`#2FC9E3` | Onboarding & Background Intelligence | • Normalizes 1–10+ yr career breaks with zero penalty<br>• Extracts prior skills, projects, and weekly hours (1–2 hrs/day)<br>• Maps candidates to one of 12 comeback tracks | [Read Guide](file:///docs/agents/01_profile_intake_agent.md) |
| **Agent 2: Skill Gap Explainer**<br>`01a1de36f0e8700086166b4a851c6cc3ee54` | **Tangerine**<br>`#FF9A3D` | 2026 Industry Benchmark Diagnostic | • Explains framework evolutions (Java 8 → 21, Spring Boot 2 → 3, React classes → Hooks)<br>• 3-tier prioritization (Critical Refresh, Benchmark, Bonus Edge)<br>• Eliminates tech intimidation | [Read Guide](file:///docs/agents/02_skill_gap_explainer_agent.md) |
| **Agent 3: Tutor Coach**<br>`01a1de4d9d9870008b817a17a82f4df6c01f` | **Lime**<br>`#43D98C` | Socratic Coding Tutor & Doubt Solver | • 24/7 patient doubt resolution with runnable code snippets<br>• Dockerfiles, Kubernetes YAML, PySpark pipelines, SQL window functions<br>• Step-by-step debugging walkthroughs | [Read Guide](file:///docs/agents/03_tutor_coach_agent.md) |
| **Agent 4: Interview Coach**<br>`01a1de720200700080d531f4ede929161334` | **Strawberry**<br>`#FF5C8A` | Mock Prep & Confidence Builder | • "Zero Apology" career break framing scripts (STAR + C)<br>• Technical mock questions across all 12 tracks<br>• 0–100 rubric scoring across Technical Depth, Clarity, & Poise | [Read Guide](file:///docs/agents/04_interview_coach_agent.md) |
| **Agent 5: Job Scout**<br>`01a1de9d73187000802c8a3d7e9646b202f9` | **Blueberry**<br>`#4D8DFF` | Returnships & Opportunity Intelligence | • Catalog of corporate returnships (Amazon, Goldman Sachs, Accellor, Wells Fargo)<br>• Transparent skill match scoring (e.g. 94% match)<br>• Compliant live search generation for LinkedIn, Naukri, & Internshala | [Read Guide](file:///docs/agents/05_job_scout_agent.md) |
| **Agent 6: Application Assistant**<br>`01a1dea7df10700086de70a71d70390e6a24` | **Grape**<br>`#8E5CFF` | Materials & Framing Drafter | • Hybrid Returnee Resume template (competencies before chronological gap)<br>• Google XYZ accomplishment formula adapted for returners<br>• Returnship cover letters & recruiter cold outreach messages | [Read Guide](file:///docs/agents/06_application_assistant_agent.md) |

> [!NOTE]
> **The "No Raw APP_URL" Mandate**: All agents are strictly instructed never to output raw placeholder tokens (`APP_URL`). Instead, they guide learners using human-friendly directions and clean relative paths (`/app`, `/app/journey`, `/app/skills`, `/app/interview`, `/app/job-scout`, `/app/applications`, `/app/intake`).

---

## 🎯 The 12 Career Comeback Tracks

ReStartHer provides complete benchmarks, curriculum roadmaps, assessment quizzes, and interview question banks for 12 distinct tracks:

1. **Backend Developer**: Java 21, Spring Boot 3 (`jakarta.*`), RESTful APIs, SQL, Docker, Kafka, Microservices.
2. **Full Stack Developer**: React 18/19, TypeScript, Next.js, Node.js/Express, Prisma ORM, PostgreSQL.
3. **Frontend Developer**: React 19, TypeScript, Tailwind CSS, Vite, Core Web Vitals (LCP, INP, CLS), WCAG accessibility.
4. **Data Analyst**: Advanced SQL Window Functions (`ROW_NUMBER`, `DENSE_RANK`, `LEAD`, `LAG`), Python Pandas 2.x, Power BI DAX, Tableau.
5. **QA Automation Engineer / SDET**: Playwright (TypeScript/Python), Selenium 4, REST-Assured API automation, GitHub Actions CI/CD.
6. **Cloud & DevOps Engineer**: Docker multi-stage builds, Kubernetes pod orchestration, AWS/Azure cloud architecture, GitHub Actions, Linux, Terraform.
7. **Data Engineer**: Python ETL, Apache Spark (PySpark), Kafka event streaming, Airflow workflow scheduling, Snowflake lakehouses.
8. **AI & Machine Learning Engineer**: Python, PyTorch, Generative AI & Large Language Models (LLMs), RAG pipelines, Vector DBs, FastAPI inference.
9. **Cybersecurity Analyst**: Network Defense, OWASP Top 10 remediation, Linux system hardening, IAM least-privilege, SIEM telemetry investigation.
10. **Mobile App Developer**: React Native, Flutter (Dart), TypeScript, modern state management, mobile REST APIs, mobile CI/CD.
11. **Technical Product Manager (TPM)**: Product Strategy, Agile/Scrum ceremonies, User Stories, Jira, Data-driven analytics, technical PRDs.
12. **UI/UX Designer**: Figma component variants & auto-layout, interactive prototyping, usability testing, design systems, and Tailwind design tokens.

---

## 🔑 Pre-Seeded Demo Credentials

The platform seeds three comprehensive demo accounts on initial database startup:

| Role | Email | Password | Access Route | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@restarther.org` | `AdminSecure123!` | `/admin` | Complete platform governance, telemetry, user provisioning, database status |
| **Trainer / Mentor** | `trainer@restarther.org` | `TrainerSecure123!` | `/trainer` | Mentor caseload, assigned tasks, observational notes, learner progress tracking |
| **Learner (Priya)** | `priya@restarther.org` | `PriyaSecure123!` | `/app` | Priya Raman (4.5 yrs Java exp, 3.5-yr break, Spring Boot 3 Backend comeback roadmap) |

*(Quick-fill demo buttons are provided on the Sign-In page at `/login` when `DEMO_MODE=true`.)*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**
- **Git**

### 2. Backend Setup & Startup

```bash
# Clone the repository
git clone https://github.com/sathwik27-ai/AI-powered-career-re-entry-ecosystem.git
cd AI-powered-career-re-entry-ecosystem

# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server (auto-creates tables and seeds reference data)
python -m uvicorn main:app --reload --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

### 3. Frontend Setup & Startup

```bash
# In a new terminal from the project root:
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- **Web Application**: `http://localhost:5173`

---

## 🗄️ Neon Serverless PostgreSQL Configuration

ReStartHer natively supports **Neon Serverless PostgreSQL** alongside local SQLite.

1. Open `.env` (in the project root or `backend/.env`).
2. Update line 18 with your Neon connection string:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Built-in Connection Pooling:
   - **`pool_pre_ping=True`**: Prevents broken pipe errors on cold-starts or idle Neon serverless scale-downs.
   - **`pool_recycle=300`**: Recycles connections every 5 minutes to prevent stale socket dropouts.
   - **Automatic Protocol Remapping**: Seamlessly converts `postgres://` to `postgresql://`.

---

## 🧪 Comprehensive Verification & Test Suite

The backend contains a test suite covering authentication, RBAC guards, the LangGraph career comeback pipeline, resume parsing, and adaptive roadmap rescheduling:

```bash
# Run pytest suite
python -m pytest backend/tests -v
```

### Frontend Production Build
```bash
# Typecheck and bundle production assets
cd frontend
npm run build
```
- Verified clean build (`0 errors`, bundled in ~6–8s).

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
│   ├── tests/                   # Pytest automated test suite
│   ├── config.py                # Environment configuration loader
│   └── main.py                  # FastAPI application entrypoint
├── docs/
│   └── agents/                  # Complete A–Z training docs for all 6 Jotform agents
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client and contract interfaces
│   │   ├── components/          # Reusable UI widgets, layout shells, and agent widgets
│   │   ├── context/             # AuthContext (user session, role, token management)
│   │   ├── pages/
│   │   │   ├── admin/           # Admin portal (dashboard, telemetry, user management)
│   │   │   ├── auth/            # Sign in, registration, forgot password, unauthorized
│   │   │   ├── learner/         # Learner portal (dashboard, journey, skills, interviews)
│   │   │   └── trainer/         # Trainer portal (caseload, assignments, reports)
│   │   ├── theme/               # Theme context and palette standards
│   │   ├── App.tsx              # React router configuration and role guards
│   │   └── main.tsx             # Application bootstrap
│   ├── package.json
│   ├── tailwind.config.js       # Custom palette and design tokens
│   └── vite.config.ts
├── .env.example                 # Production environment variable template
├── .gitignore                   # Secure ignore rules for secrets and databases
└── README.md                    # This document
```

---

## 📜 License & Authors

- **Platform Architect & Contributor**: [sathwik27-ai](https://github.com/sathwik27-ai)
- **Repository**: [AI-powered-career-re-entry-ecosystem](https://github.com/sathwik27-ai/AI-powered-career-re-entry-ecosystem)
- **License**: MIT License
