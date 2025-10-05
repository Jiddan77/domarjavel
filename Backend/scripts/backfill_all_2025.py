#!/usr/bin/env python3
"""
Master script to backfill all missing data for 2025 season matches.
Runs referee, penalty, and card backfill scripts in sequence.
"""

import subprocess
import sys
from pathlib import Path

def run_script(script_path, season=2025, dry_run=False):
    """Run a backfill script and return success status."""
    cmd = [sys.executable, str(script_path), "--season", str(season)]
    if dry_run:
        cmd.append("--dry-run")
    
    print(f"\n{'='*60}")
    print(f"Running: {script_path.name}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_path.name}: {e}")
        return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Backfill all missing data for 2025 season")
    parser.add_argument("--season", type=int, default=2025, help="Season to backfill")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be updated without making changes")
    args = parser.parse_args()
    
    # Define script paths
    scripts_dir = Path(__file__).parent / "lib"
    scripts = [
        scripts_dir / "backfill_referees_2025.py",
        scripts_dir / "backfill_penalties_2025.py", 
        scripts_dir / "backfill_cards_2025.py"
    ]
    
    print(f"🚀 Starting backfill process for {args.season} season")
    if args.dry_run:
        print("🧪 DRY RUN MODE - No changes will be made")
    
    success_count = 0
    for script in scripts:
        if script.exists():
            if run_script(script, args.season, args.dry_run):
                success_count += 1
        else:
            print(f"❌ Script not found: {script}")
    
    print(f"\n{'='*60}")
    print(f"✅ Completed {success_count}/{len(scripts)} backfill scripts successfully")
    
    if success_count == len(scripts):
        print("🎉 All data backfill completed successfully!")
    else:
        print("⚠️  Some scripts failed - check output above for details")
        sys.exit(1)

if __name__ == "__main__":
    main()