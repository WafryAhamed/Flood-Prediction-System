#!/usr/bin/env python3
"""
Database Schema Verification Script
Connects to PostgreSQL and verifies all required tables and columns exist.
"""

import asyncio
import json
from datetime import datetime

try:
    from sqlalchemy import inspect, text
    from sqlalchemy.ext.asyncio import create_async_engine
except ImportError:
    print("❌ SQLAlchemy not installed")
    import sys
    sys.exit(1)

# Database configuration (from server/.env or config)
DATABASE_URL = "postgresql+asyncpg://floodweb:floodweb_secret@127.0.0.1:5432/floodresilience"

async def verify_database():
    """Verify database schema."""
    
    print(f"\n📊 Database Schema Verification - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    engine = None
    try:
        engine = create_async_engine(DATABASE_URL, echo=False)
        
        async with engine.begin() as conn:
            # Get all tables
            print("\n1️⃣  Checking Table Existence...")
            result = await conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            
            tables = [row[0] for row in result]
            print(f"   ✓ Found {len(tables)} tables in public schema\n")
            
            # Group tables by category
            categories = {
                'Users & Auth': ['users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'admin_sessions', 'refresh_tokens'],
                'Broadcasts & Alerts': ['broadcasts', 'broadcast_targets', 'notification_deliveries', 'emergency_contacts'],
                'Weather': ['weather_observations', 'weather_forecasts', 'weather_alerts'],
                'Reports': ['citizen_reports', 'report_upvotes', 'report_events'],
                'GIS & Locations': ['districts', 'risk_zones', 'shelters', 'evacuation_routes', 'evacuation_points'],
                'System & Audit': ['system_settings', 'system_events', 'audit_logs', 'maintenance_windows'],
                'Extras': ['flood_history', 'simulation_scenarios', 'user_safety_profiles'],
            }
            
            all_checked = set()
            critical_missing = []
            
            for category, required in categories.items():
                print(f"   📁 {category}")
                category_status = []
                for table in required:
                    all_checked.add(table)
                    if table in tables:
                        # Count rows (for interest)
                        try:
                            row_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                            row_count = row_result.scalar()
                            print(f"      ✓ {table:30} ({row_count:5} rows)")
                            category_status.append((table, True))
                        except Exception as e:
                            print(f"      ✓ {table:30} (error reading count)")
                            category_status.append((table, True))
                    else:
                        print(f"      ✗ {table:30} MISSING")
                        category_status.append((table, False))
                        if table in ['users', 'broadcasts', 'districts', 'emergency_contacts']:
                            critical_missing.append(table)
                
            # Check for unexpected tables
            checked_tables = set()
            for required_list in categories.values():
                checked_tables.update(required_list)
            
            unexpected = set(tables) - checked_tables
            if unexpected:
                print(f"\n   📊 Additional tables found:")
                for table in sorted(unexpected):
                    print(f"      • {table}")
            
            # ═══════════════════════════════════════════════════════════
            # Check key columns
            # ═══════════════════════════════════════════════════════════
            print("\n\n2️⃣  Checking Critical Columns...")
            
            critical_columns = {
                'users': ['id', 'email', 'password_hash', 'status'],
                'broadcasts': ['id', 'type', 'status', 'title'],
                'weather_observations': ['id', 'temperature_c', 'wind_speed_kmh', 'precipitation_mm'],
                'emergency_contacts': ['id', 'name', 'phone', 'category'],
                'citizen_reports': ['id', 'report_type', 'status', 'latitude', 'longitude'],
                'districts': ['id', 'name', 'code'],
                'system_settings': ['id', 'key', 'value'],
            }
            
            for table_name, required_cols in critical_columns.items():
                if table_name not in tables:
                    print(f"   ⚠️  Table '{table_name}' not found, skipping column check")
                    continue
                
                # Get actual columns
                result = await conn.execute(text(f"""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = '{table_name}'
                    ORDER BY column_name
                """))
                
                actual_cols = [row[0] for row in result]
                missing_cols = [col for col in required_cols if col not in actual_cols]
                
                if missing_cols:
                    print(f"   ✗ {table_name:25} Missing: {', '.join(missing_cols)}")
                else:
                    print(f"   ✓ {table_name:25} All {len(required_cols)} critical columns present")
            
            # ═══════════════════════════════════════════════════════════
            # Check indexes
            # ═══════════════════════════════════════════════════════════
            print("\n\n3️⃣  Checking Critical Indexes...")
            
            result = await conn.execute(text("""
                SELECT 
                    t.tablename,
                    COUNT(i.indexname) as index_count
                FROM pg_tables t
                LEFT JOIN pg_indexes i ON t.tablename = i.tablename
                WHERE t.schemaname = 'public'
                GROUP BY t.tablename
                HAVING COUNT(i.indexname) > 0
                ORDER BY COUNT(i.indexname) DESC
                LIMIT 10
            """))
            
            for table, count in result:
                print(f"   📍 {table:25} {count:3} indexes")
            
            # ═══════════════════════════════════════════════════════════
            # Check constraints
            # ═══════════════════════════════════════════════════════════
            print("\n\n4️⃣  Checking Constraints...")
            
            result = await conn.execute(text("""
                SELECT 
                    constraint_type,
                    COUNT(*) as count
                FROM information_schema.table_constraints
                WHERE table_schema = 'public'
                GROUP BY constraint_type
                ORDER BY constraint_type
            """))
            
            for constraint_type, count in result:
                constraint_names = {
                    'PRIMARY KEY': '🔑',
                    'FOREIGN KEY': '🔗',
                    'UNIQUE': '🆔',
                    'CHECK': '✔️',
                }
                symbol = constraint_names.get(constraint_type, '•')
                print(f"   {symbol} {constraint_type:15} {count:3} constraints")
            
            # ═══════════════════════════════════════════════════════════
            # Summary
            # ═══════════════════════════════════════════════════════════
            print("\n\n" + "=" * 70)
            print("SUMMARY")
            print("=" * 70)
            
            if critical_missing:
                print(f"❌ CRITICAL TABLES MISSING: {', '.join(critical_missing)}")
                status = "FAILED"
            else:
                print(f"✅ All critical tables present ({len(all_checked)} verified)")
                status = "PASSED"
            
            print(f"📊 Total tables in database: {len(tables)}")
            
            # Save results
            results = {
                "timestamp": datetime.now().isoformat(),
                "status": status,
                "total_tables": len(tables),
                "critical_tables": len(all_checked),
                "missing_critical": critical_missing,
                "tables_found": tables,
            }
            
            with open("database_verification_results.json", "w") as f:
                json.dump(results, f, indent=2)
            
            print("\n📁 Results saved to database_verification_results.json")
            
            if status == "PASSED":
                print(f"\n{chr(92)}033[92m✓ Database schema is READY for rebuild{chr(92)}033[0m")
            else:
                print(f"\n{chr(92)}033[91m✗ Database schema has issues{chr(92)}033[0m")
            
            return status == "PASSED"
    
    except Exception as e:
        print(f"\n❌ Database Connection Error:")
        print(f"   {str(e)}")
        print(f"\nMake sure PostgreSQL is running and DATABASE_URL is correct:")
        print(f"   {DATABASE_URL}")
        return False
    
    finally:
        if engine:
            await engine.dispose()

if __name__ == "__main__":
    result = asyncio.run(verify_database())
    exit(0 if result else 1)
