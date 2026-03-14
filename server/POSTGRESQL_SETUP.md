# PostgreSQL + pgAdmin Setup (Flood Resilience)

This backend is configured to use PostgreSQL as the primary database.

## Runtime credentials

- Host: `localhost`
- Port: `5432`
- Database: `flood_resilience`
- Username: `postgres`
- Password: `2001`

## Start services (Docker)

Use the server compose stack. It starts:
- PostgreSQL (`postgis/postgis`)
- FastAPI backend
- Redis / Celery
- pgAdmin 4 (`http://localhost:5050`)

## pgAdmin 4 access

- URL: `http://localhost:5050`
- Email: `admin@floodweb.local`
- Password: `admin_password`

A default pgAdmin server profile is preloaded from `server/pgadmin/servers.json`.

## Backend DB checks

At startup, backend will:
1. verify PostgreSQL connectivity,
2. initialize extensions (`postgis`, `vector`, `uuid-ossp`),
3. fail fast if DB is unreachable.

Health endpoint includes DB status:
- `GET /health` -> `database: connected|disconnected`

## Ensure database exists (non-docker local)

Use:
- `server/scripts/ensure_database.py`

This script creates the target database if missing.

## Schema/migration

- Alembic migration file: `server/alembic/versions/3281b255311f_initial_schema.py`
- Apply migrations with Alembic upgrade to head.

## Integration verification script

- `server/scripts/integration_audit.py`

Checks:
- DB connection identity
- schema + constraints presence
- ACID atomicity smoke test
- integration API CRUD flow
- SSE realtime event delivery
- chatbot logging persistence
