#!/usr/bin/env python3
"""
Test script to verify referee name validation and match filtering
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

from Backend.app.main import normalize_referee_name, is_valid_match

def test_referee_validation():
    """Test referee name validation"""
    print("🧪 Testing Referee Name Validation")
    print("=" * 50)
    
    # Test cases: (input, expected_result, description)
    test_cases = [
        # Valid referee names
        ("Anders Andersson", "Anders Andersson", "Normal referee name"),
        ("Lars-Erik Svensson", "Lars-Erik Svensson", "Name with hyphen"),
        ("Mohammed Al-Hassan", "Mohammed Al-Hassan", "International name"),
        
        # Invalid referee names (should return None)
        ("Referee123", None, "Name with numbers"),
        ("Domare 456", None, "Swedish referee with number"),
        ("Ref789", None, "Short name with numbers"),
        ("12345", None, "Only numbers"),
        ("", None, "Empty string"),
        ("   ", None, "Only whitespace"),
        ("null", None, "Null placeholder"),
        ("TBD", None, "To be determined"),
        ("Domare ej utsedd", None, "Swedish unassigned"),
        ("???", None, "Question marks"),
        ("---", None, "Dashes"),
        ("F♦D!_V}<$.H", None, "Corrupted data"),
        ("@#$%^&*()", None, "Only special characters"),
    ]
    
    passed = 0
    failed = 0
    
    for input_name, expected, description in test_cases:
        result = normalize_referee_name(input_name)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
            
        print(f"{status} | '{input_name}' → '{result}' | {description}")
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    return failed == 0

def test_match_validation():
    """Test match validation"""
    print("\n🧪 Testing Match Validation")
    print("=" * 50)
    
    # Test cases: (match_data, expected_result, description)
    test_cases = [
        # Valid matches
        ({
            "referee": "Anders Andersson",
            "score": "2-1",
            "yellow": "3-2",
            "red": "0-1"
        }, True, "Normal played match"),
        
        ({
            "referee": "Lars Svensson", 
            "score": "0-0",
            "yellow": "2-1",
            "red": "0-0"
        }, True, "0-0 match with cards (played)"),
        
        # Invalid matches
        ({
            "referee": "Referee123",
            "score": "2-1",
            "yellow": "1-0",
            "red": "0-0"
        }, False, "Match with numbered referee"),
        
        ({
            "referee": "Anders Andersson",
            "score": "0-0",
            "yellow": "0-0", 
            "red": "0-0"
        }, False, "0-0 match with no cards (unplayed)"),
        
        ({
            "referee": "",
            "score": "1-1",
            "yellow": "2-1",
            "red": "0-0"
        }, False, "Match with empty referee"),
        
        ({
            "referee": "TBD",
            "score": "",
            "yellow": "",
            "red": ""
        }, False, "Unscheduled match"),
    ]
    
    passed = 0
    failed = 0
    
    for match_data, expected, description in test_cases:
        result = is_valid_match(match_data)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
            
        referee = match_data.get("referee", "")[:20] + "..." if len(match_data.get("referee", "")) > 20 else match_data.get("referee", "")
        print(f"{status} | Referee: '{referee}' → {result} | {description}")
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    return failed == 0

def main():
    """Run all tests"""
    print("🚀 Dommarjävel Referee Validation Tests")
    print("=" * 60)
    
    referee_tests_passed = test_referee_validation()
    match_tests_passed = test_match_validation()
    
    print("\n" + "=" * 60)
    if referee_tests_passed and match_tests_passed:
        print("🎉 All tests passed! Referee validation is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Check the validation logic.")
        return 1

if __name__ == "__main__":
    sys.exit(main())