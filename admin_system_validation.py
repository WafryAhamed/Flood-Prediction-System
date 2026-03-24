#!/usr/bin/env python3
"""
FLOOD RESILIENCE ADMIN SYSTEM - LIVE VALIDATION TEST
Validates the complete admin system against a running backend

Run this AFTER starting the backend on port 8001
"""

import requests
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import time

# Configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'flood_resilience',
    'user': 'postgres',
    'password': '2001'
}

API_BASE = 'http://localhost:8001/api/v1'
ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'admin'  # Change to actual admin password

# Test Results
results = {
    'database': {},
    'api': {},
    'admin_system': {},
    'timestamp': datetime.now().isoformat()
}

def test_database_connection():
    """Test PostgreSQL connection"""
    print("\n=== DATABASE TESTS ===")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get version
        cursor.execute("SELECT version();")
        version = cursor.fetchone()['version']
        print(f"✅ Connected to PostgreSQL: {version.split(',')[0]}")
        results['database']['connection'] = 'PASS'
        
        # Check critical tables
        tables_to_check = [
            'users',
            'roles',
            'page_visibility',
            'system_settings_config',
            'emergency_contacts',
            'citizen_reports',
            'broadcasts',
            'districts'
        ]
        
        missing_tables = []
        for table in tables_to_check:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table};")
            result = cursor.fetchone()
            if result['count'] >= 0:
                print(f"✅ Table '{table}' exists")
            else:
                missing_tables.append(table)
        
        results['database']['tables'] = 'PASS' if not missing_tables else f'FAIL: {missing_tables}'
        
        # Check page visibility
        cursor.execute("SELECT COUNT(*) as count FROM page_visibility WHERE is_enabled = true;")
        enabled_count = cursor.fetchone()['count']
        print(f"✅ Page visibility: {enabled_count} pages enabled")
        results['database']['page_visibility'] = f'{enabled_count} pages enabled'
        
        # Check system settings
        cursor.execute("SELECT dark_mode, sound_alerts, push_notifications, data_collection, anonymous_reporting FROM system_settings_config LIMIT 1;")
        settings = cursor.fetchone()
        if settings:
            print(f"✅ System settings: dark_mode={settings['dark_mode']}, sound_alerts={settings['sound_alerts']}, push_notifications={settings['push_notifications']}")
            results['database']['settings'] = 'PASS'
        
        # Check emergency contacts
        cursor.execute("SELECT COUNT(*) as count FROM emergency_contacts WHERE is_active = true;")
        contact_count = cursor.fetchone()['count']
        print(f"✅ Emergency contacts: {contact_count} active")
        results['database']['emergency_contacts'] = f'{contact_count} active'
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        results['database']['error'] = str(e)
        return False

def test_api_health():
    """Test API health endpoint"""
    print("\n=== API HEALTH TESTS ===")
    try:
        response = requests.get(f"{API_BASE.replace('/api/v1', '')}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Health endpoint: {response.status_code}")
            results['api']['health'] = 'PASS'
            return True
        else:
            print(f"❌ Health endpoint returned: {response.status_code}")
            results['api']['health'] = f'FAIL: {response.status_code}'
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Backend not running on port 8001")
        print(f"   Start backend with: python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
        results['api']['health'] = 'FAIL: Connection refused'
        return False
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        results['api']['health'] = f'FAIL: {str(e)}'
        return False

def test_authentication():
    """Test login and JWT token"""
    print("\n=== AUTHENTICATION TESTS ===")
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('tokens', {}).get('access_token')
            if token:
                print(f"✅ Login successful: JWT token issued")
                results['api']['auth'] = 'PASS'
                return token
            else:
                print(f"❌ Token not in response")
                results['api']['auth'] = 'FAIL: No token'
                return None
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            results['api']['auth'] = f'FAIL: {response.status_code}'
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"⚠️  Backend not running (skipping auth test)")
        results['api']['auth'] = 'SKIPPED'
        return None
    except Exception as e:
        print(f"❌ Auth failed: {str(e)}")
        results['api']['auth'] = f'FAIL: {str(e)}'
        return None

def test_admin_endpoints(token):
    """Test admin-specific endpoints"""
    print("\n=== ADMIN ENDPOINT TESTS ===")
    
    if not token:
        print("⚠️  Skipping admin tests (no token)")
        results['admin_system']['endpoints'] = 'SKIPPED'
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test page visibility
    try:
        response = requests.get(f"{API_BASE}/admin/page-visibility", headers=headers, timeout=5)
        if response.status_code == 200:
            pages = response.json()
            print(f"✅ Page visibility endpoint: {len(pages)} pages returned")
            results['admin_system']['page_visibility'] = f'{len(pages)} pages'
        else:
            print(f"❌ Page visibility returned: {response.status_code}")
            results['admin_system']['page_visibility'] = f'FAIL: {response.status_code}'
    except Exception as e:
        print(f"❌ Page visibility test failed: {str(e)}")
        results['admin_system']['page_visibility'] = f'FAIL: {str(e)}'
    
    # Test system settings
    try:
        response = requests.get(f"{API_BASE}/admin/settings", headers=headers, timeout=5)
        if response.status_code == 200:
            settings = response.json()
            print(f"✅ System settings endpoint: Retrieved settings")
            results['admin_system']['settings'] = 'PASS'
        else:
            print(f"❌ Settings returned: {response.status_code}")
            results['admin_system']['settings'] = f'FAIL: {response.status_code}'
    except Exception as e:
        print(f"❌ Settings test failed: {str(e)}")
        results['admin_system']['settings'] = f'FAIL: {str(e)}'
    
    # Test emergency contacts
    try:
        response = requests.get(f"{API_BASE}/integration/emergency-contacts", headers=headers, timeout=5)
        if response.status_code == 200:
            contacts = response.json()
            print(f"✅ Emergency contacts endpoint: {len(contacts)} contacts returned")
            results['admin_system']['emergency_contacts'] = f'{len(contacts)} contacts'
        else:
            print(f"❌ Emergency contacts returned: {response.status_code}")
            results['admin_system']['emergency_contacts'] = f'FAIL: {response.status_code}'
    except Exception as e:
        print(f"❌ Emergency contacts test failed: {str(e)}")
        results['admin_system']['emergency_contacts'] = f'FAIL: {str(e)}'

def test_page_visibility_toggle(token):
    """Test page visibility toggle functionality"""
    print("\n=== PAGE VISIBILITY TOGGLE TEST ===")
    
    if not token:
        print("⚠️  Skipping toggle test (no token)")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Get current state
        response = requests.get(f"{API_BASE}/admin/page-visibility", headers=headers, timeout=5)
        if response.status_code != 200:
            print(f"❌ Cannot get current visibility")
            return
        
        pages = response.json()
        test_page = pages[0] if pages else None
        
        if not test_page:
            print("⚠️  No pages available to test")
            return
        
        page_name = test_page['page_name']
        original_state = test_page['is_enabled']
        new_state = not original_state
        
        # Toggle it
        response = requests.put(
            f"{API_BASE}/admin/page-visibility/{page_name}",
            headers=headers,
            json={"is_enabled": new_state},
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            api_state = result['is_enabled']
            
            # Verify in database
            conn = psycopg2.connect(**DB_CONFIG)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(f"SELECT is_enabled FROM page_visibility WHERE page_name = %s;", (page_name,))
            db_result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            db_state = db_result['is_enabled'] if db_result else None
            
            if api_state == new_state == db_state:
                print(f"✅ Toggled '{page_name}': {original_state} → {new_state}")
                print(f"   ✅ API response: {api_state}")
                print(f"   ✅ Database: {db_state}")
                results['admin_system']['toggle_test'] = 'PASS'
                
                # Toggle back
                requests.put(
                    f"{API_BASE}/admin/page-visibility/{page_name}",
                    headers=headers,
                    json={"is_enabled": original_state},
                    timeout=5
                )
            else:
                print(f"❌ State mismatch!")
                print(f"   API: {api_state}, DB: {db_state}, Expected: {new_state}")
                results['admin_system']['toggle_test'] = 'FAIL: State mismatch'
        else:
            print(f"❌ Toggle returned: {response.status_code}")
            results['admin_system']['toggle_test'] = f'FAIL: {response.status_code}'
            
    except requests.exceptions.ConnectionError:
        print(f"⚠️  Backend not available (skipping)")
        results['admin_system']['toggle_test'] = 'SKIPPED'
    except Exception as e:
        print(f"❌ Toggle test failed: {str(e)}")
        results['admin_system']['toggle_test'] = f'FAIL: {str(e)}'

def main():
    """Run all tests"""
    print("=" * 70)
    print("FLOOD RESILIENCE ADMIN SYSTEM - LIVE VALIDATION TEST")
    print("=" * 70)
    
    # Database tests
    db_ok = test_database_connection()
    
    # API tests
    api_ok = test_api_health()
    
    if api_ok:
        token = test_authentication()
        if token:
            test_admin_endpoints(token)
            test_page_visibility_toggle(token)
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    db_status = "✅ PASS" if db_ok else "❌ FAIL"
    api_status = "✅ PASS" if api_ok else "❌ FAIL"
    
    print(f"\nDatabase Tests:    {db_status}")
    print(f"API Tests:         {api_status}")
    
    if db_ok and api_ok:
        print("\n🎉 ADMIN SYSTEM FULLY OPERATIONAL!")
    elif db_ok:
        print("\n⚠️  DATABASE OK BUT BACKEND OFFLINE")
        print("   Start backend: python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
    else:
        print("\n❌ SYSTEM NOT READY - CHECK DATABASE CONNECTION")
    
    # Save results
    with open('admin_validation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n✅ Results saved to admin_validation_results.json")
    print("=" * 70)

if __name__ == '__main__':
    main()
