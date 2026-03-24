#!/usr/bin/env python3
"""
Database connection utility for Flood Resilience System
Provides easy access to PostgreSQL database from Python
"""

import os
import sys
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor


class DBConnection:
    """PostgreSQL connection manager"""
    
    DB_URL = "postgresql://postgres:2001@127.0.0.1:5432/flood_resilience"
    
    @classmethod
    @contextmanager
    def connect(cls):
        """Context manager for database connections"""
        conn = psycopg2.connect(cls.DB_URL)
        try:
            yield conn
        finally:
            conn.close()
    
    @classmethod
    def query(cls, sql, params=None, fetch_all=False):
        """Execute SELECT query and return results"""
        with cls.connect() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(sql, params or [])
            return cursor.fetchall() if fetch_all else cursor.fetchone()
    
    @classmethod
    def execute(cls, sql, params=None, commit=True):
        """Execute INSERT/UPDATE/DELETE query"""
        with cls.connect() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params or [])
            if commit:
                conn.commit()
            return cursor.rowcount
    
    @classmethod
    def test_connection(cls):
        """Test database connectivity"""
        try:
            with cls.connect() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                return True, version
        except Exception as e:
            return False, str(e)


if __name__ == "__main__":
    # Test connection when run directly
    success, result = DBConnection.test_connection()
    if success:
        print(f"✅ Database Connected!")
        print(f"   Version: {result}")
        
        # Show example usage
        print("\n📚 Usage Examples:")
        print("""
from db_utils import DBConnection

# SELECT query (single row)
user = DBConnection.query("SELECT * FROM users WHERE id = %s", [1])

# SELECT query (multiple rows)
users = DBConnection.query("SELECT * FROM users LIMIT 10", fetch_all=True)

# INSERT/UPDATE/DELETE
rows_affected = DBConnection.execute(
    "UPDATE users SET status = %s WHERE id = %s",
    ['active', 1]
)

# Context manager for custom operations
with DBConnection.connect() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users;")
    count = cursor.fetchone()[0]
    print(f"Total users: {count}")
        """)
    else:
        print(f"❌ Database Connection Failed!")
        print(f"   Error: {result}")
        sys.exit(1)
