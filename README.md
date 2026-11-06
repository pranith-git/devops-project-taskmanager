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

This project uses a repeatable lifecycle to move a change from an identified need to a running application. The stages are connected: test and runtime feedback becomes new planning input, and each change should pass build and test checks before it is released. Docker Compose runs PostgreSQL, the Flask API, and a Python HTTP server for the static frontend. PostgreSQL stores account records; dashboard tasks and the selected theme are stored in the browser's `localStorage`, so they are browser-specific and are not backed up with the PostgreSQL volume.

The flow is:

1. Define a user or operational need and its acceptance criteria.
2. Implement the change in the relevant backend, frontend, or deployment files.
3. Build the services and verify they start with the expected configuration.
4. Run automated tests and smoke-check important user journeys.
5. Package and document a version that has passed those checks.
6. Deploy it, verify health, and monitor the application and its data.
7. Use incidents, metrics, and user feedback to plan the next change.

### 1. Plan

Start with a user workflow or operational problem, then describe the expected behavior in a way that can be verified. For a feature, acceptance criteria might cover registration and login, session handling, or dashboard actions such as creating, filtering, prioritizing, and deleting tasks. Include invalid input and unauthenticated access in the criteria, not just the successful path.

Record non-functional requirements alongside the feature: security of credentials and session cookies, expected availability, data retention, and any compatibility impact. Identify which part of the application is likely to change (Flask API, static frontend, database, or Compose configuration) and which tests should demonstrate completion. Keep work small enough to review and release independently where practical.

From the repository root, inspect the current changes and recent history before starting:

```powershell
git status --short
git log -5 --oneline
```

**Output:** a scoped change with acceptance criteria, risk notes, and a test plan. Those criteria become the basis for implementation and later release checks.

### 2. Code

Implement the change in the layer that owns it. The Flask backend handles API behavior and persistence; the browser frontend presents the user flows and calls the API; Compose and Dockerfiles describe how the services are built and connected. Keep these boundaries clear so that interface changes do not silently alter database behavior, and database changes do not leave the application unable to read existing data.

Validate input at the API boundary, preserve established authentication behavior, and keep configuration such as `SECRET_KEY` and database credentials in environment variables rather than source control. For schema or configuration changes, document any migration or rollout ordering needed. Add or update tests as part of the same change so the acceptance criteria remain executable.

Before handing off the change, check the patch and see which files it affects:

```powershell
git diff --check
git diff --stat
git status --short
```

In this application, changes to API behavior and account storage belong under `backend/`; dashboard behavior and browser-side task/theme storage are under `frontend/`. The task list currently uses `localStorage`, not the Flask API or PostgreSQL.

**Output:** reviewed source and configuration changes, together with tests that cover the new behavior and relevant regressions.

### 3. Build

Build the runtime from the repository's Dockerfiles and Compose configuration. The backend image installs dependencies from `requirements.txt`; the frontend image serves the static files; Compose connects both services to PostgreSQL. Required secrets are supplied through the environment or `.env`, while `.env.example` documents the expected configuration without containing live credentials.

Run `docker compose up --build` to build and start the stack. Compose waits for the database health check before starting the backend, then waits for the backend health check before starting the frontend. A successful build is more than a completed image build: the services must start, the database must be reachable, and the backend health endpoint must respond. The application creates its database table on startup; review how schema changes are applied before releasing changes that require more than initial table creation.

Validate the resolved Compose configuration and build the images from the repository root:

```powershell
docker compose config --quiet
docker compose build
```

The Compose service names are `database`, `backend`, and `frontend`. `docker compose config --quiet` checks the Compose configuration and required variables; it does not start the services.

**Output:** reproducible service images and a running stack using the documented configuration.

### 4. Test

Test from the smallest relevant unit outward to the full application. Backend tests verify API behavior and persistence, including valid and invalid credentials, duplicate usernames, and session behavior. Selenium tests exercise user journeys in a browser, including login and task/dashboard interactions. Run the tests using the commands in the [Backend tests](#backend-tests) and [Selenium tests](#selenium-tests) sections.

From the repository root, run the backend tests with:

```powershell
python -m unittest discover -s backend -v
```

For browser tests, start the Compose app first, ensure Chrome is installed, then run:

```powershell
docker compose up -d --build
python -m unittest discover -s tests/selenium -v
```

The Selenium tests use Chrome and connect to the frontend at `http://127.0.0.1:8081`. The discovered Selenium suite checks task deletion and night mode; the original login and add-task browser tests can also be run with:

```powershell
python selenium_tests.py
```

The backend suite checks the account API and session behavior.

After automated tests pass, perform a Compose smoke check: confirm the database and services are healthy, request `/health`, load the login page, and verify a representative authenticated flow. Check failure paths as well as success paths, such as rejected invalid input and access without a valid session. If a test fails, fix the cause and repeat the relevant checks before proceeding.

Run these basic HTTP checks while the Compose services are up:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:5000/health
(Invoke-WebRequest -Uri http://127.0.0.1:8081/login.html).StatusCode
```

Automating these commands in CI is a recommended next step; do not treat a manual local pass as evidence that CI is already configured. CI should use isolated test data and non-production secrets, and should block release when required tests fail.

Stop the local services after browser testing if you no longer need them:

```powershell
docker compose down
```

**Output:** test results and smoke-check evidence matched to the plan's acceptance criteria.

### 5. Release

Prepare a release only after the build and test gates pass. Review the changes and their dependencies, confirm the required environment variables are documented, and check that no secrets or local database files are included. If the change affects the schema or runtime configuration, include the upgrade and rollback considerations in the release notes.

Tag or otherwise identify the version being delivered. Summarize user-visible changes, fixes, and operational actions so that the deployed version can be traced to its source and test results. Confirm that the documented startup instructions still work from a clean checkout.

After the release commit has been created and verified, replace `vX.Y.Z` with the actual version:

```powershell
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

This repository does not currently define an automated release pipeline; these commands only create and publish a Git tag.

**Output:** an identifiable, tested version with release notes and deployment instructions.

### 6. Deploy

For a local Compose deployment on Windows, run these commands from the repository root. Create `.env` if it does not exist, edit it to replace the example `SECRET_KEY` and `POSTGRES_PASSWORD` with strong unique values, then start the services:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env and replace the example secrets before continuing.
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

If `.env` already exists, do not overwrite it with `Copy-Item`; review and update it instead. The frontend and backend ports are bound to `127.0.0.1:8081` and `127.0.0.1:5000`; PostgreSQL data is kept in the named `postgres_data` volume. Keep deployment credentials and data separate from development and test environments.

Once services start, verify the Compose health checks, API health endpoint, and frontend page:

```powershell
docker compose ps
Invoke-RestMethod -Uri http://127.0.0.1:5000/health
Invoke-WebRequest -Uri http://127.0.0.1:8081/login.html | Select-Object StatusCode
```

For a hosted or externally accessible deployment, place the application behind an appropriately configured HTTPS endpoint and set `SESSION_COOKIE_SECURE=true` in that environment; do not expose the development-oriented local setup directly to the public internet. Have a rollback plan, especially when a release changes persistent data or configuration.

**Output:** the intended version running in the target environment, with health and user-flow checks completed.

### 7. Operate

Operations continue after deployment. Check container status and health, review backend and database logs for errors, and respond to reports by identifying the affected version, reproducing the user flow, and tracing the request through the frontend, API, and database. The `/health` endpoint is a basic service check, not a complete measure of whether every user workflow is functioning.

Protect and regularly back up the `postgres_data` volume, and periodically verify that backups can be restored. Limit access to secrets, rotate them through a planned change, and avoid logging passwords, session values, or other sensitive data. For an incident, assess impact, restore service or roll back where appropriate, preserve useful diagnostic information, and record follow-up work rather than relying on an informal fix.

Useful first checks for a running Compose deployment are:

```powershell
docker compose ps
docker compose logs --tail=100 backend database frontend
Invoke-RestMethod -Uri http://127.0.0.1:5000/health
```

The database health check uses `pg_isready`; the backend health check calls `/health`. PostgreSQL backups cover account data only, not dashboard tasks or theme settings held in browser `localStorage`.

**Output:** a stable service, recoverable data, and documented incident or maintenance actions.

### 8. Monitor and Optimize

Use operational signals and user feedback to decide what to improve. Useful signals include health-check failures, container restarts, API errors and latency, database connection problems, and failures in critical browser journeys. Treat failed logins carefully: monitor aggregate patterns without recording passwords or unnecessary personal data. Selenium tests and API checks can catch regressions, while production monitoring can reveal problems those tests do not reproduce.

Review these signals regularly and convert recurring failures, slow paths, or usability issues into prioritized work. Improvements might include stronger automated checks, clearer error handling, database backup/restore drills, or better deployment observability. Revisit the acceptance criteria and risk notes during planning so lessons from operation shape the next development cycle.

For a live local view of resource usage and service logs, use:

```powershell
docker compose stats
docker compose logs --follow backend
```

Stop the log stream with `Ctrl+C`. Compose provides container health checks and logs, but this repository does not currently include a metrics dashboard, centralized logging service, or CI pipeline.

**Output:** prioritized follow-up work and a feedback loop that improves reliability and delivery over time.
