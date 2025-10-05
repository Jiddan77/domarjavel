#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations
import json, re, sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"

def load_json(p: Path) -> Any:
    return json.loads(p.read_text(encoding="utf-8"))

def save_json(p: Path, obj: Any) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def normalize_container(js: Any) -> List[dict]:
    if isinstance(js, dict) and isinstance(js.get("matches"), list):
        return js["matches"]
    if isinstance(js, list):
        return js
    return []

def slugify_name(name: str) -> str:
    t = (name or "").strip().lower()
    # svensk translit
    t = (t.replace("å","a").replace("ä","a").replace("ö","o")
           .replace("é","e").replace("è","e").replace("ü","u"))
    t = re.sub(r"[^a-z0-9]+", "_", t)
    t = re.sub(r"_+", "_", t).strip("_")
    return t or "unknown"

def compact_entry(m: dict) -> dict:
    # säkerställ vårt compact-schema även om data.json råkar innehålla fler fält
    keys = ["match_id","season","date","referee","home","away","score","penalty","datetime"]
    return {k:m.get(k) for k in keys if m.get(k) is not None}

def is_season(m: dict, season: int) -> bool:
    return str(m.get("season")) == str(season)

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, default=2025)
    ap.add_argument("--data", type=str, default=str(DATA_FILE))
    ap.add_argument("--chunks-dir", type=str, default=None,
                    help="Basdir för chunks. Default: data/chunks/<season>")
    args = ap.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        print(f"❌ Hittar inte {data_path}")
        sys.exit(2)

    js = load_json(data_path)
    matches = normalize_container(js)

    season_matches = [compact_entry(m) for m in matches if is_season(m, args.season)]
    if not season_matches:
        print(f"ℹ️  Inga matcher i data.json för säsong {args.season}")
        sys.exit(0)

    # finished = allt som redan finns i data.json för den här säsongen
    finished = list(season_matches)

    # upcoming = läs från standardfil om den finns
    chunks_base = Path(args.chunks_dir) if args.chunks_dir else (ROOT / "data" / "chunks" / str(args.season))
    upcoming_path = chunks_base / "upcoming.json"
    upcoming: List[dict] = []
    if upcoming_path.exists():
        u = load_json(upcoming_path)
        upcoming = normalize_container(u)

    # --- Skriv säsongsfiler ---
    save_json(chunks_base / "finished.json", {"matches": finished})
    if upcoming:
        save_json(chunks_base / "upcoming.json", {"matches": upcoming})
    # all.json = finished + upcoming (kompakt)
    # undvik dubbletter på match_id
    seen = set()
    all_list: List[dict] = []
    for lst in (finished, upcoming):
        for m in lst:
            mid = str(m.get("match_id"))
            if mid not in seen:
                all_list.append(compact_entry(m))
                seen.add(mid)
    save_json(chunks_base / "all.json", {"matches": all_list})

    # --- Teams-chunks (finished + upcoming) ---
    teams_dir = chunks_base / "teams"
    teams_dir.mkdir(parents=True, exist_ok=True)

    by_team: Dict[str, List[dict]] = {}
    def add_team(t: str, m: dict):
        if not t: return
        key = slugify_name(t)
        by_team.setdefault(key, []).append(compact_entry(m))

    for m in finished:
        add_team(m.get("home"), m)
        add_team(m.get("away"), m)
    for m in upcoming:
        add_team(m.get("home"), m)
        add_team(m.get("away"), m)

    for key, lst in by_team.items():
        save_json(teams_dir / f"{key}.json", {"matches": lst})

    # --- Refs-chunks (endast finished – upcoming har ingen domare) ---
    refs_dir = chunks_base / "refs"
    refs_dir.mkdir(parents=True, exist_ok=True)

    by_ref: Dict[str, List[dict]] = {}
    for m in finished:
        ref = (m.get("referee") or "").strip()
        if not ref:
            continue
        key = slugify_name(ref)
        by_ref.setdefault(key, []).append(compact_entry(m))

    for key, lst in by_ref.items():
        save_json(refs_dir / f"{key}.json", {"matches": lst})

    # --- Health/summary ---
    n_with_ref = sum(1 for m in finished if (m.get("referee") or "").strip())
    print(f"[split] season={args.season}  finished={len(finished)}  with_ref={n_with_ref}  upcoming={len(upcoming)}")
    print(f"[split] wrote: teams={len(by_team)}  refs={len(by_ref)}  → {chunks_base}")

if __name__ == "__main__":
    main()
