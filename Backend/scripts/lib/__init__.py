#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
minimized_inspect.py
--------------------
Snabb diagnostik av din minimized-fil jämfört med data.json.

Visar:
- hur många unika match-ID som finns i minimized
- hur många match-ID (för en given säsong) som redan finns i data.json
- hur många som saknas (dvs. potentiellt nya att hämta)
- provlista på saknade ID (--show)

Kör:
  python3 scripts/lib/minimized_inspect.py \
    --minimized tmp/minimized_2025.json \
    --data data/data.json \
    --season 2025 \
    --show 30
"""
from __future__ import annotations
import json
from pathlib import Path
from collections import deque
from typing import Any, Set


def ids_any(js: Any) -> Set[int]:
    """Skanna ett godtyckligt JSON-objekt och plocka ut unika match-id."""
    seen: Set[int] = set()
    dq = deque([js])

    def as_int(v):
        try:
            return int(str(v).strip())
        except Exception:
            return None

    while dq:
        x = dq.popleft()
        if isinstance(x, dict):
            # vanliga nycklar vi sett i minimized
            for k in ("match_id", "id", "matchId", "gameId", "game_id"):
                if k in x:
                    mid = as_int(x[k])
                    if mid is not None:
                        seen.add(mid)
            dq.extend(x.values())
        elif isinstance(x, list):
            dq.extend(x)
    return seen


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--minimized", required=True, help="Sökväg till minimized_YYYY.json")
    ap.add_argument("--data", default="data/data.json", help="Sökväg till data.json")
    ap.add_argument("--season", type=int, default=2025, help="Säsong att jämföra i data.json")
    ap.add_argument("--show", type=int, default=20, help="Visa upp till N saknade ID")
    args = ap.parse_args()

    # Läs minimized och samla ID
    mini = load_json(Path(args.minimized))
    mini_ids = ids_any(mini)

    # Läs data.json (kan vara lista eller {matches:[...]})
    try:
        js = load_json(Path(args.data))
        matches = js["matches"] if isinstance(js, dict) and "matches" in js else js
    except FileNotFoundError:
        matches = []

    in_data = {
        int(m["match_id"]) for m in matches
        if isinstance(m, dict)
        and "match_id" in m
        and str(m.get("season")) == str(args.season)
    }

    missing = sorted(mini_ids - in_data)

    print(f"minimized: {len(mini_ids)} ID  | data({args.season}): {len(in_data)} ID  | missing: {len(missing)}")
    if missing:
        n = max(0, int(args.show))
        print("sample:", missing[:n])


if __name__ == "__main__":
    main()
