import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Minimal match set used in all tests
MATCHES = []
refs = ["GLENN NYBERG", "ANDREAS EKBERG", "VIKTOR WESTER"]
for i, ref in enumerate(refs):
    for j in range(15):
        MATCHES.append({
            "referee": ref,
            "home": f"HomeTeam{j}",
            "away": f"AwayTeam{j}",
            "yellow": f"{i+1}–{i}",
            "red": "0–0",
            "penalty": f"{1 if j == 0 else 0}–0",
            "season": 2024,
        })


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


def test_bias_endpoint_returns_list(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/bias?minMatches=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3


def test_bias_endpoint_has_required_fields(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/bias?minMatches=5")
    item = response.json()[0]
    for field in ["referee", "matches", "composite_score", "card_rate_score",
                  "home_away_score", "team_favoritism_score", "cards_per_game",
                  "home_away_delta", "flagged_teams"]:
        assert field in item, f"Missing field: {field}"


def test_bias_filtered_by_season(client):
    mixed = MATCHES + [
        {"referee": "OLD REF", "home": "A", "away": "B",
         "yellow": "3–3", "red": "0–0", "penalty": "0–0", "season": 2020}
        for _ in range(15)
    ]
    with patch("app.compare.load_matches", return_value=mixed):
        response = client.get("/api/bias?season=2024&minMatches=5")
    names = [r["referee"] for r in response.json()]
    assert "OLD REF" not in names


def test_compare_endpoint_two_refs(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/compare?referee=GLENN+NYBERG&referee=ANDREAS+EKBERG")
    assert response.status_code == 200
    data = response.json()
    assert "referees" in data
    assert "league_avg" in data
    assert len(data["referees"]) == 2


def test_compare_endpoint_case_insensitive(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/compare?referee=glenn+nyberg&referee=andreas+ekberg")
    assert response.status_code == 200
    assert len(response.json()["referees"]) == 2


def test_compare_endpoint_too_few_refs(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/compare?referee=GLENN+NYBERG")
    assert response.status_code == 422


def test_compare_endpoint_too_many_refs(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get(
            "/api/compare?referee=A&referee=B&referee=C&referee=D&referee=E"
        )
    assert response.status_code == 422


def test_compare_endpoint_ref_not_found(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/compare?referee=GHOST+REF&referee=ANDREAS+EKBERG")
    assert response.status_code == 404


def test_compare_referee_has_required_fields(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/compare?referee=GLENN+NYBERG&referee=ANDREAS+EKBERG")
    ref = response.json()["referees"][0]
    for field in ["name", "matches", "cards_per_game", "penalties_per_game",
                  "home_card_advantage", "bias"]:
        assert field in ref, f"Missing field: {field}"


def test_compare_league_avg_has_required_fields(client):
    with patch("app.compare.load_matches", return_value=MATCHES):
        response = client.get("/api/compare?referee=GLENN+NYBERG&referee=ANDREAS+EKBERG")
    avg = response.json()["league_avg"]
    for field in ["cards_per_game", "penalties_per_game", "home_card_advantage"]:
        assert field in avg, f"Missing field: {field}"
