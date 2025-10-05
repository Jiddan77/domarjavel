# scripts/lib/enrich_html_fallback.py
from __future__ import annotations
import re, requests
from bs4 import BeautifulSoup
from typing import Dict, Any
from .sv_datetime import parse_sv_short

DATE_SELECTOR = "p.text-uppercase"  # matchar bl.a. "sön 27 jul 16:30"
REFS_SELECTOR = "#matchdetails .match-hero__info > div:nth-child(2) > p"  # din domar-nod

def fetch_meta_from_html(url: str, season: int, timeout=20, verbose=False) -> Dict[str, Any]:
    """
    Läser statiskt HTML och försöker plocka:
      - 'sön 27 jul 16:30' → date_iso + datetime(UTC) + datetime_local
      - domare från din p-nod
    OBS: fungerar bara om texten faktiskt finns i serversvaret. Om sidan fyller via JS
         och HTML:en är tom → överväg Playwright-fallback (se enrich_via_playwright).
    """
    out: Dict[str, Any] = {}
    r = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    # Datum/tid
    node = soup.select_one(DATE_SELECTOR)
    if node and node.get_text(strip=True):
        text = node.get_text(strip=True)
        date_iso, dt_utc, dt_local = parse_sv_short(text, default_year=season)
        if date_iso: out["date_iso"] = date_iso
        if dt_utc:   out["datetime"] = dt_utc
        if dt_local: out["datetime_local"] = dt_local
    else:
        # fallback: regex i hela dokumentet
        body_txt = soup.get_text(" ", strip=True)
        m = re.search(r"(mån|tis|ons|tors|fre|lör|sön)\s+\d{1,2}\s+[a-zåäö]{3}\s+\d{1,2}:\d{2}", body_txt, flags=re.I)
        if not m:
            m = re.search(r"\b\d{1,2}\s+[a-zåäö]{3}\s+\d{1,2}:\d{2}\b", body_txt, flags=re.I)
        if m:
            date_iso, dt_utc, dt_local = parse_sv_short(m.group(0), default_year=season)
            if date_iso: out["date_iso"] = date_iso
            if dt_utc:   out["datetime"] = dt_utc
            if dt_local: out["datetime_local"] = dt_local

    # Domare
    refs = soup.select_one(REFS_SELECTOR)
    if refs and refs.get_text(strip=True):
        names_str = refs.get_text(strip=True)
        names = [n.strip() for n in names_str.split(",") if n.strip()]
        if names:
            out["referee"] = names[0]
            out["referees"] = names
    else:
        body_txt = soup.get_text(" ", strip=True)
        m = re.search(r"Domare[:\s]+([^\n|]+)", body_txt, flags=re.I)
        if m:
            names_str = m.group(1).strip()
            names = [n.strip() for n in names_str.split(",") if n.strip()]
            if names:
                out["referee"] = names[0]
                out["referees"] = names

    if verbose:
        print(f"[html] {url} → {out}")
    return {k: v for k, v in out.items() if v}
