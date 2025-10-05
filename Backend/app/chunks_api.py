"""
Enhanced API endpoints that leverage pre-computed chunks for better performance.
These endpoints can serve data directly from chunks when possible, falling back to
dynamic filtering when needed.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
import json
from pathlib import Path

router = APIRouter()

# Paths
ROOT = Path(__file__).resolve().parents[1]
CHUNKS_DIR = ROOT / "data" / "chunks"
DATA_FILE = ROOT / "data" / "data.json"

def slugify(name: str) -> str:
    """Convert name to URL-safe slug."""
    import re
    name = name.lower().strip()
    name = name.replace('å', 'a').replace('ä', 'a').replace('ö', 'o')
    name = re.sub(r'[^a-z0-9]+', '_', name)
    return name.strip('_')

def load_chunk(path: Path) -> Optional[Dict[str, Any]]:
    """Load a chunk file if it exists."""
    try:
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return None

def load_data() -> Dict[str, Any]:
    """Load main data file."""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.get("/chunks/seasons")
async def get_seasons_summary():
    """Get quick summary of all seasons from chunks."""
    summary_path = CHUNKS_DIR / "seasons_summary.json"
    summary = load_chunk(summary_path)
    
    if summary:
        return summary
    
    # Fallback to dynamic calculation
    data = load_data()
    matches = data.get("matches", [])
    
    seasons = {}
    for match in matches:
        season = match.get("season")
        if season:
            if season not in seasons:
                seasons[season] = {"total_matches": 0, "finished_matches": 0, "upcoming_matches": 0}
            
            seasons[season]["total_matches"] += 1
            if match.get("status") == "FINISHED":
                seasons[season]["finished_matches"] += 1
            else:
                seasons[season]["upcoming_matches"] += 1
    
    return seasons

@router.get("/chunks/season/{season}/stats")
async def get_season_stats(season: int):
    """Get pre-computed season statistics."""
    stats_path = CHUNKS_DIR / str(season) / "stats.json"
    stats = load_chunk(stats_path)
    
    if stats:
        return stats
    
    raise HTTPException(status_code=404, detail=f"Statistics not found for season {season}")

@router.get("/chunks/season/{season}/teams")
async def get_season_team_stats(season: int):
    """Get pre-computed team statistics for a season."""
    stats_path = CHUNKS_DIR / str(season) / "team_stats.json"
    stats = load_chunk(stats_path)
    
    if stats:
        return stats
    
    raise HTTPException(status_code=404, detail=f"Team statistics not found for season {season}")

@router.get("/chunks/season/{season}/referees")
async def get_season_referee_stats(season: int):
    """Get pre-computed referee statistics for a season."""
    stats_path = CHUNKS_DIR / str(season) / "referee_stats.json"
    stats = load_chunk(stats_path)
    
    if stats:
        return stats
    
    raise HTTPException(status_code=404, detail=f"Referee statistics not found for season {season}")

@router.get("/chunks/season/{season}/team/{team_name}")
async def get_team_matches(
    season: int, 
    team_name: str,
    side: Optional[str] = Query(None, regex="^(home|away)$"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get matches for a specific team from chunks."""
    team_slug = slugify(team_name)
    
    # Determine which chunk to load
    if side == "home":
        chunk_path = CHUNKS_DIR / str(season) / "teams" / f"{team_slug}_home.json"
    elif side == "away":
        chunk_path = CHUNKS_DIR / str(season) / "teams" / f"{team_slug}_away.json"
    else:
        chunk_path = CHUNKS_DIR / str(season) / "teams" / f"{team_slug}.json"
    
    chunk_data = load_chunk(chunk_path)
    
    if chunk_data:
        matches = chunk_data.get("matches", [])
        total = len(matches)
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated_matches = matches[start_idx:end_idx]
        
        return {
            "matches": paginated_matches,
            "total": total,
            "team": team_name,
            "side": side,
            "season": season
        }
    
    raise HTTPException(status_code=404, detail=f"No matches found for team {team_name} in season {season}")

@router.get("/chunks/season/{season}/referee/{referee_name}")
async def get_referee_matches(
    season: int,
    referee_name: str,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get matches for a specific referee from chunks."""
    referee_slug = slugify(referee_name)
    chunk_path = CHUNKS_DIR / str(season) / "referees" / f"{referee_slug}.json"
    
    chunk_data = load_chunk(chunk_path)
    
    if chunk_data:
        matches = chunk_data.get("matches", [])
        total = len(matches)
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated_matches = matches[start_idx:end_idx]
        
        return {
            "matches": paginated_matches,
            "total": total,
            "referee": referee_name,
            "season": season
        }
    
    raise HTTPException(status_code=404, detail=f"No matches found for referee {referee_name} in season {season}")

@router.get("/chunks/season/{season}/matches")
async def get_season_matches(
    season: int,
    status: Optional[str] = Query(None, regex="^(finished|upcoming|all)$"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get matches for a season from chunks."""
    
    # Determine which chunk to load
    if status == "finished":
        chunk_path = CHUNKS_DIR / str(season) / "finished.json"
    elif status == "upcoming":
        chunk_path = CHUNKS_DIR / str(season) / "upcoming.json"
    else:
        chunk_path = CHUNKS_DIR / str(season) / "all.json"
    
    chunk_data = load_chunk(chunk_path)
    
    if chunk_data:
        matches = chunk_data.get("matches", [])
        total = len(matches)
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated_matches = matches[start_idx:end_idx]
        
        return {
            "matches": paginated_matches,
            "total": total,
            "season": season,
            "status": status or "all"
        }
    
    raise HTTPException(status_code=404, detail=f"No matches found for season {season}")

@router.get("/chunks/index")
async def get_global_index():
    """Get global index with all available seasons, teams, and referees."""
    index_path = CHUNKS_DIR / "index.json"
    index = load_chunk(index_path)
    
    if index:
        return index
    
    raise HTTPException(status_code=404, detail="Global index not found")

@router.post("/chunks/rebuild")
async def rebuild_chunks(season: Optional[int] = None):
    """Rebuild chunks for a specific season or all seasons."""
    import subprocess
    import sys
    
    try:
        script_path = ROOT / "scripts" / "lib" / "create_optimized_chunks.py"
        
        if season:
            cmd = [sys.executable, str(script_path), "--season", str(season)]
        else:
            cmd = [sys.executable, str(script_path), "--all-seasons"]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Chunks rebuilt successfully for {'season ' + str(season) if season else 'all seasons'}",
                "output": result.stdout
            }
        else:
            return {
                "success": False,
                "message": "Failed to rebuild chunks",
                "error": result.stderr
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rebuilding chunks: {str(e)}")

# Health check endpoint
@router.get("/chunks/health")
async def chunks_health():
    """Check if chunk system is working properly."""
    index_path = CHUNKS_DIR / "index.json"
    index = load_chunk(index_path)
    
    if not index:
        return {
            "status": "unhealthy",
            "message": "Global index not found",
            "recommendation": "Run chunk rebuild"
        }
    
    # Check if we have chunks for the latest season
    seasons = index.get("seasons", [])
    if not seasons:
        return {
            "status": "unhealthy", 
            "message": "No seasons found in index"
        }
    
    latest_season = max(seasons)
    season_dir = CHUNKS_DIR / str(latest_season)
    
    required_files = ["all.json", "finished.json", "stats.json"]
    missing_files = [f for f in required_files if not (season_dir / f).exists()]
    
    if missing_files:
        return {
            "status": "degraded",
            "message": f"Missing chunk files for season {latest_season}: {missing_files}",
            "recommendation": f"Run chunk rebuild for season {latest_season}"
        }
    
    return {
        "status": "healthy",
        "latest_season": latest_season,
        "total_seasons": len(seasons),
        "last_updated": index.get("last_updated")
    }