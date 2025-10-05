#!/usr/bin/env python3
"""
Data status checker for Domarjävel.
Shows comprehensive statistics about match data completeness.

Usage:
    python3 Backend/scripts/check_status.py
    python3 Backend/scripts/check_status.py --season 2024
    python3 Backend/scripts/check_status.py --detailed
"""

import argparse
import json
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict, Counter

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "data.json"

def load_matches() -> List[Dict[str, Any]]:
    """Load matches from data.json."""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('matches', []) if isinstance(data, dict) else data
    except FileNotFoundError:
        print(f"❌ Data file not found: {DATA_FILE}")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in data file: {e}")
        return []

def analyze_season(matches: List[Dict[str, Any]], season: int) -> Dict[str, Any]:
    """Analyze matches for a specific season."""
    season_matches = [m for m in matches if int(m.get('season', 0)) == season]
    
    if not season_matches:
        return {'error': f'No matches found for season {season}'}
    
    # Basic counts
    total = len(season_matches)
    finished = [m for m in season_matches if m.get('status') == 'FINISHED']
    upcoming = [m for m in season_matches if m.get('status') != 'FINISHED']
    
    # Data completeness
    with_referee = [m for m in season_matches if m.get('referee')]
    with_penalty = [m for m in season_matches if m.get('penalty')]
    with_yellow = [m for m in season_matches if m.get('yellow')]
    with_red = [m for m in season_matches if m.get('red')]
    
    # Missing data (only for finished matches)
    finished_ids = {m['match_id'] for m in finished}
    missing_referee = [m for m in finished if not m.get('referee')]
    missing_penalty = [m for m in finished if not m.get('penalty')]
    missing_yellow = [m for m in finished if not m.get('yellow')]
    missing_red = [m for m in finished if not m.get('red')]
    
    # Referee statistics
    referee_counts = Counter(m.get('referee') for m in season_matches if m.get('referee'))
    
    # Team statistics
    teams = set()
    for match in season_matches:
        if match.get('home'):
            teams.add(match['home'])
        if match.get('away'):
            teams.add(match['away'])
    
    # Date range
    dates = [m.get('date') for m in season_matches if m.get('date')]
    dates = [d for d in dates if d]  # Remove None values
    
    return {
        'season': season,
        'total_matches': total,
        'finished_matches': len(finished),
        'upcoming_matches': len(upcoming),
        'teams': len(teams),
        'unique_referees': len(referee_counts),
        'data_completeness': {
            'referee': {
                'total': len(with_referee),
                'finished_with_data': len([m for m in finished if m.get('referee')]),
                'missing_from_finished': len(missing_referee),
                'percentage': round(len([m for m in finished if m.get('referee')]) / len(finished) * 100, 1) if finished else 0
            },
            'penalty': {
                'total': len(with_penalty),
                'finished_with_data': len([m for m in finished if m.get('penalty')]),
                'missing_from_finished': len(missing_penalty),
                'percentage': round(len([m for m in finished if m.get('penalty')]) / len(finished) * 100, 1) if finished else 0
            },
            'cards': {
                'yellow_total': len(with_yellow),
                'red_total': len(with_red),
                'finished_with_yellow': len([m for m in finished if m.get('yellow')]),
                'finished_with_red': len([m for m in finished if m.get('red')]),
                'missing_yellow': len(missing_yellow),
                'missing_red': len(missing_red),
                'yellow_percentage': round(len([m for m in finished if m.get('yellow')]) / len(finished) * 100, 1) if finished else 0,
                'red_percentage': round(len([m for m in finished if m.get('red')]) / len(finished) * 100, 1) if finished else 0
            }
        },
        'referee_counts': dict(referee_counts.most_common(10)),
        'date_range': {
            'first': min(dates) if dates else None,
            'last': max(dates) if dates else None
        },
        'missing_data_samples': {
            'referee': [m['match_id'] for m in missing_referee[:5]],
            'penalty': [m['match_id'] for m in missing_penalty[:5]],
            'yellow': [m['match_id'] for m in missing_yellow[:5]],
            'red': [m['match_id'] for m in missing_red[:5]]
        }
    }

def print_season_summary(analysis: Dict[str, Any], detailed: bool = False):
    """Print a formatted summary of season analysis."""
    if 'error' in analysis:
        print(f"❌ {analysis['error']}")
        return
    
    season = analysis['season']
    print(f"\n🏈 Season {season} Summary")
    print("=" * 50)
    
    # Basic stats
    print(f"📊 Match Overview:")
    print(f"   Total matches: {analysis['total_matches']}")
    print(f"   Finished: {analysis['finished_matches']}")
    print(f"   Upcoming: {analysis['upcoming_matches']}")
    print(f"   Teams: {analysis['teams']}")
    print(f"   Referees: {analysis['unique_referees']}")
    
    if analysis['date_range']['first']:
        print(f"   Date range: {analysis['date_range']['first']} → {analysis['date_range']['last']}")
    
    # Data completeness
    dc = analysis['data_completeness']
    print(f"\n📈 Data Completeness (Finished Matches):")
    print(f"   Referee: {dc['referee']['finished_with_data']}/{analysis['finished_matches']} ({dc['referee']['percentage']}%)")
    print(f"   Penalty: {dc['penalty']['finished_with_data']}/{analysis['finished_matches']} ({dc['penalty']['percentage']}%)")
    print(f"   Yellow cards: {dc['cards']['finished_with_yellow']}/{analysis['finished_matches']} ({dc['cards']['yellow_percentage']}%)")
    print(f"   Red cards: {dc['cards']['finished_with_red']}/{analysis['finished_matches']} ({dc['cards']['red_percentage']}%)")
    
    # Missing data warnings
    missing_any = (dc['referee']['missing_from_finished'] > 0 or 
                   dc['penalty']['missing_from_finished'] > 0 or
                   dc['cards']['missing_yellow'] > 0 or
                   dc['cards']['missing_red'] > 0)
    
    if missing_any:
        print(f"\n⚠️  Missing Data:")
        if dc['referee']['missing_from_finished'] > 0:
            print(f"   Referee: {dc['referee']['missing_from_finished']} matches")
        if dc['penalty']['missing_from_finished'] > 0:
            print(f"   Penalty: {dc['penalty']['missing_from_finished']} matches")
        if dc['cards']['missing_yellow'] > 0:
            print(f"   Yellow cards: {dc['cards']['missing_yellow']} matches")
        if dc['cards']['missing_red'] > 0:
            print(f"   Red cards: {dc['cards']['missing_red']} matches")
        
        print(f"\n💡 To fix missing data, run:")
        print(f"   bash Backend/scripts/update_matches.sh --season {season}")
    else:
        print(f"\n✅ All finished matches have complete data!")
    
    # Detailed information
    if detailed:
        print(f"\n👨‍⚖️ Top Referees:")
        for referee, count in list(analysis['referee_counts'].items())[:5]:
            print(f"   {referee}: {count} matches")
        
        if missing_any:
            samples = analysis['missing_data_samples']
            print(f"\n🔍 Sample Missing Data (Match IDs):")
            if samples['referee']:
                print(f"   Missing referee: {samples['referee']}")
            if samples['penalty']:
                print(f"   Missing penalty: {samples['penalty']}")
            if samples['yellow']:
                print(f"   Missing yellow: {samples['yellow']}")
            if samples['red']:
                print(f"   Missing red: {samples['red']}")

def main():
    parser = argparse.ArgumentParser(description="Check Domarjävel data status")
    parser.add_argument("--season", type=int, help="Specific season to analyze")
    parser.add_argument("--detailed", action="store_true", help="Show detailed information")
    parser.add_argument("--all-seasons", action="store_true", help="Show summary for all seasons")
    args = parser.parse_args()
    
    print("🔍 Domarjävel Data Status Check")
    print("=" * 40)
    
    matches = load_matches()
    if not matches:
        return
    
    # Get available seasons
    seasons = sorted(set(int(m.get('season', 0)) for m in matches if m.get('season')))
    print(f"📅 Available seasons: {', '.join(map(str, seasons))}")
    print(f"📁 Data file: {DATA_FILE}")
    print(f"📦 Total matches: {len(matches)}")
    
    if args.all_seasons:
        # Show summary for all seasons
        for season in seasons:
            analysis = analyze_season(matches, season)
            print_season_summary(analysis, detailed=False)
    elif args.season:
        # Show specific season
        if args.season not in seasons:
            print(f"❌ Season {args.season} not found in data")
            return
        analysis = analyze_season(matches, args.season)
        print_season_summary(analysis, detailed=args.detailed)
    else:
        # Show latest season by default
        latest_season = max(seasons)
        analysis = analyze_season(matches, latest_season)
        print_season_summary(analysis, detailed=args.detailed)
        
        if len(seasons) > 1:
            print(f"\n💡 Use --season YEAR to check other seasons")
            print(f"   Use --all-seasons to see all seasons")
            print(f"   Use --detailed for more information")

if __name__ == "__main__":
    main()