#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations
import json, time, random, shutil
from pathlib import Path
from typing import Any, Dict, Optional
import requests

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"
BACKUP_DIR = ROOT / "backups"

MATCHSTATS_URL = "https://allsvenskan.se/data-endpoint/matchstats"
TIMEOUT = 20
RETRY = 2
SLEEP = 0.25

SESSION = requests.Session()
SESSION.headers.update({
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://allsvenskan.se/",
    "Origin": "https://allsvenskan.se",
    "Connection": "keep-alive",
    "Accept-Encoding": "gzip, deflate, br",
})
UA = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
]

def req(url: str, params: Dict[str, Any]) -> Optional[requests.Response]:
    try:
        SESSION.headers["User-Agent"] = random.choice(UA)
        return SESSION.get(url, params=params, timeout=TIMEOUT)
    except requests.RequestException:
        return None

def parse_relaxed_json(s: str):
    s = (s or "").strip().rstrip("%").strip()
    import json as _json
    try: return _json.loads(s)
    except Exception: pass
    start = next((i for i,ch in enumerate(s) if s[i] in "{["), None)
    end = next((i for i in range(len(s)-1, -1, -1) if s[i] in "}]"), None)
    if start is not None and end is not None and start < end:
        try: return _json.loads(s[start:end+1])
        except Exception: return None
    return None

def to_pair_str(a, b) -> str:
    try: ai = int(a or 0)
    except: ai = 0
    try: bi = int(b or 0)
    except: bi = 0
    return f"{ai}–{bi}"

def fetch_stats(mid: int, season: int):
    for attempt in range(1, RETRY+1):
        r = req(MATCHSTATS_URL, {"id": mid, "season": season})
        if r and r.status_code == 200 and "application/json" in (r.headers.get("Content-Type","").lower()):
            data = parse_relaxed_json(r.text)
            if data: return data
        time.sleep(0.7 * attempt)
    return None

def backup(path: Path):
    if not path.exists(): return None
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    import time as _t
    ts = _t.strftime("%Y%m%d-%H%M%S")
    dst = BACKUP_DIR / f"{path.name}.{ts}.bak"
    shutil.copy2(path, dst)
    return dst

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--season", type=int, default=2025)
    args = ap.parse_args()

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    matches = data if isinstance(data, list) else data.get("matches", [])
    t = [m for m in matches if int(m.get("season",0))==args.season]

    print(f"🔎 Backfill yellow/red cards {args.season}: {len(t)} matcher.")
    changed = 0
    for i, m in enumerate(t, 1):
        mid = int(m["match_id"])
        sts = fetch_stats(mid, args.season)
        if not sts:
            print(f"—  [{i}/{len(t)}] {mid}: inga stats"); continue
        
        # Extract yellow and red card data
        yellow = to_pair_str(sts.get("homeTeamYellowCards"), sts.get("visitingTeamYellowCards"))
        red = to_pair_str(sts.get("homeTeamRedCards"), sts.get("visitingTeamRedCards"))
        
        match_changed = False
        if m.get("yellow") != yellow:
            m["yellow"] = yellow
            match_changed = True
        if m.get("red") != red:
            m["red"] = red
            match_changed = True
            
        if match_changed:
            changed += 1
            print(f"✅ [{i}/{len(t)}] {mid}: yellow → {yellow}, red → {red}")
        else:
            print(f"—  [{i}/{len(t)}] {mid}: ingen ändring")

    if changed == 0:
        print("ℹ️  Inget att uppdatera."); return
    if args.dry_run:
        print(f"🧪 Dry-run: skulle uppdatera {changed} rader."); return

    b = backup(DATA_FILE)
    if b: print(f"💾 Backup: {b}")
    if isinstance(data, list):
        DATA_FILE.write_text(json.dumps(matches, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        data["matches"] = matches
        DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎯 Uppdaterade {changed} rader i {DATA_FILE}")

if __name__ == "__main__":
    main()