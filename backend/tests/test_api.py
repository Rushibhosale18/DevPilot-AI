"""
DevPilot AI - Backend Tests
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db

# ── In-memory SQLite for tests ────────────────────────────────────────────────
TEST_DB_URL = "sqlite:///./test_devpilot.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=engine)
client = TestClient(app)


# ── Auth tests ────────────────────────────────────────────────────────────────
class TestAuth:
    def test_health(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_register(self):
        r = client.post("/api/auth/register", json={
            "email": "test@devpilot.ai",
            "username": "testuser",
            "password": "SecurePass123!",
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data

    def test_register_duplicate_email(self):
        client.post("/api/auth/register", json={
            "email": "dup@devpilot.ai", "username": "dup1", "password": "pass"
        })
        r = client.post("/api/auth/register", json={
            "email": "dup@devpilot.ai", "username": "dup2", "password": "pass"
        })
        assert r.status_code == 400

    def test_login(self):
        client.post("/api/auth/register", json={
            "email": "login@devpilot.ai", "username": "loginuser", "password": "mypass"
        })
        r = client.post("/api/auth/login", data={
            "username": "login@devpilot.ai", "password": "mypass"
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self):
        r = client.post("/api/auth/login", data={
            "username": "login@devpilot.ai", "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_authenticated(self):
        reg = client.post("/api/auth/register", json={
            "email": "me@devpilot.ai", "username": "meuser", "password": "mepass"
        })
        token = reg.json()["access_token"]
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == "me@devpilot.ai"


# ── Repository tests ──────────────────────────────────────────────────────────
class TestRepositories:
    def _get_token(self, suffix=""):
        r = client.post("/api/auth/register", json={
            "email": f"repo{suffix}@devpilot.ai",
            "username": f"repouser{suffix}",
            "password": "repopass",
        })
        return r.json()["access_token"]

    def test_list_repos_empty(self):
        token = self._get_token("list")
        r = client.get("/api/repos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json() == []

    def test_add_invalid_url(self):
        token = self._get_token("inv")
        r = client.post("/api/repos", json={"github_url": "not-a-url"},
                        headers={"Authorization": f"Bearer {token}"})
        # Should fail (400) since URL parsing fails or GitHub API rejects it
        assert r.status_code in (400, 422)
