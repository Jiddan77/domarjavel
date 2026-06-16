#!/usr/bin/env python3
"""Detects if a new Allsvenskan season has started and initialises its minimized file."""

import json
import time
import requests
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"
TMP_DIR = ROOT / "tmp"

# ID estimate per season: 2025 base + ~387 330 per year
_SEASON_BASE = {2025: 6_142_500, 2026: 6_529_830}


def _estimate_base(season: int) -> int:
    if season in _SEASON_BASE:
        return _SEASON_BASE[season]
    return 6_142_500 + (season - 2025) * 387_330


def _unwrap(val):
    if isinstance(val, dict):
        for k in ("stringValue", "integerValue", "doubleValue", "booleanValue"):
            if k in val:
                return val[k]
    return val


def _probe_id(match_id: int, season: int, session: requests.Session) -> bool:
    url = f"https://allsvenskan.se/data-endpoint/match?id={match_id}&season={season}"
    try:
        r = session.get(url, timeout=6)
        if r.status_code != 200:
            return False
        data = r.json()
        if not data or data.get("error"):
            return False
        # A real match has a matchId field
        raw = data.get("matchId") or data.get("fields", {}).get("matchId")
        return raw is not None
    except Exception:
        return False


def main() -> None:
    with open(DATA_FILE) as f:
        matches = json.load(f).get("matches", [])

    existing_seasons = {m.get("season") for m in matches if m.get("season")}
    current_max = max(existing_seasons, default=datetime.now().year - 1)
    next_season = current_max + 1

    if next_season in existing_seasons:
        print(f"Season {next_season} already in data.json — skipping detection")
        return

    minimized_path = TMP_DIR / f"minimized_{next_season}.json"
    if minimized_path.exists():
        print(f"Minimized file for {next_season} already exists — skipping detection")
        return

    base = _estimate_base(next_season)
    print(f"Probing for season {next_season} around ID {base}...")

    session = requests.Session()
    found: list[dict] = []

    for match_id in range(base - 200, base + 800):
        if _probe_id(match_id, next_season, session):
            found.append({"id": match_id, "season": next_season})
        time.sleep(0.08)

    if not found:
        print(f"No matches found for season {next_season} — season hasn't started yet")
        return

    TMP_DIR.mkdir(exist_ok=True)
    with open(minimized_path, "w") as f:
        json.dump(found, f)

    print(f"::notice::New season {next_season} detected — {len(found)} matches written to {minimized_path.name}")
    print(f"Season {next_season} initialised with {len(found)} match IDs")


if __name__ == "__main__":
    main()
