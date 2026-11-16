"""Multiple-choice assessment bank used by the Learning Agent.

Quiz scores are real, measured results (correct answers / total) and replace the
rule-based proficiency estimate for that skill once taken.
"""
from __future__ import annotations


def _q(qid, question, options, answer, explanation):
    return {"id": qid, "question": question, "options": options, "answer": answer, "explanation": explanation}


QUIZZES: dict[str, list[dict]] = {
    "Spring Boot": [
        _q("sb1", "Which Java version is the minimum baseline for Spring Boot 3?", ["Java 8", "Java 11", "Java 17", "Java 21"], 2, "Spring Boot 3 requires Java 17 or later."),
        _q("sb2", "In Spring Boot 3, `javax.persistence` imports were replaced by…", ["jakarta.persistence", "spring.persistence", "java.persistence", "hibernate.persistence"], 0, "Spring Boot 3 moved to Jakarta EE 9+, so packages changed from javax.* to jakarta.*."),
        _q("sb3", "What does a 'starter' dependency such as spring-boot-starter-web provide?", ["A code generator", "A curated set of dependencies with auto-configuration", "A test runner", "A database driver only"], 1, "Starters bundle compatible dependencies that auto-configuration then wires up."),
        _q("sb4", "Which annotation centralises exception handling across REST controllers?", ["@ExceptionMapper", "@ControllerAdvice", "@ErrorHandler", "@GlobalCatch"], 1, "@ControllerAdvice (or @RestControllerAdvice) with @ExceptionHandler methods handles errors globally."),
        _q("sb5", "Which test annotation loads only the web layer for fast controller tests?", ["@SpringBootTest", "@DataJpaTest", "@WebMvcTest", "@MockBean"], 2, "@WebMvcTest slices the context to MVC components and works with MockMvc."),
    ],
    "Java": [
        _q("j1", "Which feature creates an immutable data carrier class concisely?", ["enum", "record", "interface", "sealed"], 1, "Records (Java 16+) generate constructor, accessors, equals, hashCode and toString."),
        _q("j2", "What does `list.stream().filter(...).map(...).toList()` return in Java 16+?", ["A mutable ArrayList", "An unmodifiable List", "A Stream", "An array"], 1, "Stream.toList() returns an unmodifiable list."),
        _q("j3", "Optional is best used for…", ["Fields in entities", "Method return values that may be absent", "Collections", "Method parameters"], 1, "Optional is intended primarily as a return type signalling possible absence."),
        _q("j4", "Which is a checked exception?", ["NullPointerException", "IllegalArgumentException", "IOException", "ArithmeticException"], 2, "IOException must be declared or handled."),
        _q("j5", "CompletableFuture.supplyAsync runs a task…", ["Synchronously on the caller", "Asynchronously, by default on the common ForkJoinPool", "Only on a new thread each time", "Only in Spring"], 1, "Without an executor it uses ForkJoinPool.commonPool()."),
    ],
    "REST APIs": [
        _q("r1", "Which HTTP method is idempotent and typically replaces a whole resource?", ["POST", "PUT", "PATCH", "CONNECT"], 1, "PUT replaces the resource and repeating it has the same effect."),
        _q("r2", "Best status code after successfully creating a resource?", ["200 OK", "201 Created", "204 No Content", "202 Accepted"], 1, "201 Created, ideally with a Location header."),
        _q("r3", "A client sends invalid JSON fields. Which status is most appropriate?", ["400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"], 0, "400 (or 422) signals a client-side validation problem."),
        _q("r4", "Which URL best follows REST resource naming?", ["/getAllBooks", "/books", "/book/list/all", "/doBooks"], 1, "Use plural nouns; the HTTP method expresses the action."),
        _q("r5", "What is the purpose of an OpenAPI specification?", ["To deploy APIs", "To describe endpoints, schemas and responses in a machine-readable way", "To encrypt traffic", "To replace tests"], 1, "OpenAPI documents the API contract for humans and tools."),
    ],
    "SQL": [
        _q("s1", "Which join returns all rows from the left table, matched or not?", ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"], 1, "LEFT JOIN keeps all left rows and fills unmatched right columns with NULL."),
        _q("s2", "Which clause filters groups after aggregation?", ["WHERE", "HAVING", "ORDER BY", "LIMIT"], 1, "HAVING filters aggregated groups; WHERE filters rows before grouping."),
        _q("s3", "What does an index primarily improve?", ["Insert speed", "Read/query speed on indexed columns", "Storage size", "Data integrity only"], 1, "Indexes speed up lookups at some cost to writes."),
        _q("s4", "A CTE is introduced with which keyword?", ["WITH", "TEMP", "DECLARE", "VIEW"], 0, "WITH name AS (...) defines a common table expression."),
        _q("s5", "Which property guarantees a transaction is all-or-nothing?", ["Consistency", "Isolation", "Atomicity", "Durability"], 2, "Atomicity is the A in ACID."),
    ],
    "Docker": [
        _q("d1", "A Docker image is…", ["A running process", "A read-only template made of layers", "A virtual machine", "A config file"], 1, "Containers are running instances of images."),
        _q("d2", "Why use a multi-stage Dockerfile?", ["To run several containers", "To keep build tools out of the final, smaller image", "To use several base OSes at runtime", "It is required for Java"], 1, "Build in one stage, copy only artefacts into a slim runtime stage."),
        _q("d3", "Which tool defines and runs multi-container applications locally?", ["Docker Swarm", "Docker Compose", "Dockerfile", "Docker Hub"], 1, "docker compose up starts all services from docker-compose.yml."),
        _q("d4", "How should data persist beyond a container's life?", ["Inside the container filesystem", "In a volume", "In environment variables", "In the image"], 1, "Volumes persist independently of container lifecycle."),
        _q("d5", "Which instruction sets the default command for a container?", ["RUN", "CMD", "COPY", "FROM"], 1, "CMD (or ENTRYPOINT) defines what runs when the container starts."),
    ],
    "Unit Testing": [
        _q("u1", "In JUnit 5, which annotation runs a test with multiple inputs?", ["@RepeatedTest", "@ParameterizedTest", "@MultiTest", "@TestFactory"], 1, "@ParameterizedTest with sources like @ValueSource or @CsvSource."),
        _q("u2", "Why mock a repository in a service unit test?", ["To test the database", "To isolate the service logic from external dependencies", "To make tests slower", "Mocks are required by JUnit"], 1, "Mocks isolate the unit under test."),
        _q("u3", "In TDD, what comes first?", ["Production code", "A failing test", "Refactoring", "Deployment"], 1, "Red → green → refactor."),
        _q("u4", "Which tests should be most numerous in the testing pyramid?", ["End-to-end tests", "Manual tests", "Unit tests", "Load tests"], 2, "Unit tests are fast and cheap, so they form the base."),
    ],
    "Git": [
        _q("g1", "Which command creates and switches to a new branch?", ["git branch -d x", "git switch -c x", "git merge x", "git push x"], 1, "git switch -c (or git checkout -b) creates and switches."),
        _q("g2", "What does `git rebase main` do on a feature branch?", ["Deletes main", "Replays your commits on top of main", "Merges main with a merge commit", "Pushes to remote"], 1, "Rebase rewrites your branch history on top of main."),
        _q("g3", "A pull request is used to…", ["Download code", "Propose and review changes before merging", "Delete a branch", "Revert commits"], 1, "PRs enable code review."),
        _q("g4", "Which command shows unstaged changes?", ["git log", "git diff", "git stash", "git tag"], 1, "git diff shows working-tree changes."),
    ],
    "Microservices": [
        _q("m1", "A key benefit of microservices is…", ["Simpler debugging", "Independent deployment of services", "No network calls", "One shared database"], 1, "Services can be deployed and scaled independently."),
        _q("m2", "What does a circuit breaker do?", ["Encrypts calls", "Stops calling a failing service for a while to prevent cascading failures", "Balances load", "Caches data"], 1, "It fails fast and gives the downstream service time to recover."),
        _q("m3", "An API gateway typically…", ["Stores data", "Provides a single entry point that routes requests to services", "Replaces services", "Runs tests"], 1, "Gateways handle routing, auth and rate limiting."),
        _q("m4", "Which is generally recommended for data ownership?", ["One database shared by all services", "Each service owns its data", "No database", "Only caches"], 1, "Database-per-service avoids tight coupling."),
    ],
    "Python": [
        _q("p1", "Which decorator generates __init__ and __repr__ for a class?", ["@staticmethod", "@dataclass", "@property", "@classmethod"], 1, "dataclasses.dataclass generates boilerplate methods."),
        _q("p2", "What isolates project dependencies?", ["A virtual environment", "A global pip install", "PYTHONPATH only", "A .pyc file"], 0, "python -m venv creates isolated environments."),
        _q("p3", "Which reads JSON from a file object?", ["json.loads(f)", "json.load(f)", "json.read(f)", "json.parse(f)"], 1, "json.load reads from a file; json.loads parses a string."),
        _q("p4", "Type hints in Python are…", ["Enforced at runtime", "Optional annotations checked by tools like mypy", "Required", "Only for classes"], 1, "They are not enforced by the interpreter."),
    ],
    "JavaScript": [
        _q("js1", "Which keyword declares a block-scoped variable that can be reassigned?", ["var", "let", "const", "static"], 1, "let is block-scoped and reassignable."),
        _q("js2", "`await` can be used…", ["Anywhere", "Inside async functions (or top-level modules)", "Only in loops", "Only with callbacks"], 1, "await pauses within an async context."),
        _q("js3", "`fetch()` returns…", ["JSON", "A Promise resolving to a Response", "A string", "XML"], 1, "Call response.json() to parse the body."),
        _q("js4", "`===` compares…", ["Value only with coercion", "Value and type without coercion", "References only", "Strings only"], 1, "Strict equality avoids type coercion."),
    ],
    "React": [
        _q("re1", "State updates in React should be done…", ["By mutating state directly", "Via the setter from useState", "Through the DOM", "With global variables"], 1, "Use the setter so React re-renders."),
        _q("re2", "useEffect is primarily for…", ["Styling", "Synchronising with external systems (side effects)", "Routing", "Declaring state"], 1, "Effects handle data fetching, subscriptions, etc."),
        _q("re3", "Keys in lists help React…", ["Style items", "Identify items between renders", "Sort items", "Fetch data"], 1, "Stable keys enable efficient reconciliation."),
        _q("re4", "A controlled input…", ["Has its value driven by React state", "Is uncontrolled", "Uses refs only", "Cannot be validated"], 0, "value + onChange keep React as the source of truth."),
    ],
}


def public_quiz(skill: str) -> list[dict]:
    """Questions without the answer key (safe to send to the browser)."""
    return [
        {"id": q["id"], "question": q["question"], "options": q["options"]}
        for q in QUIZZES.get(skill, [])
    ]
