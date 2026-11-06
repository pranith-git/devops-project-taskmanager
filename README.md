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

The app is available at:

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
