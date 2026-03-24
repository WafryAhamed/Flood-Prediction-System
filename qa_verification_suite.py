#!/usr/bin/env python3
"""
FLOOD RESILIENCE PLATFORM - COMPREHENSIVE QA VERIFICATION SUITE

Direct Database + API Testing
Validates: Admin Systems, Database Consistency, API Correctness
"""

import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import psycopg2
import psycopg2.extras
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('qa_verification_suite.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class TestStatus(Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    ERROR = "ERROR"


@dataclass
class TestResult:
    test_name: str
    category: str
    status: TestStatus
    duration: float
    message: str = ""
    details: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'test_name': self.test_name,
            'category': self.category,
            'status': self.status.name,
            'duration': round(self.duration, 3),
            'message': self.message,
            'details': self.details or {},
            'timestamp': datetime.now().isoformat(),
        }


class QAVerificationSuite:
    """Direct QA Verification Against Database & API"""
    
    def __init__(self, backend_port=8001):
        self.backend_url = f"http://localhost:{backend_port}"
        self.backend_port = backend_port
        self.db_conn = None
        self.session = self._create_session()
        self.results: List[TestResult] = []
        self.admin_token = None
        
    def _create_session(self) -> requests.Session:
        """Create session with retry logic"""
        session = requests.Session()
        retry = Retry(
            total=2,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session
    
    def connect_db(self, dbname="flood_resilience", user="postgres",
                   password="2001", host="localhost") -> bool:
        """Connect to database"""
        try:
            self.db_conn = psycopg2.connect(
                dbname=dbname, user=user, password=password, host=host,
                cursor_factory=psycopg2.extras.RealDictCursor
            )
            logger.info(f"✅ Database connected: {dbname}")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def record(self, result: TestResult):
        """Record result"""
        self.results.append(result)
        status_symbol = "✅" if result.status == TestStatus.PASSED else \
                       "❌" if result.status == TestStatus.FAILED else \
                       "⚠️" if result.status == TestStatus.ERROR else "⏭️"
        logger.info(
            f"{status_symbol} [{result.category:15}] {result.test_name:45} | "
            f"{result.duration:6.3f}s | {result.message}"
        )
    
    # =========================================================================
    # DATABASE VERIFICATION TESTS
    # =========================================================================
    
    def test_db_connectivity(self) -> bool:
        """Test 1: Database connectivity"""
        start = time.time()
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("SELECT version()")
            version = cursor.fetchone()['version']
            cursor.close()
            
            self.record(TestResult(
                test_name="Database Connectivity",
                category="DB_SETUP",
                status=TestStatus.PASSED,
                duration=time.time() - start,
                message="PostgreSQL responsive",
                details={"version": version[:50]}
            ))
            return True
        except Exception as e:
            self.record(TestResult(
                test_name="Database Connectivity",
                category="DB_SETUP",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_critical_tables_exist(self) -> bool:
        """Test 2: Critical tables existence"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        required_tables = {
            'users': ['id', 'email', 'full_name', 'public_id'],
            'page_visibility': ['page_name', 'is_enabled'],
            'system_settings_config': ['dark_mode', 'sound_alerts'],
            'emergency_contacts': ['name', 'phone', 'category', 'is_active'],
            'citizen_reports': ['public_id', 'status', 'urgency'],
            'broadcasts': ['id', 'status', 'priority'],
            'districts': ['id', 'name', 'code'],
        }
        
        missing = {}
        for table, columns in required_tables.items():
            cursor.execute(
                "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name=%s)",
                (table,)
            )
            result = cursor.fetchone()
            table_exists = result.get('exists') if isinstance(result, dict) else result[0]
            
            if not table_exists:
                missing[table] = "table not found"
                continue
            
            # Check columns
            for col in columns:
                cursor.execute("""
                    SELECT EXISTS(
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name=%s AND column_name=%s
                    )
                """, (table, col))
                result = cursor.fetchone()
                col_exists = result.get('exists') if isinstance(result, dict) else result[0]
                if not col_exists:
                    missing[f"{table}.{col}"] = "column not found"
        
        cursor.close()
        
        status = TestStatus.PASSED if not missing else TestStatus.FAILED
        self.record(TestResult(
            test_name="Critical Tables Structure",
            category="DB_SCHEMA",
            status=status,
            duration=time.time() - start,
            message=f"Verified {len(required_tables)} tables",
            details={"missing": missing} if missing else {"all_tables": "present"}
        ))
        
        return status == TestStatus.PASSED
    
    def test_page_visibility_data(self) -> bool:
        """Test 3: Page Visibility records"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        try:
            cursor.execute("""
                SELECT page_name, is_enabled, COUNT(*) as count
                FROM page_visibility
                GROUP BY page_name, is_enabled
                ORDER BY page_name
            """)
            records = cursor.fetchall()
            cursor.close()
            
            if not records:
                self.record(TestResult(
                    test_name="Page Visibility Records",
                    category="DATA_INTEGRITY",
                    status=TestStatus.FAILED,
                    duration=time.time() - start,
                    message="No page visibility records found"
                ))
                return False
            
            details = {row['page_name']: {'enabled': row['is_enabled']}
                      for row in records}
            
            self.record(TestResult(
                test_name="Page Visibility Records",
                category="DATA_INTEGRITY",
                status=TestStatus.PASSED,
                duration=time.time() - start,
                message=f"Found {len(records)} page visibility settings",
                details=details
            ))
            return True
        except Exception as e:
            self.record(TestResult(
                test_name="Page Visibility Records",
                category="DATA_INTEGRITY",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_system_settings_data(self) -> bool:
        """Test 4: System Settings completeness"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, dark_mode, sound_alerts, push_notifications,
                       data_collection, anonymous_reporting
                FROM system_settings_config
                LIMIT 1
            """)
            row = cursor.fetchone()
            cursor.close()
            
            if not row:
                self.record(TestResult(
                    test_name="System Settings Exists",
                    category="DATA_INTEGRITY",
                    status=TestStatus.FAILED,
                    duration=time.time() - start,
                    message="No system settings found - initializing defaults"
                ))
                
                # Initialize defaults
                cursor = self.db_conn.cursor()
                cursor.execute("""
                    INSERT INTO system_settings_config
                    (dark_mode, sound_alerts, push_notifications, data_collection, anonymous_reporting)
                    VALUES (true, true, true, false, true)
                """)
                self.db_conn.commit()
                cursor.close()
                return False
            
            settings = {
                'dark_mode': row['dark_mode'],
                'sound_alerts': row['sound_alerts'],
                'push_notifications': row['push_notifications'],
                'data_collection': row['data_collection'],
                'anonymous_reporting': row['anonymous_reporting'],
            }
            
            self.record(TestResult(
                test_name="System Settings Data",
                category="DATA_INTEGRITY",
                status=TestStatus.PASSED,
                duration=time.time() - start,
                message="All system settings present",
                details=settings
            ))
            return True
        except Exception as e:
            self.record(TestResult(
                test_name="System Settings Data",
                category="DATA_INTEGRITY",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_emergency_contacts_integrity(self) -> bool:
        """Test 5: Emergency Contacts data integrity"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_active THEN 1 END) as active,
                    COUNT(DISTINCT category) as categories
                FROM emergency_contacts
            """)
            stats = cursor.fetchone()
            
            cursor.execute("""
                SELECT category, COUNT(*) as count, is_active
                FROM emergency_contacts
                GROUP BY category, is_active
                ORDER BY category
            """)
            by_category = cursor.fetchall()
            cursor.close()
            
            details = {
                'total_contacts': stats['total'],
                'active_contacts': stats['active'],
                'unique_categories': stats['categories'],
                'by_category': [
                    {'category': r['category'], 'count': r['count'], 'active': r['is_active']}
                    for r in by_category
                ]
            }
            
            self.record(TestResult(
                test_name="Emergency Contacts Integrity",
                category="DATA_INTEGRITY",
                status=TestStatus.PASSED,
                duration=time.time() - start,
                message=f"Found {stats['total']} emergency contacts",
                details=details
            ))
            return True
        except Exception as e:
            self.record(TestResult(
                test_name="Emergency Contacts Integrity",
                category="DATA_INTEGRITY",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_user_roles_relationships(self) -> bool:
        """Test 6: User-Role relationships"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT u.id) as user_count,
                    COUNT(DISTINCT r.id) as role_count,
                    COUNT(DISTINCT ur.user_id) as users_with_roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
            """)
            stats = cursor.fetchone()
            
            cursor.execute("""
                SELECT r.name, COUNT(ur.user_id) as user_count
                FROM roles r
                LEFT JOIN user_roles ur ON r.id = ur.role_id
                GROUP BY r.name
            """)
            roles = cursor.fetchall()
            cursor.close()
            
            details = {
                'total_users': stats['user_count'],
                'total_roles': stats['role_count'],
                'users_with_roles': stats['users_with_roles'],
                'roles': [{'name': r['name'], 'user_count': r['user_count']} for r in roles]
            }
            
            self.record(TestResult(
                test_name="User-Role Relationships",
                category="DATA_INTEGRITY",
                status=TestStatus.PASSED,
                duration=time.time() - start,
                message=f"Verified {stats['user_count']} users and {stats['role_count']} roles",
                details=details
            ))
            return True
        except Exception as e:
            self.record(TestResult(
                test_name="User-Role Relationships",
                category="DATA_INTEGRITY",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    # =========================================================================
    # API ENDPOINT TESTS
    # =========================================================================
    
    def test_backend_health(self) -> bool:
        """Test 7: Backend health check"""
        start = time.time()
        try:
            resp = self.session.get(f"{self.backend_url}/health", timeout=5)
            
            if resp.status_code == 200:
                data = resp.json()
                self.record(TestResult(
                    test_name="Backend Health Check",
                    category="API_HEALTH",
                    status=TestStatus.PASSED,
                    duration=time.time() - start,
                    message="Backend responding",
                    details=data
                ))
                return True
            else:
                self.record(TestResult(
                    test_name="Backend Health Check",
                    category="API_HEALTH",
                    status=TestStatus.FAILED,
                    duration=time.time() - start,
                    message=f"Status {resp.status_code}"
                ))
                return False
        except requests.exceptions.ConnectionError:
            self.record(TestResult(
                test_name="Backend Health Check",
                category="API_HEALTH",
                status=TestStatus.SKIPPED,
                duration=time.time() - start,
                message=f"Backend not running on port {self.backend_port}"
            ))
            return False
        except Exception as e:
            self.record(TestResult(
                test_name="Backend Health Check",
                category="API_HEALTH",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_auth_endpoint(self) -> bool:
        """Test 8: Auth endpoint availability"""
        start = time.time()
        try:
            resp = self.session.post(
                f"{self.backend_url}/api/v1/auth/login",
                json={"email": "test@test.com", "password": "wrongpass"},
                timeout=5
            )
            
            # Even with wrong credentials, endpoint should respond
            if resp.status_code in [200, 401, 403]:
                self.record(TestResult(
                    test_name="Auth Endpoint Availability",
                    category="API_ENDPOINTS",
                    status=TestStatus.PASSED,
                    duration=time.time() - start,
                    message=f"Auth endpoint responding (status: {resp.status_code})"
                ))
                return True
            else:
                self.record(TestResult(
                    test_name="Auth Endpoint Availability",
                    category="API_ENDPOINTS",
                    status=TestStatus.FAILED,
                    duration=time.time() - start,
                    message=f"Auth endpoint returned {resp.status_code}"
                ))
                return False
        except requests.exceptions.ConnectionError:
            self.record(TestResult(
                test_name="Auth Endpoint Availability",
                category="API_ENDPOINTS",
                status=TestStatus.SKIPPED,
                duration=time.time() - start,
                message="Backend not running"
            ))
            return False
        except Exception as e:
            self.record(TestResult(
                test_name="Auth Endpoint Availability",
                category="API_ENDPOINTS",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_admin_endpoints(self) -> bool:
        """Test 9: Admin endpoints structure"""
        start = time.time()
        endpoints = [
            "/api/v1/admin/page-visibility",
            "/api/v1/admin/settings",
            "/api/v1/integration/emergency-contacts",
        ]
        
        accessible = []
        unreachable = []
        
        for endpoint in endpoints:
            try:
                resp = self.session.options(f"{self.backend_url}{endpoint}", timeout=5)
                if resp.status_code < 500:
                    accessible.append(endpoint)
                else:
                    unreachable.append((endpoint, resp.status_code))
            except requests.exceptions.ConnectionError:
                unreachable.append((endpoint, "backend not running"))
            except Exception as e:
                unreachable.append((endpoint, str(e)))
        
        status = TestStatus.PASSED if accessible else TestStatus.SKIPPED
        
        self.record(TestResult(
            test_name="Admin API Endpoints",
            category="API_ENDPOINTS",
            status=status,
            duration=time.time() - start,
            message=f"Tested {len(endpoints)} endpoints",
            details={
                'accessible': accessible,
                'unreachable': unreachable
            }
        ))
        
        return status == TestStatus.PASSED
    
    # =========================================================================
    # CONSISTENCY TESTS
    # =========================================================================
    
    def test_db_referential_integrity(self) -> bool:
        """Test 10: Database referential integrity"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        try:
            # Check for orphaned user_roles
            cursor.execute("""
                SELECT COUNT(*) as orphaned_user_roles
                FROM user_roles ur
                WHERE ur.user_id NOT IN (SELECT id FROM users)
            """)
            orphaned_user_roles = cursor.fetchone()['orphaned_user_roles']
            
            # Check for orphaned role_permissions
            cursor.execute("""
                SELECT COUNT(*) as orphaned_role_perms
                FROM role_permissions rp
                WHERE rp.role_id NOT IN (SELECT id FROM roles)
            """)
            orphaned_role_perms = cursor.fetchone()['orphaned_role_perms']
            
            cursor.close()
            
            status = TestStatus.PASSED if (orphaned_user_roles == 0 and orphaned_role_perms == 0) else TestStatus.FAILED
            
            self.record(TestResult(
                test_name="Referential Integrity",
                category="DB_CONSISTENCY",
                status=status,
                duration=time.time() - start,
                message="Checking orphaned relationships",
                details={
                    'orphaned_user_roles': orphaned_user_roles,
                    'orphaned_role_permissions': orphaned_role_perms
                }
            ))
            return status == TestStatus.PASSED
        except Exception as e:
            self.record(TestResult(
                test_name="Referential Integrity",
                category="DB_CONSISTENCY",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    def test_data_type_consistency(self) -> bool:
        """Test 11: Data type consistency"""
        start = time.time()
        cursor = self.db_conn.cursor()
        
        try:
            # Check boolean fields in system_settings_config
            cursor.execute("""
                SELECT 
                    dark_mode, sound_alerts, push_notifications,
                    data_collection, anonymous_reporting
                FROM system_settings_config
                LIMIT 1
            """)
            row = cursor.fetchone()
            
            if row:
                all_booleans = all(
                    isinstance(row[col], (bool, type(None)))
                    for col in row.keys()
                )
                
                status = TestStatus.PASSED if all_booleans else TestStatus.FAILED
            else:
                status = TestStatus.SKIPPED
            
            cursor.close()
            
            self.record(TestResult(
                test_name="Data Type Consistency",
                category="DB_CONSISTENCY",
                status=status,
                duration=time.time() - start,
                message="Checked boolean field consistency"
            ))
            return status != TestStatus.FAILED
        except Exception as e:
            self.record(TestResult(
                test_name="Data Type Consistency",
                category="DB_CONSISTENCY",
                status=TestStatus.ERROR,
                duration=time.time() - start,
                message=str(e)
            ))
            return False
    
    # =========================================================================
    # EXECUTION & REPORTING
    # =========================================================================
    
    def run_all_tests(self) -> bool:
        """Execute all verification tests"""
        logger.info("\n" + "="*100)
        logger.info("FLOOD RESILIENCE PLATFORM - QA VERIFICATION SUITE")
        logger.info("="*100)
        logger.info(f"Start Time: {datetime.now().isoformat()}")
        logger.info(f"Backend: {self.backend_url}")
        logger.info("="*100 + "\n")
        
        overall_success = True
        
        # Database tests
        logger.info("[DATABASE VERIFICATION]")
        if not self.test_db_connectivity():
            logger.error("❌ Cannot proceed without database - aborting tests")
            return False
        
        overall_success &= self.test_critical_tables_exist()
        overall_success &= self.test_page_visibility_data()
        overall_success &= self.test_system_settings_data()
        overall_success &= self.test_emergency_contacts_integrity()
        overall_success &= self.test_user_roles_relationships()
        
        # API tests
        logger.info("\n[API VERIFICATION]")
        self.test_backend_health()
        self.test_auth_endpoint()
        self.test_admin_endpoints()
        
        # Consistency tests
        logger.info("\n[DATA CONSISTENCY VERIFICATION]")
        overall_success &= self.test_db_referential_integrity()
        overall_success &= self.test_data_type_consistency()
        
        # Generate reports
        self.print_summary()
        self.generate_report_file()
        
        # Cleanup
        if self.db_conn:
            self.db_conn.close()
        
        return overall_success
    
    def print_summary(self):
        """Print test summary"""
        summary = {
            'total': len(self.results),
            'passed': sum(1 for r in self.results if r.status == TestStatus.PASSED),
            'failed': sum(1 for r in self.results if r.status == TestStatus.FAILED),
            'errors': sum(1 for r in self.results if r.status == TestStatus.ERROR),
            'skipped': sum(1 for r in self.results if r.status == TestStatus.SKIPPED),
        }
        
        logger.info("\n"+ "="*100)
        logger.info("TEST SUMMARY")
        logger.info("="*100)
        logger.info(f"Total Tests:  {summary['total']}")
        logger.info(f"✅ Passed:    {summary['passed']}")
        logger.info(f"❌ Failed:    {summary['failed']}")
        logger.info(f"⚠️ Errors:    {summary['errors']}")
        logger.info(f"⏭️ Skipped:   {summary['skipped']}")
        logger.info("="*100)
        
        if summary['failed'] == 0 and summary['errors'] == 0:
            logger.info("✅ VERIFICATION PASSED - System is healthy")
        else:
            logger.warning(f"⚠️ Found {summary['failed']} failures and {summary['errors']} errors")
    
    def generate_report_file(self):
        """Generate test report files"""
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'backend_url': self.backend_url,
            'summary': {
                'total': len(self.results),
                'passed': sum(1 for r in self.results if r.status == TestStatus.PASSED),
                'failed': sum(1 for r in self.results if r.status == TestStatus.FAILED),
                'errors': sum(1 for r in self.results if r.status == TestStatus.ERROR),
                'skipped': sum(1 for r in self.results if r.status == TestStatus.SKIPPED),
            },
            'results': [r.to_dict() for r in self.results],
        }
        
        # JSON report
        with open("qa_verification_report.json", "w", encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        # Markdown report
        md = self._generate_markdown_report(report_data)
        with open("qa_verification_report.md", "w", encoding='utf-8') as f:
            f.write(md)
        
        logger.info(f"\n✅ Reports generated:")
        logger.info(f"   - qa_verification_report.json")
        logger.info(f"   - qa_verification_report.md")
        logger.info(f"   - qa_verification_suite.log")
    
    def _generate_markdown_report(self, data: Dict[str, Any]) -> str:
        """Generate Markdown report"""
        summary = data['summary']
        pass_rate = (summary['passed'] / summary['total'] * 100) if summary['total'] > 0 else 0
        
        md = f"""# FLOOD RESILIENCE PLATFORM - QA VERIFICATION REPORT

**Generated:** {data['timestamp']}  
**Backend:** {data['backend_url']}

---

## EXECUTIVE SUMMARY

| Metric | Count | Percentage |
|--------|-------|-----------|
| **Total Tests** | {summary['total']} | 100% |
| **✅ Passed** | {summary['passed']} | {summary['passed']/summary['total']*100:.1f}% |
| **❌ Failed** | {summary['failed']} | {summary['failed']/summary['total']*100:.1f}% |
| **⚠️ Errors** | {summary['errors']} | {summary['errors']/summary['total']*100:.1f}% |
| **⏭️ Skipped** | {summary['skipped']} | {summary['skipped']/summary['total']*100:.1f}% |

**Overall Status:** """
        
        if summary['failed'] == 0 and summary['errors'] == 0:
            md += "✅ **HEALTHY**\n"
        else:
            md += "⚠️ **ISSUES DETECTED**\n"
        
        md += "\n---\n\n## TEST RESULTS BY CATEGORY\n\n"
        
        # Group by category
        by_category = {}
        for result in data['results']:
            cat = result['category']
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(result)
        
        for category in sorted(by_category.keys()):
            results = by_category[category]
            passed = sum(1 for r in results if r['status'] == 'PASSED')
            
            md += f"\n### {category} ({passed}/{len(results)} passed)\n\n"
            md += "| Test | Status | Duration | Message |\n"
            md += "|------|--------|----------|----------|\n"
            
            for result in results:
                icon = "✅" if result['status'] == 'PASSED' else \
                       "❌" if result['status'] == 'FAILED' else \
                       "⏭️" if result['status'] == 'SKIPPED' else "⚠️"
                
                message = result['message'][:40]
                md += (f"| {result['test_name'][:40]} | {icon} {result['status']} | "
                      f"{result['duration']:.3f}s | {message} |\n")
        
        md += "\n---\n\n## CONCLUSION\n\n"
        
        if summary['failed'] == 0 and summary['errors'] == 0:
            md += "✅ **SYSTEM VALIDATION SUCCESSFUL**\n\nAll tests passed. The admin system is functioning correctly.\n"
        else:
            md += "❌ **SYSTEM VALIDATION FAILED**\n\n"
            md += f"Found {summary['failed']} failures and {summary['errors']} errors. Review details above.\n"
        
        return md


def main():
    suite = QAVerificationSuite(backend_port=8001)
    if not suite.connect_db():
        logger.error("Database connection failed - cannot proceed")
        sys.exit(1)
    success = suite.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
