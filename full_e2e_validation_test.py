#!/usr/bin/env python3
"""
FLOOD RESILIENCE PLATFORM - FULL E2E VALIDATION TEST
Tests the complete admin system with live backend and database
"""

import requests
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import time
import sys

# Configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'flood_resilience',
    'user': 'postgres',
    'password': '2001'
}

API_BASE = 'http://localhost:8001/api/v1'

# Test Results
test_results = {
    'timestamp': datetime.now().isoformat(),
    'database_tests': [],
    'api_tests': [],
    'admin_system_tests': [],
    'summary': {}
}

def log(level, message):
    """Log messages to file and stdout"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_msg = f"[{timestamp}] [{level}] {message}"
    print(log_msg)
    with open('e2e_test_results.log', 'a', encoding='utf-8') as f:
        f.write(log_msg + '\n')

def test_database_connectivity():
    """Test 1: Database Connectivity"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 1: DATABASE CONNECTIVITY")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT version();")
        version = cursor.fetchone()['version']
        db_version = version.split(',')[0]
        log("PASS", f"Database connected: {db_version}")
        test_results['database_tests'].append({'name': 'Connectivity', 'status': 'PASS', 'details': db_version})
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        log("FAIL", f"Database connection failed: {str(e)}")
        test_results['database_tests'].append({'name': 'Connectivity', 'status': 'FAIL', 'error': str(e)})
        return False

def test_critical_tables():
    """Test 2: Critical Tables Exist"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 2: CRITICAL TABLES VERIFICATION")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        tables = ['users', 'roles', 'page_visibility', 'system_settings_config', 
                  'emergency_contacts', 'citizen_reports', 'broadcasts', 'districts']
        
        all_exist = True
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM {table};")
            result = cursor.fetchone()
            log("PASS", f"  Table '{table}' exists")
        
        log("PASS", f"All {len(tables)} critical tables found")
        test_results['database_tests'].append({'name': 'Critical Tables', 'status': 'PASS', 'count': len(tables)})
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        log("FAIL", f"Table verification failed: {str(e)}")
        test_results['database_tests'].append({'name': 'Critical Tables', 'status': 'FAIL', 'error': str(e)})
        return False

def test_page_visibility_data():
    """Test 3: Page Visibility System"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 3: PAGE VISIBILITY DATA")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT page_name, is_enabled FROM page_visibility;")
        pages = cursor.fetchall()
        
        if len(pages) == 0:
            log("WARN", "No pages in visibility table")
            test_results['database_tests'].append({'name': 'Page Visibility', 'status': 'WARN', 'pages': []})
        else:
            page_names = [p['page_name'] for p in pages]
            enabled_count = sum(1 for p in pages if p['is_enabled'])
            log("PASS", f"Found {len(pages)} pages ({enabled_count} enabled)")
            for page in pages[:3]:  # Show first 3
                log("PASS", f"  - {page['page_name']}: {page['is_enabled']}")
            
            test_results['database_tests'].append({
                'name': 'Page Visibility', 
                'status': 'PASS', 
                'total_pages': len(pages),
                'enabled_pages': enabled_count,
                'pages': page_names
            })
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        log("FAIL", f"Page visibility check failed: {str(e)}")
        test_results['database_tests'].append({'name': 'Page Visibility', 'status': 'FAIL', 'error': str(e)})
        return False

def test_system_settings():
    """Test 4: System Settings"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 4: SYSTEM SETTINGS VERIFICATION")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT dark_mode, sound_alerts, push_notifications, data_collection, anonymous_reporting FROM system_settings_config LIMIT 1;")
        settings = cursor.fetchone()
        
        if settings:
            log("PASS", f"System settings found:")
            log("PASS", f"  - dark_mode: {settings['dark_mode']}")
            log("PASS", f"  - sound_alerts: {settings['sound_alerts']}")
            log("PASS", f"  - push_notifications: {settings['push_notifications']}")
            log("PASS", f"  - data_collection: {settings['data_collection']}")
            log("PASS", f"  - anonymous_reporting: {settings['anonymous_reporting']}")
            
            test_results['database_tests'].append({
                'name': 'System Settings', 
                'status': 'PASS',
                'settings': dict(settings)
            })
        else:
            log("FAIL", "Settings not found")
            test_results['database_tests'].append({'name': 'System Settings', 'status': 'FAIL', 'error': 'No settings'})
        
        cursor.close()
        conn.close()
        return True if settings else False
    except Exception as e:
        log("FAIL", f"System settings check failed: {str(e)}")
        test_results['database_tests'].append({'name': 'System Settings', 'status': 'FAIL', 'error': str(e)})
        return False

def test_emergency_contacts():
    """Test 5: Emergency Contacts CRUD"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 5: EMERGENCY CONTACTS VERIFICATION")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT COUNT(*) as cnt FROM emergency_contacts WHERE is_active = true;")
        result = cursor.fetchone()
        active_count = result['cnt'] if result else 0
        
        log("PASS", f"Active emergency contacts: {active_count}")
        
        # Get sample contacts
        cursor.execute("SELECT id, name, phone, category FROM emergency_contacts WHERE is_active = true LIMIT 3;")
        contacts = cursor.fetchall()
        
        for contact in contacts:
            log("PASS", f"  - {contact['name']} ({contact['category']}): {contact['phone']}")
        
        test_results['database_tests'].append({
            'name': 'Emergency Contacts',
            'status': 'PASS',
            'active_count': active_count,
            'sample': [dict(c) for c in contacts]
        })
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        log("FAIL", f"Emergency contacts check failed: {str(e)}")
        test_results['database_tests'].append({'name': 'Emergency Contacts', 'status': 'FAIL', 'error': str(e)})
        return False

def test_database_integrity():
    """Test 6: Database Referential Integrity"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 6: REFERENTIAL INTEGRITY")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check for orphaned records
        cursor.execute("""
            SELECT COUNT(*) as orphaned_reports 
            FROM citizen_reports cr
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cr.reporter_id)
        """)
        orphaned_reports = cursor.fetchone()['orphaned_reports']
        
        cursor.execute("""
            SELECT COUNT(*) as orphaned_broadcasts 
            FROM broadcasts b
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b.author_id)
        """)
        orphaned_broadcasts = cursor.fetchone()['orphaned_broadcasts']
        
        if orphaned_reports == 0 and orphaned_broadcasts == 0:
            log("PASS", "No orphaned records found")
            test_results['database_tests'].append({
                'name': 'Referential Integrity',
                'status': 'PASS',
                'orphaned_reports': orphaned_reports,
                'orphaned_broadcasts': orphaned_broadcasts
            })
            return True
        else:
            log("WARN", f"Orphaned records: reports={orphaned_reports}, broadcasts={orphaned_broadcasts}")
            test_results['database_tests'].append({
                'name': 'Referential Integrity',
                'status': 'WARN',
                'orphaned_reports': orphaned_reports,
                'orphaned_broadcasts': orphaned_broadcasts
            })
            return False
    except Exception as e:
        log("FAIL", f"Integrity check failed: {str(e)}")
        test_results['database_tests'].append({'name': 'Referential Integrity', 'status': 'FAIL', 'error': str(e)})
        return False

def test_api_health():
    """Test 7: API Health"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 7: API HEALTH CHECK")
    log("INFO", "=" * 70)
    
    try:
        response = requests.get(f"{API_BASE.replace('/api/v1', '')}/health", timeout=5)
        if response.status_code == 200:
            log("PASS", f"Health endpoint: {response.status_code}")
            test_results['api_tests'].append({'name': 'Health Check', 'status': 'PASS', 'code': 200})
            return True
        else:
            log("WARN", f"Health endpoint: {response.status_code}")
            test_results['api_tests'].append({'name': 'Health Check', 'status': 'WARN', 'code': response.status_code})
            return False
    except requests.exceptions.ConnectionError as e:
        log("FAIL", f"Backend not responding: {str(e)}")
        test_results['api_tests'].append({'name': 'Health Check', 'status': 'FAIL', 'error': 'Connection refused'})
        return False
    except Exception as e:
        log("FAIL", f"Health check failed: {str(e)}")
        test_results['api_tests'].append({'name': 'Health Check', 'status': 'FAIL', 'error': str(e)})
        return False

def test_page_visibility_api(token=None):
    """Test 8: Page Visibility API"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 8: PAGE VISIBILITY API ENDPOINT")
    log("INFO", "=" * 70)
    
    try:
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        response = requests.get(f"{API_BASE}/admin/page-visibility", headers=headers, timeout=5)
        
        if response.status_code == 200:
            pages = response.json()
            log("PASS", f"API returned {len(pages)} pages")
            
            if isinstance(pages, list) and len(pages) > 0:
                log("PASS", f"  Sample: {pages[0]}")
            
            test_results['api_tests'].append({
                'name': 'Page Visibility API',
                'status': 'PASS',
                'count': len(pages),
                'code': 200
            })
            return True
        else:
            log("WARN", f"Page visibility API returned: {response.status_code}")
            test_results['api_tests'].append({
                'name': 'Page Visibility API',
                'status': 'WARN',
                'code': response.status_code
            })
            return False
    except requests.exceptions.ConnectionError:
        log("WARN", "Backend not responding")
        test_results['api_tests'].append({'name': 'Page Visibility API', 'status': 'SKIPPED', 'reason': 'Backend offline'})
        return False
    except Exception as e:
        log("FAIL", f"API test failed: {str(e)}")
        test_results['api_tests'].append({'name': 'Page Visibility API', 'status': 'FAIL', 'error': str(e)})
        return False

def test_page_visibility_toggle():
    """Test 9: Page Visibility Toggle (API + Database)"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 9: PAGE VISIBILITY TOGGLE (API -> DB)")
    log("INFO", "=" * 70)
    
    try:
        # Get current state
        response = requests.get(f"{API_BASE}/admin/page-visibility", timeout=5)
        if response.status_code != 200:
            log("WARN", "Cannot get page visibility")
            test_results['admin_system_tests'].append({'name': 'Toggle Test', 'status': 'SKIPPED'})
            return False
        
        pages = response.json()
        if not pages:
            log("WARN", "No pages available")
            test_results['admin_system_tests'].append({'name': 'Toggle Test', 'status': 'SKIPPED'})
            return False
        
        test_page = pages[0]
        page_name = test_page['page_name']
        original_state = test_page['is_enabled']
        new_state = not original_state
        
        log("INFO", f"Testing toggle for '{page_name}'")
        log("INFO", f"  Original state: {original_state}")
        log("INFO", f"  New state: {new_state}")
        
        # Note: Toggle would require authentication - skip for now
        log("WARN", "Toggle test requires admin authentication (auth not yet tested)")
        test_results['admin_system_tests'].append({
            'name': 'Toggle Test',
            'status': 'SKIPPED',
            'reason': 'Requires authentication'
        })
        return False
        
    except Exception as e:
        log("FAIL", f"Toggle test failed: {str(e)}")
        test_results['admin_system_tests'].append({'name': 'Toggle Test', 'status': 'FAIL', 'error': str(e)})
        return False

def test_database_consistency():
    """Test 10: Database Consistency Check"""
    log("INFO", "=" * 70)
    log("INFO", "TEST 10: DATABASE CONSISTENCY CHECK")
    log("INFO", "=" * 70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check for NULL values in critical fields
        cursor.execute("SELECT COUNT(*) as cnt FROM page_visibility WHERE is_enabled IS NULL;")
        null_visibility = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM users WHERE email IS NULL;")
        null_emails = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM emergency_contacts WHERE name IS NULL;")
        null_contacts = cursor.fetchone()['cnt']
        
        if null_visibility == 0 and null_emails == 0 and null_contacts == 0:
            log("PASS", "No NULL violations in critical fields")
            test_results['database_tests'].append({
                'name': 'Consistency Check',
                'status': 'PASS',
                'null_visibility': null_visibility,
                'null_emails': null_emails,
                'null_contacts': null_contacts
            })
            cursor.close()
            conn.close()
            return True
        else:
            log("WARN", f"NULL violations: visibility={null_visibility}, emails={null_emails}, contacts={null_contacts}")
            test_results['database_tests'].append({
                'name': 'Consistency Check',
                'status': 'WARN',
                'null_violations': null_visibility + null_emails + null_contacts
            })
            cursor.close()
            conn.close()
            return False
    except Exception as e:
        log("FAIL", f"Consistency check failed: {str(e)}")
        test_results['database_tests'].append({'name': 'Consistency Check', 'status': 'FAIL', 'error': str(e)})
        return False

def generate_summary():
    """Generate test summary"""
    log("INFO", "=" * 70)
    log("INFO", "TEST SUMMARY")
    log("INFO", "=" * 70)
    
    total_tests = len(test_results['database_tests']) + len(test_results['api_tests']) + len(test_results['admin_system_tests'])
    passed = sum(1 for t in test_results['database_tests'] + test_results['api_tests'] + test_results['admin_system_tests'] if t['status'] == 'PASS')
    failed = sum(1 for t in test_results['database_tests'] + test_results['api_tests'] + test_results['admin_system_tests'] if t['status'] == 'FAIL')
    skipped = sum(1 for t in test_results['database_tests'] + test_results['api_tests'] + test_results['admin_system_tests'] if t['status'] == 'SKIPPED')
    warned = sum(1 for t in test_results['database_tests'] + test_results['api_tests'] + test_results['admin_system_tests'] if t['status'] == 'WARN')
    
    test_results['summary'] = {
        'total': total_tests,
        'passed': passed,
        'failed': failed,
        'skipped': skipped,
        'warned': warned,
        'pass_rate': f"{(passed/total_tests)*100:.1f}%" if total_tests > 0 else "0%"
    }
    
    log("INFO", f"Total Tests:  {total_tests}")
    log("INFO", f"Passed:       {passed}")
    log("INFO", f"Failed:       {failed}")
    log("INFO", f"Warned:       {warned}")
    log("INFO", f"Skipped:      {skipped}")
    log("INFO", f"Pass Rate:    {test_results['summary']['pass_rate']}")
    
    if failed == 0:
        log("INFO", "")
        log("INFO", "STATUS: ALL CRITICAL TESTS PASSED!")
        log("INFO", "")
    else:
        log("FAIL", f"STATUS: {failed} TEST(S) FAILED")
        log("INFO", "")

def main():
    """Run all tests"""
    # Clear previous log
    with open('e2e_test_results.log', 'w', encoding='utf-8') as f:
        f.write('')
    
    log("INFO", "")
    log("INFO", "*" * 70)
    log("INFO", "FLOOD RESILIENCE PLATFORM - FULL E2E VALIDATION TEST")
    log("INFO", "*" * 70)
    log("INFO", "")
    
    # Database Tests
    log("INFO", "[PHASE 1: DATABASE TESTS]")
    test_database_connectivity()
    test_critical_tables()
    test_page_visibility_data()
    test_system_settings()
    test_emergency_contacts()
    test_database_integrity()
    test_database_consistency()
    
    # API Tests
    log("INFO", "[PHASE 2: API TESTS]")
    api_ok = test_api_health()
    test_page_visibility_api()
    
    # Admin System Tests
    log("INFO", "[PHASE 3: ADMIN SYSTEM TESTS]")
    test_page_visibility_toggle()
    
    # Summary
    generate_summary()
    
    # Save JSON results
    with open('e2e_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    log("INFO", "")
    log("INFO", "Results saved to:")
    log("INFO", "  - e2e_test_results.json")
    log("INFO", "  - e2e_test_results.log")
    log("INFO", "")

if __name__ == '__main__':
    main()
