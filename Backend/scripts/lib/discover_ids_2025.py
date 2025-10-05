
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, json, time, random
from typing import Any, Dict, Optional, Tuple
import requests

BASE = "https://allsvenskan.se"
STATS = BASE + "/data-endpoint/matchstats?id={id}&season={s}"
MATCH = BASE + "/data-endpoint/match?id={id}&season={s}"

UA = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
]

SESSION = requests.Session()
SESSION.headers.update({
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    "Referer": "https://allsvenskan.se/",
    "Origin": "https://allsvenskan.se",
    "Connection": "keep-alive",
    "Accept-Encoding": "gzip, deflate, br",
})

FINISHED_TOKENS = {"finished","finished_recently","fulltime","full time","ft","slut","end","played","completed","klar","avslutad"}

def rjson(url: str) -> Optional[Dict[str, Any]]:
    try:
        SESSION.headers["User-Agent"] = random.choice(UA)
        r = SESSION.get(url, timeout=15)
        if r.status_code == 200 and r.text and r.headers.get("Content-Type","").lower().startswith("application/json"):
            try:
                return r.json()
            except Exception:
                pass
        return None
    except requests.RequestException:
        return None

def finished_any(obj: Dict[str, Any]) -> bool:
    if not isinstance(obj, dict): return False
    def walk(o):
        if isinstance(o, dict):
            yield o
            for v in o.values(): yield from walk(v)
        elif isinstance(o, list):
            for v in o: yield from walk(v)
    for n in walk(obj):
        for k in ("status","extendedStatus","state","matchStatus"):
            v = n.get(k)
            if isinstance(v, str) and v.strip().lower() in FINISHED_TOKENS:
                return True
    for n in walk(obj):
        if isinstance(n, dict):
            h = n.get("homeTeamGoals"); a = n.get("visitingTeamGoals")
            if isinstance(h, int) and isinstance(a, int): return True
    return False

def status_pair(stats: Optional[Dict[str,Any]], match: Optional[Dict[str,Any]]) -> Tuple[str, str]:
    s = (stats or {}).get("status") or (match or {}).get("status") or ""
    es = (stats or {}).get("extendedStatus") or (match or {}).get("extendedStatus") or ""
    return (str(s).upper(), str(es).upper())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, default=2025)
    ap.add_argument("--out", default="tmp/minimized_2025.json")
    ap.add_argument("--start-id", type=int, default=6142500)
    ap.add_argument("--end-id", type=int, default=6144000)
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    matches = []
    checked = 0
    for mid in range(args.start_id, args.end_id + 1):
        checked += 1
        js_s = rjson(STATS.format(id=mid, s=args.season))
        js_m = rjson(MATCH.format(id=mid, s=args.season))
        if not js_s and not js_m:
            if args.verbose and checked % 50 == 0:
                print(f"[probe] Kollat {checked} … (inga träffar)")
            continue
        stat, ext = status_pair(js_s, js_m)
        matches.append({
            "match_id": mid,
            "season": args.season,
            "status": stat or ("FINISHED" if finished_any(js_s or js_m or {}) else "UPCOMING"),
            "extendedStatus": ext or "",
        })
        if args.verbose:
            tag = "FIN" if finished_any(js_s or js_m or {}) else "UP"
            print(f"[hit] {mid} {tag} {stat or ''} {ext or ''}")
        time.sleep(0.08)

    out = {"matches": matches}
    import pathlib
    pathlib.Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"✅ Sparade {len(matches)} matcher till {args.out}")

if __name__ == "__main__":
    main()
