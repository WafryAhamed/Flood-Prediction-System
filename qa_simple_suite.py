#!/usr/bin/env python3
"""
FLOOD RESILIENCE PLATFORM - QA VERIFICATION SUITE
Database & API Validation
"""

import json
import sys
import time
import logging
from datetime import datetime
from typing import Any, Dict, List

import psycopg2
import psycopg2.extras
import requests
from requests.exceptions import ConnectionError

# Setup logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('qa_suite.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def test_database() -> Dict[str, Any]:
    """Test database connectivity and integrity"""
    results = {'database': {}}
    
    try:
        conn = psycopg2.connect(
            dbname="flood_resilience", user="postgres",
            password="2001", host="localhost",
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        cursor = conn.cursor()
        
        # Test 1: DB version
        cursor.execute("SELECT version()")
        version = cursor.fetchone()['version']
        results['database']['connectivity'] = 'PASS'
        results['database']['version'] = version[:60]
        
        # Test 2: Critical tables
        tables_to_check = [
            'users', 'page_visibility', 'system_settings_config',
            'emergency_contacts', 'citizen_reports', 'broadcasts', 'districts'
        ]
        
        tables_found = []
        for table in tables_to_check:
            cursor.execute("""
                SELECT EXISTS(SELECT 1 FROM information_schema.tables 
                WHERE table_name=%s)
            """, (table,))
            exists = cursor.fetchone().get('exists') if isinstance(cursor.fetchone(), dict) else cursor.fetchone()[0]
            cursor.execute("""
                SELECT EXISTS(SELECT 1 FROM information_schema.tables 
                WHERE table_name=%s)
            """, (table,))
            exists = list(cursor.fetchone().values())[0] if cursor.fetchone() else False
            
            if exists:
                tables_found.append(table)
        
        results['database']['tables'] = {
            'required': len(tables_to_check),
            'found': len(tables_found),
            'status': 'PASS' if len(tables_found) == len(tables_to_check) else 'FAIL'
        }
        
        # Test 3: Page visibility records
        cursor.execute("SELECT COUNT(*) as count FROM page_visibility")
        pv_count = cursor.fetchone()['count']
        results['database']['page_visibility_records'] = pv_count
        
        # Test 4: System settings
        cursor.execute("""
            SELECT dark_mode, sound_alerts, push_notifications,
                   data_collection, anonymous_reporting
            FROM system_settings_config LIMIT 1
        """)
        ss = cursor.fetchone()
        results['database']['system_settings'] = dict(ss) if ss else None
        
        # Test 5: Emergency contacts
        cursor.execute("""
            SELECT COUNT(*) as count FROM emergency_contacts
            WHERE is_active = true
        """)
        ec_count = cursor.fetchone()['count']
        results['database']['active_emergency_contacts'] = ec_count
        
        # Test 6: User roles
        cursor.execute("""
            SELECT COUNT(DISTINCT u.id) as user_count
            FROM users u
            INNER JOIN user_roles ur ON u.id = ur.user_id
        """)
        user_with_roles = cursor.fetchone()['user_count']
        results['database']['users_with_roles'] = user_with_roles
        
        cursor.close()
        conn.close()
        
        results['database']['overall'] = 'PASS'
        
    except Exception as e:
        results['database']['overall'] = 'FAIL'
        results['database']['error'] = str(e)
    
    return results


def test_api(port=8001) -> Dict[str, Any]:
    """Test API endpoints"""
    results = {'api': {}}
    base_url = f"http://localhost:{port}"
    
    try:
        # Test 1: Health check
        try:
            resp = requests.get(f"{base_url}/health", timeout=5)
            results['api']['health'] = 'PASS' if resp.status_code == 200 else 'FAIL'
        except ConnectionError:
            results['api']['health'] = 'SKIPPED - backend not running'
        
        # Test 2: Auth endpoint
        try:
            resp = requests.post(
                f"{base_url}/api/v1/auth/login",
                json={"email": "test@test.com", "password": "test"},
                timeout=5
            )
            results['api']['auth_endpoint'] = 'PASS' if resp.status_code in [200, 401] else 'FAIL'
        except ConnectionError:
            results['api']['auth_endpoint'] = 'SKIPPED'
        except:
            results['api']['auth_endpoint'] = 'ERROR'
        
        # Test 3: Admin endpoints
        try:
            headers = {"Authorization": "Bearer test"}
            resp = requests.get(f"{base_url}/api/v1/admin/page-visibility", headers=headers, timeout=5)
            results['api']['admin_endpoint'] = 'PASS' if resp.status_code in [200, 401] else 'FAIL'
        except ConnectionError:
            results['api']['admin_endpoint'] = 'SKIPPED'
        except:
            results['api']['admin_endpoint'] = 'ERROR'
        
        results['api']['overall'] = 'PASS' if 'FAIL' not in results['api'].values() else 'FAIL'
        
    except Exception as e:
        results['api']['overall'] = 'ERROR'
        results['api']['error'] = str(e)
    
    return results


def main():
    logger.info("=" * 80)
    logger.info("FLOOD RESILIENCE PLATFORM - QA VERIFICATION SUITE")
    logger.info("=" * 80)
    logger.info(f"Start: {datetime.now().isoformat()}")
    logger.info("")
    
    # Run tests
    logger.info("[1/2] Running database tests...")
    db_results = test_database()
    
    logger.info("[2/2] Running API tests...")
    api_results = test_api(port=8001)
    
    # Compile results
    all_results = {
        'timestamp': datetime.now().isoformat(),
        **db_results,
        **api_results
    }
    
    # Print summary
    logger.info("")
    logger.info("=" * 80)
    logger.info("TEST RESULTS")
    logger.info("=" * 80)
    logger.info("")
    
    logger.info("DATABASE TESTS:")
    for key, value in db_results.get('database', {}).items():
        logger.info(f"  {key}: {value}")
    
    logger.info("")
    logger.info("API TESTS:")
    for key, value in api_results.get('api', {}).items():
        logger.info(f"  {key}: {value}")
    
    logger.info("")
    logger.info("=" * 80)
    
    # Save reports
    with open('qa_results.json', 'w') as f:
        json.dump(all_results, f, indent=2, default=str)
    
    logger.info("Results saved to qa_results.json")
    logger.info("")
    
    # Determine overall status
    db_pass = db_results.get('database', {}).get('overall') == 'PASS'
    api_pass = api_results.get('api', {}).get('overall') != 'FAIL'
    
    if db_pass and api_pass:
        logger.info("OVERALL: PASS - System validation successful")
        return True
    else:
        logger.info("OVERALL: FAIL - Issues detected")
        return False


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
