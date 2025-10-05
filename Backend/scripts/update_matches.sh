#!/usr/bin/env bash
# Simple wrapper script for updating matches with complete data backfill
# Usage: 
#   bash scripts/update_matches.sh                    # Update 2025 season
#   bash scripts/update_matches.sh --dry-run          # See what would be updated
#   bash scripts/update_matches.sh --season 2024      # Update different season

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
SEASON=2025
DRY_RUN=0
VERBOSE=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --season)
      SEASON="${2:?Season required}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --verbose|-v)
      VERBOSE=1
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--season YEAR] [--dry-run] [--verbose]"
      echo ""
      echo "Options:"
      echo "  --season YEAR    Season to update (default: 2025)"
      echo "  --dry-run        Show what would be updated without making changes"
      echo "  --verbose        Show detailed output"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Use --help for usage information" >&2
      exit 1
      ;;
  esac
done

echo "🏈 Domarjävel Match Updater"
echo "=========================="
echo "Season: $SEASON"
echo "Root: $ROOT_DIR"

# Check if minimized file exists
MINIMIZED_FILE="$ROOT_DIR/tmp/minimized_${SEASON}.json"
if [[ ! -f "$MINIMIZED_FILE" ]]; then
  echo "❌ Minimized file not found: $MINIMIZED_FILE"
  echo "   Please ensure you have the minimized data file for season $SEASON"
  exit 1
fi

echo "Minimized file: ${MINIMIZED_FILE#$ROOT_DIR/}"

# Build command
CMD=(python3 "$SCRIPT_DIR/update_and_backfill.py" --season "$SEASON")

if [[ $DRY_RUN -eq 1 ]]; then
  CMD+=(--dry-run)
  echo "Mode: DRY RUN (no changes will be made)"
else
  echo "Mode: LIVE UPDATE (changes will be made)"
fi

if [[ $VERBOSE -eq 1 ]]; then
  CMD+=(--verbose)
fi

echo ""
echo "🚀 Starting update process..."

# Change to root directory and run the command
cd "$ROOT_DIR"
exec "${CMD[@]}"