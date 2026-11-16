"""Curated free learning content per skill: topics, exercises, challenges and resources.

Resource links point to free, official documentation or well-known free tutorials.
"""
from __future__ import annotations

CURRICULUM: dict[str, dict] = {
    "Spring Boot": {
        "topics": [
            "What changed in Spring Boot 3: Java 17 baseline, Jakarta EE namespace, starters",
            "Project setup with Spring Initializr and auto-configuration",
            "Dependency injection, beans and externalised configuration",
            "Building REST controllers with validation",
            "Spring Data JPA repositories and entity mapping",
            "Exception handling with @ControllerAdvice and ProblemDetail",
            "Testing with @SpringBootTest, @WebMvcTest and MockMvc",
            "Actuator, profiles and production readiness",
        ],
        "exercises": [
            "Generate a Spring Boot 3 project and expose a /health endpoint",
            "Write a service bean and inject it via constructor injection",
            "Build a CRUD controller for a `Book` resource with input validation",
            "Persist books with Spring Data JPA and an H2 database",
            "Return RFC 7807 ProblemDetail responses for not-found and validation errors",
            "Write MockMvc tests for the Book controller",
        ],
        "challenge": "Add pagination, sorting and an OpenAPI (springdoc) spec to your Book API",
        "resources": [
            ("freeCodeCamp: Spring Boot Full Course (YouTube)", "https://www.youtube.com/watch?v=9SGDpanrc8U"),
            ("Amigoscode: Spring Boot 3 Tutorial (YouTube)", "https://www.youtube.com/watch?v=5r3QU0f1oNU"),
            ("Spring Guides: Building an Application with Spring Boot", "https://spring.io/guides/gs/spring-boot/"),
            ("Spring Guides: Building a RESTful Web Service", "https://spring.io/guides/gs/rest-service/"),
            ("Spring Boot Reference Documentation", "https://docs.spring.io/spring-boot/index.html"),
        ],
    },
    "Java": {
        "topics": [
            "Modern Java refresher: var, records, switch expressions, text blocks",
            "Collections and the Streams API",
            "Optional and functional interfaces",
            "Exceptions and clean error handling",
            "Concurrency basics: ExecutorService and CompletableFuture",
        ],
        "exercises": [
            "Rewrite a POJO as a Java record and use a switch expression",
            "Use streams to group and summarise a list of orders",
            "Refactor null checks to Optional",
            "Process tasks in parallel with CompletableFuture",
        ],
        "challenge": "Implement a small in-memory cache with expiry using modern Java features",
        "resources": [
            ("freeCodeCamp: Java Programming for Beginners (YouTube)", "https://www.youtube.com/watch?v=A74TOX803D0"),
            ("Programming with Mosh: Java Full Course (YouTube)", "https://www.youtube.com/watch?v=eIrMbG6442k"),
            ("dev.java – Learn Java (Oracle)", "https://dev.java/learn/"),
            ("The Java Tutorials", "https://docs.oracle.com/javase/tutorial/"),
        ],
    },
    "REST APIs": {
        "topics": [
            "HTTP methods, status codes and idempotency",
            "Resource naming, versioning and pagination",
            "Request validation and consistent error responses",
            "API documentation with OpenAPI",
            "Authentication basics: tokens and JWT",
        ],
        "exercises": [
            "Design the endpoints for a task-tracker API on paper",
            "Choose correct status codes for 6 common scenarios",
            "Add pagination and filtering to a list endpoint",
            "Write an OpenAPI description for two endpoints",
        ],
        "challenge": "Secure your API with token-based authentication and role checks",
        "resources": [
            ("Traversy Media: REST API Concepts & Design (YouTube)", "https://www.youtube.com/watch?v=lsMQRaeKNDk"),
            ("freeCodeCamp: REST APIs Crash Course (YouTube)", "https://www.youtube.com/watch?v=-MTSQjw5DrM"),
            ("MDN: HTTP request methods", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods"),
            ("MDN: HTTP response status codes", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"),
            ("OpenAPI Specification – Getting started", "https://learn.openapis.org/"),
        ],
    },
    "SQL": {
        "topics": [
            "Joins, grouping and aggregate functions",
            "Subqueries and common table expressions",
            "Indexes and query performance basics",
            "Transactions and isolation",
        ],
        "exercises": [
            "Write 5 join queries on an orders/customers schema",
            "Rewrite a nested subquery as a CTE",
            "Use EXPLAIN to compare a query with and without an index",
        ],
        "challenge": "Model and query a schema for a library system with window functions",
        "resources": [
            ("freeCodeCamp: SQL Tutorial - Full Database Course (YouTube)", "https://www.youtube.com/watch?v=HXV3zeQKqGY"),
            ("Programming with Mosh: Complete SQL Mastery (YouTube)", "https://www.youtube.com/watch?v=7S_tz1z_5bA"),
            ("SQLBolt – interactive SQL lessons", "https://sqlbolt.com/"),
            ("PostgreSQL Tutorial (official docs)", "https://www.postgresql.org/docs/current/tutorial.html"),
        ],
    },
    "Docker": {
        "topics": [
            "Containers vs virtual machines; images and layers",
            "Writing a Dockerfile for a Java/Python service",
            "Docker Compose for an app plus database",
            "Volumes, networking and environment variables",
        ],
        "exercises": [
            "Run a database container and connect to it",
            "Containerise your Book API with a multi-stage Dockerfile",
            "Write a docker-compose.yml for API + PostgreSQL",
        ],
        "challenge": "Shrink your image size and add a container health check",
        "resources": [
            ("TechWorld with Nana: Docker Tutorial for Beginners (YouTube)", "https://www.youtube.com/watch?v=3c-iBn73dDE"),
            ("freeCodeCamp: Docker Full Course for Beginners (YouTube)", "https://www.youtube.com/watch?v=fqMOX6JJhGo"),
            ("Docker Docs – Get started", "https://docs.docker.com/get-started/"),
            ("Docker Docs – Compose overview", "https://docs.docker.com/compose/"),
        ],
    },
    "Unit Testing": {
        "topics": [
            "Testing pyramid and what to unit test",
            "JUnit 5 basics: assertions, parameterised tests",
            "Mocking dependencies with Mockito",
            "Test-driven development workflow",
        ],
        "exercises": [
            "Write parameterised tests for a validation utility",
            "Mock a repository in a service test",
            "Build a small feature test-first",
        ],
        "challenge": "Reach meaningful coverage on your Book API service layer",
        "resources": [
            ("freeCodeCamp: Unit Testing with JUnit 5 & Mockito (YouTube)", "https://www.youtube.com/watch?v=o5pE7L2tVV8"),
            ("JUnit 5 User Guide", "https://junit.org/junit5/docs/current/user-guide/"),
            ("pytest – Get started", "https://docs.pytest.org/en/stable/getting-started.html"),
        ],
    },
    "Git": {
        "topics": ["Branching and pull requests", "Rebasing vs merging", "Resolving conflicts"],
        "exercises": ["Open a feature branch and a pull request", "Resolve a merge conflict deliberately"],
        "challenge": "Contribute a documentation fix to an open-source project",
        "resources": [
            ("freeCodeCamp: Git and GitHub for Beginners (YouTube)", "https://www.youtube.com/watch?v=RGOj5yH7evk"),
            ("Pro Git book (free)", "https://git-scm.com/book/en/v2"),
        ],
    },
    "Microservices": {
        "topics": [
            "Monolith vs microservices trade-offs",
            "Service boundaries and API gateways",
            "Inter-service communication: REST and messaging",
            "Resilience patterns: retries, circuit breakers",
        ],
        "exercises": [
            "Split your Book API into catalogue and loans services",
            "Call one service from another with a timeout and retry",
        ],
        "challenge": "Add a circuit breaker (Resilience4j) between two services",
        "resources": [
            ("Java Brains: Microservices Architecture (YouTube)", "https://www.youtube.com/watch?v=y8IQb4ofjDo"),
            ("microservices.io – Pattern language", "https://microservices.io/patterns/index.html"),
            ("Spring – Microservices", "https://spring.io/microservices"),
        ],
    },
    "Cloud Deployment": {
        "topics": ["Cloud fundamentals: compute, storage, networking", "Deploying a container to a managed service", "Environment configuration and secrets"],
        "exercises": ["Deploy your containerised API to a free-tier service"],
        "challenge": "Automate deployment from your Git repository",
        "resources": [
            ("freeCodeCamp: AWS Certified Cloud Practitioner Full Course (YouTube)", "https://www.youtube.com/watch?v=SOTamWNgDKc"),
            ("AWS – Getting started resource center", "https://aws.amazon.com/getting-started/"),
            ("Microsoft Learn – Azure training", "https://learn.microsoft.com/en-us/training/azure/"),
        ],
    },
    "CI/CD": {
        "topics": ["Continuous integration concepts", "Writing a GitHub Actions workflow"],
        "exercises": ["Create a workflow that builds and tests on every push"],
        "challenge": "Add a deployment job gated on tests passing",
        "resources": [
            ("TechWorld with Nana: GitHub Actions Tutorial (YouTube)", "https://www.youtube.com/watch?v=R8_veQiYBjI"),
            ("GitHub Actions documentation", "https://docs.github.com/en/actions"),
        ],
    },
    "Python": {
        "topics": ["Modern Python refresher: typing, dataclasses, f-strings", "Virtual environments and packaging", "Working with files and JSON"],
        "exercises": ["Rewrite a script with type hints and dataclasses", "Parse a JSON file and summarise it"],
        "challenge": "Build a small CLI tool with argparse and tests",
        "resources": [
            ("freeCodeCamp: Python for Beginners - Full Course (YouTube)", "https://www.youtube.com/watch?v=eWRfhZUzrAc"),
            ("Programming with Mosh: Python Tutorial for Beginners (YouTube)", "https://www.youtube.com/watch?v=_uQrJ0TkZlc"),
            ("The Python Tutorial (official)", "https://docs.python.org/3/tutorial/"),
        ],
    },
    "JavaScript": {
        "topics": ["Modern JavaScript: let/const, arrow functions, modules", "Promises and async/await", "Working with the DOM and fetch"],
        "exercises": ["Fetch data from a public API and render a list", "Refactor callbacks to async/await"],
        "challenge": "Build a small offline-capable to-do app",
        "resources": [
            ("freeCodeCamp: JavaScript Programming - Full Course (YouTube)", "https://www.youtube.com/watch?v=jS4aFq5-91M"),
            ("MDN – JavaScript Guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"),
        ],
    },
    "TypeScript": {
        "topics": ["Types, interfaces and generics", "Typing React components"],
        "exercises": ["Convert a small JS module to TypeScript"],
        "challenge": "Add strict mode to a project and fix all errors",
        "resources": [
            ("freeCodeCamp: TypeScript Course for Beginners (YouTube)", "https://www.youtube.com/watch?v=30LWjhZzg50"),
            ("TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
        ],
    },
    "React": {
        "topics": ["Components, props and state", "Effects and data fetching", "Forms and controlled inputs", "Routing"],
        "exercises": ["Build a searchable list component", "Fetch and display data with loading and error states"],
        "challenge": "Build a multi-page dashboard with React Router",
        "resources": [
            ("freeCodeCamp: React JS Full Course (YouTube)", "https://www.youtube.com/watch?v=bMknfKXIFA8"),
            ("The Net Ninja: React Crash Course (YouTube)", "https://www.youtube.com/watch?v=j942wKiXFu8"),
            ("react.dev – Learn React", "https://react.dev/learn"),
        ],
    },
    "HTML": {
        "topics": ["Semantic HTML and accessibility"],
        "exercises": ["Mark up a profile page semantically"],
        "challenge": "Pass an automated accessibility audit",
        "resources": [("MDN – HTML basics", "https://developer.mozilla.org/en-US/docs/Learn/HTML")],
    },
    "CSS": {
        "topics": ["Flexbox and Grid", "Responsive design"],
        "exercises": ["Build a responsive card grid"],
        "challenge": "Recreate a dashboard layout responsively",
        "resources": [("MDN – CSS layout", "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout")],
    },
    "Excel": {
        "topics": ["Lookup functions and pivot tables", "Charts and conditional formatting"],
        "exercises": ["Build a pivot-table summary of sales data"],
        "challenge": "Build an interactive KPI sheet",
        "resources": [("Microsoft Excel help & learning", "https://support.microsoft.com/en-us/excel")],
    },
    "Power BI": {
        "topics": ["Data modelling basics", "DAX measures", "Building reports"],
        "exercises": ["Build a report from a sample dataset"],
        "challenge": "Publish a dashboard with three linked visuals",
        "resources": [("Microsoft Learn – Power BI", "https://learn.microsoft.com/en-us/training/powerplatform/power-bi")],
    },
    "Statistics": {
        "topics": ["Descriptive statistics", "Distributions and sampling", "Hypothesis testing basics"],
        "exercises": ["Summarise a dataset with mean, median and spread"],
        "challenge": "Run and interpret an A/B test analysis",
        "resources": [("Khan Academy – Statistics and probability", "https://www.khanacademy.org/math/statistics-probability")],
    },
    "Data Visualization": {
        "topics": ["Choosing the right chart", "Storytelling with data"],
        "exercises": ["Redesign a cluttered chart"],
        "challenge": "Build a one-page insight report",
        "resources": [("Tableau – Free training", "https://www.tableau.com/learn/training")],
    },
    "Tableau": {
        "topics": ["Connecting data and building views"],
        "exercises": ["Build a dashboard from a sample dataset"],
        "challenge": "Publish a dashboard to Tableau Public",
        "resources": [("Tableau – Free training", "https://www.tableau.com/learn/training")],
    },
    "Selenium": {
        "topics": ["WebDriver basics", "Locators and waits", "Page Object Model"],
        "exercises": ["Automate a login flow test"],
        "challenge": "Build a small Page Object Model test suite",
        "resources": [("Selenium documentation", "https://www.selenium.dev/documentation/")],
    },
    "Manual Testing": {
        "topics": ["Test case design techniques", "Bug reporting"],
        "exercises": ["Write boundary-value test cases for a form"],
        "challenge": "Write a full test plan for a sample app",
        "resources": [("ISTQB – Foundation syllabus (free download)", "https://www.istqb.org/certifications/certified-tester-foundation-level")],
    },
    "Agile": {
        "topics": ["Scrum roles and ceremonies"],
        "exercises": ["Write user stories with acceptance criteria"],
        "challenge": "Plan a sprint for a small project",
        "resources": [("The Scrum Guide", "https://scrumguides.org/scrum-guide.html")],
    },
}

GENERIC = {
    "topics": ["Core concepts refresher", "Hands-on practice", "Applying it in a small project"],
    "exercises": ["Complete a guided hands-on exercise"],
    "challenge": "Apply the skill in a small portfolio project",
    "resources": [],
}

MINI_PROJECTS: dict[str, dict] = {
    "Backend Developer": {
        "title": "Library Management REST API",
        "description": "Build a Spring Boot 3 REST API for books and loans with validation, JPA persistence, MockMvc tests and a Dockerfile. Push it to GitHub with a README - it becomes a recent portfolio project you can genuinely discuss in interviews.",
    },
    "Full Stack Developer": {
        "title": "Task Tracker Web App",
        "description": "Build a React front end and a REST API back end for a task tracker with authentication and a relational database.",
    },
    "Frontend Developer": {
        "title": "Accessible Job Board UI",
        "description": "Build a responsive, accessible React job-board interface with search, filters and tests.",
    },
    "Data Analyst": {
        "title": "Sales Insights Dashboard",
        "description": "Clean a public dataset with SQL/Python and publish an insights dashboard in Power BI.",
    },
    "QA Engineer": {
        "title": "Automated Test Suite",
        "description": "Build a Selenium Page Object Model suite and API tests for a demo web application, running in CI.",
    },
    "Cloud & DevOps Engineer": {
        "title": "GitOps Kubernetes Microservice Pipeline",
        "description": "Build a containerized microservice deployment with Docker, Kubernetes Helm charts, and automated GitHub Actions CI/CD with health probes.",
    },
    "Data Engineer": {
        "title": "Real-time Event Streaming & ETL Lakehouse",
        "description": "Build an end-to-end data pipeline with Python, Kafka streaming, and Spark transformations loading into a clean analytical data warehouse.",
    },
    "AI / Machine Learning Engineer": {
        "title": "Production RAG Question-Answering System",
        "description": "Build a retrieval-augmented generation (RAG) assistant using Python, LangChain, vector embeddings, and a FastAPI inference service.",
    },
    "Cybersecurity Analyst": {
        "title": "Automated Security Vulnerability Assessment Lab",
        "description": "Perform an end-to-end OWASP Top 10 vulnerability scan, draft a remediation report, and implement secure IAM policies on cloud resources.",
    },
    "Mobile App Developer": {
        "title": "Cross-Platform Mobile Comeback App",
        "description": "Develop a responsive React Native mobile app with offline state management, push notifications, and REST API integration.",
    },
    "Technical Product Manager": {
        "title": "Product Requirement Document (PRD) & Launch Strategy",
        "description": "Author a comprehensive PRD with user personas, user stories, success metrics, and an interactive sprint roadmap for a career returnship product.",
    },
    "UI/UX Designer": {
        "title": "Design System & Accessible Mobile Prototype",
        "description": "Design an interactive, WCAG-compliant design system and mobile prototype in Figma complete with component variants and usability findings.",
    },
}


def curriculum(skill: str) -> dict:
    return CURRICULUM.get(skill, GENERIC)
