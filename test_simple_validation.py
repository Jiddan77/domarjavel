#!/usr/bin/env python3
"""
Simple test for referee validation logic
"""

import re

def normalize_referee_name(referee_name):
    """Clean and normalize referee names"""
    if not referee_name:
        return None
    
    # Remove empty/placeholder referees
    cleaned = referee_name.strip()
    if not cleaned or cleaned.lower() in ['', 'null', 'none', 'unknown', 'tbd', 'n/a']:
        return None
    
    # Remove problematic characters and corrupt names
    cleaned = cleaned.replace('�', '').replace('♦', '').replace('◊', '')
    cleaned = ' '.join(cleaned.split())  # Normalize whitespace
    
    # Filter out corrupt referee names (common patterns from unplayed games)
    corrupt_patterns = [
        'domare ej utsedd',
        'ej utsedd',
        'not assigned',
        'tbd',
        'pending',
        'unknown',
        'n/a',
        'null',
        'undefined',
        '---',
        '???',
        'domare saknas',
        'ingen domare',
        'no referee'
    ]
    
    cleaned_lower = cleaned.lower()
    for pattern in corrupt_patterns:
        if pattern in cleaned_lower:
            return None
    
    # Filter out names that are too short or contain only numbers/symbols
    if len(cleaned) < 3 or cleaned.isdigit() or not any(c.isalpha() for c in cleaned):
        return None
    
    # NEW: Filter out referee names containing numbers (indicates unplayed games)
    if re.search(r'\d', cleaned):
        return None
    
    # Filter out names with excessive special characters (corrupted data)
    special_char_count = sum(1 for c in cleaned if not c.isalnum() and not c.isspace())
    if special_char_count > len(cleaned) * 0.3:  # More than 30% special characters
        return None
    
    return cleaned if cleaned else None

def test_referee_names():
    """Test referee name validation"""
    print("🧪 Testing Referee Name Validation")
    print("=" * 50)
    
    test_cases = [
        # Valid names (should pass)
        ("Anders Andersson", True, "Normal referee name"),
        ("Lars-Erik Svensson", True, "Name with hyphen"),
        ("Mohammed Al-Hassan", True, "International name"),
        ("Åke Öberg", True, "Swedish characters"),
        
        # Invalid names (should be filtered out)
        ("Referee123", False, "Name with numbers"),
        ("Domare 456", False, "Swedish referee with number"),
        ("Ref789", False, "Short name with numbers"),
        ("12345", False, "Only numbers"),
        ("", False, "Empty string"),
        ("   ", False, "Only whitespace"),
        ("null", False, "Null placeholder"),
        ("TBD", False, "To be determined"),
        ("Domare ej utsedd", False, "Swedish unassigned"),
        ("???", False, "Question marks"),
        ("---", False, "Dashes"),
        ("F♦D!_V}<$.H", False, "Corrupted data from your screenshot"),
        ("@#$%^&*()", False, "Only special characters"),
        ("AB", False, "Too short"),
        ("Test123Name", False, "Numbers in middle"),
        ("Name4", False, "Number at end"),
        ("5Name", False, "Number at start"),
    ]
    
    passed = 0
    failed = 0
    
    for input_name, should_be_valid, description in test_cases:
        result = normalize_referee_name(input_name)
        is_valid = result is not None
        
        if is_valid == should_be_valid:
            status = "✅ PASS"
            passed += 1
        else:
            status = "❌ FAIL"
            failed += 1
            
        print(f"{status} | '{input_name}' → {'VALID' if is_valid else 'FILTERED'} | {description}")
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All referee validation tests passed!")
        print("\n✅ Benefits:")
        print("- Games with numbered referees will be filtered out")
        print("- Corrupted referee names will be removed")
        print("- Only real, played matches will be counted")
        print("- Statistics will be more accurate")
    else:
        print("❌ Some tests failed - check validation logic")
    
    return failed == 0

if __name__ == "__main__":
    test_referee_names()