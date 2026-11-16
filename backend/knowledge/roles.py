"""Target-role requirement profiles.

Each requirement has a tier:
  core      - appears in most job descriptions for the role; addressed first
  important - frequently requested; addressed second
  nice      - differentiators; addressed last

`target` is the proficiency level (0-100, on the same rule-based scale the Skill
Gap Agent uses) considered job-ready for that tier. These are authored
guidelines for the prototype, not measured market statistics.
"""
from __future__ import annotations

ROLES: dict[str, dict] = {
    "Backend Developer": {
        "aliases": ["backend", "back-end", "back end", "java developer", "python developer", "server-side", "api developer", "backend engineer"],
        "domain": "Software Engineering",
        "requirements": [
            {"skill": "Java", "tier": "core", "target": 80, "why": "Most backend job descriptions for this track ask for strong Java fundamentals."},
            {"skill": "Spring Boot", "tier": "core", "target": 80, "why": "Spring Boot 3 is the standard framework for Java backend services; versions changed significantly in recent years (Jakarta EE namespace, Java 17 baseline)."},
            {"skill": "REST APIs", "tier": "core", "target": 80, "why": "Designing and building HTTP/JSON APIs is the day-to-day work of a backend developer."},
            {"skill": "SQL", "tier": "core", "target": 75, "why": "Backend services persist and query data; relational databases remain the default."},
            {"skill": "Unit Testing", "tier": "important", "target": 70, "why": "Teams expect automated tests (JUnit 5, Mockito) with every change."},
            {"skill": "Git", "tier": "important", "target": 70, "why": "Pull-request based collaboration is universal."},
            {"skill": "Docker", "tier": "important", "target": 65, "why": "Services are packaged and run as containers in most modern teams."},
            {"skill": "Microservices", "tier": "important", "target": 60, "why": "Many backend teams split systems into independently deployable services."},
            {"skill": "Cloud Deployment", "tier": "nice", "target": 55, "why": "Familiarity with deploying to a cloud provider is a strong differentiator."},
            {"skill": "CI/CD", "tier": "nice", "target": 50, "why": "Automated build-and-deploy pipelines speed up delivery."},
        ],
    },
    "Full Stack Developer": {
        "aliases": ["full stack", "full-stack", "fullstack", "web developer", "software developer", "software engineer", "developer", "programmer", "sde", "swe", "application developer", "engineer"],
        "domain": "Software Engineering",
        "requirements": [
            {"skill": "JavaScript", "tier": "core", "target": 80, "why": "The language of the web front end and often the back end."},
            {"skill": "React", "tier": "core", "target": 75, "why": "The most requested front-end library in full-stack roles."},
            {"skill": "REST APIs", "tier": "core", "target": 75, "why": "Front end and back end communicate through APIs."},
            {"skill": "SQL", "tier": "core", "target": 70, "why": "Full-stack developers own the data layer too."},
            {"skill": "HTML", "tier": "important", "target": 70, "why": "Semantic, accessible markup."},
            {"skill": "CSS", "tier": "important", "target": 65, "why": "Responsive layouts and design systems."},
            {"skill": "TypeScript", "tier": "important", "target": 60, "why": "Increasingly the default for production JavaScript."},
            {"skill": "Git", "tier": "important", "target": 70, "why": "Pull-request based collaboration is universal."},
            {"skill": "Docker", "tier": "nice", "target": 50, "why": "Containerised local environments and deployment."},
            {"skill": "Cloud Deployment", "tier": "nice", "target": 50, "why": "Shipping apps to the cloud end to end."},
        ],
    },
    "Frontend Developer": {
        "aliases": ["frontend", "front-end", "front end", "ui developer", "react developer", "frontend engineer", "ui engineer", "web designer"],
        "domain": "Software Engineering",
        "requirements": [
            {"skill": "JavaScript", "tier": "core", "target": 80, "why": "Core language of interactive web interfaces."},
            {"skill": "React", "tier": "core", "target": 80, "why": "The most requested UI library."},
            {"skill": "HTML", "tier": "core", "target": 75, "why": "Semantic, accessible markup."},
            {"skill": "CSS", "tier": "core", "target": 75, "why": "Responsive layout and styling."},
            {"skill": "TypeScript", "tier": "important", "target": 65, "why": "Type-safe front-end code is now common."},
            {"skill": "Git", "tier": "important", "target": 70, "why": "Pull-request based collaboration is universal."},
            {"skill": "Unit Testing", "tier": "important", "target": 55, "why": "Component and unit tests are expected."},
            {"skill": "REST APIs", "tier": "nice", "target": 60, "why": "Consuming APIs from the browser."},
        ],
    },
    "Data Analyst": {
        "aliases": ["data analyst", "business analyst", "analytics", "bi analyst", "reporting analyst", "data scientist", "data engineer", "bi developer"],
        "domain": "Data & Analytics",
        "requirements": [
            {"skill": "SQL", "tier": "core", "target": 80, "why": "Querying data is the core daily task of an analyst."},
            {"skill": "Excel", "tier": "core", "target": 75, "why": "Still the most common analysis and reporting tool."},
            {"skill": "Statistics", "tier": "core", "target": 65, "why": "Needed to interpret data correctly."},
            {"skill": "Power BI", "tier": "important", "target": 65, "why": "Widely used BI tool for dashboards."},
            {"skill": "Python", "tier": "important", "target": 60, "why": "Automation and deeper analysis with pandas."},
            {"skill": "Data Visualization", "tier": "important", "target": 65, "why": "Communicating insights clearly."},
            {"skill": "Tableau", "tier": "nice", "target": 50, "why": "Alternative BI tool common in larger organisations."},
        ],
    },
    "QA Engineer": {
        "aliases": ["qa", "quality assurance", "test engineer", "tester", "sdet", "automation tester", "qa automation", "qa automation engineer", "test analyst", "software tester"],
        "domain": "Quality Assurance",
        "requirements": [
            {"skill": "Manual Testing", "tier": "core", "target": 75, "why": "Designing test cases and exploratory testing."},
            {"skill": "Selenium", "tier": "core", "target": 70, "why": "The standard for browser test automation."},
            {"skill": "Java", "tier": "important", "target": 60, "why": "Common language for automation frameworks."},
            {"skill": "SQL", "tier": "important", "target": 60, "why": "Validating data in the back end."},
            {"skill": "REST APIs", "tier": "important", "target": 60, "why": "API testing is now standard."},
            {"skill": "Agile", "tier": "important", "target": 60, "why": "QA works inside agile teams."},
            {"skill": "CI/CD", "tier": "nice", "target": 50, "why": "Running automated suites in pipelines."},
        ],
    },
    "Cloud & DevOps Engineer": {
        "aliases": ["cloud", "devops", "cloud engineer", "devops engineer", "sre", "platform engineer", "infrastructure engineer", "cloud architect"],
        "domain": "Cloud & Infrastructure",
        "requirements": [
            {"skill": "Docker", "tier": "core", "target": 80, "why": "Containerization is fundamental to cloud and microservices deployments."},
            {"skill": "Kubernetes", "tier": "core", "target": 75, "why": "The industry standard orchestrator for managing containerized applications."},
            {"skill": "Cloud Deployment", "tier": "core", "target": 80, "why": "Hands-on proficiency with AWS, Azure, or GCP cloud platforms."},
            {"skill": "CI/CD", "tier": "core", "target": 75, "why": "Automating continuous integration and continuous deployment pipelines (GitHub Actions, GitLab CI)."},
            {"skill": "Linux", "tier": "important", "target": 70, "why": "Server operations, shell scripting, and systems administration."},
            {"skill": "Git", "tier": "important", "target": 75, "why": "Source control and GitOps infrastructure workflows."},
            {"skill": "Python", "tier": "important", "target": 65, "why": "Cloud automation, lambda functions, and infrastructure scripting."},
            {"skill": "Terraform", "tier": "nice", "target": 60, "why": "Declarative Infrastructure as Code (IaC) provisioning."},
        ],
    },
    "Data Engineer": {
        "aliases": ["data engineer", "etl developer", "big data engineer", "data platform engineer", "pipeline engineer"],
        "domain": "Data Engineering",
        "requirements": [
            {"skill": "SQL", "tier": "core", "target": 85, "why": "Advanced SQL queries, CTEs, and relational database schema modeling."},
            {"skill": "Python", "tier": "core", "target": 80, "why": "Primary language for data manipulation, cleaning, and pipeline orchestration."},
            {"skill": "Data Pipelines", "tier": "core", "target": 75, "why": "Designing scalable ETL/ELT pipelines with Airflow or DBT."},
            {"skill": "Apache Spark", "tier": "important", "target": 70, "why": "Distributed big data processing for high-volume transformations."},
            {"skill": "Kafka", "tier": "important", "target": 65, "why": "Streaming event ingestion and distributed pub/sub messaging."},
            {"skill": "Cloud Deployment", "tier": "important", "target": 65, "why": "Cloud data warehouses such as Snowflake, BigQuery, or Redshift."},
            {"skill": "Docker", "tier": "nice", "target": 60, "why": "Containerizing pipeline jobs and local database environments."},
            {"skill": "Git", "tier": "important", "target": 70, "why": "Version controlling data pipeline definitions and dbt models."},
        ],
    },
    "AI / Machine Learning Engineer": {
        "aliases": ["ai engineer", "machine learning engineer", "ml engineer", "data scientist", "deep learning engineer", "ai/ml engineer", "genai engineer", "llm engineer"],
        "domain": "Artificial Intelligence",
        "requirements": [
            {"skill": "Python", "tier": "core", "target": 85, "why": "Standard programming language for AI/ML and PyTorch development."},
            {"skill": "Machine Learning", "tier": "core", "target": 80, "why": "Supervised, unsupervised algorithms, model evaluation, and feature engineering."},
            {"skill": "Generative AI", "tier": "core", "target": 75, "why": "Modern LLM prompt engineering, RAG architectures, and embeddings."},
            {"skill": "Statistics", "tier": "core", "target": 70, "why": "Statistical modeling, probability, and hypothesis testing."},
            {"skill": "SQL", "tier": "important", "target": 70, "why": "Extracting and transforming training datasets from relational stores."},
            {"skill": "REST APIs", "tier": "important", "target": 65, "why": "Serving models as inference REST APIs via FastAPI."},
            {"skill": "Docker", "tier": "nice", "target": 60, "why": "Packaging machine learning inference containers."},
            {"skill": "Cloud Deployment", "tier": "nice", "target": 55, "why": "Cloud model deployment (AWS SageMaker, Hugging Face)."},
        ],
    },
    "Cybersecurity Analyst": {
        "aliases": ["cybersecurity", "security analyst", "information security", "infosec", "soc analyst", "cyber security engineer", "security engineer"],
        "domain": "Cybersecurity",
        "requirements": [
            {"skill": "Network Security", "tier": "core", "target": 80, "why": "Understanding firewalls, TCP/IP, OSI model, and network defense."},
            {"skill": "Vulnerability Assessment", "tier": "core", "target": 75, "why": "Scanning and remediating OWASP Top 10 web vulnerabilities."},
            {"skill": "Linux", "tier": "core", "target": 70, "why": "Linux command line, security logging, and system hardening."},
            {"skill": "Python", "tier": "important", "target": 65, "why": "Automating security checks, log parsing, and incident response scripts."},
            {"skill": "SQL", "tier": "important", "target": 60, "why": "Investigating database injection vulnerabilities and query logs."},
            {"skill": "Cloud Deployment", "tier": "important", "target": 60, "why": "Securing cloud IAM, VPCs, and storage buckets in AWS/Azure."},
            {"skill": "Agile", "tier": "nice", "target": 55, "why": "Integrating security practices into modern DevSecOps sprint cycles."},
        ],
    },
    "Mobile App Developer": {
        "aliases": ["mobile developer", "flutter developer", "react native developer", "android developer", "ios developer", "mobile app engineer"],
        "domain": "Mobile Engineering",
        "requirements": [
            {"skill": "Mobile Development", "tier": "core", "target": 80, "why": "Cross-platform mobile apps with React Native or Flutter."},
            {"skill": "JavaScript", "tier": "core", "target": 80, "why": "Core runtime language for React Native mobile engineering."},
            {"skill": "TypeScript", "tier": "important", "target": 70, "why": "Strict type safety for mobile components and navigation state."},
            {"skill": "REST APIs", "tier": "core", "target": 75, "why": "Connecting mobile frontends to backend services and cloud auth."},
            {"skill": "Git", "tier": "important", "target": 70, "why": "Collaboration and multi-developer mobile codebases."},
            {"skill": "Unit Testing", "tier": "important", "target": 60, "why": "Automated mobile unit and component testing (Jest)."},
            {"skill": "Cloud Deployment", "tier": "nice", "target": 50, "why": "Mobile CI/CD pipelines (Fastlane, Expo Application Services)."},
        ],
    },
    "Technical Product Manager": {
        "aliases": ["product manager", "technical product manager", "pm", "tpm", "product owner", "associate product manager"],
        "domain": "Product & Project Management",
        "requirements": [
            {"skill": "Product Strategy", "tier": "core", "target": 85, "why": "Defining roadmap priorities, PRDs, and user story acceptance criteria."},
            {"skill": "Agile", "tier": "core", "target": 85, "why": "Leading sprint ceremonies, backlog grooming, and Scrum workflows."},
            {"skill": "Data Visualization", "tier": "core", "target": 75, "why": "Tracking product metrics, KPIs, retention, and funnel conversion."},
            {"skill": "SQL", "tier": "important", "target": 65, "why": "Direct data querying to validate feature hypotheses independently."},
            {"skill": "REST APIs", "tier": "important", "target": 60, "why": "Technical fluency when collaborating with engineering architects."},
            {"skill": "Git", "tier": "nice", "target": 50, "why": "Understanding pull requests and engineering delivery lifecycles."},
        ],
    },
    "UI/UX Designer": {
        "aliases": ["ui/ux designer", "product designer", "ux designer", "ui designer", "interaction designer", "visual designer"],
        "domain": "Design & User Experience",
        "requirements": [
            {"skill": "Figma", "tier": "core", "target": 85, "why": "Modern design standard for wireframes, component variants, and interactive prototypes."},
            {"skill": "User Research", "tier": "core", "target": 80, "why": "Conducting interviews, user journeys, usability testing, and persona creation."},
            {"skill": "HTML", "tier": "important", "target": 65, "why": "Understanding semantic DOM structure to collaborate smoothly with developers."},
            {"skill": "CSS", "tier": "important", "target": 65, "why": "Understanding CSS Grid, Flexbox, and design tokens (Tailwind CSS)."},
            {"skill": "Agile", "tier": "nice", "target": 60, "why": "Working in agile sprint design-to-development handoffs."},
        ],
    },
}

TIER_WEIGHT = {"core": 3, "important": 2, "nice": 1}
TIER_ORDER = {"core": 0, "important": 1, "nice": 2}


def resolve_role(text: str | None) -> str | None:
    """Return the canonical role name for free text, or None if unknown."""
    if not text:
        return None
    t = text.strip().lower()
    for name in ROLES:
        if name.lower() == t:
            return name
    for name, meta in ROLES.items():
        if any(alias in t for alias in meta["aliases"]):
            return name
    return None


def suggest_roles(skills: list[str]) -> list[str]:
    """Rank roles by how many of their core/important skills the person already has."""
    owned = {s.lower() for s in skills}
    scored = []
    for name, meta in ROLES.items():
        score = sum(TIER_WEIGHT[r["tier"]] for r in meta["requirements"] if r["skill"].lower() in owned)
        scored.append((score, name))
    scored.sort(reverse=True)
    return [n for s, n in scored if s > 0][:3]
