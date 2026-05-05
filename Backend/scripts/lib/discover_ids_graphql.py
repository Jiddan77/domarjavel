#!/usr/bin/env python3
"""
Fetch match IDs for a season via the allsvenskan.se GraphQL API.
Used for seasons >= 2026 where the REST endpoint is no longer available.

Usage:
    python3 scripts/lib/discover_ids_graphql.py --season 2026 --out tmp/minimized_2026.json
"""

import argparse
import json
import sys
from pathlib import Path

import requests

GQL_URL = "https://gql.sportomedia.se/graphql"
GQL_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://www.allsvenskan.se",
    "Referer": "https://www.allsvenskan.se/",
}

QUERY = """
query($season: Int!, $start: String!, $end: String!) {
  matchesForLeague(
    configLeagueName: "allsvenskan"
    configSeasonStartYear: $season
    startDate: $start
    endDate: $end
  ) {
    matches {
      fogisId
      id
      status
      extendedStatus
      round
      homeTeamName
      visitingTeamName
      homeTeamAbbrv
      visitingTeamAbbrv
      startDate
      homeTeamScore
      visitingTeamScore
      arenaName
      configSeasonStartYear
    }
  }
}
"""


def fetch_matches(season: int) -> list[dict]:
    variables = {
        "season": season,
        "start": f"{season}-01-01",
        "end": f"{season}-12-31",
    }
    resp = requests.post(
        GQL_URL,
        json={"query": QUERY, "variables": variables},
        headers=GQL_HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if "errors" in data:
        print(f"GraphQL errors: {data['errors']}", file=sys.stderr)
        sys.exit(1)
    return data["data"]["matchesForLeague"]["matches"]


def to_minimized(raw: list[dict]) -> list[dict]:
    result = []
    for m in raw:
        result.append({
            "match_id": m["fogisId"],
            "season": m["configSeasonStartYear"],
            "status": m["status"],
            "extendedStatus": m.get("extendedStatus", ""),
            "round": m["round"],
            "home": m["homeTeamName"],
            "away": m["visitingTeamName"],
            "home_abbr": m.get("homeTeamAbbrv", ""),
            "away_abbr": m.get("visitingTeamAbbrv", ""),
            "date": m["startDate"],
            "home_score": m.get("homeTeamScore"),
            "away_score": m.get("visitingTeamScore"),
            "arena": m.get("arenaName", ""),
        })
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    print(f"Fetching {args.season} season from GraphQL...")
    raw = fetch_matches(args.season)
    minimized = to_minimized(raw)

    finished = sum(1 for m in minimized if m["status"] == "FINISHED")
    upcoming = sum(1 for m in minimized if m["status"] == "UPCOMING")
    print(f"Got {len(minimized)} matches: {finished} FINISHED, {upcoming} UPCOMING")

    if args.verbose:
        for m in minimized[:5]:
            print(f"  R{m['round']:02d} {m['home']} vs {m['away']} [{m['status']}] fogisId={m['match_id']}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(minimized, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved to {out}")


if __name__ == "__main__":
    main()
