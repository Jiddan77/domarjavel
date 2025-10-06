"""
Database configuration and connection management.
"""

import os
import asyncpg
from typing import Optional, List, Dict, Any
import json
from pathlib import Path

class DatabaseManager:
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        self.pool: Optional[asyncpg.Pool] = None
        
        # Fallback to JSON file if no database
        self.json_fallback = not self.database_url
        if self.json_fallback:
            self.data_file = Path(__file__).parent.parent / 'data' / 'data.json'
    
    async def initialize(self):
        """Initialize database connection pool."""
        if self.database_url:
            try:
                self.pool = await asyncpg.create_pool(
                    self.database_url,
                    min_size=1,
                    max_size=10,
                    command_timeout=60
                )
                print("✅ Database pool initialized")
            except Exception as e:
                print(f"❌ Database connection failed: {e}")
                print("🔄 Falling back to JSON file")
                self.json_fallback = True
        else:
            print("ℹ️ No DATABASE_URL found, using JSON file")
    
    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
    
    def _load_json_data(self) -> List[Dict[str, Any]]:
        """Load data from JSON file as fallback."""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get('matches', []) if isinstance(data, dict) else data
        except Exception as e:
            print(f"❌ Error loading JSON data: {e}")
            return []
    
    async def get_matches(self, 
                         season: Optional[List[int]] = None,
                         referee: Optional[List[str]] = None,
                         team: Optional[List[str]] = None,
                         side: Optional[str] = None,
                         limit: int = 100,
                         offset: int = 0,
                         include_total: bool = False) -> Dict[str, Any]:
        """Get matches with filtering and pagination."""
        
        if self.json_fallback:
            return await self._get_matches_json(season, referee, team, side, limit, offset, include_total)
        
        # Database query
        conditions = []
        params = []
        param_count = 0
        
        # Build WHERE conditions
        if season:
            param_count += 1
            conditions.append(f"season = ANY(${param_count})")
            params.append(season)
        
        if referee:
            param_count += 1
            conditions.append(f"referee = ANY(${param_count})")
            params.append(referee)
        
        if team:
            if side == "home":
                param_count += 1
                conditions.append(f"home_team = ANY(${param_count})")
                params.append(team)
            elif side == "away":
                param_count += 1
                conditions.append(f"away_team = ANY(${param_count})")
                params.append(team)
            else:
                param_count += 1
                conditions.append(f"(home_team = ANY(${param_count}) OR away_team = ANY(${param_count}))")
                params.append(team)
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        try:
            async with self.pool.acquire() as conn:
                # Get total count if requested
                total = 0
                if include_total:
                    count_query = f"SELECT COUNT(*) FROM matches{where_clause}"
                    total = await conn.fetchval(count_query, *params)
                
                # Get matches with pagination
                query = f"""
                    SELECT match_id, season, date, date_iso, datetime_str as datetime,
                           referee, home_team as home, away_team as away, score,
                           yellow_cards as yellow, red_cards as red, penalties as penalty,
                           status, extended_status as "extendedStatus"
                    FROM matches{where_clause}
                    ORDER BY date_iso DESC NULLS LAST, match_id DESC
                    LIMIT ${param_count + 1} OFFSET ${param_count + 2}
                """
                params.extend([limit, offset])
                
                rows = await conn.fetch(query, *params)
                matches = [dict(row) for row in rows]
                
                if include_total:
                    return {"matches": matches, "total": total}
                return matches
                
        except Exception as e:
            print(f"❌ Database query error: {e}")
            # Fallback to JSON
            return await self._get_matches_json(season, referee, team, side, limit, offset, include_total)
    
    async def _get_matches_json(self, season, referee, team, side, limit, offset, include_total):
        """Fallback method using JSON data."""
        matches = self._load_json_data()
        
        # Apply filters
        if season:
            matches = [m for m in matches if m.get("season") in season]
        
        if referee:
            matches = [m for m in matches if m.get("referee") in referee]
        
        if team:
            if side == "home":
                matches = [m for m in matches if m.get("home") in team]
            elif side == "away":
                matches = [m for m in matches if m.get("away") in team]
            else:
                matches = [m for m in matches if m.get("home") in team or m.get("away") in team]
        
        total = len(matches)
        
        # Apply pagination
        paginated_matches = matches[offset:offset + limit]
        
        if include_total:
            return {"matches": paginated_matches, "total": total}
        return paginated_matches
    
    async def get_seasons(self) -> List[Dict[str, Any]]:
        """Get available seasons with match counts."""
        
        if self.json_fallback:
            matches = self._load_json_data()
            seasons = {}
            for match in matches:
                season = match.get("season")
                if season:
                    seasons[season] = seasons.get(season, 0) + 1
            
            return [{"season": s, "matches": count} for s, count in sorted(seasons.items())]
        
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT season, COUNT(*) as matches 
                    FROM matches 
                    GROUP BY season 
                    ORDER BY season DESC
                """)
                return [{"season": row["season"], "matches": row["matches"]} for row in rows]
        except Exception as e:
            print(f"❌ Database query error: {e}")
            return await self.get_seasons()  # Fallback to JSON
    
    async def get_referees(self, season: Optional[List[int]] = None, min_matches: int = 1) -> List[Dict[str, Any]]:
        """Get referees with match counts."""
        
        if self.json_fallback:
            matches = self._load_json_data()
            
            if season:
                matches = [m for m in matches if m.get("season") in season]
            
            referees = {}
            for match in matches:
                ref = match.get("referee")
                if ref:
                    referees[ref] = referees.get(ref, 0) + 1
            
            return [{"name": name, "matches": count} 
                   for name, count in referees.items() 
                   if count >= min_matches]
        
        try:
            conditions = []
            params = []
            
            if season:
                conditions.append("season = ANY($1)")
                params.append(season)
            
            where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
            
            async with self.pool.acquire() as conn:
                query = f"""
                    SELECT referee as name, COUNT(*) as matches 
                    FROM matches{where_clause}
                    WHERE referee IS NOT NULL
                    GROUP BY referee 
                    HAVING COUNT(*) >= ${len(params) + 1}
                    ORDER BY matches DESC
                """
                params.append(min_matches)
                
                rows = await conn.fetch(query, *params)
                return [{"name": row["name"], "matches": row["matches"]} for row in rows]
        except Exception as e:
            print(f"❌ Database query error: {e}")
            return await self.get_referees(season, min_matches)

# Global database manager instance
db_manager = DatabaseManager()