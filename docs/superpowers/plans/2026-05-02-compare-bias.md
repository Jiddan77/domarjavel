# Compare & Bias Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bias scoring system to the ranking page and a `/compare` page for side-by-side referee analysis.

**Architecture:** Two new FastAPI endpoints (`/api/bias`, `/api/compare`) read from the existing `data.json`. Frontend adds SWR hooks, three new components, a new `/compare` page, and updates the existing ranking page bias tab.

**Tech Stack:** Python 3 / FastAPI / pytest — Next.js 14 / TypeScript / SWR / Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `Backend/app/bias.py` | Pure bias computation (no FastAPI) |
| Create | `Backend/app/compare.py` | FastAPI router: `/api/bias` + `/api/compare` |
| Modify | `Backend/app/main.py` | Register compare router |
| Create | `Backend/tests/__init__.py` | pytest package marker |
| Create | `Backend/tests/test_bias.py` | Unit tests for bias computation |
| Create | `Frontend/hooks/useBiasScores.ts` | SWR hook for `/api/bias` |
| Create | `Frontend/hooks/useCompare.ts` | SWR hook for `/api/compare` |
| Create | `Frontend/components/BiasBreakdown.tsx` | Per-referee bias progress bars + score badge |
| Create | `Frontend/components/RefereeSelector.tsx` | Chip-based multi-select (max 4) |
| Create | `Frontend/components/CompareStatsTable.tsx` | Side-by-side stats table with league avg |
| Create | `Frontend/app/compare/page.tsx` | `/compare` page |
| Modify | `Frontend/app/ranking/page.tsx` | Replace bias sort/display with composite score; add Compare link |

---

### Task 1: Backend — pytest setup + bias.py

**Files:**
- Create: `Backend/tests/__init__.py`
- Create: `Backend/tests/test_bias.py`
- Create: `Backend/app/bias.py`
- Modify: `Backend/requirements.txt`

- [ ] **Step 1: Add pytest to requirements**

Open `Backend/requirements.txt` and append:
```
pytest==8.2.2
pytest-asyncio==0.23.8
httpx==0.27.0
```

- [ ] **Step 2: Create tests package**

```bash
mkdir -p ~/domarjavel/Backend/tests
touch ~/domarjavel/Backend/tests/__init__.py
```

- [ ] **Step 3: Write failing tests**

Create `Backend/tests/test_bias.py`:

```python
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

def test_compute_bias_empty_input():
    assert compute_bias_scores([], min_matches=1) == {}

def test_bias_result_fields():
    results = compute_bias_scores(_build_dataset(), min_matches=10)
    r = results["REF_A"]
    assert isinstance(r, BiasResult)
    assert r.referee == "REF_A"
    assert r.matches == 20
    assert isinstance(r.flagged_teams, list)
```

- [ ] **Step 4: Run tests — confirm they all fail**

```bash
cd ~/domarjavel/Backend && python -m pytest tests/test_bias.py -v 2>&1 | head -30
```
Expected: `ModuleNotFoundError: No module named 'app.bias'`

- [ ] **Step 5: Create bias.py**

Create `Backend/app/bias.py`:

```python
import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "data.json"


def parse_cards(s) -> tuple[int, int]:
    if not s:
        return 0, 0
    s = str(s).replace("–", "-")
    try:
        parts = s.split("-")
        if len(parts) == 2:
            return int(parts[0]), int(parts[1])
    except ValueError:
        pass
    return 0, 0


@dataclass
class BiasResult:
    referee: str
    matches: int
    composite_score: float
    card_rate_score: float
    home_away_score: float
    team_favoritism_score: float
    cards_per_game: float
    home_away_delta: float
    flagged_teams: list[str] = field(default_factory=list)


def _clamp_z(z: float) -> float:
    return min(10.0, max(0.0, z * 2.0 + 5.0))


def load_matches(seasons: Optional[list[int]] = None) -> list[dict]:
    with open(DATA_FILE, encoding="utf-8") as f:
        raw = json.load(f)
    matches = raw if isinstance(raw, list) else raw.get("matches", [])
    if seasons:
        matches = [m for m in matches if m.get("season") in seasons]
    return matches


def compute_bias_scores(
    matches: list[dict], min_matches: int = 10
) -> dict[str, "BiasResult"]:
    by_ref: dict[str, list[dict]] = {}
    for m in matches:
        ref = (m.get("referee") or "").strip()
        if ref:
            by_ref.setdefault(ref, []).append(m)

    by_ref = {k: v for k, v in by_ref.items() if len(v) >= min_matches}
    if not by_ref:
        return {}

    # Per-referee aggregates
    ref_cpg: dict[str, float] = {}
    ref_delta: dict[str, float] = {}
    for ref, ms in by_ref.items():
        total_cards = total_delta = 0
        for m in ms:
            yh, ya = parse_cards(m.get("yellow"))
            rh, ra = parse_cards(m.get("red"))
            total_cards += yh + ya + rh + ra
            total_delta += (yh + rh) - (ya + ra)
        ref_cpg[ref] = total_cards / len(ms)
        ref_delta[ref] = total_delta / len(ms)

    # League stats for signal 1 (card rate)
    cpg_vals = list(ref_cpg.values())
    mean_cpg = sum(cpg_vals) / len(cpg_vals)
    std_cpg = math.sqrt(sum((v - mean_cpg) ** 2 for v in cpg_vals) / len(cpg_vals)) or 1.0

    # League stats for signal 2 (home/away delta)
    delta_vals = list(ref_delta.values())
    mean_delta = sum(delta_vals) / len(delta_vals)
    std_delta = math.sqrt(sum((v - mean_delta) ** 2 for v in delta_vals) / len(delta_vals)) or 1.0

    # League-wide per-team card distributions (for signal 3)
    league_team: dict[str, list[float]] = {}
    for ref, ms in by_ref.items():
        for m in ms:
            yh, ya = parse_cards(m.get("yellow"))
            rh, ra = parse_cards(m.get("red"))
            home, away = m.get("home", ""), m.get("away", "")
            if home:
                league_team.setdefault(home, []).append(float(yh + rh))
            if away:
                league_team.setdefault(away, []).append(float(ya + ra))

    team_mean: dict[str, float] = {}
    team_std: dict[str, float] = {}
    for team, vals in league_team.items():
        m_ = sum(vals) / len(vals)
        team_mean[team] = m_
        team_std[team] = math.sqrt(sum((v - m_) ** 2 for v in vals) / len(vals)) or 1.0

    results: dict[str, BiasResult] = {}
    for ref, ms in by_ref.items():
        s1 = _clamp_z((ref_cpg[ref] - mean_cpg) / std_cpg)
        s2 = _clamp_z((ref_delta[ref] - mean_delta) / std_delta)

        # Signal 3: team favoritism
        ref_team: dict[str, list[float]] = {}
        for m in ms:
            yh, ya = parse_cards(m.get("yellow"))
            rh, ra = parse_cards(m.get("red"))
            home, away = m.get("home", ""), m.get("away", "")
            if home:
                ref_team.setdefault(home, []).append(float(yh + rh))
            if away:
                ref_team.setdefault(away, []).append(float(ya + ra))

        flagged = [
            team for team, vals in ref_team.items()
            if len(vals) >= 3
            and abs(sum(vals) / len(vals) - team_mean.get(team, sum(vals) / len(vals)))
            / team_std.get(team, 1.0) > 1.5
        ]

        s3 = min(10.0, len(flagged) * 2.5)
        composite = round(s1 * 0.4 + s2 * 0.35 + s3 * 0.25, 1)

        results[ref] = BiasResult(
            referee=ref,
            matches=len(ms),
            composite_score=composite,
            card_rate_score=round(s1, 1),
            home_away_score=round(s2, 1),
            team_favoritism_score=round(s3, 1),
            cards_per_game=round(ref_cpg[ref], 2),
            home_away_delta=round(ref_delta[ref], 2),
            flagged_teams=sorted(flagged),
        )

    return results
```

- [ ] **Step 6: Run tests — all must pass**

```bash
cd ~/domarjavel/Backend && python -m pytest tests/test_bias.py -v
```
Expected: all 14 tests PASSED

- [ ] **Step 7: Commit**

```bash
cd ~/domarjavel && git add Backend/app/bias.py Backend/tests/ Backend/requirements.txt
git commit -m "feat: add bias score computation (3-signal: card rate, home/away, team favoritism)"
```

---

### Task 2: Backend — compare.py router

**Files:**
- Create: `Backend/app/compare.py`
- Create tests in: `Backend/tests/test_compare.py`

- [ ] **Step 1: Write failing tests**

Create `Backend/tests/test_compare.py`:

```python
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
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
cd ~/domarjavel/Backend && python -m pytest tests/test_compare.py -v 2>&1 | head -20
```
Expected: `ModuleNotFoundError: No module named 'app.compare'`

- [ ] **Step 3: Create compare.py**

Create `Backend/app/compare.py`:

```python
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from .bias import load_matches, compute_bias_scores, parse_cards

router = APIRouter()


def _find_referee(name: str, bias_results: dict) -> Optional[object]:
    """Case-insensitive lookup in bias_results."""
    direct = bias_results.get(name)
    if direct:
        return direct
    name_upper = name.upper()
    for key, val in bias_results.items():
        if key.upper() == name_upper:
            return val
    return None


@router.get("/bias")
def get_bias_scores(
    season: Optional[list[int]] = Query(default=None),
    minMatches: int = Query(default=10, ge=1),
):
    matches = load_matches(seasons=season or None)
    results = compute_bias_scores(matches, min_matches=minMatches)
    return [
        {
            "referee": r.referee,
            "matches": r.matches,
            "composite_score": r.composite_score,
            "card_rate_score": r.card_rate_score,
            "home_away_score": r.home_away_score,
            "team_favoritism_score": r.team_favoritism_score,
            "cards_per_game": r.cards_per_game,
            "home_away_delta": r.home_away_delta,
            "flagged_teams": r.flagged_teams,
        }
        for r in sorted(results.values(), key=lambda x: x.composite_score, reverse=True)
    ]


@router.get("/compare")
def get_compare(
    referee: list[str] = Query(...),
    season: Optional[list[int]] = Query(default=None),
):
    if len(referee) < 2:
        raise HTTPException(status_code=422, detail="Provide at least 2 referee names")
    if len(referee) > 4:
        raise HTTPException(status_code=422, detail="Maximum 4 referee names allowed")

    matches = load_matches(seasons=season or None)
    bias_results = compute_bias_scores(matches, min_matches=1)

    output = []
    not_found = []
    for req in referee:
        found = _find_referee(req, bias_results)
        if not found:
            not_found.append(req)
            continue

        ref_matches = [
            m for m in matches
            if (m.get("referee") or "").upper() == req.upper()
        ]
        total_pen = sum(
            parse_cards(m.get("penalty", ""))[0] + parse_cards(m.get("penalty", ""))[1]
            for m in ref_matches
        )
        penalties_per_game = round(total_pen / len(ref_matches), 2) if ref_matches else 0.0

        output.append({
            "name": found.referee,
            "matches": found.matches,
            "cards_per_game": found.cards_per_game,
            "penalties_per_game": penalties_per_game,
            "home_card_advantage": found.home_away_delta,
            "bias": {
                "composite_score": found.composite_score,
                "card_rate_score": found.card_rate_score,
                "home_away_score": found.home_away_score,
                "team_favoritism_score": found.team_favoritism_score,
                "flagged_teams": found.flagged_teams,
            },
        })

    if not_found:
        raise HTTPException(
            status_code=404,
            detail=f"Referees not found: {', '.join(not_found)}"
        )

    # League averages (from all refs with >= 1 match)
    all_cpg = [r.cards_per_game for r in bias_results.values()]
    all_delta = [r.home_away_delta for r in bias_results.values()]
    total_pen = sum(
        parse_cards(m.get("penalty", ""))[0] + parse_cards(m.get("penalty", ""))[1]
        for m in matches if (m.get("referee") or "").strip()
    )
    total_pen_matches = sum(1 for m in matches if (m.get("referee") or "").strip())

    league_avg = {
        "cards_per_game": round(sum(all_cpg) / len(all_cpg), 2) if all_cpg else 0.0,
        "penalties_per_game": round(total_pen / total_pen_matches, 2) if total_pen_matches else 0.0,
        "home_card_advantage": round(sum(all_delta) / len(all_delta), 2) if all_delta else 0.0,
    }

    return {"referees": output, "league_avg": league_avg}
```

- [ ] **Step 4: Run compare tests — all must pass**

```bash
cd ~/domarjavel/Backend && python -m pytest tests/test_compare.py -v
```
Expected: all 10 tests PASSED

- [ ] **Step 5: Commit**

```bash
cd ~/domarjavel && git add Backend/app/compare.py Backend/tests/test_compare.py
git commit -m "feat: add /api/bias and /api/compare FastAPI endpoints"
```

---

### Task 3: Backend — register router in main.py

**Files:**
- Modify: `Backend/app/main.py`

- [ ] **Step 1: Add import and include_router**

In `Backend/app/main.py`, add the import after the existing chunks_router import (line 7):

```python
from .compare import router as compare_router
```

After the existing `app.include_router(chunks_router, ...)` line (line ~64), add:

```python
app.include_router(compare_router, prefix="/api", tags=["compare"])
```

- [ ] **Step 2: Smoke test locally**

```bash
cd ~/domarjavel/Backend && uvicorn app.main:app --port 8001 --reload &
sleep 2
curl -s "http://localhost:8001/api/bias?minMatches=10" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d)} referees'); print(d[0])"
```
Expected: `N referees` and a JSON object with `composite_score` field.

```bash
curl -s "http://localhost:8001/api/compare?referee=GLENN+NYBERG&referee=ANDREAS+EKBERG" | python3 -c "import json,sys; d=json.load(sys.stdin); print([r['name'] for r in d['referees']])"
```
Expected: `['GLENN NYBERG', 'ANDREAS EKBERG']`

```bash
kill %1  # stop the dev server
```

- [ ] **Step 3: Commit**

```bash
cd ~/domarjavel && git add Backend/app/main.py
git commit -m "feat: register compare router in FastAPI app"
```

---

### Task 4: Frontend — useBiasScores and useCompare hooks

**Files:**
- Create: `Frontend/hooks/useBiasScores.ts`
- Create: `Frontend/hooks/useCompare.ts`

Frontend has no test framework — verify with TypeScript type-check after each step.

- [ ] **Step 1: Create useBiasScores.ts**

Create `Frontend/hooks/useBiasScores.ts`:

```typescript
"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface BiasScore {
  referee: string;
  matches: number;
  composite_score: number;
  card_rate_score: number;
  home_away_score: number;
  team_favoritism_score: number;
  cards_per_game: number;
  home_away_delta: number;
  flagged_teams: string[];
}

export function useBiasScores(params: { seasons?: number[]; minMatches?: number } = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const q = new URLSearchParams();
  if (params.seasons?.length) {
    params.seasons.forEach(s => q.append("season", s.toString()));
  }
  if (params.minMatches != null) {
    q.set("minMatches", params.minMatches.toString());
  }
  const key = `${apiUrl}/api/bias?${q.toString()}`;
  const { data, error, isLoading } = useSWR<BiasScore[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { biasScores: data, error, isLoading };
}
```

- [ ] **Step 2: Create useCompare.ts**

Create `Frontend/hooks/useCompare.ts`:

```typescript
"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { BiasScore } from "./useBiasScores";

export interface CompareReferee {
  name: string;
  matches: number;
  cards_per_game: number;
  penalties_per_game: number;
  home_card_advantage: number;
  bias: Pick<
    BiasScore,
    | "composite_score"
    | "card_rate_score"
    | "home_away_score"
    | "team_favoritism_score"
    | "flagged_teams"
  >;
}

export interface LeagueAvg {
  cards_per_game: number;
  penalties_per_game: number;
  home_card_advantage: number;
}

export interface CompareResult {
  referees: CompareReferee[];
  league_avg: LeagueAvg;
}

export function useCompare(referees: string[], seasons?: number[]) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const enabled = referees.length >= 2;

  const q = new URLSearchParams();
  referees.forEach(r => q.append("referee", r));
  if (seasons?.length) {
    seasons.forEach(s => q.append("season", s.toString()));
  }

  const key = enabled ? `${apiUrl}/api/compare?${q.toString()}` : null;
  const { data, error, isLoading } = useSWR<CompareResult>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { compareData: data, error, isLoading };
}
```

- [ ] **Step 3: Type-check**

```bash
cd ~/domarjavel/Frontend && npx tsc --noEmit 2>&1 | grep -E "hooks/(useBias|useCompare)" || echo "No type errors in hooks"
```
Expected: `No type errors in hooks`

- [ ] **Step 4: Commit**

```bash
cd ~/domarjavel && git add Frontend/hooks/useBiasScores.ts Frontend/hooks/useCompare.ts
git commit -m "feat: add useBiasScores and useCompare SWR hooks"
```

---

### Task 5: Frontend — BiasBreakdown component

**Files:**
- Create: `Frontend/components/BiasBreakdown.tsx`

- [ ] **Step 1: Create component**

Create `Frontend/components/BiasBreakdown.tsx`:

```tsx
import type { CompareReferee } from "@/hooks/useCompare";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b"];

function biasColor(score: number): string {
  if (score >= 7) return "#ef4444";
  if (score >= 4) return "#f59e0b";
  return "#22c55e";
}

function BarRow({
  label,
  value,
  score,
  detail,
}: {
  label: string;
  value: string;
  score: number;
  detail?: string;
}) {
  const color = biasColor(score);
  const width = `${(score / 10) * 100}%`;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="bg-slate-900 rounded h-1.5">
        <div
          className="h-1.5 rounded transition-all"
          style={{ background: color, width }}
        />
      </div>
      {detail && <div className="text-xs text-slate-500 mt-0.5">{detail}</div>}
    </div>
  );
}

interface Props {
  referees: CompareReferee[];
}

export default function BiasBreakdown({ referees }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-xs font-semibold text-slate-500 tracking-widest mb-3 uppercase">
        Bias Breakdown
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${referees.length}, 1fr)` }}
      >
        {referees.map((ref, i) => {
          const color = COLORS[i] ?? "#94a3b8";
          const { bias } = ref;
          const compositeColor = biasColor(bias.composite_score);
          return (
            <div key={ref.name}>
              <div
                className="text-sm font-semibold mb-3"
                style={{ color }}
              >
                {ref.name
                  .toLowerCase()
                  .replace(/\b\w/g, c => c.toUpperCase())}
              </div>

              <BarRow
                label="Card rate"
                value={`${bias.card_rate_score.toFixed(1)} / 10`}
                score={bias.card_rate_score}
              />
              <BarRow
                label="Home/away gap"
                value={`${ref.home_card_advantage >= 0 ? "+" : ""}${ref.home_card_advantage.toFixed(2)} cards`}
                score={bias.home_away_score}
              />
              <BarRow
                label="Team patterns"
                value={
                  bias.flagged_teams.length > 0
                    ? bias.flagged_teams.slice(0, 2).join(", ")
                    : "None flagged"
                }
                score={bias.team_favoritism_score}
              />

              <div
                className="mt-3 inline-block text-xs font-semibold px-2 py-1 rounded"
                style={{
                  background: `${compositeColor}15`,
                  border: `1px solid ${compositeColor}30`,
                  color: compositeColor,
                }}
              >
                Bias score: {bias.composite_score} / 10
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd ~/domarjavel/Frontend && npx tsc --noEmit 2>&1 | grep "BiasBreakdown" || echo "No type errors in BiasBreakdown"
```
Expected: `No type errors in BiasBreakdown`

- [ ] **Step 3: Commit**

```bash
cd ~/domarjavel && git add Frontend/components/BiasBreakdown.tsx
git commit -m "feat: add BiasBreakdown component"
```

---

### Task 6: Frontend — RefereeSelector component

**Files:**
- Create: `Frontend/components/RefereeSelector.tsx`

- [ ] **Step 1: Create component**

Create `Frontend/components/RefereeSelector.tsx`:

```tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b"];
const MAX_REFEREES = 4;

interface Props {
  selected: string[];
  allReferees: string[];
  onChange: (refs: string[]) => void;
}

export default function RefereeSelector({ selected, allReferees, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = allReferees
    .filter(r => !selected.includes(r))
    .filter(r => r.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);

  const add = (ref: string) => {
    if (selected.length < MAX_REFEREES) {
      onChange([...selected, ref]);
    }
    setQuery("");
    setOpen(false);
  };

  const remove = (ref: string) => {
    onChange(selected.filter(r => r !== ref));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {selected.map((ref, i) => {
        const color = COLORS[i] ?? "#94a3b8";
        const displayName = ref
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase());
        return (
          <div
            key={ref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
            style={{
              background: "#1e293b",
              border: `1px solid #334155`,
              color,
            }}
          >
            {displayName}
            <button
              onClick={() => remove(ref)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={`Remove ${displayName}`}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}

      {selected.length < MAX_REFEREES && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpen(v => !v);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-slate-400 border border-dashed border-slate-600 hover:border-slate-400 transition-colors"
          >
            <Plus size={13} /> Add referee
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
              <div className="p-2 border-b border-slate-700">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search referees..."
                  className="w-full bg-slate-900 text-slate-100 text-sm px-2 py-1 rounded outline-none placeholder-slate-500"
                />
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
                ) : (
                  filtered.map(ref => (
                    <li key={ref}>
                      <button
                        onClick={() => add(ref)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        {ref
                          .toLowerCase()
                          .replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd ~/domarjavel/Frontend && npx tsc --noEmit 2>&1 | grep "RefereeSelector" || echo "No type errors in RefereeSelector"
```
Expected: `No type errors in RefereeSelector`

- [ ] **Step 3: Commit**

```bash
cd ~/domarjavel && git add Frontend/components/RefereeSelector.tsx
git commit -m "feat: add RefereeSelector chip component with searchable dropdown"
```

---

### Task 7: Frontend — CompareStatsTable component

**Files:**
- Create: `Frontend/components/CompareStatsTable.tsx`

- [ ] **Step 1: Create component**

Create `Frontend/components/CompareStatsTable.tsx`:

```tsx
import type { CompareReferee, LeagueAvg } from "@/hooks/useCompare";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b"];
const AVG_COLOR = "#475569";

function fmt(n: number, decimals = 2): string {
  return isFinite(n) ? n.toFixed(decimals) : "-";
}

interface RowProps {
  label: string;
  values: number[];
  avgValue: number;
  decimals?: number;
  prefix?: string;
  higherIsBetter?: boolean;
}

function StatRow({ label, values, avgValue, decimals = 2, prefix = "", higherIsBetter = false }: RowProps) {
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
  return (
    <tr className="border-t border-slate-700 text-slate-100">
      <td className="py-2 px-3 text-sm text-slate-400">{label}</td>
      {values.map((v, i) => {
        const isBest = v === best && values.filter(x => x === best).length < values.length;
        return (
          <td key={i} className="py-2 px-3 text-right text-sm font-semibold" style={{ color: COLORS[i] }}>
            {isBest ? <span className="underline decoration-dotted">{prefix}{fmt(v, decimals)}</span> : `${prefix}${fmt(v, decimals)}`}
          </td>
        );
      })}
      <td className="py-2 px-3 text-right text-sm" style={{ color: AVG_COLOR }}>
        {prefix}{fmt(avgValue, decimals)}
      </td>
    </tr>
  );
}

interface Props {
  referees: CompareReferee[];
  leagueAvg: LeagueAvg;
}

export default function CompareStatsTable({ referees, leagueAvg }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-slate-500 tracking-widest mb-3 uppercase">
        Stats Comparison
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="text-left py-1 px-3 w-2/5">Metric</th>
              {referees.map((ref, i) => (
                <th key={ref.name} className="text-right py-1 px-3" style={{ color: COLORS[i] }}>
                  {ref.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </th>
              ))}
              <th className="text-right py-1 px-3" style={{ color: AVG_COLOR }}>
                League avg
              </th>
            </tr>
          </thead>
          <tbody>
            <StatRow
              label="Matches"
              values={referees.map(r => r.matches)}
              avgValue={leagueAvg.cards_per_game} // placeholder — matches has no league avg
              decimals={0}
              higherIsBetter={true}
            />
            <StatRow
              label="Cards / game"
              values={referees.map(r => r.cards_per_game)}
              avgValue={leagueAvg.cards_per_game}
              decimals={2}
              higherIsBetter={false}
            />
            <StatRow
              label="Penalties / game"
              values={referees.map(r => r.penalties_per_game)}
              avgValue={leagueAvg.penalties_per_game}
              decimals={2}
              higherIsBetter={false}
            />
            <StatRow
              label="Home card advantage"
              values={referees.map(r => r.home_card_advantage)}
              avgValue={leagueAvg.home_card_advantage}
              decimals={2}
              higherIsBetter={false}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Fix the Matches row** — it incorrectly shows `leagueAvg.cards_per_game` as the average. Replace the Matches StatRow with:

```tsx
<tr className="border-t border-slate-700 text-slate-100">
  <td className="py-2 px-3 text-sm text-slate-400">Matches</td>
  {referees.map((ref, i) => (
    <td key={i} className="py-2 px-3 text-right text-sm font-semibold" style={{ color: COLORS[i] }}>
      {ref.matches}
    </td>
  ))}
  <td className="py-2 px-3 text-right text-sm" style={{ color: AVG_COLOR }}>—</td>
</tr>
```

And remove the `StatRow` for Matches from the `<tbody>` (replace the entire Matches `<StatRow>` line with the `<tr>` above).

- [ ] **Step 3: Type-check**

```bash
cd ~/domarjavel/Frontend && npx tsc --noEmit 2>&1 | grep "CompareStatsTable" || echo "No type errors in CompareStatsTable"
```
Expected: `No type errors in CompareStatsTable`

- [ ] **Step 4: Commit**

```bash
cd ~/domarjavel && git add Frontend/components/CompareStatsTable.tsx
git commit -m "feat: add CompareStatsTable component"
```

---

### Task 8: Frontend — /compare page

**Files:**
- Create: `Frontend/app/compare/page.tsx`

- [ ] **Step 1: Create page**

Create `Frontend/app/compare/page.tsx`:

```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import RefereeSelector from "@/components/RefereeSelector";
import CompareStatsTable from "@/components/CompareStatsTable";
import BiasBreakdown from "@/components/BiasBreakdown";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRefs = searchParams.get("referees")
    ? searchParams.get("referees")!.split(",").map(r => decodeURIComponent(r.trim())).filter(Boolean)
    : [];

  const [selected, setSelected] = useState<string[]>(initialRefs);
  const [allReferees, setAllReferees] = useState<string[]>([]);

  const { compareData, error, isLoading } = useCompare(selected);

  // Fetch all referee names for the selector
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/api/referees`)
      .then(r => r.json())
      .then((data: { name: string }[]) =>
        setAllReferees(data.map(r => r.name).sort())
      )
      .catch(() => {});
  }, []);

  // Sync selection to URL
  const handleChange = (refs: string[]) => {
    setSelected(refs);
    const params = new URLSearchParams();
    if (refs.length) params.set("referees", refs.map(encodeURIComponent).join(","));
    router.replace(`/compare${refs.length ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <Link
            href="/ranking"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Compare Referees</h1>
            <p className="text-sm text-slate-500">Pick 2–4 referees to compare side-by-side</p>
          </div>
        </header>

        {/* Selector */}
        <div className="mb-6">
          <RefereeSelector
            selected={selected}
            allReferees={allReferees}
            onChange={handleChange}
          />
        </div>

        {/* States */}
        {selected.length < 2 && (
          <div className="text-center py-16 text-slate-500">
            Add at least 2 referees to start comparing.
          </div>
        )}

        {selected.length >= 2 && isLoading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {selected.length >= 2 && error && (
          <ErrorMessage error={error} />
        )}

        {compareData && !isLoading && (
          <>
            <CompareStatsTable
              referees={compareData.referees}
              leagueAvg={compareData.league_avg}
            />
            <BiasBreakdown referees={compareData.referees} />
          </>
        )}
      </div>
    </main>
  );
}

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ComparePage />
    </Suspense>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd ~/domarjavel/Frontend && npx tsc --noEmit 2>&1 | grep "compare/page" || echo "No type errors in compare page"
```
Expected: `No type errors in compare page`

- [ ] **Step 3: Commit**

```bash
cd ~/domarjavel && git add Frontend/app/compare/
git commit -m "feat: add /compare page"
```

---

### Task 9: Frontend — update ranking page + add Compare nav link

**Files:**
- Modify: `Frontend/app/ranking/page.tsx`
- Modify: `Frontend/app/page.tsx` (or nav component — check which file contains the main nav)

- [ ] **Step 1: Find the nav component**

```bash
grep -rn "ranking\|/ranking" ~/domarjavel/Frontend/app/page.tsx | head -10
grep -rn "href.*ranking" ~/domarjavel/Frontend/components/ | head -10
```

- [ ] **Step 2: Add import and hook to ranking page**

At the top of `Frontend/app/ranking/page.tsx`, add after the existing imports:

```tsx
import { useBiasScores } from "@/hooks/useBiasScores";
import Link from "next/link";
```

(Link may already be imported — check before adding.)

Inside `RankingPage()`, add after the existing `useAdvancedStats` call:

```tsx
const { biasScores } = useBiasScores({ minMatches: 5 });

const biasMap = Object.fromEntries(
  (biasScores ?? []).map(b => [b.referee, b.composite_score])
);
```

- [ ] **Step 3: Update bias sort in getRankedReferees**

Find the `case "bias":` block (currently at line ~72) and replace:

```tsx
case "bias":
  aValue = Math.abs(a.home_bias_score - 0.5); // Distance from neutral
  bValue = Math.abs(b.home_bias_score - 0.5);
  break;
```

With:

```tsx
case "bias":
  aValue = biasMap[a.name] ?? 0;
  bValue = biasMap[b.name] ?? 0;
  break;
```

- [ ] **Step 4: Update bias display in the rankings list**

Find the `{rankingType === "bias" && (` block (around line ~271) and replace:

```tsx
{rankingType === "bias" && (
  <div>
    <div className="text-2xl font-bold text-green-600">
      {fmt(Math.abs(referee.home_bias_score - 0.5), 3)}
    </div>
    <div className="text-xs text-slate-500">bias score</div>
  </div>
)}
```

With:

```tsx
{rankingType === "bias" && (
  <Link href={`/compare?referees=${encodeURIComponent(referee.name)}`}>
    <div
      className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
      style={{
        color:
          (biasMap[referee.name] ?? 0) >= 7
            ? "#ef4444"
            : (biasMap[referee.name] ?? 0) >= 4
            ? "#f59e0b"
            : "#22c55e",
      }}
    >
      {biasMap[referee.name]?.toFixed(1) ?? "—"}
    </div>
    <div className="text-xs text-slate-500">bias score</div>
  </Link>
)}
```

- [ ] **Step 5: Add Compare nav link**

Find the nav or header section in `page.tsx` (or the appropriate component identified in Step 1). Add a "Compare" link next to the ranking link. For example, if `page.tsx` contains:

```tsx
<Link href="/ranking">Rankings</Link>
```

Add after it:

```tsx
<Link href="/compare">Compare</Link>
```

If the nav is in a separate component (e.g., `components/Navigation.tsx`), make the same change there.

- [ ] **Step 6: Type-check**

```bash
cd ~/domarjavel/Frontend && npx tsc --noEmit 2>&1 | grep "ranking/page\|page.tsx" | head -10 || echo "No type errors"
```

- [ ] **Step 7: Commit**

```bash
cd ~/domarjavel && git add Frontend/app/ranking/page.tsx Frontend/app/page.tsx Frontend/components/
git commit -m "feat: wire bias scores to ranking page and add Compare nav link"
```

---

### Task 10: Smoke test end-to-end

- [ ] **Step 1: Start backend**

```bash
cd ~/domarjavel/Backend && uvicorn app.main:app --port 8001 &
```

- [ ] **Step 2: Start frontend**

```bash
cd ~/domarjavel/Frontend && NEXT_PUBLIC_API_URL=http://localhost:8001 npm run dev &
```

- [ ] **Step 3: Verify bias API returns real data**

```bash
curl -s "http://localhost:8001/api/bias?minMatches=10" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'{len(data)} referees with bias scores')
top = data[0]
print(f'Top: {top[\"referee\"]} — composite {top[\"composite_score\"]}, cards/game {top[\"cards_per_game\"]}')"
```
Expected: output showing N referees, top referee name, composite score.

- [ ] **Step 4: Verify compare API**

```bash
curl -s "http://localhost:8001/api/compare?referee=MOHAMMED+AL-HAKIM&referee=GLENN+NYBERG" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data['referees']:
    print(r['name'], r['cards_per_game'], 'bias:', r['bias']['composite_score'])"
```
Expected: two rows with referee name, cards/game, composite bias score.

- [ ] **Step 5: Check browser**

Open `http://localhost:3000/ranking` → click "Neutrality" tab → bias scores should show colored numbers instead of the old decimal.

Open `http://localhost:3000/compare` → add two referees → stats table and bias breakdown should appear.

- [ ] **Step 6: Stop dev servers**

```bash
kill %1 %2 2>/dev/null || true
```

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
cd ~/domarjavel && git add -p && git commit -m "fix: smoke test adjustments for compare & bias feature"
```

---

## Notes

- **Data file path**: `Backend/data/data.json`, 1,440 matches, seasons 2020–2025. Yellow/red/penalty encoded as `"home–away"` with en-dash.
- **Referee names in data**: All uppercase (e.g., `"GLENN NYBERG"`). The API does case-insensitive matching; frontend displays them title-cased.
- **No PostgreSQL needed**: All bias computation reads directly from JSON, same as `chunks_api.py`. Works with the Railway deployment as-is.
- **Minimum matches**: 10 for bias column on ranking page, 1 for compare page (any referee can be compared).
- **Frontend testing**: No jest/vitest configured — use `tsc --noEmit` for type safety. Visual testing via browser smoke test in Task 10.
