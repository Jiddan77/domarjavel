#!/usr/bin/env python3
"""
Migration script to move data from JSON to PostgreSQL.
Run this after deploying to Railway/Render with PostgreSQL.
"""

import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import asyncpg
import asyncio
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(str(Path(__file__).parent.parent))

async def create_tables(conn):
    """Create the matches table with proper schema."""
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS matches (
            id SERIAL PRIMARY KEY,
            match_id INTEGER UNIQUE NOT NULL,
            season INTEGER NOT NULL,
            date TEXT,
            date_iso TIMESTAMP,
            datetime_str TEXT,
            referee TEXT,
            home_team TEXT NOT NULL,
            away_team TEXT NOT NULL,
            score TEXT,
            yellow_cards TEXT,
            red_cards TEXT,
            penalties TEXT,
            status TEXT,
            extended_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    
    # Create indexes for better performance
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_referee ON matches(referee);')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team);')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team);')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_match_id ON matches(match_id);')
    
    print("✅ Database tables created successfully")

async def migrate_matches(conn, matches_data: List[Dict[str, Any]]):
    """Migrate match data from JSON to PostgreSQL."""
    
    print(f"🔄 Migrating {len(matches_data)} matches...")
    
    # Prepare the insert statement
    insert_query = '''
        INSERT INTO matches (
            match_id, season, date, date_iso, datetime_str, referee,
            home_team, away_team, score, yellow_cards, red_cards, 
            penalties, status, extended_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (match_id) DO UPDATE SET
            season = EXCLUDED.season,
            date = EXCLUDED.date,
            date_iso = EXCLUDED.date_iso,
            datetime_str = EXCLUDED.datetime_str,
            referee = EXCLUDED.referee,
            home_team = EXCLUDED.home_team,
            away_team = EXCLUDED.away_team,
            score = EXCLUDED.score,
            yellow_cards = EXCLUDED.yellow_cards,
            red_cards = EXCLUDED.red_cards,
            penalties = EXCLUDED.penalties,
            status = EXCLUDED.status,
            extended_status = EXCLUDED.extended_status,
            updated_at = CURRENT_TIMESTAMP;
    '''
    
    migrated_count = 0
    error_count = 0
    
    for match in matches_data:
        try:
            # Parse date_iso if it exists
            date_iso = None
            if match.get('date_iso'):
                try:
                    date_iso = datetime.fromisoformat(match['date_iso'].replace('Z', '+00:00'))
                except:
                    date_iso = None
            
            await conn.execute(
                insert_query,
                match.get('match_id'),
                match.get('season'),
                match.get('date'),
                date_iso,
                match.get('datetime'),
                match.get('referee'),
                match.get('home'),
                match.get('away'),
                match.get('score'),
                match.get('yellow'),
                match.get('red'),
                match.get('penalty'),
                match.get('status'),
                match.get('extendedStatus')
            )
            migrated_count += 1
            
            if migrated_count % 100 == 0:
                print(f"   Migrated {migrated_count} matches...")
                
        except Exception as e:
            error_count += 1
            print(f"   Error migrating match {match.get('match_id', 'unknown')}: {e}")
    
    print(f"✅ Migration complete: {migrated_count} matches migrated, {error_count} errors")
    return migrated_count, error_count

async def verify_migration(conn):
    """Verify the migration was successful."""
    
    # Count total matches
    total_matches = await conn.fetchval('SELECT COUNT(*) FROM matches;')
    print(f"📊 Total matches in database: {total_matches}")
    
    # Count by season
    seasons = await conn.fetch('SELECT season, COUNT(*) as count FROM matches GROUP BY season ORDER BY season;')
    print("📅 Matches by season:")
    for season_row in seasons:
        print(f"   {season_row['season']}: {season_row['count']} matches")
    
    # Count referees
    referee_count = await conn.fetchval('SELECT COUNT(DISTINCT referee) FROM matches WHERE referee IS NOT NULL;')
    print(f"👨‍⚖️ Unique referees: {referee_count}")
    
    # Count teams
    team_count = await conn.fetchval('''
        SELECT COUNT(DISTINCT team) FROM (
            SELECT home_team as team FROM matches 
            UNION 
            SELECT away_team as team FROM matches
        ) teams WHERE team IS NOT NULL;
    ''')
    print(f"⚽ Unique teams: {team_count}")

async def main():
    """Main migration function."""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        print("   Set it to your PostgreSQL connection string")
        return
    
    # Load JSON data
    data_file = Path(__file__).parent.parent / 'data' / 'data.json'
    if not data_file.exists():
        print(f"❌ Data file not found: {data_file}")
        return
    
    print(f"📁 Loading data from {data_file}")
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    matches = data.get('matches', []) if isinstance(data, dict) else data
    print(f"📊 Found {len(matches)} matches to migrate")
    
    # Connect to database
    print(f"🔌 Connecting to database...")
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Database connection successful")
        
        # Create tables
        await create_tables(conn)
        
        # Migrate data
        migrated, errors = await migrate_matches(conn, matches)
        
        # Verify migration
        await verify_migration(conn)
        
        print(f"\n🎉 Migration completed successfully!")
        print(f"   Migrated: {migrated} matches")
        print(f"   Errors: {errors}")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("   Make sure DATABASE_URL is correct and database is accessible")
    finally:
        if 'conn' in locals():
            await conn.close()

if __name__ == "__main__":
    asyncio.run(main())