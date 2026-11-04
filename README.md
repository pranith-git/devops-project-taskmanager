# Task Manager Backend

The Flask backend provides a small JSON API for account registration and login.
It stores usernames and Werkzeug password hashes in SQLite. Login state is held
in a signed, HTTP-only session cookie; passwords are never returned by the API.

## Run with Compose

Copy `.env.example` to `.env` and replace `SECRET_KEY` with a unique random
value, then run:

```sh
docker compose up --build
```

The API is available at `http://localhost:5000`. SQLite data is stored in the
named `user_data` volume. Set `SESSION_COOKIE_SECURE=true` when serving the API
over HTTPS. The default development secret key is only for local, non-Compose
use and must not be used in production.

## Endpoints

- `POST /api/register` — JSON `{ "username": "alice", "password": "..." }`
- `POST /api/login` — same JSON shape; sets the session cookie
- `GET /api/me` — returns the logged-in username
- `POST /api/logout` — clears the session
- `GET /health` — Compose health check

Usernames are case-insensitive and must be 3-32 characters. Passwords must be
8-128 characters. Run the tests locally with:

```sh
python -m unittest discover -s backend -v
```
