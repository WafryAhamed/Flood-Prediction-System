#!/usr/bin/env python3
"""
Backend API Audit Script
Tests all critical backend endpoints to verify functionality before rebuild.
"""

import asyncio
import json
import sys
from datetime import datetime

try:
    import httpx
except ImportError:
    print("❌ httpx not installed. Install with: pip install httpx")
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

async def test_backend():
    """Test all critical backend endpoints."""
    
    print(f"{BLUE}Backend API Audit Started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        results = {
            "health": [],
            "integration": [],
            "broadcasts": [],
            "weather": [],
            "users": [],
            "errors": []
        }
        
        # ═══════════════════════════════════════════════════════════
        # 1. HEALTH CHECK
        # ═══════════════════════════════════════════════════════════
        print_header("1. Health Check")
        
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print_success(f"Backend is running on {BASE_URL}")
                results["health"].append({"endpoint": "/health", "status": response.status_code, "ok": True})
            else:
                print_error(f"Health check returned {response.status_code}")
                results["health"].append({"endpoint": "/health", "status": response.status_code, "ok": False})
        except Exception as e:
            print_error(f"Cannot connect to backend: {e}")
            print(f"\n{RED}CRITICAL: Backend server is not running on {BASE_URL}{RESET}")
            print("Start backend with: cd server && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001")
            return results
        
        # ═══════════════════════════════════════════════════════════
        # 2. INTEGRATION API TESTS
        # ═══════════════════════════════════════════════════════════
        print_header("2. Integration API Endpoints")
        
        endpoints = [
            ("GET", "/integration/bootstrap", "Get initial state"),
            ("GET", "/integration/events", "SSE event stream"),
        ]
        
        for method, path, desc in endpoints:
            try:
                if method == "GET":
                    response = await client.get(f"{API_URL}{path}")
                elif method == "PUT":
                    response = await client.put(f"{API_URL}{path}", json={})
                
                status = "✓" if response.status_code < 400 else "✗"
                print(f"{status} {method:6} {path:30} -> {response.status_code}")
                results["integration"].append({
                    "method": method,
                    "endpoint": path,
                    "status": response.status_code,
                    "ok": response.status_code < 400
                })
            except Exception as e:
                print_error(f"{method} {path} -> Error: {str(e)[:50]}")
                results["errors"].append({"endpoint": path, "error": str(e)})
        
        # ═══════════════════════════════════════════════════════════
        # 3. BROADCASTS API TESTS
        # ═══════════════════════════════════════════════════════════
        print_header("3. Broadcasts API Endpoints")
        
        endpoints = [
            ("GET", "/broadcasts", "List all broadcasts"),
            ("GET", "/broadcasts/active", "Get active broadcasts"),
        ]
        
        for method, path, desc in endpoints:
            try:
                response = await client.get(f"{API_URL}{path}")
                status = "✓" if response.status_code < 400 else "✗"
                print(f"{status} {method:6} {path:30} -> {response.status_code}")
                results["broadcasts"].append({
                    "method": method,
                    "endpoint": path,
                    "status": response.status_code,
                    "ok": response.status_code < 400
                })
            except Exception as e:
                print_error(f"{method} {path} -> Error: {str(e)[:50]}")
                results["errors"].append({"endpoint": path, "error": str(e)})
        
        # ═══════════════════════════════════════════════════════════
        # 4. WEATHER API TESTS
        # ═══════════════════════════════════════════════════════════
        print_header("4. Weather API Endpoints")
        
        endpoints = [
            ("GET", "/weather/current", "Get current weather"),
            ("GET", "/weather/observations", "Get weather observations"),
            ("GET", "/weather/forecasts", "Get weather forecasts"),
        ]
        
        for method, path, desc in endpoints:
            try:
                response = await client.get(f"{API_URL}{path}")
                status = "✓" if response.status_code < 400 else "✗"
                print(f"{status} {method:6} {path:30} -> {response.status_code}")
                results["weather"].append({
                    "method": method,
                    "endpoint": path,
                    "status": response.status_code,
                    "ok": response.status_code < 400
                })
            except Exception as e:
                print_error(f"{method} {path} -> Error: {str(e)[:50]}")
                results["errors"].append({"endpoint": path, "error": str(e)})
        
        # ═══════════════════════════════════════════════════════════
        # 5. USERS API TESTS
        # ═══════════════════════════════════════════════════════════
        print_header("5. Users API Endpoints")
        
        endpoints = [
            ("GET", "/users", "List users (requires auth)"),
        ]
        
        for method, path, desc in endpoints:
            try:
                response = await client.get(f"{API_URL}{path}")
                # 401 Unauthorized is expected if not authenticated
                status = "✓" if response.status_code < 500 else "✗"
                expected = "(auth required)" if response.status_code == 401 else ""
                print(f"{status} {method:6} {path:30} -> {response.status_code} {expected}")
                results["users"].append({
                    "method": method,
                    "endpoint": path,
                    "status": response.status_code,
                    "ok": response.status_code < 500
                })
            except Exception as e:
                print_error(f"{method} {path} -> Error: {str(e)[:50]}")
                results["errors"].append({"endpoint": path, "error": str(e)})
        
        # ═══════════════════════════════════════════════════════════
        # 6. ADMIN CONTACT ENDPOINTS
        # ═══════════════════════════════════════════════════════════
        print_header("6. Admin Emergency Contacts Endpoints")
        
        endpoints = [
            ("GET", "/admin/emergency-contacts", "List contacts (requires auth)"),
        ]
        
        for method, path, desc in endpoints:
            try:
                response = await client.get(f"{API_URL}{path}")
                status = "✓" if response.status_code < 500 else "✗"
                expected = "(auth required)" if response.status_code == 401 else ""
                print(f"{status} {method:6} {path:30} -> {response.status_code} {expected}")
                results["errors"].append({  # Store for diagnostics
                    "method": method,
                    "endpoint": path,
                    "status": response.status_code,
                    "ok": response.status_code < 500
                })
            except Exception as e:
                print_error(f"{method} {path} -> Error: {str(e)[:50]}")
                results["errors"].append({"endpoint": path, "error": str(e)})
        
        # ═══════════════════════════════════════════════════════════
        # SUMMARY
        # ═══════════════════════════════════════════════════════════
        print_header("SUMMARY")
        
        total_ok = sum(len([r for r in v if isinstance(r, dict) and r.get("ok")]) for v in results.values() if isinstance(v, list))
        total_tests = sum(len([r for r in v if isinstance(r, dict)]) for v in results.values() if isinstance(v, list))
        
        print(f"Total Endpoints Tested: {total_tests}")
        print(f"Endpoints Working: {total_ok}")
        
        if results["errors"]:
            print(f"\n{YELLOW}Errors/Warnings: {len(results['errors'])}{RESET}")
            for error in results["errors"][:5]:  # Show first 5
                if "error" in error:
                    print(f"  • {error['endpoint']}: {error['error'][:60]}")
        
        # ═══════════════════════════════════════════════════════════
        # STATUS
        # ═══════════════════════════════════════════════════════════
        if total_ok >= 3:
            print(f"\n{GREEN}✓ BACKEND OPERATIONAL - Ready for rebuild phase{RESET}")
        else:
            print(f"\n{RED}✗ BACKEND HAS ISSUES - Check errors above{RESET}")
        
        return results

if __name__ == "__main__":
    results = asyncio.run(test_backend())
    
    # Save results to file
    with open("backend_audit_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n{BLUE}Detailed results saved to backend_audit_results.json{RESET}")
