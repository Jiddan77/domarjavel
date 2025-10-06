from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import json
import os
from pathlib import Path
from .chunks_api import router as chunks_router
from .database import db_manager

app = FastAPI(
    title="Dommarjävel API",
    description="Swedish football referee statistics API",
    version="1.0.0"
)

# CORS configuration
origins = os.getenv("API_CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include chunks API router
app.include_router(chunks_router, prefix="/api", tags=["chunks"])

# Database lifecycle
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Dommarjävel API...")
    try:
        import asyncio
        await asyncio.wait_for(db_manager.initialize(), timeout=30.0)
        print("✅ Startup completed successfully")
    except asyncio.TimeoutError:
        print("⚠️ Database initialization timed out, continuing with JSON fallback")
        db_manager.json_fallback = True
    except Exception as e:
        print(f"❌ Startup error: {e}")
        db_manager.json_fallback = True

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Shutting down Dommarjävel API...")
    await db_manager.close()

# Utility functions
def parse_score(score_str):
    """Parse score string handling both - and – characters"""
    if not score_str:
        return 0, 0
    # Replace en-dash with regular dash
    score_str = score_str.replace("–", "-")
    try:
        parts = score_str.split("-")
        if len(parts) == 2:
            return int(parts[0]), int(parts[1])
    except ValueError:
        pass
    return 0, 0

# Data loading
def load_data():
    data_dir = os.getenv("DATA_DIR", "data")
    data_path = Path(data_dir) / "data.json"
    
    if not data_path.exists():
        return {"matches": []}
    
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Ensure data has matches key
    if isinstance(data, list):
        return {"matches": data}
    return data

@app.get("/")
async def root():
    return {"message": "Dommarjävel API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    db_status = "connected" if db_manager.pool and not db_manager.json_fallback else "json_fallback"
    return {
        "status": "healthy", 
        "service": "dommarjavel-api",
        "database": db_status,
        "version": "1.0.0"
    }

@app.get("/index")
async def get_index():
    """Get basic API information"""
    return {
        "name": "Dommarjävel API",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/index", 
            "/matches",
            "/seasons",
            "/referees",
            "/teams",
            "/stats",
            "/leaderboard"
        ]
    }

@app.get("/matches")
async def get_matches(
    season: Optional[List[int]] = Query(None),
    referee: Optional[List[str]] = Query(None),
    team: Optional[List[str]] = Query(None),
    side: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False, alias="includeTotal")
):
    """Get matches with optional filtering"""
    return await db_manager.get_matches(
        season=season,
        referee=referee,
        team=team,
        side=side,
        limit=limit,
        offset=offset,
        include_total=include_total
    )

@app.get("/seasons")
async def get_seasons():
    """Get available seasons"""
    return await db_manager.get_seasons()

@app.get("/referees")
async def get_referees(
    season: Optional[List[int]] = Query(None),
    min_matches: int = Query(1, alias="minMatches")
):
    """Get referees with match counts"""
    return await db_manager.get_referees(season=season, min_matches=min_matches)

@app.get("/teams")
async def get_teams(
    season: Optional[List[int]] = Query(None),
    min_matches: int = Query(1, alias="minMatches")
):
    """Get teams with match counts"""
    data = load_data()
    matches = data.get("matches", [])
    
    # Filter by season if provided
    if season:
        matches = [m for m in matches if m.get("season") in season]
    
    teams = {}
    for match in matches:
        home = match.get("home")
        away = match.get("away")
        
        for team in [home, away]:
            if team:
                if team not in teams:
                    teams[team] = {"name": team, "matches": 0}
                teams[team]["matches"] += 1
    
    # Filter by minimum matches
    filtered_teams = [team for team in teams.values() if team["matches"] >= min_matches]
    
    return sorted(filtered_teams, key=lambda x: x["matches"], reverse=True)

@app.get("/stats")
async def get_stats(
    season: Optional[List[int]] = Query(None),
    referee: Optional[List[str]] = Query(None),
    team: Optional[List[str]] = Query(None),
    side: Optional[str] = Query(None)
):
    """Get statistics for filtered matches"""
    data = load_data()
    matches = data.get("matches", [])
    
    # Apply same filters as matches endpoint
    filtered_matches = matches
    
    if season:
        filtered_matches = [m for m in filtered_matches if m.get("season") in season]
    
    if referee:
        filtered_matches = [m for m in filtered_matches if m.get("referee") in referee]
    
    if team:
        if side == "home":
            filtered_matches = [m for m in filtered_matches if m.get("home") in team]
        elif side == "away":
            filtered_matches = [m for m in filtered_matches if m.get("away") in team]
        else:
            filtered_matches = [m for m in filtered_matches if m.get("home") in team or m.get("away") in team]
    
    # Calculate statistics
    total_matches = len(filtered_matches)
    total_yellow = sum(sum(parse_score(m.get("yellow", "0-0"))) for m in filtered_matches)
    total_red = sum(sum(parse_score(m.get("red", "0-0"))) for m in filtered_matches)
    total_penalty = sum(sum(parse_score(m.get("penalty", "0-0"))) for m in filtered_matches)
    
    avg_yellow = total_yellow / total_matches if total_matches > 0 else 0
    avg_red = total_red / total_matches if total_matches > 0 else 0
    avg_penalty = total_penalty / total_matches if total_matches > 0 else 0
    
    return {
        "totalMatches": total_matches,
        "totalYellow": total_yellow,
        "totalRed": total_red,
        "totalPenalty": total_penalty,
        "avgYellow": round(avg_yellow, 2),
        "avgRed": round(avg_red, 2),
        "avgPenalty": round(avg_penalty, 2)
    }

@app.get("/leaderboard")
async def get_leaderboard(
    season: Optional[List[int]] = Query(None),
    team: Optional[List[str]] = Query(None),
    limit: int = Query(10),
    min_matches: int = Query(1, alias="minMatches"),
    min_team_matches: int = Query(1, alias="minTeamMatches")
):
    """Get referee leaderboard by cards per match"""
    data = load_data()
    matches = data.get("matches", [])
    
    # Filter matches
    filtered_matches = matches
    
    if season:
        filtered_matches = [m for m in filtered_matches if m.get("season") in season]
    
    if team:
        filtered_matches = [m for m in filtered_matches if m.get("home") in team or m.get("away") in team]
    
    # Calculate referee stats
    referee_stats = {}
    for match in filtered_matches:
        ref = match.get("referee")
        if not ref:
            continue
            
        if ref not in referee_stats:
            referee_stats[ref] = {
                "name": ref,
                "matches": 0,
                "totalYellow": 0,
                "totalRed": 0,
                "totalPenalty": 0
            }
        
        referee_stats[ref]["matches"] += 1
        
        # Parse card counts using the same parse_score function
        yellow_home, yellow_away = parse_score(match.get("yellow", "0-0"))
        red_home, red_away = parse_score(match.get("red", "0-0"))
        penalty_home, penalty_away = parse_score(match.get("penalty", "0-0"))
        
        referee_stats[ref]["totalYellow"] += yellow_home + yellow_away
        referee_stats[ref]["totalRed"] += red_home + red_away
        referee_stats[ref]["totalPenalty"] += penalty_home + penalty_away
    
    # Filter and calculate averages
    leaderboard = []
    for ref_data in referee_stats.values():
        if ref_data["matches"] >= min_matches:
            ref_data["avgYellow"] = round(ref_data["totalYellow"] / ref_data["matches"], 2)
            ref_data["avgRed"] = round(ref_data["totalRed"] / ref_data["matches"], 2)
            ref_data["avgPenalty"] = round(ref_data["totalPenalty"] / ref_data["matches"], 2)
            ref_data["avgTotal"] = round((ref_data["totalYellow"] + ref_data["totalRed"] + ref_data["totalPenalty"]) / ref_data["matches"], 2)
            leaderboard.append(ref_data)
    
    # Sort by total cards per match
    leaderboard.sort(key=lambda x: x["avgTotal"], reverse=True)
    
    return leaderboard[:limit]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)