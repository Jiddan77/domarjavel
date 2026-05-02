# Compare & Bias Feature Design
**Date:** 2026-05-02  
**Project:** domarjavel  
**Scope:** Side-by-side referee comparison page + bias scoring system

---

## Overview

Two new features built on top of existing match data (1,440 matches, 2020–2025):

1. **Bias scoring** — each referee gets a composite bias score (0–10) derived from three signals, surfaced as a column on the ranking page
2. **Compare page** — `/compare` lets users pick 2–4 referees and see their stats side-by-side with full bias breakdown

---

## Data Model

All computation uses the existing `data.json` match records:

```json
{
  "match_id": 3508502,
  "season": 2020,
  "referee": "GLENN NYBERG",
  "home": "AIK",
  "away": "Malmö FF",
  "yellow": "2–1",
  "red": "0–0",
  "penalty": "1–0"
}
```

Yellow/red/penalty values are `"home_count–away_count"` strings. Bias computation parses these.

---

## Bias Score Computation

Three signals, each normalized to 0–10. Composite = weighted average.

### Signal 1: Card Rate (weight 40%)

- Compute each referee's cards/game (yellow + red, all matches)
- Compute league-wide mean and standard deviation
- Z-score = `(referee_rate - mean) / std`
- Clamp to [0, 10]: `score = min(10, max(0, z_score * 2 + 5))`
- High z-score → high card rate → high bias signal

### Signal 2: Home/Away Imbalance (weight 35%)

- Per match: `home_cards - away_cards`
- Per referee: mean of this delta across all matches
- League mean delta is near 0; compute std
- Z-score same clamping formula
- High positive delta → referee consistently favors home teams

### Signal 3: Team Favoritism (weight 25%)

- Per referee, per team: compute cards/game when that team played
- Compare to league average cards/game for that team
- Flag teams where deviation > 1.5 std
- Score = `min(10, flagged_team_count * 2.5)` — 0 flagged = 0, 4+ = 10

### Composite Score

```python
bias_score = (signal1 * 0.4) + (signal2 * 0.35) + (signal3 * 0.25)
```

Rounded to one decimal. Returned alongside per-signal breakdown.

**Minimum matches threshold:** 10 matches to be included in bias computation.

---

## Architecture

### Approach B: Two new backend endpoints

New Python module `Backend/app/bias.py` with pure computation functions.  
New Python module `Backend/app/compare.py` with FastAPI router.  
Register both routers in `Backend/app/main.py`.

No new database tables — reads from existing in-memory match data.

---

## Backend

### `Backend/app/bias.py`

Pure functions, no FastAPI dependency:

```python
def parse_score(s: str) -> tuple[int, int]  # "2–1" → (2, 1)
def compute_bias_scores(matches: list[dict], min_matches: int = 10) -> dict[str, BiasResult]
```

`BiasResult` dataclass:
```python
@dataclass
class BiasResult:
    referee: str
    matches: int
    composite_score: float          # 0–10
    card_rate_score: float          # 0–10
    home_away_score: float          # 0–10
    team_favoritism_score: float    # 0–10
    cards_per_game: float
    home_away_delta: float          # mean home_cards - away_cards
    flagged_teams: list[str]        # teams with significant deviation
```

### `Backend/app/compare.py`

FastAPI router with two endpoints:

**`GET /api/bias`**
```
Query params: season[] (optional, default all), minMatches (default 10)
Returns: list of BiasResult for all qualifying referees
```

**`GET /api/compare`**
```
Query params: referee[] (required, 2–4 names), season[] (optional)
Returns: {
  referees: [
    {
      name, matches, cards_per_game, penalties_per_game,
      home_card_advantage,  # mean home_cards - away_cards
      bias: BiasResult
    }
  ],
  league_avg: { cards_per_game, penalties_per_game, home_card_advantage }
}
```

**`GET /api/compare` validation:**
- Reject if fewer than 2 or more than 4 referees
- Return 404 with message if a referee name is not found
- Referee name matching: case-insensitive, strip whitespace

---

## Frontend

### New files

**`Frontend/app/compare/page.tsx`**
- Next.js page at `/compare`
- Reads `?referees=NAME1,NAME2` from URL params (enables direct linking)
- State: selected referee names array, season filter
- Fetches `/api/compare` via `useCompare` hook when ≥2 referees selected
- Layout per approved mockup: referee selector chips → stats table → bias breakdown

**`Frontend/components/RefereeSelector.tsx`**
- Chip-based multi-select, max 4
- "+ Add referee" button opens a searchable dropdown over the full referee list
- Referee list fetched once via existing `/api/referees` endpoint
- Selected referees shown as removable chips with assigned color

**`Frontend/components/CompareStatsTable.tsx`**
- Renders the stats comparison table
- Columns: referee names (color-coded) + league avg
- Rows: Matches, Cards/game, Penalties/game, Home card advantage
- Highlights highest/lowest value per row

**`Frontend/components/BiasBreakdown.tsx`**
- Per-referee bias panel (progress bars + composite score badge)
- Signals: Card rate, Home/away gap, Team patterns
- Color coding: red ≥ 7, amber 4–7, green < 4

**`Frontend/hooks/useCompare.ts`**
- SWR hook: `useSWR(['/api/compare', referees, seasons], fetcher)`
- Disabled when fewer than 2 referees selected

**`Frontend/hooks/useBiasScores.ts`**
- SWR hook for `/api/bias`
- Used by ranking page to populate Bias column

### Modified files

**`Frontend/app/ranking/page.tsx`**
- Add "Bias" column to the ranking table
- Value: colored score badge (e.g., `8.1` in red, `2.4` in green)
- Clicking the badge navigates to `/compare?referees=NAME`
- Bias data fetched via `useBiasScores` with same `minMatches` as current ranking

**`Frontend/app/page.tsx` (nav)**
- Add "Compare" link to the navigation

---

## Color Assignment for Compare Page

Up to 4 referees, each gets a distinct color:
```
[0] → #60a5fa (blue)
[1] → #a78bfa (purple)
[2] → #34d399 (green)
[3] → #f59e0b (amber)
```

League average column always uses `#475569` (muted).

---

## URL Design

- `/compare` — empty state, show selector
- `/compare?referees=GLENN+NYBERG,ANDREAS+EKBERG` — pre-loaded comparison
- Referee names URL-encoded, comma-separated
- Season filter: `?referees=...&season=2024`

---

## Error States

- Fewer than 2 referees selected → prompt to add more, no fetch
- Referee not found → inline error on the chip ("Not found")
- API error → "Could not load comparison data" message with retry

---

## Out of Scope

- PDF export (Dommarkollen feature, deferred)
- Prediction engine (deferred)
- User authentication (not needed for read-only stats)
- Per-match drill-down from compare page

---

## Files to Create

| File | Purpose |
|------|---------|
| `Backend/app/bias.py` | Bias score computation |
| `Backend/app/compare.py` | FastAPI router for /api/bias and /api/compare |
| `Frontend/app/compare/page.tsx` | /compare page |
| `Frontend/components/RefereeSelector.tsx` | Chip-based referee picker |
| `Frontend/components/CompareStatsTable.tsx` | Stats comparison table |
| `Frontend/components/BiasBreakdown.tsx` | Per-referee bias panels |
| `Frontend/hooks/useCompare.ts` | SWR hook for /api/compare |
| `Frontend/hooks/useBiasScores.ts` | SWR hook for /api/bias |

## Files to Modify

| File | Change |
|------|--------|
| `Backend/app/main.py` | Register compare router |
| `Frontend/app/ranking/page.tsx` | Add Bias column |
| `Frontend/app/page.tsx` (or nav component) | Add Compare nav link |
