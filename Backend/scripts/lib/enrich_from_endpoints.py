# scripts/lib/enrich_from_endpoints.py
from __future__ import annotations
import re, time
from typing import Any, Dict, Optional, Tuple
import requests

SV_MONTHS = {
    "januari":1,"februari":2,"mars":3,"april":4,"maj":5,"juni":6,
    "juli":7,"augusti":8,"september":9,"oktober":10,"november":11,"december":12,
}

def _sv_to_iso(s: str) -> Optional[str]:
    if not isinstance(s, str): return None
    s = s.strip().lower()
    m = re.match(r"(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})", s)
    if not m: return None
    d = int(m.group(1)); mon = SV_MONTHS.get(m.group(2)); y = int(m.group(3))
    if not mon: return None
    return f"{y:04d}-{mon:02d}-{d:02d}"

def _http_get_json(url: str, params: Dict[str, Any], tries: int = 3, delay: float = 0.7
                   ) -> Optional[Dict[str, Any]]:
    last = None
    for _ in range(tries):
        try:
            r = requests.get(url, params=params, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last = e
            time.sleep(delay)
    return None

def _norm_datetime(raw_date: Any, raw_time: Any, raw_iso: Any) -> Tuple[Optional[str], Optional[str]]:
    """Returnerar (date_iso, datetime_utc_iso) om möjligt."""
    date_iso = None
    dt_iso = None
    if isinstance(raw_iso, str):
        s = raw_iso.strip()
        if "T" in s:
            date_iso = s.split("T", 1)[0]
            dt_iso = s if s.endswith("Z") or "+" in s else s + "Z"
            return date_iso, dt_iso
        if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
            date_iso = s
    if isinstance(raw_date, str):
        s = raw_date.strip()
        if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
            date_iso = s
        else:
            date_iso = _sv_to_iso(s) or date_iso
    if date_iso and isinstance(raw_time, str) and re.match(r"^\d{2}:\d{2}$", raw_time.strip()):
        # anta lokal svensk tid → sätt bara som text; konvertering hanteras separat om behövs
        dt_iso = f"{date_iso}T{raw_time.strip()}:00Z"  # lägg 'Z' som enkel standard
    return date_iso, dt_iso

def fetch_meta_from_match_config(mid: int, season: int, verbose: bool = False) -> Dict[str, Any]:
    """
    Hämtar meta från match-config om tillgängligt (vissa matcher har nästan tomt config).
    Returnerar t.ex. {date, date_iso, datetime, home, away, referee}
    """
    out: Dict[str, Any] = {}
    mc = _http_get_json("https://allsvenskan.se/data-endpoint/match-config",
                        {"id": mid, "season": season})
    if not mc:
        if verbose: print(f"[mc] no data for id={mid} season={season}")
        return out

    raw_date = mc.get("date") or mc.get("matchDate") or mc.get("startDate") or mc.get("start_date")
    raw_time = mc.get("time") or mc.get("startTime")
    raw_iso  = mc.get("datetime") or mc.get("date_iso") or mc.get("startDateISO") or mc.get("matchDateTime")
    date_iso, dt_iso = _norm_datetime(raw_date, raw_time, raw_iso)

    if raw_date: out["date"] = raw_date
    if date_iso: out["date_iso"] = date_iso
    if dt_iso:   out["datetime"] = dt_iso

    out["home"] = mc.get("homeTeamName") or mc.get("home")
    out["away"] = mc.get("visitingTeamName") or mc.get("away")
    out["referee"] = mc.get("referee") or mc.get("refereeName") or mc.get("domare") or mc.get("mainReferee")

    if verbose: print(f"[mc] {mid} → {out}")
    return {k: v for k, v in out.items() if v is not None and v != ""}
