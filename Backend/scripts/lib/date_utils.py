
# -*- coding: utf-8 -*-
"""
date_utils.enrich_match_with_date(entry, force=False, verbose=False)

- Läser entry["url"] (eller bygger /matcher/{season}/{match_id}/) och försöker extrahera datum + tid.
- Först via requests+BeautifulSoup (snabbt), sedan Playwright som fallback.
- Tolkar svenska månadsnamn; konverterar Europe/Stockholm till UTC (Z).
"""
from __future__ import annotations
import os, re
from typing import Optional, Tuple
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from zoneinfo import ZoneInfo

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36"
SW_MONTHS = {
    "jan":"01","januari":"01",
    "feb":"02","februari":"02",
    "mar":"03","mars":"03",
    "apr":"04","april":"04",
    "maj":"05",
    "jun":"06","juni":"06",
    "jul":"07","juli":"07",
    "aug":"08","augusti":"08",
    "sep":"09","september":"09",
    "okt":"10","oktober":"10",
    "nov":"11","november":"11",
    "dec":"12","december":"12",
}

def _fetch_html(url: str) -> Optional[str]:
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=15)
        if r.status_code == 200 and r.text:
            return r.text
    except requests.RequestException:
        return None
    return None

def _parse_swe_date(text: str, default_year: Optional[int]) -> Optional[Tuple[str,str]]:
    t = " ".join(text.lower().split())
    m = re.search(r"(\d{1,2})\s+([a-zåäö]+)\s+(\d{1,2}):(\d{2})", t)
    if not m: return None
    day = int(m.group(1)); mon_txt = m.group(2); hh = int(m.group(3)); mm = int(m.group(4))
    mon = SW_MONTHS.get(mon_txt)
    if not mon: return None
    year = int(default_year or datetime.now().year)
    date_iso = f"{year:04d}-{mon}-{day:02d}"
    time_hm = f"{hh:02d}:{mm:02d}"
    return date_iso, time_hm

def _try_bs4(url: str, season: Optional[int], verbose=False) -> Optional[Tuple[str,str]]:
    html = _fetch_html(url)
    if not html: return None
    soup = BeautifulSoup(html, "lxml")
    p = soup.select_one("p.text-lg-small.text-tiny.text-uppercase.text-center.text-lg-start.pt-lg-1")
    if p:
        txt = p.get_text(" ", strip=True)
        if verbose: print(f"HTML-träff via 'p.text-lg-small...': {txt}")
        parsed = _parse_swe_date(txt, season)
        if parsed: return parsed
    for pp in soup.find_all("p"):
        txt = pp.get_text(" ", strip=True)
        parsed = _parse_swe_date(txt, season)
        if parsed:
            if verbose: print(f"HTML-träff (fallback <p>): {txt}")
            return parsed
    txt = soup.get_text(" ", strip=True)
    parsed = _parse_swe_date(txt, season)
    if parsed and verbose:
        print(f"HTML-träff (document scan): {parsed}")
    return parsed

def _try_playwright(url: str, season: Optional[int], verbose=False) -> Optional[Tuple[str,str]]:
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        return None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            sel = "p.text-lg-small.text-tiny.text-uppercase.text-center.text-lg-start.pt-lg-1"
            el = page.query_selector(sel)
            if el:
                txt = el.inner_text().strip()
                if verbose: print(f"Playwright-träff via '{sel}': {txt}")
                parsed = _parse_swe_date(txt, season)
                if parsed:
                    ctx.close(); browser.close()
                    return parsed
            txt = page.inner_text("body")[:5000]
            parsed = _parse_swe_date(txt, season)
            ctx.close(); browser.close()
            return parsed
    except Exception:
        return None

def enrich_match_with_date(entry: dict, force: bool=False, verbose: bool=False) -> bool:
    if os.environ.get("NO_DATE") == "1":
        if verbose: print(f"[info] {entry.get('match_id')}: hoppar datum (NO_DATE).")
        return False
    if not force and entry.get("date") and entry.get("datetime"):
        return True

    mid = int(entry.get("match_id"))
    season = int(entry.get("season") or 2025)
    url = entry.get("url") or f"https://allsvenskan.se/matcher/{season}/{mid}/"

    parsed = _try_bs4(url, season, verbose=verbose)
    if not parsed:
        parsed = _try_playwright(url, season, verbose=verbose)
    if not parsed:
        return False

    date_iso, hm = parsed
    try:
        dt_local = datetime.fromisoformat(f"{date_iso}T{hm}:00").replace(tzinfo=ZoneInfo("Europe/Stockholm"))
        dt_utc = dt_local.astimezone(ZoneInfo("UTC"))
        entry["date"] = date_iso
        entry["datetime"] = dt_utc.replace(microsecond=0).isoformat().replace("+00:00", "Z")
        return True
    except Exception:
        return False
