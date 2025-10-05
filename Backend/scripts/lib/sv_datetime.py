# scripts/lib/sv_datetime.py
from __future__ import annotations
import re
from datetime import datetime
from typing import Optional, Tuple
from zoneinfo import ZoneInfo

SV_MONTHS_ABBR = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "maj": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12
}
WEEKDAYS = r"(mån|tis|ons|tors|fre|lör|sön)"

def parse_sv_short(text: str, default_year: int, tz: str = "Europe/Stockholm"
                   ) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    'sön 27 jul 16:30' eller '27 jul 16:30' → (date_iso, datetime_utc_iso, datetime_local_iso)
    """
    if not text:
        return None, None, None
    t = text.strip().lower()

    m = re.search(rf"{WEEKDAYS}\s+(\d{{1,2}})\s+([a-zåäö]{{3}})\s+(\d{{1,2}}:\d{{2}})", t)
    if not m:
        m = re.search(r"(\d{1,2})\s+([a-zåäö]{3})\s+(\d{1,2}:\d{2})", t)
        if not m:
            return None, None, None

        day, mon_abbr, hhmm = m.group(1), m.group(2), m.group(3)
    else:
        day, mon_abbr, hhmm = m.group(1), m.group(2), m.group(3)

    day_i = int(day)
    mon = SV_MONTHS_ABBR.get(mon_abbr[:3])
    if not mon:
        return None, None, None

    dt_local = datetime.strptime(f"{default_year:04d}-{mon:02d}-{day_i:02d} {hhmm}", "%Y-%m-%d %H:%M")
    dt_local = dt_local.replace(tzinfo=ZoneInfo(tz))
    dt_utc = dt_local.astimezone(ZoneInfo("UTC"))

    date_iso = dt_local.date().isoformat()
    dt_local_iso = dt_local.isoformat(timespec="seconds")     # e.g. 2025-07-27T16:30:00+02:00
    dt_utc_iso = dt_utc.replace(tzinfo=None).isoformat(timespec="seconds") + "Z"
    return date_iso, dt_utc_iso, dt_local_iso
