# Task Manager Demo

This project is a small full-stack demo with:

- a Flask backend with PostgreSQL storage
- a static frontend served from a simple Python web server
- a browser-based login page and dashboard
- Selenium UI tests for login, task creation and deletion, and night mode

## Run with Compose

Copy `.env.example` to `.env`, replace `SECRET_KEY` and `POSTGRES_PASSWORD` with
unique strong values, then run:

```sh
docker compose up --build
```

The app is available at the following local URLs:

- Frontend login page: `http://127.0.0.1:8081/login.html`
- Frontend dashboard: `http://127.0.0.1:8081/index.html`
- Backend API: `http://127.0.0.1:5000`
- Health check: `http://127.0.0.1:5000/health`

Compose runs PostgreSQL from the `postgres:17-alpine` image and stores database
files in the named `postgres_data` volume. The backend waits for PostgreSQL's
health check before starting. Set `SESSION_COOKIE_SECURE=true` when serving the
API over HTTPS.

## Demo login flow

1. Open `http://127.0.0.1:8081/login.html`
2. Create a new account or log in with an existing one
3. The dashboard loads only after the backend confirms the session
4. Use the logout button to clear the session

## API endpoints

- `POST /api/register` — JSON `{ "username": "alice", "password": "..." }`
- `POST /api/login` — same JSON shape; sets the session cookie
- `GET /api/me` — returns the logged-in username
- `POST /api/logout` — clears the session
- `GET /health` — Compose health check

Usernames are case-insensitive and must be 3-32 characters. Passwords must be
8-128 characters.

## Selenium tests

Start the app with Compose, then run all Selenium tests with:

```sh
python -m unittest discover -s tests/selenium -v
```

Run the new UI checks individually:

```sh
python -m unittest discover -s tests/selenium -p test_delete_task.py -v
python -m unittest discover -s tests/selenium -p test_night_mode.py -v
```

The Selenium tests use Chrome and include short pauses for the demo. The original
login and add-task tests can still be run with `python selenium_tests.py`.

## Backend tests

```sh
python -m unittest discover -s backend -v
```

## DevOps Lifecycle Documentation

This project is a containerized full-stack application built with Python, Flask, PostgreSQL, and static frontend assets. To manage it effectively in a DevOps workflow, each stage of the lifecycle should be treated as a continuous delivery pipeline that keeps software reliable, secure, and easy to operate.

### 1. Plan

During the planning phase, the project scope should be defined around the core user workflows: user registration, login, session-based authentication, task creation, filtering, prioritization, deletion, and night mode on the dashboard. The team should document functional requirements, non-functional requirements, risk areas, and operational constraints before coding begins. For this project, the roadmap should include a clear definition of success for performance, security, and deployment readiness, using Docker Compose as the local runtime model and PostgreSQL as the persistence layer. A backlog should track features, bug fixes, and test coverage goals, while branch naming and issue tracking should align to clean release management.

### 2. Code

In the coding phase, the application is split into a Flask backend and a static frontend that communicates through REST APIs. Developers should maintain a clean separation between API logic, UI behavior, and database access. The backend should continue using secure password hashing via Werkzeug, session-based authentication, and environment-driven configuration for secrets such as `SECRET_KEY` and `POSTGRES_PASSWORD`. Frontend code should stay simple and lightweight, while database/schema changes should be reviewed carefully to avoid compatibility issues. Code quality should be reinforced by consistent naming conventions, modular JavaScript, and small, testable functions rather than large monolithic files.

### 3. Build

The build phase is handled through Docker and Compose. The project is assembled from a backend container, a PostgreSQL service, and a frontend serving layer. The build process should validate that dependencies resolve correctly from `requirements.txt`, Dockerfiles are correct, and the Compose environment loads secret values from `.env` without exposing them in the repository. A successful build means the containers start reliably, the API health endpoint responds, and the database is initialized with the expected tables. For this project, the build workflow should be reproducible enough that any developer can run `docker compose up --build` and get the same runtime state.

### 4. Test

Testing is essential because the project includes both backend and UI automation checks. The backend logic should be validated with unit tests under `backend/`, while Selenium tests should validate login, task creation, deletion, and dashboard behavior in a browser environment. The project should enforce smoke checks such as database startup, API health checks, and browser interactions before approving a release. A healthy DevOps process for this repository would require automated tests in CI to run on every change, so regressions are caught before deployment. The test phase also includes validating both happy-path and failure-path scenarios, especially for invalid credentials, duplicate usernames, and session expiry.

### 5. Release

The release phase should prepare the project for controlled delivery. This includes tagging a version, verifying environment variables, documenting configuration steps in the README, and confirming that the app works using the same commands intended for end users. Since this project is container-based, the release checklist should confirm that Docker images are built successfully, `postgres_data` persists data correctly, and the frontend URLs remain stable. Release notes should summarize user-visible changes, database updates, security improvements, and any operational caveats such as required `.env` values. A release is not complete until the application has passed build and test gates in a clean environment.

### 6. Deploy

Deployment for this project is straightforward and should be handled via Compose in a target environment, such as a local VM, a staging server, or a container host. The deployment process should start by copying `.env.example` to `.env`, setting strong secrets, and ensuring the environment is isolated from development data. The Flask backend should be exposed on port `5000`, the frontend on `8081`, and PostgreSQL should run under the `postgres:17-alpine` image with a persistent volume. Production or staging deploys should verify the `/health` endpoint, the login page, and the dashboard route after startup. If this service is moved to a hosted environment, HTTPS and secure cookies should also be configured before exposing it externally.

### 7. Operate

During the operation phase, the application should be supported through continuous health monitoring and incident handling. The team should use Docker health checks, log inspection, and API monitoring to verify that the database and web service remain healthy. For this project, the operational checklist includes checking the PostgreSQL container health, confirming the backend `/health` endpoint returns `ok`, and validating that login and session flows continue to function. Regular backup of the `postgres_data` volume, rotation of secret keys, and review of application logs should be part of normal operations. If a user reports a login or task issue, the operations workflow should begin with log review, container status checks, and a quick reproduction against the running environment.

### 8. Monitor and Optimize

The final DevOps phase focuses on long-term reliability and improvement. For this project, monitoring should include request success rates, failed logins, database connection errors, container restarts, and browser-based validation of key user journeys. Data from Selenium tests, API health checks, and manual QA should be used to identify bottlenecks or reliability issues. Optimization can include improving frontend responsiveness, tightening backend validation, reducing session risk, or increasing test coverage with CI automation. Over time, the project should evolve toward stronger version control, automated deployment checks, and more mature observability so that releases become faster, safer, and easier to maintain.

This DevOps lifecycle approach ensures the project remains secure, stable, and scalable while supporting rapid iteration for a small but practical full-stack application.
