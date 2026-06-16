#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto-fetch match schedule from allsvenskan.se
Probes individual match IDs and collects basic match data.
Handles different output formats for different seasons:
  - 2025: {"matches": [...]}
  - 2026+: plain list [...]
"""
import argparse
import json
import time
import random
import pathlib
import requests
from typing import Any, Dict, List, Optional, Tuple

BASE = "https://allsvenskan.se"
MATCH = BASE + "/data-endpoint/match?id={id}&season={s}"

UA = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
]

SESSION = None

def init_session():
    global SESSION
    SESSION = requests.Session()
    SESSION.headers.update({
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
        "Referer": "https://allsvenskan.se/",
        "Origin": "https://allsvenskan.se",
        "Connection": "keep-alive",
        "Accept-Encoding": "gzip, deflate, br",
    })

def rjson(url: str) -> Optional[Dict[str, Any]]:
    """Fetch JSON from URL with random User-Agent."""
    try:
        SESSION.headers["User-Agent"] = random.choice(UA)
        r = SESSION.get(url, timeout=15)
        if r.status_code == 200 and r.text and r.headers.get("Content-Type","").lower().startswith("application/json"):
            try:
                return r.json()
            except Exception:
                pass
        return None
    except Exception:
        return None

def firestore_value(obj: Any) -> Any:
    """Extract value from Firestore-wrapped format (e.g., {"stringValue": "x"})."""
    if not isinstance(obj, dict):
        return None
    if "stringValue" in obj:
        return obj["stringValue"]
    if "integerValue" in obj:
        try:
            return int(obj["integerValue"])
        except (ValueError, TypeError):
            return None
    if "booleanValue" in obj:
        return obj["booleanValue"]
    return None

def extract_match_data(match_id: int, season: int, match_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract basic match data from the match endpoint response (Firestore format).
    Returns dict with at least: match_id, season, status, extendedStatus
    Also includes: home, away, date, round if available.
    """
    fields = match_json.get("fields", {})

    # Extract status and extendedStatus from Firestore format
    status = firestore_value(fields.get("status")) or "UNKNOWN"
    ext_status = firestore_value(fields.get("extendedStatus")) or ""

    entry = {
        "match_id": match_id,
        "season": season,
        "status": status,
        "extendedStatus": ext_status,
    }

    # Extract team names from Firestore format
    home_name = firestore_value(fields.get("homeTeamName"))
    away_name = firestore_value(fields.get("visitingTeamName"))
    if home_name:
        entry["home"] = home_name
    if away_name:
        entry["away"] = away_name

    # Extract date (startDate in Firestore format)
    start_date = firestore_value(fields.get("startDate"))
    if start_date:
        entry["date"] = start_date

    # Extract round
    round_val = firestore_value(fields.get("round"))
    if round_val:
        entry["round"] = round_val

    # Extract arena if available
    arena = firestore_value(fields.get("arenaName"))
    if arena:
        entry["arena"] = arena

    return entry

def estimate_id_range(season: int) -> Tuple[int, int]:
    """
    Estimate ID range for a given season based on known mappings.

    Known ranges:
    - 2025: ~6142500-6144000
    - 2026: ~6529830 (start, continues further)

    Approximate gap per year: ~387330
    """
    if season == 2025:
        return (6142500, 6144000)
    elif season == 2026:
        return (6529830, 6530200)  # Estimate based on existing file
    else:
        # Linear extrapolation: gap is ~387330 per year
        base_year = 2026
        base_start = 6529830
        gap = 387330
        years_diff = season - base_year
        estimated_start = base_start + (gap * years_diff)
        estimated_end = estimated_start + 500  # Assume ~300-500 matches per season
        return (estimated_start, estimated_end)

def read_existing_minimized(filepath: str, season: int) -> Tuple[List[Dict[str, Any]], Tuple[int, int]]:
    """
    Read existing minimized file if it exists.
    Returns (matches_list, (min_id, max_id)) or ([], None).
    """
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Handle both formats: {"matches": [...]} and [...]
        if isinstance(data, dict) and "matches" in data:
            matches = data["matches"]
        elif isinstance(data, list):
            matches = data
        else:
            return [], None

        if not matches:
            return [], None

        match_ids = [m.get("match_id") for m in matches if isinstance(m.get("match_id"), int)]
        if not match_ids:
            return [], None

        min_id = min(match_ids)
        max_id = max(match_ids)
        return matches, (min_id, max_id)
    except FileNotFoundError:
        return [], None
    except Exception:
        return [], None

def main():
    ap = argparse.ArgumentParser(
        description="Auto-fetch match schedule from allsvenskan.se"
    )
    ap.add_argument("--season", type=int, default=2025, help="Season to fetch (default: 2025)")
    ap.add_argument("--dry-run", action="store_true", help="Sample 50 IDs and report without writing")
    ap.add_argument("--verbose", action="store_true", help="Verbose output")
    args = ap.parse_args()

    init_session()

    # Determine output file
    out_file = f"Backend/tmp/minimized_{args.season}.json"

    # Check if file already exists and read it
    existing_matches, existing_range = read_existing_minimized(out_file, args.season)

    # Determine ID range to probe
    if existing_range:
        min_id, max_id = existing_range
        start_id = max(min_id - 50, min_id)  # Probe back 50 IDs
        end_id = min(max_id + 50, max_id + 100)  # Probe forward up to 100 IDs
        if args.verbose:
            print(f"[range] Found existing data: {min_id}-{max_id}")
            print(f"[range] Expanding search to: {start_id}-{end_id}")
    else:
        start_id, end_id = estimate_id_range(args.season)
        if args.verbose:
            print(f"[range] No existing data, estimated range: {start_id}-{end_id}")

    # For dry-run, sample only 50 IDs
    if args.dry_run:
        sample_start = start_id
        sample_end = min(start_id + 50, end_id)
        if args.verbose:
            print(f"[dry-run] Sampling {sample_end - sample_start + 1} IDs: {sample_start}-{sample_end}")
        start_id = sample_start
        end_id = sample_end

    matches = []
    checked = 0
    hits = 0

    for mid in range(start_id, end_id + 1):
        checked += 1
        js_m = rjson(MATCH.format(id=mid, s=args.season))

        if not js_m:
            if args.verbose and checked % 50 == 0:
                print(f"[probe] Checked {checked} IDs... ({hits} hits so far)")
            time.sleep(0.08)
            continue

        # Extract match data
        match_entry = extract_match_data(mid, args.season, js_m)
        matches.append(match_entry)
        hits += 1

        if args.verbose:
            status = match_entry.get("status", "UNKNOWN")
            home = match_entry.get("home", "?")
            away = match_entry.get("away", "?")
            print(f"[hit] {mid} {status} {home} vs {away}")

        time.sleep(0.08)

    print(f"[done] Probed {checked} IDs, found {hits} matches")

    if args.dry_run:
        print("[dry-run] No file written (dry-run mode)")
        # Exit with 0 even if no matches found (dry-run is just a sample)
        return 0

    # For full run, fail if we found nothing
    if hits == 0:
        print(f"[error] Found 0 matches for season {args.season}")
        return 1

    # Write output
    pathlib.Path("Backend/tmp").mkdir(parents=True, exist_ok=True)

    # For 2025, use {"matches": [...]} format; otherwise use plain list
    if args.season == 2025:
        output = {"matches": matches}
    else:
        output = matches

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved {len(matches)} matches to {out_file}")
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
