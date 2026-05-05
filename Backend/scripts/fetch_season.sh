#!/usr/bin/env bash
# Fetch all matches for a season from allsvenskan.se, then backfill data.
#
# Usage:
#   bash scripts/fetch_season.sh --season 2026
#   bash scripts/fetch_season.sh --season 2026 --start-id 6144000 --end-id 6146000
#   bash scripts/fetch_season.sh --season 2026 --dry-run
#
# ID ranges by season (approximate — widen if matches are missing):
#   2025: 6142500 – 6144000
#   2026: 6144000 – 6146500  (update end-id as season progresses)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PY=${PYTHON:-python3}

SEASON=2026
DRY_RUN=0
VERBOSE=0
START_ID=""
END_ID=""

# Default ID ranges per season (bash 3.2 compatible — no associative arrays)
_default_start() {
  case "$1" in
    2020) echo 6130000 ;;  2021) echo 6133000 ;; 2022) echo 6136000 ;;
    2023) echo 6138500 ;;  2024) echo 6140500 ;; 2025) echo 6142500 ;;
    2026) echo 6144000 ;;  *)    echo 6144000 ;;
  esac
}
_default_end() {
  case "$1" in
    2020) echo 6133000 ;;  2021) echo 6136000 ;; 2022) echo 6138500 ;;
    2023) echo 6140500 ;;  2024) echo 6142500 ;; 2025) echo 6144000 ;;
    2026) echo 6146500 ;;  *)    echo 6146500 ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --season)    SEASON="${2:?}"; shift 2 ;;
    --start-id)  START_ID="${2:?}"; shift 2 ;;
    --end-id)    END_ID="${2:?}"; shift 2 ;;
    --dry-run)   DRY_RUN=1; shift ;;
    --verbose|-v) VERBOSE=1; shift ;;
    --help|-h)
      sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

START_ID="${START_ID:-$(_default_start "$SEASON")}"
END_ID="${END_ID:-$(_default_end "$SEASON")}"
MINIMIZED="$ROOT_DIR/tmp/minimized_${SEASON}.json"

echo "🏈 Domarjävel – Fetch Season $SEASON"
echo "======================================"
echo "ID range: $START_ID - $END_ID"
echo "Output:   tmp/minimized_${SEASON}.json"
[[ $DRY_RUN -eq 1 ]] && echo "Mode:     DRY RUN"
echo ""

if [[ $DRY_RUN -eq 0 ]]; then
  echo "Step 1/2: Discovering match IDs from allsvenskan.se …"
  cd "$ROOT_DIR"
  if [[ "$SEASON" -ge 2026 ]]; then
    DISCOVER_CMD=(
      "$PY" "$SCRIPT_DIR/lib/discover_ids_graphql.py"
      --season "$SEASON"
      --out "$MINIMIZED"
    )
  else
    DISCOVER_CMD=(
      "$PY" "$SCRIPT_DIR/lib/discover_ids_2025.py"
      --season "$SEASON"
      --start-id "$START_ID"
      --end-id "$END_ID"
      --out "$MINIMIZED"
    )
  fi
  [[ $VERBOSE -eq 1 ]] && DISCOVER_CMD+=(--verbose)
  "${DISCOVER_CMD[@]}"

  echo ""
  echo "Step 2/2: Updating data.json and backfilling …"
  UPDATE_CMD=("$SCRIPT_DIR/update_matches.sh" --season "$SEASON")
  [[ $VERBOSE -eq 1 ]] && UPDATE_CMD+=(--verbose)
  "${UPDATE_CMD[@]}"
else
  echo "Step 1/2 (skipped - dry run): Would scan IDs $START_ID - $END_ID for season $SEASON"
  echo "Step 2/2 (skipped – dry run): Would run update_matches.sh --season $SEASON"
fi

echo ""
echo "✅ Done. Run 'bash scripts/fetch_season.sh --season $SEASON --verbose' for detailed output."
