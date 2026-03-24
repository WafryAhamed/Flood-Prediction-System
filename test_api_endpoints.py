#!/usr/bin/env python3
"""
Test all backend API endpoints to identify connection issues.
Tests: HTTP methods, request/response formats, missing endpoints.
"""
import requests
import json
from typing import Any

BASE_URL = "http://localhost:8000"
API_PREFIX = f"{BASE_URL}/api/v1"

def test_endpoint(method: str, path: str, **kwargs) -> dict[str, Any]:
    """Test an API endpoint and return status, response, and errors."""
    url = f"{API_PREFIX}{path}"
    try:
        if method.upper() == "GET":
            response = requests.get(url, **kwargs, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(url, **kwargs, timeout=5)
        elif method.upper() == "PATCH":
            response = requests.patch(url, **kwargs, timeout=5)
        elif method.upper() == "PUT":
            response = requests.put(url, **kwargs, timeout=5)
        elif method.upper() == "DELETE":
            response = requests.delete(url, **kwargs, timeout=5)
        else:
            return {"endpoint": path, "method": method, "error": "Invalid HTTP method"}
        
        result = {
            "endpoint": path,
            "method": method,
            "status_code": response.status_code,
            "success": response.status_code < 400,
        }
        
        try:
            result["response"] = response.json()
        except:
            result["response"] = response.text
        
        return result
    except Exception as e:
        return {
            "endpoint": path,
            "method": method,
            "error": str(e),
            "success": False
        }

def main():
    print("=" * 80)
    print("TESTING BACKEND API ENDPOINTS")
    print("=" * 80)
    
    tests = [
        # Health checks
        ("Health Check", "GET", "/health", {}),
        
        # Auth endpoints (login should be POST)
        ("LOGIN (POST)", "POST", "/auth/login", {
            "json": {"email": "test@example.com", "password": "test123"},
            "headers": {"Content-Type": "application/json"}
        }),
        
        # Integration endpoints
        ("Bootstrap", "GET", "/integration/bootstrap", {}),
        ("Integration Events (SSE)", "GET", "/integration/events", {}),
        
        # Integration Emergency Contacts
        ("Emergency Contacts List", "GET", "/integration/emergency-contacts", {}),
        
        # Integration Map Markers
        ("Map Markers List", "GET", "/integration/map-markers", {}),
        
        # Broadcasts endpoints
        ("List Broadcasts", "GET", "/broadcasts", {}),
        ("Active Broadcasts", "GET", "/broadcasts/active", {}),
        
        # Integration admin control
        ("Admin Control (PUT)", "PUT", "/integration/admin-control", {
            "json": {},
            "headers": {"Content-Type": "application/json"}
        }),
        
        # Chat endpoint
        ("Chat API", "POST", "/integration/chat", {
            "json": {"message": "test", "history": [], "knowledge": []},
            "headers": {"Content-Type": "application/json"}
        }),
        
        # Weather endpoints
        ("Weather Current", "GET", "/weather/current?lat=8.3593&lon=80.5103", {}),
        
        # Reports endpoints
        ("List Reports", "GET", "/reports", {}),
        
        # Districts endpoints
        ("List Districts", "GET", "/districts", {}),
        
        # Shelters endpoints
        ("List Shelters", "GET", "/shelters", {}),
    ]
    
    results = []
    for test_label, method, path, kwargs in tests:
        result = test_endpoint(method, path, **kwargs)
        results.append(result)
        
        status_emoji = "✓" if result.get("success") else "✗"
        status_text = f"{result.get('status_code', 'ERROR')}"
        error_text = f" - {result.get('error', '')}" if result.get("error") else ""
        
        print(f"{status_emoji} [{status_text}] {test_label:<40} {method:<6} {path}")
        if result.get("error"):
            print(f"       Error: {result['error']}")
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    successful = sum(1 for r in results if r.get("success"))
    total = len(results)
    
    print(f"Passed: {successful}/{total}")
    
    print("\n" + "=" * 80)
    print("ISSUES FOUND")
    print("=" * 80)
    
    issues = [r for r in results if not r.get("success")]
    if issues:
        for issue in issues:
            print(f"\n{issue['method']} {issue['endpoint']}")
            if issue.get("error"):
                print(f"  Error: {issue['error']}")
            elif issue.get("status_code"):
                print(f"  HTTP {issue['status_code']}")
    else:
        print("No issues found!")
    
    # Human-readable summary
    print("\n" + "=" * 80)
    print("DETAILED RESULTS (JSON)")
    print("=" * 80)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
