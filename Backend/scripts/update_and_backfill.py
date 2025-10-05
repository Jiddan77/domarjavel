#!/usr/bin/env python3
"""
Enhanced update script that:
1. Updates matches from minimized data
2. Automatically backfills missing referee, penalty, and card data
3. Provides comprehensive status reporting

Usage:
    python3 Backend/scripts/update_and_backfill.py --season 2025
    python3 Backend/scripts/update_and_backfill.py --season 2025 --dry-run
    python3 Backend/scripts/update_and_backfill.py --season 2025 --skip-backfill
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "data.json"

def run_command(cmd: List[str], description: str, verbose: bool = False) -> bool:
    """Run a command and return success status."""
    if verbose:
        print(f"\n🔧 {description}")
        print(f"   Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd, 
            check=True, 
            capture_output=not verbose,
            text=True,
            cwd=ROOT
        )
        if verbose:
            print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if not verbose and e.stdout:
            print(f"   stdout: {e.stdout}")
        if not verbose and e.stderr:
            print(f"   stderr: {e.stderr}")
        return False

def get_match_stats(season: int) -> Dict[str, int]:
    """Get statistics about matches for the given season."""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        matches = data.get('matches', []) if isinstance(data, dict) else data
        season_matches = [m for m in matches if int(m.get('season', 0)) == season]
        
        stats = {
            'total': len(season_matches),
            'finished': len([m for m in season_matches if m.get('status') == 'FINISHED']),
            'with_referee': len([m for m in season_matches if m.get('referee')]),
            'with_penalty': len([m for m in season_matches if m.get('penalty')]),
            'with_yellow': len([m for m in season_matches if m.get('yellow')]),
            'with_red': len([m for m in season_matches if m.get('red')]),
        }
        
        stats['missing_referee'] = stats['finished'] - stats['with_referee']
        stats['missing_penalty'] = stats['finished'] - stats['with_penalty']
        stats['missing_cards'] = stats['finished'] - min(stats['with_yellow'], stats['with_red'])
        
        return stats
    except Exception as e:
        print(f"⚠️  Could not read match statistics: {e}")
        return {}

def print_stats(stats: Dict[str, int], title: str):
    """Print match statistics in a formatted way."""
    if not stats:
        return
        
    print(f"\n📊 {title}")
    print(f"   Total matches: {stats['total']}")
    print(f"   Finished matches: {stats['finished']}")
    print(f"   With referee: {stats['with_referee']} (missing: {stats['missing_referee']})")
    print(f"   With penalty data: {stats['with_penalty']} (missing: {stats['missing_penalty']})")
    print(f"   With card data: {min(stats['with_yellow'], stats['with_red'])} (missing: {stats['missing_cards']})")

def main():
    parser = argparse.ArgumentParser(description="Update matches and backfill missing data")
    parser.add_argument("--season", type=int, default=2025, help="Season to update")
    parser.add_argument("--minimized", type=str, help="Path to minimized JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--skip-update", action="store_true", help="Skip the initial update, only run backfill")
    parser.add_argument("--skip-backfill", action="store_true", help="Skip backfill scripts, only update matches")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()
    
    print(f"🚀 Starting update and backfill process for {args.season} season")
    if args.dry_run:
        print("🧪 DRY RUN MODE - No changes will be made")
    
    # Get initial statistics
    initial_stats = get_match_stats(args.season)
    print_stats(initial_stats, f"Initial Statistics (Season {args.season})")
    
    success_count = 0
    total_steps = 0
    
    # Step 1: Update matches from minimized data
    if not args.skip_update:
        total_steps += 1
        minimized_path = args.minimized or f"tmp/minimized_{args.season}.json"
        
        update_cmd = [
            "bash", "scripts/update_from_minimized.sh",
            "--season", str(args.season),
            "--minimized", minimized_path
        ]
        if args.verbose:
            update_cmd.append("--verbose")
        if args.dry_run:
            update_cmd.append("--skip-deps")  # Don't install deps in dry run
        
        if run_command(update_cmd, "Updating matches from minimized data", args.verbose):
            success_count += 1
        
        # Get updated statistics
        if not args.dry_run:
            updated_stats = get_match_stats(args.season)
            print_stats(updated_stats, f"After Update (Season {args.season})")
            
            new_matches = updated_stats['total'] - initial_stats.get('total', 0)
            if new_matches > 0:
                print(f"✨ Added {new_matches} new matches")
    
    # Step 2: Backfill missing data
    if not args.skip_backfill and not args.dry_run:
        backfill_scripts = [
            ("scripts/lib/backfill_referees_2025.py", "Backfilling referee data"),
            ("scripts/lib/backfill_penalties_2025.py", "Backfilling penalty data"),
            ("scripts/lib/backfill_cards_2025.py", "Backfilling card data")
        ]
        
        for script_path, description in backfill_scripts:
            total_steps += 1
            backfill_cmd = [
                sys.executable, script_path,
                "--season", str(args.season)
            ]
            
            if run_command(backfill_cmd, description, args.verbose):
                success_count += 1
        
        # Step 3: Rebuild optimized chunks
        total_steps += 1
        chunks_cmd = [
            sys.executable, "scripts/lib/create_optimized_chunks.py",
            "--season", str(args.season)
        ]
        
        if run_command(chunks_cmd, "Rebuilding optimized chunks", args.verbose):
            success_count += 1
    elif args.skip_backfill:
        print("⏭️  Skipping backfill scripts as requested")
    elif args.dry_run:
        print("⏭️  Skipping backfill scripts in dry-run mode")
    
    # Final statistics
    if not args.dry_run:
        final_stats = get_match_stats(args.season)
        print_stats(final_stats, f"Final Statistics (Season {args.season})")
        
        # Show improvements
        if initial_stats:
            improvements = []
            if final_stats['with_referee'] > initial_stats['with_referee']:
                improvements.append(f"referee: +{final_stats['with_referee'] - initial_stats['with_referee']}")
            if final_stats['with_penalty'] > initial_stats['with_penalty']:
                improvements.append(f"penalty: +{final_stats['with_penalty'] - initial_stats['with_penalty']}")
            if min(final_stats['with_yellow'], final_stats['with_red']) > min(initial_stats['with_yellow'], initial_stats['with_red']):
                old_cards = min(initial_stats['with_yellow'], initial_stats['with_red'])
                new_cards = min(final_stats['with_yellow'], final_stats['with_red'])
                improvements.append(f"cards: +{new_cards - old_cards}")
            
            if improvements:
                print(f"\n🎯 Data improvements: {', '.join(improvements)}")
    
    # Summary
    print(f"\n{'='*60}")
    if total_steps == 0:
        print("ℹ️  No operations performed")
    elif success_count == total_steps:
        print(f"🎉 All {success_count} operations completed successfully!")
    else:
        print(f"⚠️  {success_count}/{total_steps} operations completed successfully")
        if success_count < total_steps:
            sys.exit(1)

if __name__ == "__main__":
    main()