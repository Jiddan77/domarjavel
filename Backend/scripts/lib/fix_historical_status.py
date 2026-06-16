#!/usr/bin/env python3
"""
One-time fix: set status='FINISHED' on historical matches (2020-2024)
that have a score and referee but no status field.
"""
import json
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"
BACKUP_DIR = ROOT / "backups"


def has_score(match: dict) -> bool:
    score = match.get("score", "")
    return bool(score and score not in ["-", "", "0-0", "0–0"])


def has_referee(match: dict) -> bool:
    ref = match.get("referee", "")
    return bool(ref and len(ref.strip()) > 3)


def main():
    # Backup first
    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"data_before_status_fix_{ts}.json"
    shutil.copy2(DATA_FILE, backup)
    print(f"Backed up to {backup}")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    matches = data.get("matches", []) if isinstance(data, dict) else data
    fixed = 0

    for match in matches:
        if match.get("status") is None:
            if has_score(match) and has_referee(match):
                match["status"] = "FINISHED"
                fixed += 1

    if isinstance(data, dict):
        data["matches"] = matches
    else:
        data = {"matches": matches}

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Fixed {fixed} matches — set status=FINISHED")


if __name__ == "__main__":
    main()
