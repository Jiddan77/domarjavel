#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
minimized_inspect.py (Firestore-aware)
--------------------------------------
Läser minimized_YYYY.json oavsett om den är "vanlig JSON" eller Firestore-lik (stringValue/integerValue/mapValue/arrayValue).
Rapporterar:
- antal unika match-ID i minimized
- hur många av dessa ID som redan finns i data.json för given säsong
- hur många som saknas (+ sample-lista)

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


# -------- Firestore unwrap --------
def _unwrap_fs_value(v: Any) -> Any:
    if not isinstance(v, dict):
        return v
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        try:
            return int(v["integerValue"])
        except Exception:
            return v["integerValue"]
    if "doubleValue" in v:
        try:
            return float(v["doubleValue"])
        except Exception:
            return v["doubleValue"]
    if "booleanValue" in v:
        return bool(v["booleanValue"])
    if "nullValue" in v:
        return None
    if "mapValue" in v:
        fields = v["mapValue"].get("fields", {})
        return {k: _unwrap_fs_value(v2) for k, v2 in fields.items()}
    if "arrayValue" in v:
        vals = v["arrayValue"].get("values", [])
        return [_unwrap_fs_value(x) for x in vals]
    # inte ett känt FS-objekt; returnera som är
    return {k: _unwrap_fs_value(v2) for k, v2 in v.items()}


def _unwrap_fs_tree(js: Any) -> Any:
    if isinstance(js, dict):
        # om det här är ett FS root-dokument (fields/mapValue), unwrapa
        if "fields" in js and isinstance(js["fields"], dict):
            return {k: _unwrap_fs_value(v) for k, v in js["fields"].items()}
        return {k: _unwrap_fs_tree(v) for k, v in js.items()}
    if isinstance(js, list):
        return [_unwrap_fs_tree(v) for v in js]
    return js


# -------- ID-extraktion --------
def _as_int(v: Any) -> int | None:
    try:
        return int(str(v).strip())
    except Exception:
        return None


def ids_any(js: Any) -> Set[int]:
    """
    Skanna ett godtyckligt (ev. Firestore-avslöjat) JSON-objekt och plocka ut unika match-id.
    Tittar på nycklar: match_id, id, matchId, gameId, game_id
    """
    seen: Set[int] = set()
    dq = deque([js])
    KEYS = ("match_id", "id", "matchId", "gameId", "game_id")

    while dq:
        x = dq.popleft()
        if isinstance(x, dict):
            for k in KEYS:
                if k in x:
                    mid = _as_int(x[k])
                    if mid is not None:
                        seen.add(mid)
            dq.extend(x.values())
        elif isinstance(x, list):
            dq.extend(x)
    return seen


# -------- IO --------
def load_json(p: Path) -> Any:
    return json.loads(p.read_text(encoding="utf-8"))


def normalize_matches_container(js: Any) -> list[dict]:
    """Tillåt både lista och {matches:[…]}."""
    if isinstance(js, dict) and isinstance(js.get("matches"), list):
        return js["matches"]
    if isinstance(js, list):
        return js
    return []


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--minimized", required=True, help="Sökväg till minimized_YYYY.json")
    ap.add_argument("--data", default="data/data.json", help="Sökväg till data.json")
    ap.add_argument("--season", type=int, default=2025, help="Säsong att jämföra i data.json")
    ap.add_argument("--show", type=int, default=20, help="Visa upp till N saknade ID")
    args = ap.parse_args()

    # 1) Läs & unwrapa minimized
    raw = load_json(Path(args.minimized))
    mini_unwrapped = _unwrap_fs_tree(raw)
    mini_ids = ids_any(mini_unwrapped)

    # 2) Läs data.json
    try:
        data = load_json(Path(args.data))
        matches = normalize_matches_container(data)
    except FileNotFoundError:
        matches = []

    in_data = {
        int(m["match_id"]) for m in matches
        if isinstance(m, dict) and "match_id" in m and str(m.get("season")) == str(args.season)
    }

    missing = sorted(mini_ids - in_data)

    print(f"minimized: {len(mini_ids)} ID  | data({args.season}): {len(in_data)} ID  | missing: {len(missing)}")
    if missing:
        n = max(0, int(args.show))
        print("sample:", missing[:n])

    # bonus: visa ett par första ID för sanity
    if mini_ids:
        head = sorted(list(mini_ids))[:10]
        print("head IDs:", head)


if __name__ == "__main__":
    main()
