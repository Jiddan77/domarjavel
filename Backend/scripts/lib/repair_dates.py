#!/usr/bin/env python3
# scripts/lib/repair_dates.py
from __future__ import annotations
import re, json, shutil, tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

SV_MONTHS = {
    "januari": 1, "februari": 2, "mars": 3, "april": 4, "maj": 5, "juni": 6,
    "juli": 7, "augusti": 8, "september": 9, "oktober": 10, "november": 11, "december": 12,
}

def parse_sv_date(s: str) -> Optional[str]:
    if not isinstance(s, str): return None
    s = s.strip().lower()
    m = re.match(r"(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})", s)
    if not m: return None
    d = int(m.group(1)); mon = SV_MONTHS.get(m.group(2)); y = int(m.group(3))
    if not mon: return None
    return f"{y:04d}-{mon:02d}-{d:02d}"

def dump_atomic(path: Path, obj: Any) -> None:
    tmp = Path(tempfile.mkstemp(prefix=".tmp-", dir=str(path.parent))[1])
    try:
        tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
        shutil.move(str(tmp), str(path))
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)

def main():
    root = Path(__file__).resolve().parents[2]
    data_path = root / "data" / "data.json"
    backup = data_path.with_suffix(".json.bak")

    js = json.loads(data_path.read_text(encoding="utf-8"))
    matches: List[Dict[str, Any]] = js["matches"] if isinstance(js, dict) else js

    changed = 0
    for m in matches:
        if m.get("date_iso"):
            continue
        raw = m.get("date")
        if not raw:
            continue
        iso = parse_sv_date(raw)
        if iso:
            m["date_iso"] = iso
            changed += 1

    if changed:
        shutil.copy2(data_path, backup)
        dump_atomic(data_path, {"matches": matches})
        print(f"✅ Uppdaterade {changed} poster (date_iso) → {data_path} (backup: {backup})")
    else:
        print("ℹ️ Inga datum att uppdatera.")

if __name__ == "__main__":
    main()
