import os
import re
import sqlite3
from contextlib import closing
from pathlib import Path

from flask import Flask, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

USERNAME_PATTERN = re.compile(r"[a-zA-Z0-9_.-]{3,32}")
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "development-only-change-this"),
        DATABASE_PATH=os.environ.get(
            "DATABASE_PATH", str(Path(__file__).parent / "instance" / "users.sqlite3")
        ),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "").lower()
        in {"1", "true", "yes"},
    )
    if test_config:
        app.config.update(test_config)

    database_path = Path(app.config["DATABASE_PATH"])
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def connect_db():
        connection = sqlite3.connect(app.config["DATABASE_PATH"], timeout=5)
        connection.row_factory = sqlite3.Row
        return connection

    def json_error(message, status):
        return jsonify(error=message), status

    def credentials():
        if not request.is_json:
            return None, json_error("Request body must be JSON.", 415)

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return None, json_error("Request body must be a valid JSON object.", 400)

        username = payload.get("username")
        password = payload.get("password")
        if not isinstance(username, str) or not USERNAME_PATTERN.fullmatch(username):
            return None, json_error(
                "Username must be 3-32 characters: letters, numbers, '.', '_' or '-'.",
                400,
            )
        if (
            not isinstance(password, str)
            or not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH
        ):
            return None, json_error(
                "Password must be between 8 and 128 characters.", 400
            )
        return (username.lower(), password), None

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    @app.post("/api/register")
    def register():
        data, error = credentials()
        if error:
            return error

        username, password = data
        try:
            with closing(connect_db()) as connection:
                with connection:
                    connection.execute(
                        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                        (username, generate_password_hash(password)),
                    )
        except sqlite3.IntegrityError:
            return json_error("Username is already registered.", 409)

        return jsonify(username=username), 201

    @app.post("/api/login")
    def login():
        data, error = credentials()
        if error:
            return error

        username, password = data
        with closing(connect_db()) as connection:
            user = connection.execute(
                "SELECT id, username, password_hash FROM users WHERE username = ?",
                (username,),
            ).fetchone()
        if user is None or not check_password_hash(user["password_hash"], password):
            return json_error("Invalid username or password.", 401)

        session.clear()
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        return jsonify(username=user["username"])

    @app.get("/api/me")
    def current_user():
        if "user_id" not in session:
            return json_error("Authentication required.", 401)
        return jsonify(username=session["username"])

    @app.post("/api/logout")
    def logout():
        session.clear()
        return jsonify(status="logged_out")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
