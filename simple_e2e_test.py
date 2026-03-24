#!/usr/bin/env python3
"""
MINIMAL E2E VALIDATION TEST
Direct tests without external dependencies
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
import traceback

results = {'tests': [], 'status': 'RUNNING'}

def test(name, func):
    """Run a test and record results"""
    try:
        result = func()
        results['tests'].append({
            'name': name,
            'status': 'PASS' if result else 'FAIL',
            'result': result
        })
        print(f"✓ {name}: PASS" if result else f"✗ {name}: FAIL")
        return result
    except Exception as e:
        results['tests'].append({
            'name': name,
            'status': 'ERROR',
            'error': str(e)
        })
        print(f"✗ {name}: ERROR - {str(e)}")
        return False

def db_connect():
    """Test database connectivity"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='flood_resilience',
            user='postgres',
            password='2001'
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT version();")
        version = cursor.fetchone()['version']
        cursor.close()
        conn.close()
        print(f"  Database: {version.split(',')[0]}")
        return True
    except Exception as e:
        print(f"  Error: {e}")
        raise

def db_tables():
    """Test critical tables exist"""
    conn = psycopg2.connect(host='localhost', port=5432, database='flood_resilience', user='postgres', password='2001')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    tables = ['users', 'roles', 'page_visibility', 'system_settings_config', 'emergency_contacts', 'citizen_reports', 'broadcasts', 'districts']
    
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM {table};")
            cnt = cursor.fetchone()['cnt']
            print(f"  {table}: {cnt} records")
        except Exception as e:
            cursor.close()
            conn.close()
            return False
    
    cursor.close()
    conn.close()
    return True

def db_page_visibility():
    """Test page visibility data"""
    conn = psycopg2.connect(host='localhost', port=5432, database='flood_resilience', user='postgres', password='2001')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT COUNT(*) as cnt FROM page_visibility;")
    count = cursor.fetchone()['cnt']
    
    cursor.execute("SELECT page_name, is_enabled FROM page_visibility LIMIT 3;")
    pages = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"  Total pages: {count}")
    for p in pages:
        print(f"    {p['page_name']}: {p['is_enabled']}")
    
    return count > 0

def db_system_settings():
    """Test system settings"""
    conn = psycopg2.connect(host='localhost', port=5432, database='flood_resilience', user='postgres', password='2001')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT dark_mode, sound_alerts, push_notifications, data_collection, anonymous_reporting FROM system_settings_config LIMIT 1;")
    settings = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if settings:
        print(f"  dark_mode: {settings['dark_mode']}")
        print(f"  sound_alerts: {settings['sound_alerts']}")
        print(f"  push_notifications: {settings['push_notifications']}")
        print(f"  data_collection: {settings['data_collection']}")
        print(f"  anonymous_reporting: {settings['anonymous_reporting']}")
        return True
    return False

def db_emergency_contacts():
    """Test emergency contacts"""
    conn = psycopg2.connect(host='localhost', port=5432, database='flood_resilience', user='postgres', password='2001')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT COUNT(*) as cnt FROM emergency_contacts WHERE is_active = true;")
    count = cursor.fetchone()['cnt']
    
    cursor.execute("SELECT name, phone, category FROM emergency_contacts WHERE is_active = true LIMIT 3;")
    contacts = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"  Active contacts: {count}")
    for c in contacts:
        print(f"    {c['name']} ({c['category']}): {c['phone']}")
    
    return count > 0

def db_integrity():
    """Test referential integrity"""
    conn = psycopg2.connect(host='localhost', port=5432, database='flood_resilience', user='postgres', password='2001')
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT COUNT(*) as orphaned 
        FROM citizen_reports cr
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cr.reporter_id)
    """)
    orphaned = cursor.fetchone()['orphaned']
    
    cursor.close()
    conn.close()
    
    print(f"  Orphaned reports: {orphaned}")
    return orphaned == 0

def api_health():
    """Test API health endpoint"""
    try:
        import requests
        response = requests.get('http://localhost:8001/health', timeout=3)
        print(f"  Health status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"  Backend unavailable: {e}")
        return False

# Run all tests
print("\n" + "="*70)
print("FLOOD RESILIENCE - E2E VALIDATION TEST")
print("="*70 + "\n")

print("[DATABASE TESTS]")
test("Database Connectivity", db_connect)
test("Critical Tables", db_tables)
test("Page Visibility Data", db_page_visibility)
test("System Settings", db_system_settings)
test("Emergency Contacts", db_emergency_contacts)
test("Referential Integrity", db_integrity)

print("\n[API TESTS]")
test("API Health Check", api_health)

# Summary
passed = sum(1 for t in results['tests'] if t['status'] == 'PASS')
failed = sum(1 for t in results['tests'] if t['status'] != 'PASS')
total = len(results['tests'])

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Tests Run:    {total}")
print(f"Passed:       {passed}")
print(f"Failed:       {failed}")
print(f"Pass Rate:    {(passed/total)*100:.1f}%")

if failed == 0:
    results['status'] = 'ALL TESTS PASSED'
    print("\nSTATUS: ✓ ADMIN SYSTEM FULLY OPERATIONAL")
else:
    results['status'] = f'{failed} TESTS FAILED'

print("="*70 + "\n")

# Save results
with open('e2e_validation_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Results saved to: e2e_validation_results.json\n")
