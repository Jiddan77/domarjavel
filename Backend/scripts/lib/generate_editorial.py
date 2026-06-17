#!/usr/bin/env python3
"""
Generate AI editorial copy for the site's hero texts.
Reads Backend/data/data.json, calls Gemini API, writes Backend/data/chunks/editorial.json.
Requires GEMINI_API_KEY environment variable.
"""

import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"
OUT_FILE = ROOT / "data" / "chunks" / "editorial.json"

GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def parse_pair(s):
    if not s:
        return 0, 0
    parts = str(s).split("–")
    if len(parts) != 2:
        return 0, 0
    try:
        return int(parts[0]), int(parts[1])
    except ValueError:
        return 0, 0


def compute_stats(matches):
    finished = [m for m in matches if m.get("referee") and m.get("score")]

    season_acc = defaultdict(lambda: {"yellow": 0, "red": 0, "pen": 0, "count": 0})
    ref_acc = defaultdict(lambda: {"yellow": 0, "count": 0})

    for m in finished:
        season = m.get("season")
        ref = (m.get("referee") or "").strip().title()
        yh, ya = parse_pair(m.get("yellow"))
        rh, ra = parse_pair(m.get("red"))
        ph, pa = parse_pair(m.get("penalty"))

        season_acc[season]["yellow"] += yh + ya
        season_acc[season]["red"] += rh + ra
        season_acc[season]["pen"] += ph + pa
        season_acc[season]["count"] += 1

        if ref:
            ref_acc[ref]["yellow"] += yh + ya
            ref_acc[ref]["count"] += 1

    seasons_sorted = sorted(season_acc)
    league_trends = []
    for s in seasons_sorted:
        st = season_acc[s]
        n = st["count"] or 1
        league_trends.append({
            "season": s,
            "avgYellow": round(st["yellow"] / n, 2),
            "avgRed": round(st["red"] / n, 3),
            "avgPen": round(st["pen"] / n, 3),
            "matches": st["count"],
        })

    active_refs = [
        {"name": name, "avgYellow": round(v["yellow"] / v["count"], 2), "matches": v["count"]}
        for name, v in ref_acc.items()
        if v["count"] >= 8 and name
    ]

    # Last season with ≥150 finished matches = fully completed
    completed = [s for s in seasons_sorted if season_acc[s]["count"] >= 150]
    last_completed = max(completed) if completed else max(seasons_sorted)

    return {
        "league_trends": league_trends,
        "active_refs": sorted(active_refs, key=lambda r: r["avgYellow"], reverse=True),
        "last_completed_season": last_completed,
    }


def build_prompt(stats):
    trends = stats["league_trends"]
    active_refs = stats["active_refs"]
    last = stats["last_completed_season"]

    trend_lines = "\n".join(
        f"  {t['season']}: {t['avgYellow']} gula/match, {t['avgRed']} röda/match, "
        f"{t['avgPen']} straffar/match ({t['matches']} matcher)"
        for t in trends
    )

    top5_strict = "\n".join(
        f"  {r['name']}: {r['avgYellow']} gula/match ({r['matches']} matcher)"
        for r in active_refs[:5]
    )
    top5_lenient = "\n".join(
        f"  {r['name']}: {r['avgYellow']} gula/match ({r['matches']} matcher)"
        for r in sorted(active_refs, key=lambda r: r["avgYellow"])[:5]
    )

    last_trend = next((t for t in trends if t["season"] == last), None)
    avg_yellow = last_trend["avgYellow"] if last_trend else "?"
    num_refs = len(active_refs)

    return f"""Du är sportjournalist för Domarjävel, en analyssite om Allsvenskan-domare.
Skriv tre korta textstycken på svenska baserat på statistiken nedan.
Var faktabaserad, träffsäker och kortfattad — journalistisk ton.

STATISTIK:
Säsongstrender (ligasnitt per match, avslutade matcher):
{trend_lines}

Aktiva domare med minst 8 matcher, strängast till snällast:
{top5_strict}

Snällaste domare:
{top5_lenient}

Senast avslutad säsong: {last} · {avg_yellow} gula/match · {num_refs} aktiva domare

PRODUCERA EXAKT DETTA JSON (ingen annan text, inga kommentarer):
{{
  "headline": "<En mening. Börja med 'Domarna delade ut {avg_yellow} gula kort per match förra säsongen —' följt av en historisk jämförelse med de senaste åren. Max 20 ord.>",
  "lede": "<En mening om domarkårens trend och de två mest extrema domarna (strängaste och snällaste). Max 35 ord.>",
  "trend_analysis": "<Två meningar om hur kortstatistiken rört sig de senaste säsongerna. Max 40 ord totalt.>"
}}"""


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set — skipping editorial generation", file=sys.stderr)
        sys.exit(0)

    print("📰 Generating editorial copy …")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw = json.load(f)
    matches = raw.get("matches", raw) if isinstance(raw, dict) else raw

    stats = compute_stats(matches)
    prompt = build_prompt(stats)

    resp = requests.post(
        GEMINI_URL,
        params={"key": api_key},
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=30,
    )
    resp.raise_for_status()
    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        print(f"Could not parse JSON from response:\n{text}", file=sys.stderr)
        sys.exit(1)

    editorial = json.loads(m.group())
    editorial["generated_at"] = datetime.now(timezone.utc).isoformat()
    editorial["season"] = stats["last_completed_season"]

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(editorial, f, ensure_ascii=False, indent=2)

    print(f"✅ Editorial written to {OUT_FILE.relative_to(ROOT)}")
    print(f"   Headline: {editorial['headline'][:80]}")


if __name__ == "__main__":
    main()
