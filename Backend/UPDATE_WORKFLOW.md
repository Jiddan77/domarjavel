# Match Update Workflow

This document describes how to smoothly update upcoming matches and backfill missing data in the Domarjävel system.

## Quick Start

The simplest way to update matches is using the wrapper script:

```bash
# Update 2025 season matches with complete data backfill
bash Backend/scripts/update_matches.sh

# See what would be updated without making changes
bash Backend/scripts/update_matches.sh --dry-run

# Update with verbose output
bash Backend/scripts/update_matches.sh --verbose
```

## What Happens During Update

The update process consists of several automated steps:

### 1. Match Data Update
- Reads new matches from `tmp/minimized_2025.json`
- Fetches match metadata (dates, teams, referees) from allsvenskan.se APIs
- Updates `data/data.json` with new and updated matches
- Creates `data/chunks/2025/upcoming.json` for frontend

### 2. Automatic Data Backfill
- **Referee Data**: Fetches missing referee assignments
- **Penalty Data**: Fetches penalty goal statistics  
- **Card Data**: Fetches yellow and red card statistics

### 3. Frontend Chunks
- Generates team-specific and referee-specific data chunks
- Updates season summary files

## Manual Control

### Individual Scripts

If you need more control, you can run individual scripts:

```bash
# 1. Update matches only (no backfill)
python3 Backend/scripts/update_and_backfill.py --season 2025 --skip-backfill

# 2. Backfill data only (no match updates)
python3 Backend/scripts/update_and_backfill.py --season 2025 --skip-update

# 3. Run specific backfill scripts
python3 Backend/scripts/lib/backfill_referees_2025.py --season 2025
python3 Backend/scripts/lib/backfill_penalties_2025.py --season 2025
python3 Backend/scripts/lib/backfill_cards_2025.py --season 2025

# 4. Original update script (advanced users)
bash Backend/scripts/update_from_minimized.sh --season 2025 --verbose
```

### Dry Run Mode

Always test changes first with dry-run mode:

```bash
# See what would be updated
bash Backend/scripts/update_matches.sh --dry-run

# Or with the Python script
python3 Backend/scripts/update_and_backfill.py --season 2025 --dry-run
```

## Data Sources

The system fetches data from multiple sources:

1. **Match Config API**: `https://allsvenskan.se/data-endpoint/match-config`
   - Basic match information (teams, dates, referees)
   
2. **Match Stats API**: `https://allsvenskan.se/data-endpoint/matchstats`
   - Detailed statistics (penalties, cards, goals)
   
3. **HTML Fallback**: Match pages on allsvenskan.se
   - Used when API data is incomplete

## File Structure

```
Backend/
├── data/
│   ├── data.json                    # Main match database
│   └── chunks/2025/
│       ├── upcoming.json            # Upcoming matches for frontend
│       ├── teams/                   # Team-specific chunks
│       └── refs/                    # Referee-specific chunks
├── tmp/
│   └── minimized_2025.json         # Source data (external)
└── scripts/
    ├── update_matches.sh            # Simple wrapper script
    ├── update_and_backfill.py       # Enhanced update script
    ├── update_from_minimized.sh     # Original update script
    └── lib/
        ├── backfill_referees_2025.py
        ├── backfill_penalties_2025.py
        ├── backfill_cards_2025.py
        └── fill_new_from_minimized_2025.py
```

## Monitoring and Status

The update scripts provide comprehensive status reporting:

- **Before/After Statistics**: Shows data completeness improvements
- **New Matches Added**: Reports how many new matches were discovered
- **Backfill Results**: Shows how many records were updated with missing data
- **Error Handling**: Clear error messages if something goes wrong

## Automation

For regular updates, you can set up a cron job:

```bash
# Update matches every hour during match season
0 * * * * cd /path/to/domarjavel && bash Backend/scripts/update_matches.sh >> logs/update.log 2>&1

# Or just during match days (weekends)
0 */2 * * 6,0 cd /path/to/domarjavel && bash Backend/scripts/update_matches.sh >> logs/update.log 2>&1
```

## Troubleshooting

### Common Issues

1. **Missing minimized file**
   ```
   ❌ Minimized file not found: tmp/minimized_2025.json
   ```
   Solution: Ensure you have the source data file in the correct location.

2. **API rate limiting**
   The scripts include built-in rate limiting and retry logic. If you encounter issues, the scripts will automatically slow down requests.

3. **Encoding issues with referee names**
   This is a known issue with some API responses. The data is still correctly stored, just the console output may show garbled text.

### Getting Help

- Check the verbose output: `--verbose` flag shows detailed information
- Use dry-run mode to test: `--dry-run` flag shows what would happen
- Check log files in `Backend/backups/` for automatic backups before changes

## Data Quality

The system ensures data quality through:

- **Automatic Backups**: Every update creates timestamped backups
- **Validation**: Scripts validate data before writing
- **Incremental Updates**: Only missing data is fetched, existing data is preserved
- **Consistent Schema**: All matches have the same field structure after updates

## Performance

- **Rate Limiting**: Built-in delays prevent overwhelming the APIs
- **Caching**: Existing data is not re-fetched unnecessarily  
- **Parallel Processing**: Multiple data sources can be processed efficiently
- **Early Stopping**: Scripts can be configured to stop after a certain number of updates for testing