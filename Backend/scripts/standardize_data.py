#!/usr/bin/env python3
"""
Script to standardize the data.json file by ensuring all match records have consistent fields.
Adds missing fields (referee, yellow, red, penalty) with default values where they don't exist.
"""

import json
import sys
from pathlib import Path

def standardize_match_data(data_file_path):
    """
    Standardize match data by ensuring all records have consistent fields.
    """
    # Read the current data
    with open(data_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        matches = data['matches']
    
    # Define required fields with their default values
    required_fields = {
        'referee': None,
        'yellow': None,
        'red': None,
        'penalty': None
    }
    
    # Track statistics
    total_matches = len(matches)
    updated_matches = 0
    
    # Process each match
    for match in matches:
        match_updated = False
        
        # Add missing fields with default values
        for field, default_value in required_fields.items():
            if field not in match:
                match[field] = default_value
                match_updated = True
        
        if match_updated:
            updated_matches += 1
    
    # Write the standardized data back
    data['matches'] = matches
    with open(data_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Standardization complete:")
    print(f"- Total matches: {total_matches}")
    print(f"- Updated matches: {updated_matches}")
    print(f"- Matches already complete: {total_matches - updated_matches}")
    
    return updated_matches

def main():
    # Path to the data file
    data_file = Path(__file__).parent.parent / 'data' / 'data.json'
    
    if not data_file.exists():
        print(f"Error: Data file not found at {data_file}")
        sys.exit(1)
    
    print(f"Standardizing data file: {data_file}")
    
    try:
        updated_count = standardize_match_data(data_file)
        print(f"\nSuccessfully updated {updated_count} match records.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()