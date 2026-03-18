# Poetry Migration Guide - Flood Resilience System Backend

## Overview

This document explains the migration from manual virtual environments to **Poetry** for Python dependency management in the Flood Resilience System backend.

## What is Poetry?

Poetry is a modern Python dependency management and packaging tool that:
- **Automatically manages Python virtual environments** (no manual activation needed)
- **Locks dependencies** to guarantee reproducible builds across machines
- **Simplifies startup scripts** by eliminating environment-specific commands
- **Handles complex dependency resolution** automatically
- **Works across Windows, macOS, and Linux** seamlessly

## What Changed

### Before (Manual Virtual Environment)
```powershell
# Had to manually activate venv
cd e:\floodweb
.\.venv\Scripts\Activate.ps1

# Had to ensure pip packages were in venv
pip install -r requirements.txt

# Then run commands
uvicorn app.main:app --reload
```

### After (Poetry)
```powershell
# No manual activation needed - Poetry manages everything
cd e:\floodweb\server
poetry install          # One-time setup
poetry run uvicorn app.main:app --reload  # Just run!
```

## Installation

### One-Time Setup

Install Poetry globally on your system:

```powershell
# Using pip (recommended)
pip install poetry

# Or download from official website
# https://python-poetry.org/docs/#installation
```

Verify installation:
```powershell
poetry --version
# Output: Poetry (version 2.3.2)
```

## Using Poetry - Common Commands

### Initial Setup
```powershell
cd e:\floodweb\server

# Install all dependencies (creates/activates virtual environment automatically)
poetry install

# Update all dependencies to latest compatible versions
poetry update
```

### Running Backend Commands

```powershell
# Development server with hot-reload
poetry run uvicorn app.main:app --reload

# Production server (Windows)
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Production server (Linux)
poetry run gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4

# Run tests
poetry run pytest tests/ -v

# Run database migrations
poetry run alembic upgrade head

# Create new migration
poetry run alembic revision --autogenerate -m "your migration description"

# Run verification script
poetry run python verify_system.py
```

### Managing Dependencies

```powershell
# Show all installed packages
poetry show

# Check specific package
poetry show fastapi

# Add new package
poetry add requests

# Add development-only package
poetry add pytest --group dev

# Remove package
poetry remove requests

# Update lock file (when pyproject.toml changes)
poetry lock

# Check pyproject.toml syntax
poetry check
```

## Project Structure

```
server/
├── pyproject.toml       ← Main Poetry configuration (replaces requirements.txt)
├── poetry.lock          ← Locked dependency versions (auto-generated)
├── .env                 ← Environment variables (not in Poetry)
├── .env.example         ← Example env file
├── app/
│   ├── main.py
│   ├── api/
│   ├── db/
│   ├── models/
│   ├── services/
│   └── ...
├── alembic/             ← Database migrations
├── scripts/             ← Utility scripts
└── tests/               ← Test files
```

### pyproject.toml Structure

The `pyproject.toml` file contains:

```toml
[tool.poetry]
name = "flood-resilience-backend"
version = "1.0.0"
description = "Flood Resilience System Backend"
authors = ["Flood Resilience Team"]

[tool.poetry.dependencies]
python = "^3.12"
# Core dependencies
fastapi = "^0.109.0"
uvicorn = {version = "^0.27.0", extras = ["standard"]}
sqlalchemy = {version = "^2.0.25", extras = ["asyncio"]}
# ... more dependencies

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.23.0"
# ... dev dependencies

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

## Startup Scripts Integration

All startup scripts have been updated to use Poetry:

### run-backend.ps1 (Development)
```powershell
cd server
poetry install --no-root    # Ensure dependencies are installed
poetry run uvicorn app.main:app --reload  # Run with Poetry
```

### run-backend-prod.ps1 (Production)
```powershell
cd server
poetry install --no-root    # Ensure dependencies are installed

# Windows: Uses Uvicorn with workers
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Linux: Uses Gunicorn with Uvicorn workers
poetry run gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4
```

### run-dev.ps1 (Full System)
```powershell
# Automatically runs Poetry install for backend
# Automatically runs npm install for frontend
# Starts both in separate terminal windows
```

## Dependencies

### Core Dependencies (Installed)

```toml
[tool.poetry.dependencies]
python = "^3.12"

# Web Framework
fastapi = "^0.109.0"
uvicorn = {version = "^0.27.0", extras = ["standard"]}
gunicorn = "^21.0.0"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"

# Database
sqlalchemy = {version = "^2.0.25", extras = ["asyncio"]}
asyncpg = "^0.29.0"
alembic = "^1.13.0"
geoalchemy2 = "^0.14.0"

# Cache & Queue
redis = "^5.0.0"
celery = "^5.3.0"

# Authentication
python-jose = {version = "^3.3.0", extras = ["cryptography"]}
passlib = {version = "^1.7.4", extras = ["bcrypt"]}

# Storage & Files
boto3 = "^1.34.0"
aiofiles = "^23.2.0"

# API & Utilities
httpx = "^0.26.0"
orjson = "^3.9.0"
python-dotenv = "^1.0.0"
```

### Development Dependencies (Optional)

```toml
[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.23.0"
pytest-cov = "^4.1.0"
black = "^24.1.0"
ruff = "^0.1.0"
mypy = "^1.8.0"
```

## Troubleshooting Poetry

### Issue: "Poetry not found"
```powershell
# Solution: Install Poetry
pip install poetry

# Verify installation
poetry --version
```

### Issue: "No module named 'fastapi'"
```powershell
# Solution: Reinstall dependencies
cd server
rm poetry.lock
poetry install --no-root
```

### Issue: Slow dependency resolution
```powershell
# Solution: Use --no-cache flag
poetry install --no-cache

# Or clear Poetry cache
poetry cache clear pypi --all
```

### Issue: Version conflict on `poetry add`
```powershell
# Check existing versions
poetry show package-name

# Update resolver with --no-update
poetry add package-name --no-update

# Or use exact version
poetry add package-name@specific.version
```

### Issue: Poetry virtual environment in wrong location
```powershell
# View Poetry config
poetry config --list

# View venv location
poetry env info

# List all Poetry environments
poetry env list

# Use specific Python version
poetry env use C:\Python312\python.exe
```

## Development Workflow

### Starting Development

```powershell
# 1. Install dependencies (one-time)
cd e:\floodweb\server
poetry install

# 2. Run the full system
cd e:\floodweb
.\run-dev.ps1
```

### Making Changes

**Backend Code Changes:**
- Edit files in `server/app/`
- `poetry run uvicorn` automatically reloads on file changes
- Changes are instantly visible

**Adding New Dependencies:**
```powershell
cd server

# Add runtime dependency
poetry add new-package-name

# Add development dependency
poetry add pytest-something --group dev

# This updates both pyproject.toml and poetry.lock
```

**Running Tests:**
```powershell
cd server

# Run all tests
poetry run pytest tests/ -v

# Run specific test file
poetry run pytest tests/test_api.py -v

# Run with coverage
poetry run pytest tests/ --cov=app
```

**Database Migrations:**
```powershell
cd server

# Create new migration (auto-detects model changes)
poetry run alembic revision --autogenerate -m "add user_profile table"

# Apply pending migrations
poetry run alembic upgrade head

# View migration history
poetry run alembic current
```

## Production Deployment

### Windows Server
```powershell
cd server
poetry install
poetry run uvicorn app.main:app `
    --host 0.0.0.0 `
    --port 8000 `
    --workers 4 `
    --loop uvloop
```

### Linux Server (Recommended for Production)
```bash
cd server
poetry install
poetry run gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    -w 4 \
    -b 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
```

### Docker Deployment
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy files
COPY pyproject.toml poetry.lock ./
COPY app ./app

# Install dependencies
RUN poetry install --no-dev

# Run server
CMD ["poetry", "run", "gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4"]
```

## Migration Checklist

- [x] Install Poetry globally
- [x] Create `pyproject.toml` with all dependencies
- [x] Generate `poetry.lock` file
- [x] Update `run-backend.ps1` to use `poetry run`
- [x] Update `run-backend-prod.ps1` to use `poetry run`
- [x] Update `run-dev.ps1` to handle Poetry installation
- [x] Test backend development server with `poetry run uvicorn`
- [x] Test backend production server with `poetry run gunicorn` (Linux) or `poetry run uvicorn` (Windows)
- [x] Update `DEVELOPMENT.md` with Poetry instructions
- [x] Update `QUICKSTART.md` with Poetry instructions
- [x] Verify database migration with `poetry run alembic upgrade head`
- [x] Test API endpoints work correctly
- [x] Verify frontend can communicate with backend
- [x] Document solution in `POETRY_MIGRATION.md` (this file)

## Summary of Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Virtual Environment** | Manual activation required | Automatic via Poetry |
| **Dependency Locking** | `requirements.txt` (unpinned) | `poetry.lock` (fully locked) |
| **Adding Packages** | `pip install` + manual pip freeze | `poetry add` (auto-updates lock file) |
| **Reproducibility** | Version conflicts possible | Guaranteed consistency across machines |
| **Development Server** | `.venv\Scripts\activate` then `uvicorn` | `poetry run uvicorn` |
| **Production Server** | Manual env setup | `poetry run gunicorn` / `poetry run uvicorn` |
| **Cross-Platform** | Different activation scripts | Same `poetry run` command everywhere |
| **IDE Integration** | Select venv interpreter manually | Poetry handles it automatically |

## Further Reading

- **Poetry Documentation**: https://python-poetry.org/docs/
- **FastAPI + Poetry**: https://fastapi.tiangolo.com/#other-tools
- **Uvicorn Documentation**: https://www.uvicorn.org/
- **Gunicorn Documentation**: https://gunicorn.org/
- **Project DEVELOPMENT.md**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Project QUICKSTART.md**: [QUICKSTART.md](./QUICKSTART.md)

---

**Last Updated**: March 15, 2026
**Poetry Version**: 2.3.2
**Python Version**: 3.12+
