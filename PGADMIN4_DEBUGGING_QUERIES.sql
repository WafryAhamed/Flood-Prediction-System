-- =============================================================================
-- PGADMIN4 FLOOD RESILIENCE SYSTEM - COMPLETE DEBUGGING QUERIES
-- =============================================================================
-- Date: March 23, 2026
-- Purpose: Comprehensive database diagnostics, verification, and health checks
-- Usage: Copy/paste each section into pgAdmin4 Query Tool for the flood_resilience database
-- =============================================================================

-- =============================================================================
-- SECTION 1: DATABASE CONNECTIVITY & BASIC HEALTH
-- =============================================================================

-- Query 1.1: Verify Database Connection
SELECT 
    current_database() as database_name,
    current_user as connected_user,
    version() as postgres_version,
    NOW() as server_time;

-- Query 1.2: Check Database Size
SELECT 
    pg_database.datname as database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) as database_size,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = 'flood_resilience') as active_connections
FROM pg_database
WHERE datname = 'flood_resilience';

-- Query 1.3: List All Databases
SELECT 
    datname as database,
    pg_size_pretty(pg_database_size(datname)) as size,
    datcreated as created_date
FROM pg_database
WHERE datistemplate = false
ORDER BY pg_database_size(datname) DESC;

-- =============================================================================
-- SECTION 2: TABLE VERIFICATION
-- =============================================================================

-- Query 2.1: Count All Tables
SELECT 
    count(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Query 2.2: List All Tables with Row Counts and Sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = tablename AND table_schema = schemaname) as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query 2.3: Verify Critical Tables Exist
SELECT 
    tablename,
    CASE 
        WHEN tablename IN ('users', 'broadcasts', 'ci_reports', 
                          'emergency_contacts', 'weather_observations', 
                          'system_settings', 'notification_deliveries')
        THEN '✅ CRITICAL'
        ELSE '✔️ OTHER'
    END as importance
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Query 2.4: Check Table Column Details
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN (
    'users', 'broadcasts', 'ci_reports', 'emergency_contacts'
)
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 3: USERS & AUTHENTICATION AUDIT
-- =============================================================================

-- Query 3.1: List All Users
SELECT 
    id,
    email,
    username,
    is_active,
    email_verified,
    created_at,
    updated_at,
    last_login_at
FROM users
ORDER BY created_at DESC;

-- Query 3.2: Count Users by Status
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_users,
    SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as verified_email,
    SUM(CASE WHEN last_login_at IS NOT NULL THEN 1 ELSE 0 END) as logged_in_users
FROM users;

-- Query 3.3: Verify Admin Account Exists
SELECT 
    u.id,
    u.email,
    u.username,
    u.is_active,
    string_agg(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@floodresilience.lk'
GROUP BY u.id, u.email, u.username, u.is_active;

-- Query 3.4: List All Users with Roles
SELECT 
    u.id,
    u.email,
    u.is_active,
    string_agg(r.name, ', ') as assigned_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.is_active
ORDER BY u.email;

-- Query 3.5: Check User Roles & Permissions
SELECT 
    u.email,
    r.name as role,
    p.name as permission,
    p.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY u.email, r.name, p.name;

-- Query 3.6: Recent Login Activity
SELECT 
    id,
    email,
    last_login_at,
    CASE 
        WHEN last_login_at IS NULL THEN 'Never logged in'
        WHEN last_login_at > NOW() - INTERVAL '1 day' THEN 'Last 24 hours'
        WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        ELSE 'Older than 7 days'
    END as login_frequency
FROM users
ORDER BY last_login_at DESC NULLS LAST;

-- =============================================================================
-- SECTION 4: BROADCAST DATA AUDIT
-- =============================================================================

-- Query 4.1: Count All Broadcasts
SELECT 
    COUNT(*) as total_broadcasts,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
    SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
FROM broadcasts;

-- Query 4.2: List Recent Broadcasts
SELECT 
    id,
    title,
    broadcast_type,
    priority,
    status,
    is_active,
    created_at,
    COALESCE(active_to, 'INDEFINITE') as active_until
FROM broadcasts
ORDER BY created_at DESC
LIMIT 30;

-- Query 4.3: Count Broadcasts by Type and Priority
SELECT 
    broadcast_type,
    priority,
    COUNT(*) as count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as currently_active
FROM broadcasts
GROUP BY broadcast_type, priority
ORDER BY count DESC;

-- Query 4.4: Active Broadcasts (Currently Displaying to Users)
SELECT 
    id,
    title,
    broadcast_type,
    priority,
    status,
    created_at,
    created_by_user_id,
    active_to,
    target_audience
FROM broadcasts
WHERE status = 'active'
  AND (active_to IS NULL OR active_to > NOW())
ORDER BY priority DESC, created_at DESC;

-- Query 4.5: Broadcasts by Creator (Admin)
SELECT 
    b.id,
    b.title,
    u.email as creator,
    b.broadcast_type,
    b.created_at,
    b.status
FROM broadcasts b
LEFT JOIN users u ON b.created_by_user_id = u.id
WHERE u.email = 'admin@floodresilience.lk'
ORDER BY b.created_at DESC;

-- Query 4.6: Expired/Inactive Broadcasts
SELECT 
    id,
    title,
    broadcast_type,
    status,
    active_to,
    CURRENT_TIMESTAMP AS current_time,
    active_to - CURRENT_TIMESTAMP as time_until_expiry
FROM broadcasts
WHERE status = 'active' AND active_to IS NOT NULL
ORDER BY active_to ASC;

-- =============================================================================
-- SECTION 5: EMERGENCY CONTACTS MANAGEMENT
-- =============================================================================

-- Query 5.1: List All Emergency Contacts
SELECT 
    id,
    label,
    number,
    type,
    is_active,
    created_at,
    updated_at
FROM emergency_contacts
ORDER BY type, label;

-- Query 5.2: Count Emergency Contacts by Type
SELECT 
    type,
    COUNT(*) as count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_contacts
FROM emergency_contacts
GROUP BY type
ORDER BY count DESC;

-- Query 5.3: Active Emergency Hotlines
SELECT 
    id,
    label,
    number,
    type,
    created_at
FROM emergency_contacts
WHERE is_active = true
ORDER BY type, label;

-- Query 5.4: Emergency Contacts in System Settings
SELECT 
    key,
    value,
    created_at,
    updated_at
FROM system_settings
WHERE key LIKE '%emergency%'
   OR key LIKE '%contact%'
   OR key LIKE '%hotline%'
ORDER BY key;

-- =============================================================================
-- SECTION 6: COMMUNITY REPORTS AUDIT
-- =============================================================================

-- Query 6.1: Count Reports by Status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM ci_reports), 2) as percentage,
    ROUND(AVG(CASE 
        WHEN severity_level = 'CRITICAL' THEN 4
        WHEN severity_level = 'HIGH' THEN 3
        WHEN severity_level = 'MEDIUM' THEN 2
        WHEN severity_level = 'LOW' THEN 1
        ELSE 0
    END), 2) as avg_severity_score
FROM ci_reports
GROUP BY status
ORDER BY count DESC;

-- Query 6.2: List Recent Community Reports
SELECT 
    id,
    description,
    severity_level,
    status,
    is_verified,
    created_at,
    reporter_email,
    location_name
FROM ci_reports
ORDER BY created_at DESC
LIMIT 50;

-- Query 6.3: Unverified High-Severity Reports
SELECT 
    id,
    description,
    severity_level,
    created_at,
    reporter_email,
    location_name,
    status
FROM ci_reports
WHERE is_verified = false 
  AND severity_level IN ('CRITICAL', 'HIGH')
ORDER BY created_at DESC;

-- Query 6.4: Reports Needing Admin Action
SELECT 
    id,
    description,
    severity_level,
    status,
    reported_at,
    reporter_email,
    CASE 
        WHEN status = 'pending' AND is_verified = false THEN 'VERIFY'
        WHEN status = 'pending' AND is_verified = true THEN 'DISPATCH'
        WHEN status = 'in_progress' THEN 'MONITOR'
        WHEN status = 'resolved' THEN 'ARCHIVED'
        ELSE 'UNKNOWN'
    END as suggested_action
FROM ci_reports
WHERE status IN ('pending', 'in_progress')
ORDER BY severity_level DESC, reported_at DESC;

-- Query 6.5: Geographic Distribution of Reports
SELECT 
    location_name,
    COUNT(*) as total_reports,
    SUM(CASE WHEN severity_level IN ('CRITICAL', 'HIGH') THEN 1 ELSE 0 END) as critical_high_reports,
    ROUND(AVG(latitude), 4) as avg_latitude,
    ROUND(AVG(longitude), 4) as avg_longitude,
    MAX(created_at) as latest_report
FROM ci_reports
GROUP BY location_name
HAVING COUNT(*) > 0
ORDER BY total_reports DESC;

-- =============================================================================
-- SECTION 7: REAL-TIME EVENT TRACKING
-- =============================================================================

-- Query 7.1: Check Notification Deliveries
SELECT 
    id,
    broadcast_id,
    delivery_channel,
    delivery_status,
    attempted_at,
    delivered_at,
    CASE 
        WHEN delivered_at IS NOT NULL THEN 'Success'
        WHEN attempted_at < NOW() - INTERVAL '1 hour' THEN 'Failed/Timeout'
        ELSE 'Pending'
    END as status
FROM notification_deliveries
ORDER BY attempted_at DESC
LIMIT 100;

-- Query 7.2: Delivery Statistics and Success Rate
SELECT 
    delivery_channel,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN delivery_status = 'pending' THEN 1 ELSE 0 END) as pending,
    ROUND(100.0 * SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM notification_deliveries
GROUP BY delivery_channel
ORDER BY total_attempts DESC;

-- Query 7.3: Failed Deliveries Requiring Attention
SELECT 
    id,
    broadcast_id,
    delivery_channel,
    attempted_at,
    delivered_at,
    (SELECT title FROM broadcasts WHERE id = delivery_channel::uuid LIMIT 1) as broadcast_title
FROM notification_deliveries
WHERE delivery_status = 'failed'
  AND attempted_at > NOW() - INTERVAL '24 hours'
ORDER BY attempted_at DESC;

-- Query 7.4: Event Publication Timeline
SELECT 
    broadcast_id,
    COUNT(*) as delivery_attempts,
    MIN(attempted_at) as first_attempt,
    MAX(attempted_at) as last_attempt,
    SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
FROM notification_deliveries
GROUP BY broadcast_id
ORDER BY first_attempt DESC
LIMIT 20;

-- =============================================================================
-- SECTION 8: SYSTEM SETTINGS & CONFIGURATION
-- =============================================================================

-- Query 8.1: System Configuration Values
SELECT 
    key,
    SUBSTRING(value, 1, 100) as value_preview,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at THEN 'MODIFIED'
        ELSE 'ORIGINAL'
    END as status
FROM system_settings
ORDER BY key;

-- Query 8.2: Recent Configuration Changes
SELECT 
    key,
    updated_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - updated_at)) / 3600 as hours_since_update
FROM system_settings
ORDER BY updated_at DESC
LIMIT 20;

-- Query 8.3: Missing Critical Settings
SELECT 
    'adminControl.broadcastFeed' as required_setting
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE key = 'adminControl.broadcastFeed')
UNION ALL
SELECT 'maintenance.emergencyContacts' 
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE key = 'maintenance.emergencyContacts')
UNION ALL
SELECT 'maintenance.mapMarkers' 
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE key = 'maintenance.mapMarkers');

-- =============================================================================
-- SECTION 9: DATA INTEGRITY & CONSISTENCY
-- =============================================================================

-- Query 9.1: Verify Foreign Key Relationships
SELECT 
    constraint_name,
    table_name,
    column_name,
    'DEFINED' as status
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
  AND constraint_name LIKE '%fk%'
  AND table_name IN ('broadcasts', 'ci_reports', 'user_roles', 'notification_deliveries')
ORDER BY table_name, constraint_name;

-- Query 9.2: Check for Orphaned Broadcast References
SELECT 
    nd.id,
    nd.broadcast_id,
    'ORPHANED' as issue_type
FROM notification_deliveries nd
LEFT JOIN broadcasts b ON nd.broadcast_id = b.id
WHERE b.id IS NULL
  AND nd.broadcast_id IS NOT NULL;

-- Query 9.3: Check for Orphaned Report References
SELECT 
    COUNT(*) as orphaned_count
FROM ci_reports r
LEFT JOIN users u ON r.reporter_id = u.id
WHERE u.id IS NULL
  AND r.reporter_id IS NOT NULL;

-- Query 9.4: Verify No NULL Values in Critical Fields
SELECT 
    'broadcasts' as table_name,
    COUNT(*) as null_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM broadcasts
WHERE title IS NULL OR broadcast_type IS NULL OR priority IS NULL
UNION ALL
SELECT 'users', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users
WHERE email IS NULL OR created_at IS NULL
UNION ALL
SELECT 'ci_reports', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM ci_reports
WHERE description IS NULL OR created_at IS NULL;

-- Query 9.5: Check Data Type Consistency
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('broadcasts', 'emergency_contacts')
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 10: PERFORMANCE & OPTIMIZATION
-- =============================================================================

-- Query 10.1: Check Index Usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN '⚠️ UNUSED'
        WHEN idx_scan < 10 THEN '⚡ LOW USAGE'
        ELSE '✅ ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query 10.2: Identify Unused Indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Query 10.3: Table and Index Size Analysis
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- =============================================================================
-- SECTION 11: CONNECTION POOL DIAGNOSTICS
-- =============================================================================

-- Query 11.1: Current Active Connections
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start)) as seconds_running
FROM pg_stat_activity
WHERE datname = 'flood_resilience'
  AND state != 'idle'
ORDER BY query_start DESC;

-- Query 11.2: Connection Statistics
SELECT 
    COUNT(*) as total_connections,
    SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,
    SUM(CASE WHEN state = 'idle in transaction' THEN 1 ELSE 0 END) as idle_in_transaction,
    MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - backend_start))) as max_connection_age_seconds
FROM pg_stat_activity
WHERE datname = 'flood_resilience';

-- Query 11.3: Long-Running Queries
SELECT 
    pid,
    usename,
    SUBSTRING(query, 1, 50) as query_snippet,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start)) as seconds_running
FROM pg_stat_activity
WHERE datname = 'flood_resilience'
  AND query_start < CURRENT_TIMESTAMP - INTERVAL '5 minutes'
  AND state != 'idle'
ORDER BY query_start;

-- Query 11.4: Idle Connections for Cleanup
SELECT 
    pid,
    usename,
    application_name,
    state_change,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - state_change)) as idle_seconds
FROM pg_stat_activity
WHERE datname = 'flood_resilience'
  AND state = 'idle'
  AND state_change < CURRENT_TIMESTAMP - INTERVAL '1 hour'
ORDER BY state_change DESC;

-- =============================================================================
-- SECTION 12: VACCINATION & REPAIR COMMANDS
-- (Use with caution - these modify data)
-- =============================================================================

-- Repair 12.1: Remove Duplicate Emergency Contacts (if any exist)
-- UNCOMMENT AND RUN ONLY IF DUPLICATES DETECTED
/*
DELETE FROM emergency_contacts
WHERE id NOT IN (
    SELECT DISTINCT ON (label, number) id
    FROM emergency_contacts
    ORDER BY label, number, created_at DESC
);
*/

-- Repair 12.2: Clean Up Failed Notification Deliveries
-- UNCOMMENT TO REMOVE OLD FAILED DELIVERIES (> 7 days)
/*
DELETE FROM notification_deliveries
WHERE delivery_status = 'failed'
  AND attempted_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
*/

-- Repair 12.3: Verify and Re-index Critical Tables
-- UNCOMMENT TO REINDEX (may lock tables temporarily)
/*
REINDEX TABLE broadcasts;
REINDEX TABLE ci_reports;
REINDEX TABLE notification_deliveries;
*/

-- Repair 12.4: Update Table Statistics
-- UNCOMMENT TO VACUUM AND ANALYZE (may lock tables temporarily)
/*
VACUUM ANALYZE broadcasts;
VACUUM ANALYZE ci_reports;
VACUUM ANALYZE notification_deliveries;
*/

-- =============================================================================
-- SECTION 13: AUTOMATED HEALTH CHECK REPORT
-- =============================================================================

-- Query 13.1: Complete System Health Dashboard
WITH db_health AS (
    SELECT 
        'Database' as component,
        CASE WHEN pg_database_size('flood_resilience') > 0 THEN '✅ OK' ELSE '❌ FAIL' END as status
),
table_health AS (
    SELECT 
        'Tables (' || COUNT(*) || ')' as component,
        CASE WHEN COUNT(*) >= 60 THEN '✅ OK' ELSE '❌ FAIL' END as status
    FROM information_schema.tables 
    WHERE table_schema = 'public'
),
user_health AS (
    SELECT 
        'Users' as component,
        CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ FAIL' END as status
    FROM users
),
admin_health AS (
    SELECT 
        'Admin Account' as component,
        CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ FAIL' END as status
    FROM users
    WHERE email = 'admin@floodresilience.lk'
),
broadcast_health AS (
    SELECT 
        'Broadcasts' as component,
        CASE WHEN COUNT(*) >= 0 THEN '✅ OK' ELSE '❌ FAIL' END as status
    FROM broadcasts
),
report_health AS (
    SELECT 
        'CI Reports' as component,
        CASE WHEN COUNT(*) >= 0 THEN '✅ OK' ELSE '❌ FAIL' END as status
    FROM ci_reports
)
SELECT component, status FROM db_health
UNION ALL SELECT component, status FROM table_health
UNION ALL SELECT component, status FROM user_health
UNION ALL SELECT component, status FROM admin_health
UNION ALL SELECT component, status FROM broadcast_health
UNION ALL SELECT component, status FROM report_health
ORDER BY component;

-- =============================================================================
-- END OF PGADMIN4 DEBUGGING QUERIES
-- =============================================================================
