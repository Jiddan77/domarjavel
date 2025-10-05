#!/usr/bin/env bash
set -euo pipefail

# Domarjävel – uppdatera från befintlig minimized (2025)
# Kör: bash scripts/update_from_minimized.sh --season 2025 --verbose [--skip-deps]

SEASON=2025
PY=${PYTHON:-python3}
ROOT_DEFAULT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="${ROOT:-$ROOT_DEFAULT}"
VERBOSE=0
RATE="0.10"
EARLY_STOP="0"
MINIMIZED=""
DATA_FILE=""
UPCOMING_OUT=""
SKIP_DEPS=0

warn() { echo "⚠️  $*" >&2; }
err()  { echo "❌ $*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --season)       SEASON="${2:?}"; shift 2 ;;
    --root)         ROOT="${2:?}"; shift 2 ;;
    --minimized)    MINIMIZED="${2:?}"; shift 2 ;;
    --rate)         RATE="${2:?}"; shift 2 ;;
    --early-stop)   EARLY_STOP="${2:?}"; shift 2 ;;
    --python)       PY="${2:?}"; shift 2 ;;
    --skip-deps)    SKIP_DEPS=1; shift ;;
    --verbose|-v)   VERBOSE=1; shift ;;
    *) err "Okänt argument: $1" ;;
  esac
done

# gör interna imports robusta
export PYTHONPATH="$ROOT"

DATA_FILE="${DATA_FILE:-$ROOT/data/data.json}"
MINIMIZED="${MINIMIZED:-$ROOT/tmp/minimized_${SEASON}.json}"
CHUNK_BASE="$ROOT/data/chunks/${SEASON}"
UPCOMING_OUT="${UPCOMING_OUT:-$CHUNK_BASE/upcoming.json}"

echo "=== Domarjävel – Update från minimized ==="
echo "Root:          $ROOT"
echo "Season:        $SEASON"
echo "Python:        $PY"
echo "Minimized:     ${MINIMIZED#$ROOT/}"
echo "Data:          ${DATA_FILE#$ROOT/}"
echo "Upcoming out:  ${UPCOMING_OUT#$ROOT/}"
echo "Rate:          $RATE   Early-stop: $EARLY_STOP"
[[ ${NO_DATE:-0} == 1 ]] && echo "NO_DATE:       enabled"

if [[ $SKIP_DEPS -eq 0 ]]; then
  if [[ -f "$ROOT/requirements.txt" ]]; then
    echo "➡️  Installerar beroenden via requirements.txt …"
    "$PY" -m pip install -r "$ROOT/requirements.txt"
  else
    warn "requirements.txt hittades inte – hoppar installation."
  fi
else
  echo "➡️  Hoppar installation av beroenden (--skip-deps)."
fi

[[ -f "$MINIMIZED" ]] || err "$MINIMIZED saknas. Ange --minimized eller lägg filen på plats."
[[ -s "$MINIMIZED" ]] || err "$MINIMIZED finns men är tom."
mkdir -p "$(dirname "$DATA_FILE")" "$CHUNK_BASE"

# Python-hjälpare inline: räkna ID + diff mot data.json
read -r BYTES_MINI MINI_COUNT PRE_DATA_COUNT DIFF_COUNT <<<"$("$PY" - <<'PY' "$MINIMIZED" "$DATA_FILE" "$SEASON"
import sys,json
from collections import deque
min_path, data_path, season = sys.argv[1], sys.argv[2], int(sys.argv[3])

def ids_any(js):
    seen=set(); dq=deque([js])
    def as_int(v):
        try: return int(str(v).strip())
        except: return None
    while dq:
        x=dq.popleft()
        if isinstance(x, dict):
            for k in ("match_id","id","matchId","gameId","game_id"):
                if k in x:
                    mid=as_int(x[k])
                    if mid is not None: seen.add(mid)
            dq.extend(x.values())
        elif isinstance(x, list):
            dq.extend(x)
    return seen

def load(p):
    with open(p,"r",encoding="utf-8") as fh: return json.load(fh)

import os
bytes_m = os.path.getsize(min_path)
mini = load(min_path)
mini_ids = ids_any(mini)
try:
    data = load(data_path)
    matches = data["matches"] if isinstance(data,dict) and "matches" in data else data
except FileNotFoundError:
    matches = []
in_data = {int(m["match_id"]) for m in matches if isinstance(m,dict) and str(m.get("season"))==str(season) and "match_id" in m}
pre_data_count = len(in_data)
diff = len(mini_ids - in_data)
print(bytes_m, len(mini_ids), pre_data_count, diff)
PY
)"

echo "📄 Minimized OK: ${BYTES_MINI} bytes, ${MINI_COUNT} unika ID."
echo "🧾 data.json före (säsong ${SEASON}): ${PRE_DATA_COUNT} ID."
if [[ "$VERBOSE" -eq 1 ]]; then
  echo "🔍 Nya ID i minimized (ej i data.json): ${DIFF_COUNT}"
  # lista upp till 15 ID som saknas
  "$PY" - <<'PY' "$MINIMIZED" "$DATA_FILE" "$SEASON"
import sys,json
from collections import deque
min_path, data_path, season = sys.argv[1], sys.argv[2], int(sys.argv[3])
def ids_any(js):
    seen=set(); dq=deque([js])
    def as_int(v):
        try: return int(str(v).strip())
        except: return None
    while dq:
        x=dq.popleft()
        if isinstance(x, dict):
            for k in ("match_id","id","matchId","gameId","game_id"):
                if k in x:
                    mid=as_int(x[k])
                    if mid is not None: seen.add(mid)
            dq.extend(x.values())
        elif isinstance(x, list):
            dq.extend(x)
    return seen
def load(p):
    with open(p,"r",encoding="utf-8") as fh: return json.load(fh)
mini = load(min_path)
mini_ids = ids_any(mini)
try:
    data = load(data_path)
    matches = data["matches"] if isinstance(data,dict) and "matches" in data else data
except FileNotFoundError:
    matches = []
in_data = {int(m["match_id"]) for m in matches if isinstance(m,dict) and str(m.get("season"))==str(season) and "match_id" in m}
missing = sorted(mini_ids - in_data)
print("   sample:", missing[:15])
PY
fi

# 1) Fyll nya finished + upcoming
echo "➡️  Fyller nya matcher från minimized → data.json + upcoming …"
FILL_ARGS=( "$ROOT/scripts/lib/fill_new_from_minimized_2025.py"
  --season "$SEASON"
  --minimized "$MINIMIZED"
  --data "$DATA_FILE"
  --upcoming-out "$UPCOMING_OUT"
  --inplace
  --rate "$RATE"
  --early-stop "$EARLY_STOP"
)
[[ $VERBOSE -eq 1 ]] && FILL_ARGS+=( --verbose )
"$PY" "${FILL_ARGS[@]}"

# 2) Chunks + health på domare
echo "➡️  Bygger frontend-chunks …"
"$PY" "$ROOT/scripts/lib/split_data_chunks.py" --season "$SEASON" || warn "split_data_chunks varning"

# sammanställ chunkstatus
TEAMS_DIR="$CHUNK_BASE/teams"
REFS_DIR="$CHUNK_BASE/refs"
SEASON_DIR="$CHUNK_BASE"
TEAMS_FILES=$(test -d "$TEAMS_DIR" && find "$TEAMS_DIR" -type f -name '*.json' | wc -l | tr -d ' ' || echo 0)
REFS_FILES=$(test -d "$REFS_DIR" && find "$REFS_DIR" -type f -name '*.json' | wc -l | tr -d ' ' || echo 0)
SEASON_FILES=$(test -d "$SEASON_DIR" && find "$SEASON_DIR" -maxdepth 1 -type f -name '*.json' | wc -l | tr -d ' ' || echo 0)

# räkna hur många 2025-matcher som har domare i data.json
REF_MATCHES_COUNT="$("$PY" - <<'PY' "$DATA_FILE" "$SEASON"
import sys,json
p,season=sys.argv[1],sys.argv[2]
try:
    js=json.load(open(p,'r',encoding='utf-8'))
    m = js["matches"] if isinstance(js,dict) and "matches" in js else js
except FileNotFoundError:
    m=[]
r = [x for x in m if str(x.get("season"))==str(season) and (x.get("referee") or "").strip()]
print(len(r))
PY
)"

UPCOMING_COUNT="$("$PY" - <<'PY' "$UPCOMING_OUT"
import sys,json,os
p=sys.argv[1]
if not os.path.exists(p) or os.path.getsize(p)==0:
    print(0); raise SystemExit
u=json.load(open(p,'r',encoding='utf-8'))
m=u["matches"] if isinstance(u,dict) and "matches" in u else (u if isinstance(u,list) else [])
print(len(m))
PY
)"

echo "🧩 Chunk-verifiering:"
echo "   - Teams-chunks: ${TEAMS_FILES} filer i ${TEAMS_DIR#$ROOT/}"
echo "   - Refs-chunks:  ${REFS_FILES} filer i ${REFS_DIR#$ROOT/}  (matcher med domare i data.json: ${REF_MATCHES_COUNT})"
echo "   - Övriga filer i ${SEASON_DIR#$ROOT/}: ${SEASON_FILES}"
if [[ -f "$UPCOMING_OUT" ]]; then
  echo "   - upcoming.json finns och innehåller ${UPCOMING_COUNT} matcher."
else
  warn "upcoming.json saknas!"
fi

# summering (nya matcher relaterat till minimized)
POST_DATA_COUNT="$("$PY" - <<'PY' "$DATA_FILE" "$SEASON"
import sys,json
p,season=sys.argv[1],sys.argv[2]
try:
    js=json.load(open(p,'r',encoding='utf-8'))
    m = js["matches"] if isinstance(js,dict) and "matches" in js else js
except FileNotFoundError:
    m=[]
ids={int(x["match_id"]) for x in m if isinstance(x,dict) and str(x.get("season"))==str(season) and "match_id" in x}
print(len(ids))
PY
)"
DELTA=$(( POST_DATA_COUNT - PRE_DATA_COUNT ))
echo "🎯 Klar! Nya matcher tillagda: ${DELTA}"
