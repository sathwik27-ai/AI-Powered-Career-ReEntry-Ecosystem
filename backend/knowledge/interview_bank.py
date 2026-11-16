"""Mock interview question bank.

Each question lists `key_points` – concepts a strong answer usually covers. Each key
point has regex patterns used by the deterministic evaluator. Model answers are
starting points; the HR ones are personalised with verified profile data.
"""
from __future__ import annotations


def kp(label: str, *patterns: str) -> dict:
    return {"label": label, "patterns": list(patterns)}


TECHNICAL: list[dict] = [
    {
        "id": "t-sb-1", "skill": "Spring Boot",
        "question": "What is Spring Boot auto-configuration, and how do starters relate to it?",
        "key_points": [
            kp("auto-configuration based on classpath", r"auto-?config", r"classpath"),
            kp("starter dependencies", r"starter"),
            kp("conditional beans / sensible defaults", r"conditional", r"default", r"opinionated"),
            kp("overriding via properties or own beans", r"application\.(?:properties|ya?ml)", r"propert", r"override"),
        ],
        "model_answer": "Spring Boot auto-configuration inspects the classpath and existing beans and conditionally creates sensible default beans (using @Conditional annotations). Starters such as spring-boot-starter-web bundle compatible dependencies, so adding one brings in libraries that auto-configuration then wires up – for example an embedded Tomcat and Jackson. I can override defaults with application.properties/yaml or by defining my own bean, and I can inspect decisions with the conditions report (--debug).",
    },
    {
        "id": "t-sb-2", "skill": "Spring Boot",
        "question": "How would you build and structure a REST endpoint in Spring Boot 3, including validation and error handling?",
        "key_points": [
            kp("@RestController and mappings", r"restcontroller", r"(?:get|post|put|delete|request)mapping"),
            kp("layered design (controller/service/repository)", r"service", r"repository", r"layer"),
            kp("validation with @Valid / Jakarta validation", r"@?valid", r"jakarta", r"notnull|notblank"),
            kp("global exception handling", r"controlleradvice", r"exceptionhandler", r"problemdetail"),
            kp("appropriate status codes", r"\b201\b", r"\b400\b", r"\b404\b", r"status code", r"responseentity"),
        ],
        "model_answer": "I create a @RestController with @GetMapping/@PostMapping methods that delegate to a service layer, which uses a Spring Data repository. Request DTOs carry Jakarta validation annotations like @NotBlank and are validated with @Valid. A @RestControllerAdvice maps exceptions to ProblemDetail responses – 400 for validation errors, 404 for missing resources – and successful creation returns 201 with ResponseEntity. I cover it with @WebMvcTest and MockMvc tests.",
    },
    {
        "id": "t-sb-3", "skill": "Spring Boot",
        "question": "What changed when moving from Spring Boot 2 to Spring Boot 3?",
        "key_points": [
            kp("Java 17 baseline", r"java\s*17", r"\b17\b"),
            kp("javax to jakarta namespace", r"jakarta", r"javax"),
            kp("observability / native image support", r"observab", r"micrometer", r"native", r"graalvm"),
            kp("migration approach", r"migrat", r"upgrade", r"deprecat"),
        ],
        "model_answer": "Spring Boot 3 requires Java 17, moves from javax.* to jakarta.* packages (Jakarta EE 9+), improves observability with Micrometer and adds GraalVM native-image support. Migration usually means upgrading to the latest 2.7 first, fixing deprecations, then switching imports to jakarta and updating dependencies.",
    },
    {
        "id": "t-java-1", "skill": "Java",
        "question": "Explain the difference between an ArrayList and a LinkedList and when you would use each.",
        "key_points": [
            kp("dynamic array vs nodes", r"array", r"node", r"linked"),
            kp("random access performance", r"random access", r"o\(1\)", r"index"),
            kp("insert/remove trade-offs", r"insert", r"remov", r"o\(n\)"),
            kp("practical default choice", r"default", r"most cases", r"usually", r"prefer"),
        ],
        "model_answer": "ArrayList is backed by a resizable array, giving O(1) index access and good cache locality; inserting in the middle is O(n). LinkedList uses doubly-linked nodes, so insertions at known positions are cheap but index access is O(n). In practice ArrayList is the default choice; LinkedList is rarely the better option.",
    },
    {
        "id": "t-java-2", "skill": "Java",
        "question": "How do Java Streams work, and can you give an example of using them?",
        "key_points": [
            kp("pipeline of operations", r"pipeline", r"chain"),
            kp("intermediate vs terminal operations", r"intermediate", r"terminal", r"lazy"),
            kp("filter/map/collect examples", r"filter", r"map", r"collect", r"tolist", r"reduce"),
            kp("immutability / side-effect free", r"side.?effect", r"immutab", r"declarative"),
        ],
        "model_answer": "A stream is a lazy pipeline: intermediate operations like filter and map build up the pipeline, and a terminal operation like collect or toList triggers processing. For example, orders.stream().filter(o -> o.total() > 1000).map(Order::customer).distinct().toList(). Streams encourage declarative, side-effect-free code.",
    },
    {
        "id": "t-rest-1", "skill": "REST APIs",
        "question": "What makes an API RESTful, and how do you choose HTTP methods and status codes?",
        "key_points": [
            kp("resources and nouns in URLs", r"resource", r"noun", r"/\w+s\b"),
            kp("HTTP methods semantics", r"\bget\b", r"\bpost\b", r"\bput\b", r"\bdelete\b"),
            kp("statelessness", r"stateless"),
            kp("status codes", r"\b20[01]\b", r"\b40[04]\b", r"status"),
            kp("idempotency", r"idempot"),
        ],
        "model_answer": "REST models the domain as resources identified by noun URLs such as /books/42. HTTP methods carry the intent: GET reads, POST creates, PUT replaces, PATCH partially updates, DELETE removes – and GET/PUT/DELETE are idempotent. Requests are stateless. Status codes communicate outcomes: 200/201/204 for success, 400 for invalid input, 404 for missing resources, 409 for conflicts.",
    },
    {
        "id": "t-sql-1", "skill": "SQL",
        "question": "How would you find customers who have not placed any orders?",
        "key_points": [
            kp("LEFT JOIN with NULL check or NOT EXISTS", r"left\s+join", r"not\s+exists", r"not\s+in"),
            kp("IS NULL filtering", r"is\s+null"),
            kp("join condition on keys", r"\bon\b", r"customer_id", r"foreign key"),
        ],
        "model_answer": "SELECT c.* FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL; – or equivalently with NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id), which is often clearer and performs well with an index on orders.customer_id.",
    },
    {
        "id": "t-docker-1", "skill": "Docker",
        "question": "How would you containerise a backend service, and why?",
        "key_points": [
            kp("Dockerfile and base image", r"dockerfile", r"base image", r"\bfrom\b"),
            kp("multi-stage build", r"multi-?stage"),
            kp("consistency across environments", r"consisten", r"works on my machine", r"portab", r"environment"),
            kp("compose / running with dependencies", r"compose", r"volume", r"port"),
        ],
        "model_answer": "I write a multi-stage Dockerfile: build the JAR in a JDK image, then copy it into a slim JRE base image and set the entrypoint. Containers give consistent, portable environments from laptop to production. Locally I use Docker Compose to run the service with its database, exposing ports and using volumes for data.",
    },
    {
        "id": "t-test-1", "skill": "Unit Testing",
        "question": "How do you approach unit testing a service that depends on a database?",
        "key_points": [
            kp("mocking dependencies", r"mock", r"stub"),
            kp("isolation of the unit", r"isolat", r"unit"),
            kp("JUnit / framework", r"junit", r"pytest", r"mockito"),
            kp("integration tests separately", r"integration", r"testcontainers"),
        ],
        "model_answer": "I isolate the service by mocking the repository with Mockito, then assert behaviour with JUnit 5 – including edge cases and exceptions. Database behaviour is covered separately by integration tests, for example with @DataJpaTest or Testcontainers.",
    },
    {
        "id": "t-ms-1", "skill": "Microservices",
        "question": "When would you choose microservices over a monolith?",
        "key_points": [
            kp("independent deployment / scaling", r"independ", r"scal", r"deploy"),
            kp("team / domain boundaries", r"team", r"domain", r"bounded context"),
            kp("operational complexity trade-off", r"complex", r"overhead", r"network", r"trade-?off"),
            kp("start with modular monolith", r"monolith", r"modular"),
        ],
        "model_answer": "Microservices pay off when parts of the system need independent deployment and scaling and when several teams own clear domain boundaries. They add operational complexity – network calls, distributed data, observability – so for a small team I'd start with a well-structured modular monolith and extract services when there's a clear need.",
    },
    {
        "id": "t-py-1", "skill": "Python",
        "question": "How do you manage dependencies and environments in a Python project?",
        "key_points": [
            kp("virtual environments", r"venv", r"virtual\s*env", r"conda", r"poetry"),
            kp("pinning requirements", r"requirements", r"pin", r"lock"),
            kp("reproducibility", r"reproduc", r"consisten"),
        ],
        "model_answer": "I create an isolated environment with python -m venv (or Poetry), pin dependencies in requirements.txt or a lock file, and document setup so every environment is reproducible.",
    },
    {
        "id": "t-js-1", "skill": "JavaScript",
        "question": "Explain promises and async/await in JavaScript.",
        "key_points": [
            kp("promise states", r"pending", r"resolv", r"reject"),
            kp("async/await syntax", r"async", r"await"),
            kp("error handling", r"try", r"catch"),
        ],
        "model_answer": "A promise represents a future value that is pending, then fulfilled or rejected. async functions return promises and await pauses until a promise settles, which makes asynchronous code read sequentially; errors are handled with try/catch.",
    },
]

HR: list[dict] = [
    {
        "id": "hr-break", "skill": None,
        "question": "Can you tell us about your career break and why you want to return now?",
        "key_points": [
            kp("states the break factually and briefly", r"break", r"took time", r"caregiving|maternity|family|personal"),
            kp("what you did to stay current / upskill", r"learn", r"course", r"upskill", r"practic", r"project", r"refresh"),
            kp("motivation for returning", r"excited", r"motivat", r"ready", r"looking forward", r"return"),
            kp("link to the role / value you bring", r"experience", r"skills?", r"contribut", r"role", r"team"),
        ],
        "model_answer": "",  # personalised at runtime
    },
    {
        "id": "hr-intro", "skill": None,
        "question": "Tell me about yourself.",
        "key_points": [
            kp("professional background", r"years?", r"experience", r"worked"),
            kp("key skills / strengths", r"skill", r"strength", r"expert|proficient|strong"),
            kp("recent learning or achievement", r"recent", r"learn", r"built", r"project"),
            kp("what you're looking for next", r"looking", r"next", r"role", r"goal"),
        ],
        "model_answer": "",
    },
    {
        "id": "hr-strength", "skill": None,
        "question": "What is a professional achievement you are proud of?",
        "key_points": [
            kp("situation / context", r"when", r"project", r"team", r"situation"),
            kp("your specific actions", r"\bi\s+(?:built|led|designed|implemented|created|improved|developed|owned)"),
            kp("measurable result", r"\d+\s*%", r"reduc", r"improv", r"result", r"saved", r"increase"),
            kp("what you learned", r"learn", r"taught me", r"since then"),
        ],
        "model_answer": "Use the STAR structure: describe the Situation and Task in one or two sentences, spend most of the answer on the Actions you personally took (\"I designed…\", \"I led…\"), and finish with a measurable Result and what you learned.",
    },
    {
        "id": "hr-updated", "skill": None,
        "question": "How do you keep your skills up to date?",
        "key_points": [
            kp("structured learning", r"course", r"documentation", r"roadmap", r"plan"),
            kp("hands-on practice", r"project", r"practic", r"build", r"exercise"),
            kp("community / reading", r"community", r"blog", r"meetup", r"open.?source", r"read"),
            kp("concrete recent example", r"recent", r"last", r"currently", r"this month"),
        ],
        "model_answer": "",
    },
    {
        "id": "hr-flex", "skill": None,
        "question": "What kind of working arrangement helps you do your best work?",
        "key_points": [
            kp("clear preference", r"remote", r"hybrid", r"flexib", r"part-?time"),
            kp("commitment to outcomes", r"deliver", r"deadline", r"outcome", r"reliab"),
            kp("communication practices", r"communicat", r"available", r"overlap", r"update"),
        ],
        "model_answer": "State your preference plainly (e.g. remote or hybrid), then focus on how you deliver: clear communication, agreed availability windows and reliable delivery against deadlines.",
    },
]

ALL_QUESTIONS = {q["id"]: q for q in TECHNICAL + HR}
