import pytest
from app.bias import parse_cards, compute_bias_scores, BiasResult

# ── parse_cards ───────────────────────────────────────────────────────────────

def test_parse_cards_normal():
    assert parse_cards("2–1") == (2, 1)

def test_parse_cards_regular_dash():
    assert parse_cards("3-0") == (3, 0)

def test_parse_cards_zero():
    assert parse_cards("0–0") == (0, 0)

def test_parse_cards_empty():
    assert parse_cards("") == (0, 0)

def test_parse_cards_none():
    assert parse_cards(None) == (0, 0)

# ── compute_bias_scores ───────────────────────────────────────────────────────

def _make_match(referee, home_yellow, away_yellow, home=None, away=None, red="0–0", penalty="0–0", season=2024):
    return {
        "referee": referee,
        "home": home or "TeamA",
        "away": away or "TeamB",
        "yellow": f"{home_yellow}–{away_yellow}",
        "red": red,
        "penalty": penalty,
        "season": season,
    }

def _build_dataset():
    """20 matches for ref A (high card rate), 20 for ref B (low card rate)."""
    matches = []
    for _ in range(20):
        matches.append(_make_match("REF_A", 4, 4))  # 8 cards/game
    for _ in range(20):
        matches.append(_make_match("REF_B", 1, 1))  # 2 cards/game
    return matches

def test_compute_bias_returns_both_refs():
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    assert "REF_A" in results
    assert "REF_B" in results

def test_compute_bias_high_card_ref_scores_higher():
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    assert results["REF_A"].composite_score > results["REF_B"].composite_score

def test_compute_bias_filters_min_matches():
    matches = [_make_match("RARE_REF", 3, 3) for _ in range(5)]
    results = compute_bias_scores(matches, min_matches=10)
    assert "RARE_REF" not in results

def test_compute_bias_score_range():
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    for r in results.values():
        assert 0.0 <= r.composite_score <= 10.0
        assert 0.0 <= r.card_rate_score <= 10.0
        assert 0.0 <= r.home_away_score <= 10.0
        assert 0.0 <= r.team_favoritism_score <= 10.0

def test_compute_bias_cards_per_game():
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    assert results["REF_A"].cards_per_game == pytest.approx(8.0)
    assert results["REF_B"].cards_per_game == pytest.approx(2.0)

def test_compute_bias_home_away_delta_neutral():
    """REF_A always gives equal cards to home and away → delta ≈ 0."""
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    assert abs(results["REF_A"].home_away_delta) < 0.01

def test_compute_bias_home_bias_detected():
    """REF_HOME gives 4 cards to home, 1 to away every match."""
    matches = [_make_match("REF_HOME", 4, 1) for _ in range(20)]
    matches += [_make_match("REF_NEUTRAL", 2, 2) for _ in range(20)]
    results = compute_bias_scores(matches, min_matches=10)
    assert results["REF_HOME"].home_away_delta > 0
    assert results["REF_HOME"].home_away_score > results["REF_NEUTRAL"].home_away_score

def test_compute_bias_flagged_teams():
    """REF_BIAS gives 5 cards to TeamX but only 1 to all others."""
    matches = []
    for _ in range(10):
        matches.append(_make_match("REF_BIAS", 5, 0, home="TeamX", away="TeamY"))
    for i in range(20):
        team = f"Team{i}"
        matches.append(_make_match("REF_BIAS", 1, 1, home=team, away="TeamZ"))
    # Add a neutral ref so league stats aren't too skewed
    for _ in range(20):
        matches.append(_make_match("REF_NEUTRAL", 1, 1, home="TeamX", away="TeamY"))
        matches.append(_make_match("REF_NEUTRAL", 1, 1, home="OtherA", away="OtherB"))
    results = compute_bias_scores(matches, min_matches=10)
    assert "TeamX" in results["REF_BIAS"].flagged_teams
    # TeamZ is the away team in 20 matches with normal card counts — should NOT be flagged
    assert "TeamZ" not in results["REF_BIAS"].flagged_teams

def test_compute_bias_empty_input():
    assert compute_bias_scores([], min_matches=1) == {}

def test_bias_result_fields():
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    r = results["REF_A"]
    assert isinstance(r, BiasResult)
    assert r.referee == "REF_A"
    assert r.matches == 20
    assert isinstance(r.flagged_teams, list)
