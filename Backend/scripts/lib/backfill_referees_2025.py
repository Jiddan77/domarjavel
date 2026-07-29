
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations
import argparse, json, random, re, shutil, time
from pathlib import Path
from typing import Any, Dict, Optional, List
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"
BACKUP_DIR = ROOT / "backups"

MATCHDOC_URL = "https://allsvenskan.se/data-endpoint/match"
TIMEOUT = 20
RETRY = 2

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

def req(url: str, params: Optional[Dict[str, Any]] = None) -> requests.Response:
    SESSION.headers["User-Agent"] = random.choice(UA)
    return SESSION.get(url, params=params, timeout=TIMEOUT)

REFEREE_NAME_RE = re.compile(r"^[A-ZÅÄÖ][A-ZÅÄÖ\-\. ]{1,58}[A-ZÅÄÖ]$")

def is_valid_referee_name(name: Optional[str]) -> bool:
    """Reject undecodable/garbled text (e.g. from an unhandled Brotli response)."""
    return bool(name) and bool(REFEREE_NAME_RE.match(name))

def parse_relaxed_json(txt: str):
    s = (txt or "").strip().rstrip('%').strip()
    try:
        return json.loads(s)
    except Exception:
        pass
    start = next((i for i,ch in enumerate(s) if ch in '{['), None)
    end = next((i for i in range(len(s)-1, -1, -1) if s[i] in '}]'), None)
    if start is not None and end is not None and start < end:
        try:
            return json.loads(s[start:end+1])
        except Exception:
            return None
    return None

def _unwrap_fs_value(v):
    if not isinstance(v, dict): return v
    if "stringValue" in v:  return v["stringValue"]
    if "integerValue" in v:
        try: return int(v["integerValue"])
        except: return v["integerValue"]
    if "doubleValue" in v:
        try: return float(v["doubleValue"])
        except: return v["doubleValue"]
    if "booleanValue" in v: return bool(v["booleanValue"])
    if "nullValue" in v:    return None
    if "mapValue" in v:
        fields = v["mapValue"].get("fields", {})
        return {k: _unwrap_fs_value(v2) for k, v2 in fields.items()}
    if "arrayValue" in v:
        vals = v["arrayValue"].get("values", [])
        return [_unwrap_fs_value(x) for x in vals]
    return v

def _fs_unwrap_fields(doc):
    fields = doc.get("fields", {})
    return {k: _unwrap_fs_value(v) for k, v in fields.items()}

def extract_main_referee_from_match_doc(doc) -> Optional[str]:
    try:
        f = _fs_unwrap_fields(doc) if (isinstance(doc, dict) and "fields" in doc) else (doc if isinstance(doc, dict) else {})
        arr = f.get("referees")
        if isinstance(arr, list) and arr and isinstance(arr[0], str) and arr[0].strip():
            return arr[0].strip().upper()
        for k in ["refereeName", "mainRefereeName"]:
            if isinstance(f.get(k), str) and f[k].strip(): return f[k].strip().upper()
        for k in ["mainReferee", "referee"]:
            v = f.get(k)
            if isinstance(v, dict):
                name = v.get("fullName") or v.get("name")
                if isinstance(name, str) and name.strip(): return name.strip().upper()
            if isinstance(v, str) and v.strip(): return v.strip().upper()
        for list_key in ["matchOfficials", "officials"]:
            arr = f.get(list_key)
            if isinstance(arr, list) and arr:
                if all(isinstance(x, str) for x in arr):
                    cand = arr[0].strip()
                    if cand: return cand.upper()
                for it in arr:
                    if not isinstance(it, dict): continue
                    role = str(it.get("role") or it.get("position") or "").lower()
                    if "assistant" in role: continue
                    nm = (it.get("fullName") or it.get("name") or it.get("displayName") or "").strip()
                    if nm: return nm.upper()
                for it in arr:
                    if isinstance(it, dict):
                        nm = (it.get("fullName") or it.get("name") or it.get("displayName") or "").strip()
                        if nm: return nm.upper()
    except Exception:
        return None
    return None

def extract_referee_from_html(url: str) -> Optional[str]:
    SESSION.headers["User-Agent"] = random.choice(UA)
    try:
        r = SESSION.get(url, timeout=TIMEOUT)
        if r.status_code != 200: return None
        soup = BeautifulSoup(r.text, "lxml")
        p = soup.select_one("p.text-lg-small.text-tiny.text-uppercase.text-center.text-lg-start.pt-lg-1")
        txt = (p.get_text(" ", strip=True) if p else "") or ""
        if not txt:
            import re as _re
            for pp in soup.find_all("p"):
                s = pp.get_text(" ", strip=True)
                if "," in s and _re.search(r"\b\w+\s+\w+\b", s):
                    txt = s; break
        if not txt: return None
        return txt.split(",")[0].strip().upper()
    except requests.RequestException:
        return None

def backup(path: Path):
    if not path.exists(): return None
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%d-%H%M%S")
    dst = BACKUP_DIR / f"{path.name}.{ts}.bak"
    shutil.copy2(path, dst)
    return dst

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, default=2025)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not DATA_FILE.exists():
        print(f"Saknar {DATA_FILE}")
        return

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    matches = data if isinstance(data, list) else data.get("matches", [])
    target = [m for m in matches if int(m.get("season",0))==args.season and not m.get("referee")]

    print(f"🔎 Saknar domare {args.season}: {len(target)} matcher")
    changed = 0
    for i, m in enumerate(target, 1):
        mid = int(m["match_id"]); season = int(m["season"])
        url = f"https://allsvenskan.se/data-endpoint/match?id={mid}&season={season}"

        ref = None
        for attempt in range(1, RETRY+1):
            r = req(url)
            if r.status_code == 200 and "application/json" in (r.headers.get("Content-Type","").lower()):
                doc = parse_relaxed_json(r.text)
                if doc:
                    candidate = extract_main_referee_from_match_doc(doc)
                    if candidate and is_valid_referee_name(candidate):
                        ref = candidate
                        break
            time.sleep(0.6 * attempt)

        if not ref:
            candidate = extract_referee_from_html(f"https://allsvenskan.se/matcher/{season}/{mid}/")
            if candidate and is_valid_referee_name(candidate):
                ref = candidate

        if ref:
            m["referee"] = ref; changed += 1
            print(f"✅ [{i}/{len(target)}] {mid}: domare → {ref}")
        else:
            print(f"—  [{i}/{len(target)}] {mid}: ingen domare i doc+HTML")

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
