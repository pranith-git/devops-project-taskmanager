import tempfile
import unittest
from pathlib import Path

from sqlalchemy import URL, select

from app import create_app
from app import users


class AuthApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "users.sqlite3"
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "DATABASE_URL": URL.create(
                    "sqlite",
                    database=str(self.database_path),
                ),
            }
        )
        self.engine = self.app.extensions["database_engine"]
        self.client = self.app.test_client()

    def tearDown(self):
        self.engine.dispose()
        self.temp_dir.cleanup()

    def test_registration_stores_a_password_hash(self):
        response = self.client.post(
            "/api/register",
            json={"username": "alice", "password": "a-secure-password"},
        )

        self.assertEqual(response.status_code, 201)
        with self.engine.connect() as connection:
            user = connection.execute(
                select(users.c.username, users.c.password_hash)
            ).one()
        username, password_hash = user
        self.assertEqual(username, "alice")
        self.assertNotEqual(password_hash, "a-secure-password")

    def test_duplicate_usernames_are_rejected_case_insensitively(self):
        self.client.post(
            "/api/register",
            json={"username": "Alice", "password": "a-secure-password"},
        )

        response = self.client.post(
            "/api/register",
            json={"username": "alice", "password": "another-password"},
        )

        self.assertEqual(response.status_code, 409)

    def test_login_session_and_logout(self):
        self.client.post(
            "/api/register",
            json={"username": "alice", "password": "a-secure-password"},
        )
        login = self.client.post(
            "/api/login",
            json={"username": "ALICE", "password": "a-secure-password"},
        )

        self.assertEqual(login.status_code, 200)
        self.assertEqual(self.client.get("/api/me").json, {"username": "alice"})
        self.assertEqual(self.client.post("/api/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/me").status_code, 401)

    def test_invalid_credentials_and_payloads_are_rejected(self):
        invalid_registration = self.client.post(
            "/api/register",
            json={"username": "a", "password": "short"},
        )
        malformed_json = self.client.post(
            "/api/register",
            data="{",
            content_type="application/json",
        )
        invalid_login = self.client.post(
            "/api/login",
            json={"username": "alice", "password": "not-registered"},
        )

        self.assertEqual(invalid_registration.status_code, 400)
        self.assertEqual(malformed_json.status_code, 400)
        self.assertEqual(
            malformed_json.json["error"],
            "Request body must be a valid JSON object.",
        )
        self.assertEqual(invalid_login.status_code, 401)
        self.assertEqual(self.client.get("/api/me").status_code, 401)


if __name__ == "__main__":
    unittest.main()
