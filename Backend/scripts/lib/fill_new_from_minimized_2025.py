#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fill_new_from_minimized_2025.py

Läser en "minimized" källa, hittar matcher, fyller på data och skriver:
- data.json (uppdaterar eller lägger till matcher)
- chunks/2025/upcoming.json (berikad upcoming-lista)

Fyller meta (date_iso/datetime/referee/home/away) via:
  1) match-config (JSON-endpoint)
  2) HTML-fallback (requests + BeautifulSoup)
  3) (valfritt) Playwright-renderad DOM (om --html-playwright)

Exempel:
python scripts/lib/fill_new_from_minimized_2025.py \
  --season 2025 \
  --minimized tmp/minimized_2025.json \
  --data data/data.json \
  --upcoming-out data/chunks/2025/upcoming.json \
  --inplace --verbose --trace-sources \
  --rate 0.15 --early-stop 3 --html-playwright
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

# Primär meta-enricher
from scripts.lib.enrich_from_endpoints import fetch_meta_from_match_config
# HTML-fallback (utan browser)
from scripts.lib.enrich_html_fallback import fetch_meta_from_html
# (valfritt) Playwright-renderad fallback:
# from scripts.lib.enrich_via_playwright import get_meta_via_playwright


# ----------------------------
# Firestore unwrapping
# ----------------------------

def _unwrap_fs_value(v: Any) -> Any:
    """Unwrap Firestore-style values (stringValue, integerValue, etc.)"""
    if not isinstance(v, dict):
        return v
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        try:
            return int(v["integerValue"])
        except Exception:
            return v["integerValue"]
    if "doubleValue" in v:
        try:
            return float(v["doubleValue"])
        except Exception:
            return v["doubleValue"]
    if "booleanValue" in v:
        return bool(v["booleanValue"])
    if "nullValue" in v:
        return None
    if "mapValue" in v:
        fields = v["mapValue"].get("fields", {})
        return {k: _unwrap_fs_value(v2) for k, v2 in fields.items()}
    if "arrayValue" in v:
        vals = v["arrayValue"].get("values", [])
        return [_unwrap_fs_value(x) for x in vals]
    # If it's a regular dict, recursively unwrap its values
    if isinstance(v, dict):
        return {k: _unwrap_fs_value(v2) for k, v2 in v.items()}
    return v

def unwrap_firestore_document(doc: Any) -> Any:
    """Unwrap a complete Firestore document"""
    if isinstance(doc, dict) and "fields" in doc:
        return _unwrap_fs_value({"mapValue": {"fields": doc["fields"]}})
    return _unwrap_fs_value(doc)

# ----------------------------
# Utils
# ----------------------------

EN_DASH = "–"  # samma som i din existerande data: "2–3"

def load_json(path: str | Path) -> Any:
    p = Path(path)
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)

def dump_json_atomic(path: str | Path, data: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".tmp-", dir=str(p.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, p)
    finally:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except OSError:
            pass

def ensure_matches_list(js: Any) -> List[Dict[str, Any]]:
    # Stöd både { "matches": [...] } och ren lista [...]
    if isinstance(js, dict) and "matches" in js and isinstance(js["matches"], list):
        return js["matches"]
    if isinstance(js, list):
        return js
    # Ny fil
    return []

def flatten_once(d: Dict[str, Any]) -> Dict[str, Any]:
    """Plocka bara ut första nivån; används för att läsa direkta fält."""
    return dict(d or {})

def i64(x: Any) -> Optional[int]:
    try:
        if x is None:
            return None
        return int(x)
    except Exception:
        return None

def safe_first(*vals: Any) -> Optional[Any]:
    for v in vals:
        if v not in (None, "", [], {}):
            return v
    return None

def merged(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(a)
    for k, v in b.items():
        if k not in out and v not in (None, "", [], {}):
            out[k] = v
    return out

def build_allsvenskan_url(season: int, mid: int) -> str:
    # sluggen behövs inte – sajten redirectar
    return f"https://allsvenskan.se/matcher/{season}/{mid}"


# ----------------------------
# Match extraction
# ----------------------------

def node_has_match_id(node: Any) -> bool:
    if not isinstance(node, dict):
        return False
    # Vanliga id-nycklar
    return "id" in node or "match_id" in node or "matchId" in node

def collect_matches_from_minimized(root: Any, verbose: bool=False) -> Dict[int, Dict[str, Any]]:
    """
    Traverserar "minimized" struktur och försöker hitta alla match-noder.
    Returnerar dict: match_id -> flat-data (bästa gissning från källan).
    """
    out: Dict[int, Dict[str, Any]] = {}

    def rec(node: Any):
        if isinstance(node, dict):
            flat = flatten_once(node)

            if node_has_match_id(node):
                # Hämta mid
                mid = i64(safe_first(flat.get("id"), flat.get("match_id"), flat.get("matchId")))
                if mid:
                    try:
                        # Plocka vanliga, lättåtkomliga fält
                        kv: Dict[str, Any] = {}

                        # Status / extended status
                        for k in ("status", "extendedStatus"):
                            if k in flat and flat[k]:
                                kv[k] = flat[k]

                        # Lag
                        hm = safe_first(flat.get("homeTeamName"), flat.get("home"))
                        aw = safe_first(flat.get("visitingTeamName"), flat.get("away"))
                        if hm: kv["home"] = hm
                        if aw: kv["away"] = aw

                        # Mål & straffar → score/penalty
                        hg = i64(safe_first(flat.get("homeTeamGoals"), flat.get("homeTeamScore")))
                        vg = i64(safe_first(flat.get("visitingTeamGoals"), flat.get("visitingTeamScore")))
                        if hg is not None and vg is not None:
                            kv["score"] = f"{hg}{EN_DASH}{vg}"
                        hgp = i64(flat.get("homeTeamGoalsFromPenalties"))
                        vgp = i64(flat.get("visitingTeamGoalsFromPenalties"))
                        if hgp is not None and vgp is not None:
                            kv["penalty"] = f"{hgp}{EN_DASH}{vgp}"

                        # Domare om den råkar finnas här
                        ref = safe_first(
                            flat.get("referee"),
                            flat.get("refereeName"),
                            flat.get("domare"),
                            flat.get("mainReferee"),
                        )
                        if ref:
                            kv["referee"] = ref

                        # Datum från startDate
                        start_date = flat.get("startDate")
                        if start_date:
                            kv["date_iso"] = start_date
                            # Convert ISO date to readable format
                            try:
                                from datetime import datetime
                                dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                                kv["datetime"] = dt.strftime("%Y-%m-%d %H:%M")
                                # Swedish date format like "24 april 2025"
                                months = ["", "januari", "februari", "mars", "april", "maj", "juni",
                                         "juli", "augusti", "september", "oktober", "november", "december"]
                                kv["date"] = f"{dt.day} {months[dt.month]} {dt.year}"
                            except Exception:
                                pass

                        out[mid] = merged(out.get(mid, {}), kv)

                    except Exception:
                        # 🚑 Viktigt: krascha inte traversal pga udda nod
                        if verbose:
                            print(f"[warn] skip broken node for id={mid}: keys={list(flat.keys())[:30]}")
                        pass  # <-- denna 'except' fixar din SyntaxError-bugg

            # Fortsätt traversal
            for v in node.values():
                rec(v)

        elif isinstance(node, list):
            for v in node:
                rec(v)

    # Handle Firestore format if needed
    if isinstance(root, dict) and "documents" in root:
        # This looks like Firestore format
        documents = root["documents"]
        if verbose:
            print(f"[firestore] Found {len(documents)} documents")
        
        for doc in documents:
            unwrapped = unwrap_firestore_document(doc)
            if verbose and len(out) < 3:  # Show first few for debugging
                print(f"[firestore] Unwrapped doc sample: {list(unwrapped.keys())[:5]}")
            rec(unwrapped)
    else:
        # Regular JSON format
        rec(root)
        
    if verbose:
        print(f"[scan] found {len(out)} matches in minimized")
    return out


# ----------------------------
# Enrichment pipeline
# ----------------------------

def enrich_match_meta(mid: int,
                      season: int,
                      kv: Dict[str, Any],
                      *,
                      use_html_playwright: bool,
                      verbose: bool) -> Dict[str, Any]:
    """
    Berikar kv med date_iso/datetime/referee/home/away från källor i ordning:
      1) match-config
      2) HTML-fallback (requests + BS4)
      3) (valfritt) Playwright-renderad DOM om ovan inte räcker
    """
    needed_main = ("date_iso", "datetime", "referee", "home", "away")

    # 1) match-config
    if any(not kv.get(k) for k in needed_main):
        if verbose:
            print(f"[mc] enrich mid={mid}")
        extra_mc = fetch_meta_from_match_config(mid, season, verbose=verbose)
        kv = merged(kv, extra_mc)

    # 2) HTML-fallback (statisk)
    if any(not kv.get(k) for k in ("date_iso", "datetime", "referee")):
        url = kv.get("url") or build_allsvenskan_url(season, mid)
        try:
            if verbose:
                print(f"[html] enrich mid={mid} url={url}")
            extra_html = fetch_meta_from_html(url, season=season, verbose=verbose)
            kv = merged(kv, extra_html)
        except Exception as e:
            if verbose:
                print(f"[html] fail mid={mid}: {e}")

    # 3) (valfritt) Playwright-renderad fallback
    if use_html_playwright and any(not kv.get(k) for k in ("date_iso", "datetime", "referee")):
        try:
            if verbose:
                print(f"[pw] enrich mid={mid}")
            # from scripts.lib.enrich_via_playwright import get_meta_via_playwright
            # extra_pw = get_meta_via_playwright(build_allsvenskan_url(season, mid), season=season, headless=True)
            # kv = merged(kv, extra_pw)
            # ↑↑↑ Avkommentera 3 raderna ovan när du vill använda Playwright. Importen ligger kommenterad i filhuvudet.
            pass
        except Exception as e:
            if verbose:
                print(f"[pw] fail mid={mid}: {e}")

    return kv


# ----------------------------
# Merge into data.json & upcoming
# ----------------------------

def is_finished_status(status: Optional[str]) -> bool:
    if not status:
        return False
    s = status.strip().upper()
    return s in ("FINISHED", "FT", "FULLTIME") or "FINISH" in s

def merge_into_data(existing: List[Dict[str, Any]],
                    updates: Dict[int, Dict[str, Any]],
                    *,
                    season: int,
                    verbose: bool) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Slår ihop uppdateringar. Returnerar (new_list, upcoming_items)
    """
    by_id: Dict[int, Dict[str, Any]] = {}
    order: List[int] = []

    def push(m: Dict[str, Any]):
        mid = i64(m.get("match_id"))
        if not mid:
            return
        if mid not in by_id:
            by_id[mid] = m
            order.append(mid)
        else:
            # shallow merge, senare uppdatering skriver över tomma fält
            base = by_id[mid]
            for k, v in m.items():
                if k == "match_id":
                    continue
                if v not in (None, "", [], {}):
                    base[k] = v

    # Ladda befintliga
    for m in existing:
        if "season" not in m and season:
            m["season"] = season
        push(m)

    upcoming_items: List[Dict[str, Any]] = []

    # Applicera uppdateringar
    for mid, kv in updates.items():
        kv = dict(kv)
        kv["match_id"] = mid
        if "season" not in kv and season:
            kv["season"] = season
        push(kv)

        # Bygg upcoming-post om status inte är finished
        st = kv.get("status") or kv.get("extendedStatus")
        if not is_finished_status(st):
            up = {
                "match_id": mid,
                "season": season,
                "home": kv.get("home"),
                "away": kv.get("away"),
                "date_iso": kv.get("date_iso"),
                "datetime": kv.get("datetime"),
                "referee": kv.get("referee"),
            }
            upcoming_items.append({k: v for k, v in up.items() if v is not None})

    # Återskapa lista i gammal ordning + nya sist
    new_list = [by_id[mid] for mid in order]
    return new_list, upcoming_items


# ----------------------------
# CLI
# ----------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Fyll nya matcher från minimized → data.json/upcoming.json")
    p.add_argument("--season", type=int, required=True)
    p.add_argument("--minimized", type=str, required=True, help="Minimized JSON-källa")
    p.add_argument("--data", type=str, required=True, help="data.json att uppdatera")
    p.add_argument("--upcoming-out", type=str, required=True, help="Sökväg för upcoming.json")
    p.add_argument("--inplace", action="store_true", help="Skriv tillbaka filer atomiskt")
    p.add_argument("--verbose", action="store_true")
    p.add_argument("--trace-sources", action="store_true", help="Alias för verbose (bakåtkompatibelt)")
    p.add_argument("--rate", type=float, default=0.15, help="(reserverad) Rate-limit till endpoints")
    p.add_argument("--early-stop", type=int, default=0, help="Stoppa efter N uppdaterade matcher (>0)")
    p.add_argument("--html-playwright", action="store_true",
                   help="Använd Playwright-renderad fallback om HTML/MC saknar meta (kräver playwright install chromium)")
    return p.parse_args()

def main():
    args = parse_args()
    verbose = bool(args.verbose or args.trace_sources)

    season: int = args.season
    minimized_path = Path(args.minimized)
    data_path = Path(args.data)
    upcoming_path = Path(args.upcoming_out)
    inplace = bool(args.inplace)
    early_stop = int(args.early_stop or 0)
    use_html_playwright = bool(args.html_playwright)

    if verbose:
        print(f"=== fill_new_from_minimized ===")
        print(f"season:        {season}")
        print(f"minimized:     {minimized_path}")
        print(f"data:          {data_path}")
        print(f"upcoming_out:  {upcoming_path}")
        print(f"inplace:       {inplace}")
        print(f"playwright:    {use_html_playwright}")
        print(f"early_stop:    {early_stop}")

    if not minimized_path.exists():
        print(f"ERR: minimized-källa saknas: {minimized_path}", file=sys.stderr)
        sys.exit(2)

    # 1) Läs källor
    minimized = load_json(minimized_path)
    data_js = load_json(data_path) if data_path.exists() else {"matches": []}
    existing_matches = ensure_matches_list(data_js)

    # 2) Hitta matchnoder i minimized
    found = collect_matches_from_minimized(minimized, verbose=verbose)

    # 3) Enrich meta per match
    updates: Dict[int, Dict[str, Any]] = {}
    changed = 0

    for idx, (mid, kv0) in enumerate(found.items(), start=1):
        kv = dict(kv0)

        # Säkra home/away-alias om de låg i flat med andra namn
        if not kv.get("home"):
            kv["home"] = safe_first(kv0.get("homeTeamName"), kv0.get("home"))
        if not kv.get("away"):
            kv["away"] = safe_first(kv0.get("visitingTeamName"), kv0.get("away"))

        # Berika med meta
        kv = enrich_match_meta(mid, season, kv, use_html_playwright=use_html_playwright, verbose=verbose)
        updates[mid] = kv

        if verbose:
            print(f"[upd] mid={mid} -> keys={sorted(kv.keys())}")

        changed += 1
        if early_stop > 0 and changed >= early_stop:
            if verbose:
                print(f"[early-stop] Reached limit {early_stop}")
            break

    # 4) Slå ihop med befintlig data
    new_list, upcoming_items = merge_into_data(existing_matches, updates, season=season, verbose=verbose)

    if inplace:
        # Backup & write
        if data_path.exists():
            shutil.copy2(data_path, data_path.with_suffix(".json.bak"))
        dump_json_atomic(data_path, {"matches": new_list})
        if verbose:
            print(f"✅ Skrev {len(new_list)} matcher → {data_path}")

        if upcoming_items:
            dump_json_atomic(upcoming_path, upcoming_items)
            if verbose:
                print(f"✅ Skrev {len(upcoming_items)} upcoming → {upcoming_path}")
        else:
            # skriv tom lista om du vill
            dump_json_atomic(upcoming_path, [])
            if verbose:
                print(f"ℹ️ Inga upcoming – skrev tom lista → {upcoming_path}")
    else:
        # Skriv till stdout istället
        print(json.dumps({
            "data": {"matches": new_list},
            "upcoming": upcoming_items,
        }, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
