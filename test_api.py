#!/usr/bin/env python3
"""
Quick API endpoint tester for Dommarjävel backend
Run this after starting the backend server to verify all endpoints work
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_endpoint(method: str, endpoint: str, data: Dict[Any, Any] = None) -> bool:
    """Test a single API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
            
        print(f"🔍 {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                if isinstance(result, dict):
                    print(f"   Keys: {list(result.keys())}")
                elif isinstance(result, list):
                    print(f"   Items: {len(result)}")
                else:
                    print(f"   Type: {type(result)}")
                print("   ✅ Success")
                return True
            except json.JSONDecodeError:
                print(f"   ⚠️  Non-JSON response: {response.text[:100]}")
                return False
        else:
            print(f"   ❌ Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection failed to {url}")
        print("   Make sure backend is running on http://localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Timeout connecting to {url}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Test all API endpoints"""
    print("🚀 Testing Dommarjävel API Endpoints")
    print("=" * 50)
    
    # Test basic endpoints
    endpoints = [
        ("GET", "/"),
        ("GET", "/health"),
        ("GET", "/api/index"),
        ("GET", "/api/seasons"),
        ("GET", "/api/referees"),
        ("GET", "/api/teams"),
        ("GET", "/api/matches"),
        ("GET", "/api/stats"),
        ("GET", "/api/advanced-stats"),
        ("GET", "/api/leaderboard"),
        ("GET", "/api/referee-votes"),
    ]
    
    success_count = 0
    total_count = len(endpoints)
    
    for method, endpoint in endpoints:
        if test_endpoint(method, endpoint):
            success_count += 1
        print()
    
    # Test POST endpoint
    print("🔍 Testing POST /api/referee-vote")
    vote_data = {
        "referee": "Test Referee",
        "vote": "up",
        "teamPreference": "Test Team"
    }
    
    if test_endpoint("POST", "/api/referee-vote", vote_data):
        success_count += 1
    total_count += 1
    
    print()
    print("=" * 50)
    print(f"📊 Results: {success_count}/{total_count} endpoints working")
    
    if success_count == total_count:
        print("🎉 All API endpoints are working!")
        return 0
    else:
        print("⚠️  Some endpoints failed. Check the backend server.")
        return 1

if __name__ == "__main__":
    sys.exit(main())