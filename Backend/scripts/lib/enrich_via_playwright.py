# scripts/lib/enrich_via_playwright.py
from __future__ import annotations
import re
from typing import Dict, Any, Optional, List
from playwright.sync_api import sync_playwright
from .sv_datetime import parse_sv_short

DATE_SELECTOR = "p.text-uppercase"
REFS_SELECTOR = "#matchdetails .match-hero__info > div:nth-child(2) > p"

def get_meta_via_playwright(url: str, season: int, headless: bool = True,
                            timeout_ms: int = 20000, wait_ms: int = 2500) -> Dict[str, Any]:
    """
    Renderar sidan och hämtar:
      - date_iso / datetime (UTC) / datetime_local (svensk TZ)
      - referee + referees
      - home/away (från <title>)
    """
    out: Dict[str, Any] = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page(user_agent="Mozilla/5.0")
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        page.wait_for_timeout(wait_ms)

        # Datum/tid
        try:
            txt = page.locator(DATE_SELECTOR).first.inner_text()
            if txt:
                date_iso, dt_utc, dt_local = parse_sv_short(txt, default_year=season)
                if date_iso: out["date_iso"] = date_iso
                if dt_utc:   out["datetime"] = dt_utc
                if dt_local: out["datetime_local"] = dt_local
        except Exception:
            pass

        # Domare
        try:
            refs_txt = page.locator(REFS_SELECTOR).inner_text()
            if refs_txt:
                names = [n.strip() for n in refs_txt.split(",") if n.strip()]
                if names:
                    out["referee"] = names[0]
                    out["referees"] = names
        except Exception:
            # Fallback: hela body
            try:
                body = page.locator("body").inner_text()
                m = re.search(r"Domare[:\s]+([^\n]+)", body, flags=re.I)
                if m:
                    names_str = m.group(1).strip()
                    names = [n.strip() for n in names_str.split(",") if n.strip()]
                    if names:
                        out["referee"] = names[0]
                        out["referees"] = names
            except Exception:
                pass

        # Lagnamn från titel (om du vill bekräfta/komplettera)
        try:
            ttl = page.title() or ""
            m = re.search(r"(.+?)\s+mot\s+(.+?)\s+-\s+Allsvenskan", ttl, flags=re.I)
            if m:
                out.setdefault("home", m.group(1).strip())
                out.setdefault("away", m.group(2).strip())
        except Exception:
            pass

        browser.close()
    return {k: v for k, v in out.items() if v}
