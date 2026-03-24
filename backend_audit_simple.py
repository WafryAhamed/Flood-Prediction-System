#!/usr/bin/env python3
"""
Simplified Backend API Audit Script  
Tests critical endpoints excluding streaming endpoints.
"""

import json
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print("❌ requests not installed. Install with: pip install requests")
    sys.exit(1)

BASE_URL = "http://localhost:8001"
API_URL = f"{BASE_URL}/api/v1"

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{RESET}")

def print_success(text):
    print(f"{GREEN}✓ {text}{RESET}")

def print_error(text):
    print(f"{RED}✗ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠ {text}{RESET}")

def test_endpoint(method, path, desc, data=None):
    """Test a single endpoint."""
    try:
        url = f"{API_URL}{path}"
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data or {}, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data or {}, timeout=5)
        
        ok = response.status_code < 400
        status_str = f"{response.status_code}"
        
        if response.status_code == 401:
            status_str += " (AUTH)"
        elif response.status_code == 404:
            status_str += " (NOT FOUND)"
        elif response.status_code >= 500:
            status_str += " (ERROR)"
        
        symbol = "✓" if ok else "✗" if response.status_code >= 500 else "⚠"
        print(f"{symbol} {method:4} {path:35} -> {status_str:15} {desc}")
        
        return {
            "method": method,
            "path": path,
            "desc": desc,
            "status": response.status_code,
            "ok": ok
        }
    except requests.exceptions.ConnectionError:
        print_error(f"{method} {path} -> CONNECTION FAILED (backend not running?)")
        return {
            "method": method,
            "path": path,
            "desc": desc,
            "status": 0,
            "ok": False,
            "error": "Connection failed"
        }
    except requests.exceptions.Timeout:
        print_error(f"{method} {path} -> TIMEOUT")
        return {
            "method": method,
            "path": path,
            "desc": desc,
            "status": 0,
            "ok": False,
            "error": "Timeout"
        }
    except Exception as e:
        print_error(f"{method} {path} -> Error: {str(e)[:40]}")
        return {
            "method": method,
            "path": path,
            "desc": desc,
            "status": 0,
            "ok": False,
            "error": str(e)
        }

def main():
    """Run backend audit."""
    
    print(f"{BLUE}Backend API Audit - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    
    all_results = []
    
    # ═══════════════════════════════════════════════════════════
    # 1. HEALTH CHECK
    # ═══════════════════════════════════════════════════════════
    print_header("1. Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Backend is running on {BASE_URL}")
        else:
            print_warning(f"Health check returned {response.status_code}")
    except Exception as e:
        print_error(f"Cannot connect to backend: {e}")
        print(f"\n{RED}CRITICAL: Backend is not running!{RESET}")
        print("Start backend with: cd server && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001")
        return
    
    # ═══════════════════════════════════════════════════════════
    # 2. INTEGRATION ENDPOINTS
    # ═══════════════════════════════════════════════════════════
    print_header("2. Integration API")
    tests = [
        ("GET", "/integration/bootstrap", "Get initial state + admin control data"),
    ]
    for method, path, desc in tests:
        all_results.append(test_endpoint(method, path, desc))
    
    # ═══════════════════════════════════════════════════════════
    # 3. BROADCASTS API
    # ═══════════════════════════════════════════════════════════
    print_header("3. Broadcasts API")
    tests = [
        ("GET", "/broadcasts", "List all broadcasts"),
        ("GET", "/broadcasts/active", "Get active broadcasts"),
    ]
    for method, path, desc in tests:
        all_results.append(test_endpoint(method, path, desc))
    
    # ═══════════════════════════════════════════════════════════
    # 4. WEATHER API
    # ═══════════════════════════════════════════════════════════
    print_header("4. Weather API")
    tests = [
        ("GET", "/weather/current", "Get current weather snapshot"),
        ("GET", "/weather/observations", "Get weather observations"),
        ("GET", "/weather/forecasts", "Get weather forecasts"),
    ]
    for method, path, desc in tests:
        all_results.append(test_endpoint(method, path, desc))
    
    # ═══════════════════════════════════════════════════════════
    # 5. USERS API (AUTH REQUIRED)
    # ═══════════════════════════════════════════════════════════
    print_header("5. Users Management API (requires auth)")
    tests = [
        ("GET", "/users", "List all users"),
    ]
    for method, path, desc in tests:
        all_results.append(test_endpoint(method, path, desc))
    
    # ═══════════════════════════════════════════════════════════
    # 6. ADMIN CONTACTS API
    # ═══════════════════════════════════════════════════════════
    print_header("6. Admin Contacts API (requires auth)")
    tests = [
        ("GET", "/admin/emergency-contacts", "List emergency contacts"),
    ]
    for method, path, desc in tests:
        all_results.append(test_endpoint(method, path, desc))
    
    # ═══════════════════════════════════════════════════════════
    # 7. MAP MARKERS API
    # ═══════════════════════════════════════════════════════════
    print_header("7. Admin Map Markers API (requires auth)")
    tests = [
        ("GET", "/admin/map-markers", "List map markers"),
    ]
    for method, path, desc in tests:
        all_results.append(test_endpoint(method, path, desc))
    
    # ═══════════════════════════════════════════════════════════
    # SUMMARY
    # ═══════════════════════════════════════════════════════════
    print_header("AUDIT SUMMARY")
    
    working = sum(1 for r in all_results if r.get("ok"))
    total = len(all_results)
    
    print(f"Endpoints Tested: {total}")
    print(f"Working (2xx-3xx): {working}")
    print(f"Require Auth (401): {sum(1 for r in all_results if r.get('status') == 401)}")
    print(f"Errors (5xx): {sum(1 for r in all_results if r.get('status') >= 500)}")
    
    print(f"\n{BLUE}Backend Status: ", end="")
    if working >= 4:
        print(f"{GREEN}✓ OPERATIONAL - Ready for rebuild{RESET}")
    elif working >= 2:
        print(f"{YELLOW}⚠ PARTIAL - Some endpoints missing or broken{RESET}")
    else:
        print(f"{RED}✗ FAILED - Check errors above{RESET}")
    
    # Save results
    with open("backend_audit_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_endpoints": total,
            "working": working,
            "results": all_results
        }, f, indent=2)
    
    print(f"\n{BLUE}Results saved to backend_audit_results.json{RESET}")

if __name__ == "__main__":
    main()
