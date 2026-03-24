#!/usr/bin/env python3
"""
FLOOD RESILIENCE - QUICK SYSTEM VALIDATION SCRIPT
Run this anytime to verify the admin system is operational
Usage: python quick_validation.py
"""

import psycopg2
from datetime import datetime
import sys

def check_database():
    """Quick database check"""
    try:
        conn = psycopg2.connect(
            host='localhost', port=5432,
            database='flood_resilience',
            user='postgres', password='2001'
        )
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("""
            SELECT COUNT(*) FROM users;
        """)
        users = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM page_visibility;
        """)
        pages = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM system_settings_config;
        """)
        settings = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM emergency_contacts WHERE is_active = true;
        """)
        contacts = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return {
            'status': 'PASS',
            'users': users,
            'pages': pages,
            'settings': settings,
            'contacts': contacts
        }
    except Exception as e:
        return {'status': 'FAIL', 'error': str(e)}

def check_backend():
    """Quick backend check"""
    try:
        import requests
        response = requests.get('http://localhost:8001/health', timeout=2)
        return {'status': 'PASS' if response.status_code == 200 else 'FAIL', 'code': response.status_code}
    except:
        return {'status': 'FAIL', 'error': 'Backend not responding'}

def main():
    print("\n" + "="*60)
    print("FLOOD RESILIENCE - SYSTEM VALIDATION")
    print("="*60 + "\n")
    
    print("[1/2] Checking database...")
    db = check_database()
    if db['status'] == 'PASS':
        print(f"✓ Database OK")
        print(f"    Users: {db['users']}")
        print(f"    Pages: {db['pages']}")
        print(f"    Settings: {db['settings']}")
        print(f"    Contacts: {db['contacts']}")
    else:
        print(f"✗ Database FAILED: {db.get('error', 'Unknown error')}")
        return 1
    
    print("\n[2/2] Checking backend API...")
    backend = check_backend()
    if backend['status'] == 'PASS':
        print(f"✓ Backend OK (HTTP {backend['code']})")
    else:
        print(f"✗ Backend FAILED: {backend.get('error', 'Unknown error')}")
        print(f"  → Start backend: python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
        return 1
    
    print("\n" + "="*60)
    print("✓ SYSTEM OPERATIONAL - ALL CHECKS PASSED")
    print("="*60 + "\n")
    return 0

if __name__ == '__main__':
    sys.exit(main())
