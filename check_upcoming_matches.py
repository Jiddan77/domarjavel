#!/usr/bin/env python3
"""
Quick script to check if there are upcoming matches in the data
"""

import json
import os
from pathlib import Path
from datetime import datetime

def parse_date(date_str):
    """Parse Swedish date format"""
    if not date_str:
        return None
    
    # Try standard parsing first
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").timestamp() * 1000
    except:
        pass
    
    # Try Swedish month names
    months = {
        'januari': 1, 'februari': 2, 'mars': 3, 'april': 4,
        'maj': 5, 'juni': 6, 'juli': 7, 'augusti': 8,
        'september': 9, 'oktober': 10, 'november': 11, 'december': 12
    }
    
    import re
    match = re.match(r'^(\d{1,2})\s+([a-zA-ZåäöÅÄÖ]+)\s+(\d{4})$', str(date_str))
    if match:
        day, month_name, year = match.groups()
        month = months.get(month_name.lower())
        if month:
            try:
                return datetime(int(year), month, int(day)).timestamp() * 1000
            except:
                pass
    
    return None

def main():
    # Find data file
    possible_paths = [
        Path("Backend/data/data.json"),
        Path("data/data.json"),
        Path("Frontend/public/data/seasons.json")
    ]
    
    data_file = None
    for path in possible_paths:
        if path.exists():
            data_file = path
            break
    
    if not data_file:
        print("❌ No data file found")
        return
    
    print(f"📂 Loading data from: {data_file}")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        matches = data
    else:
        matches = data.get("matches", [])
    
    print(f"📊 Total matches: {len(matches)}")
    
    now = datetime.now().timestamp() * 1000
    upcoming_count = 0
    past_count = 0
    unparseable_count = 0
    
    sample_dates = []
    sample_upcoming = []
    
    for match in matches[:100]:  # Check first 100 matches
        date_str = match.get("date", "")
        parsed_date = parse_date(date_str)
        
        sample_dates.append({
            "original": date_str,
            "parsed": parsed_date,
            "is_future": parsed_date > now if parsed_date else None
        })
        
        if parsed_date:
            if parsed_date > now:
                upcoming_count += 1
                if len(sample_upcoming) < 5:
                    sample_upcoming.append({
                        "date": date_str,
                        "referee": match.get("referee", ""),
                        "home": match.get("home", ""),
                        "away": match.get("away", ""),
                        "score": match.get("score", "")
                    })
            else:
                past_count += 1
        else:
            unparseable_count += 1
    
    print(f"\n📅 Date Analysis (first 100 matches):")
    print(f"  🔜 Upcoming: {upcoming_count}")
    print(f"  📊 Past: {past_count}")
    print(f"  ❓ Unparseable: {unparseable_count}")
    
    print(f"\n🔍 Sample dates:")
    for i, sample in enumerate(sample_dates[:5]):
        print(f"  {i+1}. '{sample['original']}' → {sample['parsed']} → {'FUTURE' if sample['is_future'] else 'PAST' if sample['is_future'] is False else 'UNPARSEABLE'}")
    
    if sample_upcoming:
        print(f"\n🔜 Sample upcoming matches:")
        for match in sample_upcoming:
            print(f"  📅 {match['date']} | {match['home']} vs {match['away']} | Ref: {match['referee'][:30]}...")
    else:
        print(f"\n❌ No upcoming matches found in first 100 matches")
        print("This explains why 'Show Upcoming' shows blank!")

if __name__ == "__main__":
    main()