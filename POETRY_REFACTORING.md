# Poetry Refactoring Guide - Backend Environment Management

Date: March 15, 2026
Status: ✅ Complete

## Executive Summary

The Flood Resilience System backend has been refactored to use **Poetry** for modern Python dependency management, replacing the manual `.venv` workflow. This brings the project to industry standards for Python development.

### Key Improvements
- ✅ Automatic virtual environment management
- ✅ Locked dependency versions (poetry.lock)
- ✅ Development vs. production separation
- ✅ Production Gunicorn + Uvicorn configuration
- ✅ No manual virtual environment activation required
- ✅ Reproducible builds across environments

## What Changed

### 1. Poetry Configuration (`server/pyproject.toml`)

**Before**: setuptools-based configuration
```toml
[build-system]
requires = ["setuptools>=69.0.0", "wheel"]
build-backend = "setuptools.build_meta"
```

**After**: Poetry configuration
```toml
[tool.poetry]
name = "flood-resilience-backend"
version = "1.0.0"
description = "Flood Resilience System Backend for Sri Lanka"
authors = ["Flood Resilience Team"]

[tool.poetry.dependencies]
python = "^3.12"
# All dependencies listed with version constraints

[tool.poetry.group.dev.dependencies]
# Testing and linting tools

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

### 2. Backend Startup Script (`run-backend.ps1`)

**Key Changes**:
- ✅ Now checks for Poetry installation
- ✅ Runs `poetry install --no-root` instead of manual pip
- ✅ Starts server via `poetry run uvicorn ...`
- ✅ No longer requires manual `.venv\Scripts\Activate.ps1`

```powershell
# OLD WORKFLOW:
& .\.venv\Scripts\Activate.ps1
python -m pip install fastapi uvicorn...
uvicorn app.main:app --reload

# NEW WORKFLOW:
poetry install  # Automatic, idempotent
poetry run uvicorn app.main:app --reload
```

### 3. Production Backend Script (`run-backend-prod.ps1`) - NEW

**Purpose**: Production-grade deployment configuration

```powershell
poetry run gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4
```

**Features**:
- Multiple worker processes (4 by default, configurable)
- Uvicorn worker compatibility
- Production-ready logging
- Access log and error log configuration
- Configurable timeout settings

**Note on Windows**: Gunicorn has limited Windows support and requires Unix-specific fcntl module. This script is provided for documentation and Linux/Unix deployments. For Windows production, use Uvicorn with a reverse proxy like IIS or Nginx.

### 4. Development Check Script (`dev-check.ps1`)

**Updated to**:
- ✅ Check for Poetry installation (instead of .venv)
- ✅ Verify Poetry can access Python
- ✅ Simplified prerequisites

```powershell
# Check Poetry
$Poetry = (Get-Command poetry -ErrorAction SilentlyContinue) -ne $null

# Verify Poetry Python
poetry run python --version
```

### 5. Main Launcher (`run-dev.ps1`)

**Updated**:
- ✅ Checks for Poetry first
- ✅ Clearer error messages if Poetry not found
- ✅ Validates Poetry configuration

## Installation and Usage

### Initial Setup (One-Time)

1. **Install Poetry**:
```powershell
pip install poetry
```

2. **Install Backend Dependencies**:
```powershell
cd server
poetry install
```

3. **Start Development Server**:
```powershell
cd ..
.\run-dev.ps1
```

### Daily Workflow

**Start Everything**:
```powershell
.\run-dev.ps1
```

**Start Backend Only**:
```powershell
.\run-backend.ps1
```

**Run Backend Commands**:
```powershell
cd server
poetry run alembic upgrade head    # Database migrations
poetry run pytest tests/            # Run tests
poetry run python scripts/seed_db.py  # Seed database
```

## Dependency Management

### Adding a Package

```powershell
cd server
poetry add package-name              # Add production dependency
poetry add --group dev pytest        # Add dev dependency
```

### Updating Dependencies

```powershell
poetry update              # Update to latest compatible versions
poetry update package      # Update specific package
poetrylocking  # View lock file
```

### Checking Dependencies

```powershell
poetry show                 # List all dependencies
poetry show --outdated      # Show outdated packages
poetry check               # Validate pyproject.toml
```

## Production Deployment

### On Linux/Unix Servers

```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Clone and setup
git clone <repo>
cd server
poetry install --only production

# Start with Gunicorn
poetry run gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  -w 4 \
  -b 0.0.0.0:8000
```

### Worker Configuration

Recommended worker count formula:
```
workers = (2 * cpu_cores) + 1
```

Examples:
- 2 cores: 5 workers
- 4 cores: 9 workers
- 8 cores: 17 workers
- 16 cores: 33 workers

### On Windows (Limited Support)

Use Uvicorn with a reverse proxy:
```powershell
# Uvicorn development mode
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000

# With IIS/Nginx as reverse proxy on port 80/443
```

## Environment Variables

Poetry automatically loads from `.env` file in the project directory.

Key variables handled:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `API_V1_PREFIX`: API route prefix
- `DEBUG`: Debug mode flag
- `SECRET_KEY`: Application secret
- `JWT_SECRET_KEY`: JWT signing key

All variables are validated on app startup.

## Troubleshooting

### "Poetry not found"

```powershell
# Install Poetry
pip install poetry

# Close and reopen PowerShell
# Poetry should be in PATH now
```

### "poetry install" fails

```powershell
cd server

# Clear cache and retry
poetry cache clear PyPI --all
poetry install

# Or upgrade Poetry itself
pip install --upgrade poetry
poetry install
```

### "Module not found" after poetry install

```powershell
# Reinstall without cache
poetry install --no-cache

# Or remove lock file and reinstall
rm poetry.lock
poetry install
```

### "Gunicorn fcntl error" on Windows

This is expected. Use Uvicorn for Windows development/servers.

## Verification Checklist

- ✅ Poetry installed: `poetry --version`
- ✅ Dependencies locked: `poetry.lock` file present
- ✅ Backend loads: `poetry run python -c "from app.main import app"`
- ✅ Database connected: `poetry run python verify_system.py`
- ✅ Environment vars loaded: `poetry run python -c "from app.core.config import settings"`
- ✅ System ready: `.\dev-check.ps1` shows all [+]

## Benefits of Poetry

1. **Deterministic Builds**: `poetry.lock` ensures exact versions across environments
2. **Easy Distribution**: `poetry build` creates distributable packages
3. **Dependency Management**: Clear distinction between prod and dev dependencies
4. **Version Constraints**: Flexible but explicit version specifications
5. **Virtual Environment**: Automatic, per-project isolation
6. **Minimal Setup**: No manual venv activation needed

## How to Update Documentation

When updating Poetry configuration:

1. Update `server/pyproject.toml`
2. Run `poetry install`
3. Run tests to ensure compatibility
4. Commit both `pyproject.toml` and `poetry.lock`
5. Update `DEVELOPMENT.md` with any new commands

## References

- **Poetry Documentation**: https://python-poetry.org/docs/
- **Gunicorn Documentation**: https://docs.gunicorn.org/
- **Uvicorn Documentation**: https://www.uvicorn.org/
- **Project Requirements**: `server/pyproject.toml`

## Migration Complete

This refactoring successfully modernizes the backend infrastructure while maintaining:

- ✅ All existing functionality
- ✅ Frontend compatibility
- ✅ Database operations
- ✅ Optional service support (Redis, Celery)
- ✅ Environment configuration

Developers can now:

```powershell
# Install dependencies
poetry install

# Start development
poetry run uvicorn app.main:app --reload

# Or through the launcher
.\run-dev.ps1
```

No manual virtual environment activation required!

---

**Status**: ✅ Production Ready  
**Last Updated**: March 15, 2026  
**Tested On**: Windows PowerShell 5.1, Python 3.12.10, Poetry 2.3.2
