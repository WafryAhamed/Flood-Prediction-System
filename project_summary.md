# Project Summary: Flood Prediction & Management System

## Overview
This project is a comprehensive **Flood Prediction and Management System** designed to assist both citizens and administrators in managing flood-related risks, emergencies, and recovery efforts. It features a dual-interface application:
1.  **Citizen Portal**: Focused on safety, awareness, evacuation planning, and community reporting.
2.  **Admin Command Center**: Focused on monitoring, prediction model control, resource management, and alert broadcasting.

The application places a strong emphasis on **accessibility**, including voice narration and specialized modes.

---

## Tech Stack
*   **Framework**: [React 18](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: Framer Motion
*   **Maps**: [Leaflet](https://leafletjs.com/) & React Leaflet
*   **Charts/Data Viz**: Recharts
*   **Icons**: Lucide React
*   **Routing**: React Router DOM

---

## File Structure
The project follows a standard React/Vite structure:

```
e:/floodweb/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── ui/           # Basic UI blocks (buttons, inputs, etc.)
│   │   └── [Feature].tsx # Feature components (RiskMap, Chatbot, etc.)
│   ├── contexts/         # Global state (AccessibilityContext)
│   ├── pages/            # Main Route Pages
│   │   ├── admin/        # Admin Dashboard pages
│   │   └── [Page].tsx    # specific User pages (Dashboard, Map, etc.)
│   ├── App.tsx           # Main App component & Routing configuration
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── [Config Files]        # vite.config.ts, tailwind.config.js, etc.
```

---

## Key Functions & Features

### 1. Citizen Portal (User)
*   **Emergency Dashboard**: Real-time overview of current alert levels and critical information.
*   **Risk Map**: Interactive map visualization of flood risk zones.
*   **Community Reports**: Platform for citizens to report incidents or observations.
*   **Evacuation Planner**: Tools to find safe routes and shelters.
*   **Historical Timeline**: View past flood data and events.
*   **What-If Lab**: Simulation tool for scenario planning.
*   **Agriculture Advisor**: Guidance for protecting crops/livestock.
*   **Recovery Tracker**: Monitoring post-disaster recovery progress.
*   **Education**: Learn Hub for preparedness materials.
*   **Accessibility**:
    *   Voice Narration
    *   Emergency Quick Dial
    *   Citizen Chatbot assistant

### 2. Admin Command Center
*   **Situation Room**: Central dashboard for command decisions.
*   **Model Control**: Manage prediction models and parameters.
*   **Infrastructure Monitor**: Status of dams, levees, and sensors.
*   **Facility Management**: Manage shelters and emergency centers.
*   **Alert Broadcast**: Send system-wide alerts to users.
*   **Data & Analytics**:
    *   Audit Logs
    *   Data Upload (manual entry of sensor data?)
    *   Agriculture Console
    *   Report Moderation (verifying user reports)

---

## Application Entry Point
*   **`src/App.tsx`**: handles the main routing logic, separating the `/admin` routes from the public user interface and wrapping the application in the `AccessibilityProvider`.
