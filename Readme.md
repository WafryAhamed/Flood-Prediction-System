# Flood Emergency Response & Control Center

A real-time, AI-powered system designed to monitor, predict, and manage flood risks and emergency responses across Sri Lanka. The platform combines GIS tracking, Machine Learning predictions, RAG-based Chatbots, and automated emergency broadcasting into a single decoupled architecture.

---

## 🏗️ Tech Stack & Architecture

This application is built with a modern, scalable, and asynchronous architecture, featuring vector similarities for generative AI and geospatial data handling for mapping.

### 💻 Frontend (Client)
A robust single-page application built for speed and real-time visualization.
* **Framework:** React 19 + TypeScript, powered by Vite
* **State Management:** Zustand
* **UI & Styling:** Tailwind CSS, Framer Motion (for smooth micro-interactions), and Lucide React (Icons)
* **Geospatial UI:** React-Leaflet & Leaflet.js
* **Data Visualization:** Recharts

### ⚙️ Backend (Server)
A highly concurrent Python API designed for GIS data processing and AI orchestration.
* **Framework:** FastAPI (Python 3.12+)
* **Server:** Uvicorn / Granian 
* **ORM:** SQLAlchemy 2.0 (Asynchronous) with Alembic for migrations
* **Data Validation:** Pydantic
* **Background Tasks:** Celery + Redis
* **Observability:** OpenTelemetry integration

### 🗄️ Database
Relational, Vector, and Geospatial data combined.
* **Relational:** PostgreSQL (using `asyncpg`)
* **GIS:** PostGIS (via `GeoAlchemy2` with SRID 4326 mapping)
* **Vector Storage:** `pgvector` for storing 384-dimensional text embeddings.

---

## 🤖 AI & Machine Learning Integrations

The system natively integrates several AI models to augment emergency response capabilities:
* **Machine Learning Ensembles:** Custom-trained models for Flood Prediction with rigorous validation. Our tree-structured algorithms display high accuracy:
  * *Random Forest* (Val Acc: ~92.0%)
  * *XGBoost* & *Gradient Boosting* (Val Acc: ~91.8%)
  * *LightGBM* (Val Acc: ~91.7%)
* **Model Registry:** Manages lifecycles (training, deploying, deprecated) of models for *Flood Prediction*, *Report Verification*, *Image Classification*, and *Anomaly Detection*.
* **Generative AI & RAG:** 
  * Features the **AI Crisis Commander**, an interactive chat assistant embedded directly in the District Command module, aiding in alert analysis, flood prediction models, and crisis coordination.
  * Generates and stores embeddings using `pgvector` (tuned for `sentence-transformers/all-MiniLM-L6-v2` or external LLM apis).
  * Supports localized AI interactions in English (`en`), Sinhala (`si`), and Tamil (`ta`).

---

## ✨ System Features

### 🏢 Public & Admin User Interfaces
* **Interactive Responsive Sidebar:** Dynamic navigation across all vital modules: Dashboard, Risk Map, Crowdsourced Reporting, Evacuation Routes, Scenario What-If tests, Agriculture, Recovery, and Learn Hub.
* **National Situation Room:** A comprehensive Command Center displaying National Risk Levels (e.g., CRITICAL), Active Incidents, Population at Risk, and Deployed Response Units at a glance.
* **Geospatial Intel Map:** Interactive, PostGIS-backed map showing real-time flood risks, shelter locations, and active evacuation routes with toggleable layers (Radar, Risk, Units).
* **District Command Center:** Drill-down views offering 7-Day Risk Trends, High Priority Zone classifications, and precise Resource Allocations (Personnel, Boats, Trucks).
* **Targeted Broadcast System:** Live Feed panel and multi-channel targeted emergency alerting.

---

## 🚀 Quick Start Guide

You will need two terminals to run the backend and frontend locally. Ensure **PostgreSQL** (with PostGIS and pgvector extensions) and **Redis** are running.
*Tip: You can use tools like pgAdmin 4 to visually manage your `flood_resilience` database.*

### 1. Database Configuration & Seed Data
Ensure your local PostgreSQL service is running and the database (e.g., `flood_resilience`) exists.
To populate the database with comprehensive demo data (shelters, broadcasts, weather, AI chatbot knowledge, and reports):

```powershell
cd server
.\.venv\Scripts\Activate.ps1
# Apply Alembic migrations
alembic upgrade head
# Execute master seed script
python seed_all.py
```

### 2. Start the Backend Server (Terminal 1)
The backend proxy runs on port `8000`.

```powershell
cd server
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Documentation available at: http://localhost:8000/docs*

### 3. Start the Frontend Application (Terminal 2)

```powershell
cd client
npm install
npm run dev
```
*App immediately available at: http://localhost:5173*

---

## 🔑 Default Credentials

For admin access (`/admin/login`), use the credentials generated via the seeding scripts:

* **System Access:** Super Admin (`CMD. PERERA`)
* **Role:** `SUPER_ADMIN`
* **Default Database Config:** `localhost:5432` / `flood_resilience` (postgres / 2001)

---

## 🛠️ Project Structure Overview

```text
floodweb/
├── client/                 # React 19 Frontend Application
│   ├── src/
│   │   ├── components/     # UI, SystemLogo, Map widgets, and Layouts
│   │   ├── hooks/          # Custom React hooks (e.g., useWeatherData)
│   │   ├── pages/          # Public Dashboard & Admin Situation Room
│   │   ├── stores/         # Zustand stores (adminControlStore, maintenanceStore)
│   │   └── services/       # API interaction layer
│   └── vite.config.ts      # Vite proxy configurations
└── server/                 # Python 3.12 Backend Application
    ├── app/
    │   ├── api/            # FastAPI Route definitions (v1)
    │   ├── core/           # Security, auth, and config modules
    │   ├── models/         # SQLAlchemy DB models (GIS, AI, Weather, Reports)
    │   └── services/       # Business logic (Audit, Integration State)
    ├── seed_all.py         # Master DB & Integration State seeder
    ├── pyproject.toml      # Dependency definitions
    └── alembic/            # Database schema migrations
```
