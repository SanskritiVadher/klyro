import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    """Verify that the FastAPI health check endpoint returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Klyro Financial Intelligence"


def test_root_index():
    """Verify that visiting root / serves the HTML5 application shell."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Klyro" in response.text
    assert "text/html" in response.headers.get("content-type", "")


def test_static_theme_css():
    """Verify that the editorial theme CSS is served properly."""
    response = client.get("/static/css/editorial-theme.css")
    assert response.status_code == 200
    assert "--surface-parchment" in response.text

