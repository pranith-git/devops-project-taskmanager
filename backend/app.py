import os
import re
from pathlib import Path

from flask import Flask, jsonify, request, session
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    URL,
    create_engine,
    func,
    select,
)
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

USERNAME_PATTERN = re.compile(r"[a-zA-Z0-9_.-]{3,32}")
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

metadata = MetaData()
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(32), nullable=False, unique=True),
    Column("password_hash", Text, nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.current_timestamp()),
)


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "development-only-change-this"),
        DATABASE_URL=os.environ.get("DATABASE_URL"),
        DATABASE_PATH=os.environ.get(
            "DATABASE_PATH", str(Path(__file__).parent / "instance" / "users.sqlite3")
        ),
        DB_HOST=os.environ.get("DB_HOST"),
        DB_PORT=int(os.environ.get("DB_PORT", "5432")),
        DB_NAME=os.environ.get("DB_NAME", "taskmanager"),
        DB_USER=os.environ.get("DB_USER", "taskmanager"),
        DB_PASSWORD=os.environ.get("DB_PASSWORD"),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "").lower()
        in {"1", "true", "yes"},
    )

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    if test_config:
        app.config.update(test_config)

    database_url = app.config["DATABASE_URL"]
    if database_url is None and app.config["DB_HOST"]:
        database_url = URL.create(
            "postgresql+psycopg",
            username=app.config["DB_USER"],
            password=app.config["DB_PASSWORD"],
            host=app.config["DB_HOST"],
            port=app.config["DB_PORT"],
            database=app.config["DB_NAME"],
        )
    elif database_url is None:
        database_path = Path(app.config["DATABASE_PATH"])
        database_path.parent.mkdir(parents=True, exist_ok=True)
        database_url = URL.create("sqlite", database=str(database_path))

    engine = create_engine(database_url, pool_pre_ping=True)
    metadata.create_all(engine)
    app.extensions["database_engine"] = engine

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
            with engine.begin() as connection:
                connection.execute(
                    users.insert().values(
                        username=username,
                        password_hash=generate_password_hash(password),
                    )
                )
        except IntegrityError:
            return json_error("Username is already registered.", 409)

        return jsonify(username=username), 201

    @app.post("/api/login")
    def login():
        data, error = credentials()
        if error:
            return error

        username, password = data
        with engine.connect() as connection:
            user = connection.execute(
                select(users.c.id, users.c.username, users.c.password_hash).where(
                    users.c.username == username
                )
            ).mappings().one_or_none()
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
