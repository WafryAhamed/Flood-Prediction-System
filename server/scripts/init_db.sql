-- PostgreSQL initialization script for Flood Resilience System
-- Automatically runs on container startup

-- Create PostGIS and pgvector extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Display versions
SELECT postgis_version();
SELECT extversion FROM pg_extension WHERE extname = 'pgvector';

-- Optional: Create useful indexes for GIS queries
-- Note: These are created by SQLAlchemy models, but having them here ensures they exist

-- Grant privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flood_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO flood_user;
