#!/usr/bin/env python3
"""
Enhanced chunking system for optimal frontend performance.
Creates pre-computed chunks for common filter combinations.
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
from collections import defaultdict, Counter

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "data.json"

def load_matches() -> List[Dict[str, Any]]:
    """Load matches from data.json."""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('matches', []) if isinstance(data, dict) else data

def save_json(path: Path, data: Any) -> None:
    """Save JSON data to file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def slugify(name: str) -> str:
    """Convert name to URL-safe slug."""
    import hashlib
    import re
    name = name.lower().strip()
    # Handle Swedish characters
    name = name.replace('å', 'a').replace('ä', 'a').replace('ö', 'o')
    name = re.sub(r'[^a-z0-9]+', '_', name)
    slug = name.strip('_')
    # Guard against oversized/garbled input blowing past OS filename limits
    if len(slug) > 100:
        digest = hashlib.sha1(slug.encode('utf-8')).hexdigest()[:8]
        slug = f"{slug[:80]}_{digest}"
    return slug

def create_season_chunks(matches: List[Dict[str, Any]], season: int, base_dir: Path):
    """Create comprehensive chunks for a season."""
    season_matches = [m for m in matches if m.get('season') == season]
    season_dir = base_dir / str(season)
    
    print(f"Creating chunks for season {season} ({len(season_matches)} matches)")
    
    # 1. Basic season files
    finished_matches = [m for m in season_matches if m.get('status') == 'FINISHED']
    upcoming_matches = [m for m in season_matches if m.get('status') != 'FINISHED']
    
    save_json(season_dir / 'all.json', {'matches': season_matches, 'total': len(season_matches)})
    save_json(season_dir / 'finished.json', {'matches': finished_matches, 'total': len(finished_matches)})
    save_json(season_dir / 'upcoming.json', {'matches': upcoming_matches, 'total': len(upcoming_matches)})
    
    # 2. Team-based chunks
    teams_dir = season_dir / 'teams'
    team_matches = defaultdict(list)
    team_home_matches = defaultdict(list)
    team_away_matches = defaultdict(list)
    
    for match in season_matches:
        home = match.get('home')
        away = match.get('away')
        
        if home:
            slug = slugify(home)
            team_matches[slug].append(match)
            team_home_matches[slug].append(match)
            
        if away:
            slug = slugify(away)
            team_matches[slug].append(match)
            team_away_matches[slug].append(match)
    
    # Save team chunks
    for team_slug, matches_list in team_matches.items():
        save_json(teams_dir / f'{team_slug}.json', {
            'matches': matches_list, 
            'total': len(matches_list)
        })
        save_json(teams_dir / f'{team_slug}_home.json', {
            'matches': team_home_matches[team_slug], 
            'total': len(team_home_matches[team_slug])
        })
        save_json(teams_dir / f'{team_slug}_away.json', {
            'matches': team_away_matches[team_slug], 
            'total': len(team_away_matches[team_slug])
        })
    
    # 3. Referee-based chunks
    refs_dir = season_dir / 'referees'
    referee_matches = defaultdict(list)
    
    for match in finished_matches:  # Only finished matches have referees
        referee = match.get('referee')
        if referee:
            slug = slugify(referee)
            referee_matches[slug].append(match)
    
    for ref_slug, matches_list in referee_matches.items():
        save_json(refs_dir / f'{ref_slug}.json', {
            'matches': matches_list, 
            'total': len(matches_list)
        })
    
    # 4. Pre-computed statistics
    stats = compute_season_stats(season_matches, finished_matches)
    save_json(season_dir / 'stats.json', stats)
    
    # 5. Team statistics
    team_stats = compute_team_stats(season_matches, finished_matches)
    save_json(season_dir / 'team_stats.json', team_stats)
    
    # 6. Referee statistics  
    referee_stats = compute_referee_stats(finished_matches)
    save_json(season_dir / 'referee_stats.json', referee_stats)
    
    return {
        'season': season,
        'total_matches': len(season_matches),
        'finished_matches': len(finished_matches),
        'upcoming_matches': len(upcoming_matches),
        'teams': len(team_matches),
        'referees': len(referee_matches)
    }

def compute_season_stats(all_matches: List[Dict], finished_matches: List[Dict]) -> Dict:
    """Compute comprehensive season statistics."""
    def parse_score(score_str: str) -> Tuple[int, int]:
        if not score_str or score_str == 'null':
            return 0, 0
        try:
            parts = score_str.split('–')
            return int(parts[0]), int(parts[1])
        except:
            return 0, 0
    
    total_matches = len(finished_matches)
    if total_matches == 0:
        return {'total_matches': 0}
    
    # Card statistics
    total_yellow = sum(sum(parse_score(m.get('yellow', '0–0'))) for m in finished_matches)
    total_red = sum(sum(parse_score(m.get('red', '0–0'))) for m in finished_matches)
    total_penalties = sum(sum(parse_score(m.get('penalty', '0–0'))) for m in finished_matches)
    
    # Referee statistics
    referee_counts = Counter(m.get('referee') for m in finished_matches if m.get('referee'))
    
    return {
        'total_matches': total_matches,
        'upcoming_matches': len(all_matches) - total_matches,
        'total_yellow_cards': total_yellow,
        'total_red_cards': total_red,
        'total_penalties': total_penalties,
        'avg_yellow_per_match': round(total_yellow / total_matches, 2),
        'avg_red_per_match': round(total_red / total_matches, 2),
        'avg_penalties_per_match': round(total_penalties / total_matches, 2),
        'unique_referees': len(referee_counts),
        'most_active_referee': referee_counts.most_common(1)[0] if referee_counts else None,
        'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
    }

def compute_team_stats(all_matches: List[Dict], finished_matches: List[Dict]) -> Dict:
    """Compute per-team statistics."""
    team_stats = defaultdict(lambda: {
        'total_matches': 0,
        'home_matches': 0,
        'away_matches': 0,
        'finished_matches': 0,
        'yellow_cards_for': 0,
        'yellow_cards_against': 0,
        'red_cards_for': 0,
        'red_cards_against': 0,
        'penalties_for': 0,
        'penalties_against': 0
    })
    
    def parse_score(score_str: str) -> Tuple[int, int]:
        if not score_str or score_str == 'null':
            return 0, 0
        try:
            parts = score_str.split('–')
            return int(parts[0]), int(parts[1])
        except:
            return 0, 0
    
    # Count all matches
    for match in all_matches:
        home = match.get('home')
        away = match.get('away')
        
        if home:
            team_stats[home]['total_matches'] += 1
            team_stats[home]['home_matches'] += 1
            
        if away:
            team_stats[away]['total_matches'] += 1
            team_stats[away]['away_matches'] += 1
    
    # Count finished match statistics
    for match in finished_matches:
        home = match.get('home')
        away = match.get('away')
        
        if not home or not away:
            continue
            
        team_stats[home]['finished_matches'] += 1
        team_stats[away]['finished_matches'] += 1
        
        # Card statistics
        yellow_home, yellow_away = parse_score(match.get('yellow', '0–0'))
        red_home, red_away = parse_score(match.get('red', '0–0'))
        pen_home, pen_away = parse_score(match.get('penalty', '0–0'))
        
        team_stats[home]['yellow_cards_for'] += yellow_home
        team_stats[home]['yellow_cards_against'] += yellow_away
        team_stats[home]['red_cards_for'] += red_home
        team_stats[home]['red_cards_against'] += red_away
        team_stats[home]['penalties_for'] += pen_home
        team_stats[home]['penalties_against'] += pen_away
        
        team_stats[away]['yellow_cards_for'] += yellow_away
        team_stats[away]['yellow_cards_against'] += yellow_home
        team_stats[away]['red_cards_for'] += red_away
        team_stats[away]['red_cards_against'] += red_home
        team_stats[away]['penalties_for'] += pen_away
        team_stats[away]['penalties_against'] += pen_home
    
    # Calculate averages
    result = {}
    for team, stats in team_stats.items():
        finished = stats['finished_matches']
        if finished > 0:
            stats['avg_yellow_for'] = round(stats['yellow_cards_for'] / finished, 2)
            stats['avg_yellow_against'] = round(stats['yellow_cards_against'] / finished, 2)
            stats['avg_red_for'] = round(stats['red_cards_for'] / finished, 2)
            stats['avg_red_against'] = round(stats['red_cards_against'] / finished, 2)
        
        result[team] = dict(stats)
    
    return result

def compute_referee_stats(finished_matches: List[Dict]) -> Dict:
    """Compute per-referee statistics."""
    referee_stats = defaultdict(lambda: {
        'matches': 0,
        'total_yellow': 0,
        'total_red': 0,
        'total_penalties': 0
    })
    
    def parse_score(score_str: str) -> Tuple[int, int]:
        if not score_str or score_str == 'null':
            return 0, 0
        try:
            parts = score_str.split('–')
            return int(parts[0]), int(parts[1])
        except:
            return 0, 0
    
    for match in finished_matches:
        referee = match.get('referee')
        if not referee:
            continue
            
        stats = referee_stats[referee]
        stats['matches'] += 1
        
        yellow_home, yellow_away = parse_score(match.get('yellow', '0–0'))
        red_home, red_away = parse_score(match.get('red', '0–0'))
        pen_home, pen_away = parse_score(match.get('penalty', '0–0'))
        
        stats['total_yellow'] += yellow_home + yellow_away
        stats['total_red'] += red_home + red_away
        stats['total_penalties'] += pen_home + pen_away
    
    # Calculate averages and sort by activity
    result = {}
    for referee, stats in referee_stats.items():
        matches = stats['matches']
        if matches > 0:
            stats['avg_yellow'] = round(stats['total_yellow'] / matches, 2)
            stats['avg_red'] = round(stats['total_red'] / matches, 2)
            stats['avg_penalties'] = round(stats['total_penalties'] / matches, 2)
        
        result[referee] = dict(stats)
    
    return dict(sorted(result.items(), key=lambda x: x[1]['matches'], reverse=True))

def create_global_index(matches: List[Dict[str, Any]], base_dir: Path):
    """Create global index files for quick lookups."""
    seasons = sorted(set(m.get('season') for m in matches if m.get('season')))
    teams = sorted(set(
        team for m in matches 
        for team in [m.get('home'), m.get('away')] 
        if team
    ))
    referees = sorted(set(
        m.get('referee') for m in matches 
        if m.get('referee')
    ))
    
    # Global index
    index = {
        'seasons': seasons,
        'teams': [{'name': team, 'slug': slugify(team)} for team in teams],
        'referees': [{'name': ref, 'slug': slugify(ref)} for ref in referees],
        'last_updated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_matches': len(matches)
    }
    
    save_json(base_dir / 'index.json', index)
    
    # Quick stats per season
    season_summary = {}
    for season in seasons:
        season_matches = [m for m in matches if m.get('season') == season]
        finished = [m for m in season_matches if m.get('status') == 'FINISHED']
        
        season_summary[season] = {
            'total_matches': len(season_matches),
            'finished_matches': len(finished),
            'upcoming_matches': len(season_matches) - len(finished)
        }
    
    save_json(base_dir / 'seasons_summary.json', season_summary)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Create optimized data chunks")
    parser.add_argument("--season", type=int, help="Specific season to process")
    parser.add_argument("--all-seasons", action="store_true", help="Process all seasons")
    parser.add_argument("--output-dir", type=str, help="Output directory for chunks")
    args = parser.parse_args()
    
    matches = load_matches()
    if not matches:
        print("❌ No matches found")
        return
    
    base_dir = Path(args.output_dir) if args.output_dir else ROOT / "data" / "chunks"
    
    print(f"🚀 Creating optimized chunks from {len(matches)} matches")
    print(f"📁 Output directory: {base_dir}")
    
    # Create global index
    create_global_index(matches, base_dir)
    
    # Process seasons
    seasons = sorted(set(m.get('season') for m in matches if m.get('season')))
    
    if args.season:
        if args.season in seasons:
            result = create_season_chunks(matches, args.season, base_dir)
            print(f"✅ Created chunks for season {args.season}: {result}")
        else:
            print(f"❌ Season {args.season} not found")
    elif args.all_seasons:
        for season in seasons:
            result = create_season_chunks(matches, season, base_dir)
            print(f"✅ Season {season}: {result}")
    else:
        # Default: process latest season
        latest_season = max(seasons)
        result = create_season_chunks(matches, latest_season, base_dir)
        print(f"✅ Created chunks for latest season {latest_season}: {result}")
    
    print(f"🎉 Chunk creation completed!")

if __name__ == "__main__":
    main()