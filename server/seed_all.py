"""
Master seed script: Populates ALL dummy data for every section of the
Flood Resilience System dashboard.

Seeds:
  ✅ adminControl JSON blob (broadcastFeed, dashboardResources, agriculture,
     recovery, learnHub, inundation, frontendSettings)
  ✅ maintenance JSON blob (mapZones, chatbotKnowledge, historyData,
     evacuationRoutes, simulationDefaults, dashboardOverrides, systemSettings)
  ✅ citizen_reports table (25 demo reports)
  ✅ broadcasts table (17 demo alerts)
  ✅ shelters table (demo shelters across districts)
  ✅ flood_history table
  ✅ infrastructure_assets table
  ✅ weather_observations + river_gauge_readings

Usage:
    cd server
    python seed_all.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import json
import random

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, delete
from app.db.session import async_session_factory
from app.models.audit import SystemSetting
from app.models.gis import (
    District, Shelter, EvacuationRoute as DBEvacuationRoute,
    InfrastructureAsset, FacilityType, FacilityStatus, RouteStatus,
    AssetType, AssetCondition,
)
from app.models.reports import CitizenReport, ReportType, ReportStatus, UrgencyLevel
from app.models.alerts import Broadcast, BroadcastType, BroadcastPriority, BroadcastStatus
from app.models.weather import (
    WeatherObservation, WeatherForecast, RiverGaugeReading, WeatherSource
)
from app.models.extras import FloodHistory
from app.core.security import generate_report_id
from app.services.integration_state import integration_state_service

# ═══════════════════════════════════════════════════════════════════════════
# 1. ADMIN CONTROL DATA (persisted as JSON in system_settings)
# ═══════════════════════════════════════════════════════════════════════════

ADMIN_CONTROL_DATA = {
    # ── Broadcast Feed ──
    "broadcastFeed": [
        {
            "id": "bf-1",
            "type": "critical",
            "time": "LIVE",
            "text": "CRITICAL: Immediate evacuation ordered for Colombo low-lying areas. Flash floods detected in Kelani River.",
            "active": True,
        },
        {
            "id": "bf-2",
            "type": "warning",
            "time": "LIVE",
            "text": "HIGH ALERT: Gampaha District – Heavy rainfall continues. Multiple shelters activated. 5,000+ evacuated.",
            "active": True,
        },
        {
            "id": "bf-3",
            "type": "caution",
            "time": "LIVE",
            "text": "CAUTION: Batticaloa District – Lagoon overflow predicted in 2 hours. Evacuation routes open.",
            "active": True,
        },
        {
            "id": "bf-4",
            "type": "info",
            "time": "LIVE",
            "text": "INFO: Kandy District – Relief supplies distributed. 200 family units assisted so far.",
            "active": True,
        },
        {
            "id": "bf-5",
            "type": "info",
            "time": "LIVE",
            "text": "UPDATE: Highway A9 partially cleared. Traffic restored on critical segments.",
            "active": False,
        },
        {
            "id": "bf-6",
            "type": "critical",
            "time": "LIVE",
            "text": "🚨 NATIONAL DISASTER ALERT - SEVERE WEATHER WARNING: Heavy rainfall and flooding expected across western provinces.",
            "active": True,
        },
        {
            "id": "bf-7",
            "type": "warning",
            "time": "LIVE",
            "text": "⚠️ FLOOD WARNING - CENTRAL PROVINCE: Rivers in Kandy and Matale districts showing dangerous water levels.",
            "active": True,
        },
        {
            "id": "bf-8",
            "type": "caution",
            "time": "LIVE",
            "text": "📢 EVACUATION ORDER - LOW-LYING AREAS: Mandatory evacuation from coastal low-lying areas in Southern Province.",
            "active": True,
        },
        {
            "id": "bf-9",
            "type": "info",
            "time": "LIVE",
            "text": "🏥 EMERGENCY MEDICAL SUPPORT: Mobile medical teams deployed to affected areas. Call 117 for assistance.",
            "active": True,
        },
        {
            "id": "bf-10",
            "type": "info",
            "time": "LIVE",
            "text": "📞 EMERGENCY HELPLINE ACTIVE: Call 117 for emergency assistance 24/7. SMS hotline available for remote areas.",
            "active": True,
        },
    ],

    # ── Dashboard Resources ──
    "dashboardResources": [
        {"id": "dr-1", "name": "Mobile Medical Units",      "status": "AVAILABLE", "statusColor": "bg-green-600",  "visible": True},
        {"id": "dr-2", "name": "Temporary Shelters",        "status": "FULL",      "statusColor": "bg-yellow-600", "visible": True},
        {"id": "dr-3", "name": "Water Purification Units",  "status": "AVAILABLE", "statusColor": "bg-green-600",  "visible": True},
        {"id": "dr-4", "name": "Heavy Machinery",           "status": "BUSY",      "statusColor": "bg-orange-600", "visible": True},
        {"id": "dr-5", "name": "Rescue Boats & Equipment",  "status": "AVAILABLE", "statusColor": "bg-green-600",  "visible": True},
        {"id": "dr-6", "name": "Relief Food Packages",      "status": "FULL",      "statusColor": "bg-yellow-600", "visible": True},
        {"id": "dr-7", "name": "Blankets & Clothing",       "status": "FULL",      "statusColor": "bg-yellow-600", "visible": True},
        {"id": "dr-8", "name": "Power Generators",          "status": "AVAILABLE", "statusColor": "bg-green-600",  "visible": True},
    ],

    # ── Agriculture Advisories ──
    "agricultureAdvisories": [
        {
            "id": "aa-1", "cropName": "Paddy (Rice)", "iconName": "Sprout",
            "statusLabel": "Alert", "statusColor": "bg-red-600 text-white",
            "message": "High water saturation detected in Colombo District. Recommend immediate drainage and elevated seed beds. Monitor water levels daily.",
        },
        {
            "id": "aa-2", "cropName": "Tea", "iconName": "Sprout",
            "statusLabel": "Caution", "statusColor": "bg-yellow-500 text-white",
            "message": "Moderate rainfall expected. Ensure proper drainage on slopes. Consider harvesting if ripe to avoid water damage.",
        },
        {
            "id": "aa-3", "cropName": "Coconut", "iconName": "Sprout",
            "statusLabel": "Safe", "statusColor": "bg-green-500 text-white",
            "message": "Coconut plants showing resilience. Continue regular monitoring. Secure loose fronds and fallen nuts.",
        },
        {
            "id": "aa-4", "cropName": "Rubber", "iconName": "CloudRain",
            "statusLabel": "Alert", "statusColor": "bg-red-600 text-white",
            "message": "Heavy waterlogging in Eastern plantations. Implement immediate lateral drainage systems to prevent root rot.",
        },
        {
            "id": "aa-5", "cropName": "Cinnamon", "iconName": "Droplets",
            "statusLabel": "Caution", "statusColor": "bg-yellow-500 text-white",
            "message": "Moisture levels elevated in Central District. Watch for fungal diseases. Apply fungicide if needed.",
        },
        {
            "id": "aa-6", "cropName": "Vegetables", "iconName": "Sprout",
            "statusLabel": "Alert", "statusColor": "bg-red-600 text-white",
            "message": "Tomatoes and chilies at risk in waterlogged areas. Consider raised beds and plastic mulching.",
        },
    ],

    # ── Agriculture Actions ──
    "agricultureActions": [
        {"id": "aa-act-1", "text": "Create emergency drainage channels in low-lying areas",          "order": 1},
        {"id": "aa-act-2", "text": "Distribute high-elevation crop seeds to farmers",                "order": 2},
        {"id": "aa-act-3", "text": "Organize livestock evacuation to higher ground shelters",        "order": 3},
        {"id": "aa-act-4", "text": "Install temporary pumping stations for waterlogged fields",      "order": 4},
        {"id": "aa-act-5", "text": "Deploy soil conservation teams to prevent erosion",              "order": 5},
        {"id": "aa-act-6", "text": "Prepare crop insurance claim support for affected farmers",      "order": 6},
        {"id": "aa-act-7", "text": "Monitor fertilizer and pesticide runoff pollution",              "order": 7},
        {"id": "aa-act-8", "text": "Begin community meetings on flood-resistant farming techniques", "order": 8},
    ],

    # ── Agriculture Risk Zones ──
    "agricultureZones": [
        {"id": "az-1", "label": "High Risk",      "riskLevel": "CRITICAL", "district": "Colombo District, Western",          "details": "Heavy waterlogging in paddy fields. 12,000+ farmers affected. Immediate intervention required.",                                "accentColor": "critical"},
        {"id": "az-2", "label": "High Risk",      "riskLevel": "CRITICAL", "district": "Batticaloa District, Eastern",       "details": "Extensive flooding in rubber estates. Drainage systems overwhelmed. 4,500 hectares at risk.",                                     "accentColor": "critical"},
        {"id": "az-3", "label": "Moderate Risk",  "riskLevel": "HIGH",     "district": "Kandy District, Central",            "details": "Tea plantations experiencing excessive moisture. Early fungal disease signs. Preventive measures advised.",                        "accentColor": "high"},
        {"id": "az-4", "label": "Moderate Risk",  "riskLevel": "HIGH",     "district": "Matara District, Southern",          "details": "Vegetable farms and coconut plantations waterlogged. 8,000 hectares monitored.",                                                  "accentColor": "high"},
        {"id": "az-5", "label": "Caution",         "riskLevel": "MODERATE", "district": "Kurunegala District, North Western", "details": "Mixed crops showing resilience. Continued monitoring recommended.",                                                                "accentColor": "warning"},
        {"id": "az-6", "label": "Caution",         "riskLevel": "MODERATE", "district": "Anuradhapura District, North Central","details": "Livestock feed supplies adequate. Shelters operational for 2,500 animals.",                                                        "accentColor": "warning"},
        {"id": "az-7", "label": "High Risk",      "riskLevel": "CRITICAL", "district": "Jaffna District, Northern",          "details": "Lagoon water levels critically high. 3,200 hectares of agricultural land at severe risk. Immediate action required.",              "accentColor": "critical"},
        {"id": "az-8", "label": "Moderate Risk",  "riskLevel": "HIGH",     "district": "Mullaitivu District, Eastern",       "details": "Seasonal farming areas affected by saltwater intrusion. Freshwater wells contaminated. 2,100 families impacted.",                 "accentColor": "high"},
        {"id": "az-9", "label": "Caution",         "riskLevel": "MODERATE", "district": "Ampara District, Eastern",           "details": "Mixed farming zones showing stable conditions. Early warning systems active. Crop monitoring in progress.",                        "accentColor": "warning"},
    ],

    # ── Inundation Forecasts ──
    "inundationForecasts": [
        {"id": "if-1", "district": "Colombo District",     "expectedLevel": "CRITICAL", "waterHeightCm": 185, "rainfallMm": 45, "timeToFlood": "2-3 hours", "affectedArea": "12,500 hectares", "color": "bg-red-600"},
        {"id": "if-2", "district": "Gampaha District",     "expectedLevel": "HIGH",     "waterHeightCm": 145, "rainfallMm": 38, "timeToFlood": "3-4 hours", "affectedArea": "8,900 hectares",  "color": "bg-orange-600"},
        {"id": "if-3", "district": "Batticaloa District",  "expectedLevel": "CRITICAL", "waterHeightCm": 165, "rainfallMm": 52, "timeToFlood": "1-2 hours", "affectedArea": "15,200 hectares", "color": "bg-red-600"},
        {"id": "if-4", "district": "Kalutara District",    "expectedLevel": "MODERATE", "waterHeightCm": 95,  "rainfallMm": 28, "timeToFlood": "4-5 hours", "affectedArea": "4,500 hectares",  "color": "bg-yellow-600"},
        {"id": "if-5", "district": "Kandy District",       "expectedLevel": "HIGH",     "waterHeightCm": 125, "rainfallMm": 35, "timeToFlood": "5-6 hours", "affectedArea": "6,800 hectares",  "color": "bg-orange-600"},
    ],

    # ── Recovery Progress ──
    "recoveryProgress": [
        {"id": "rp-1", "label": "Water Clearance",    "percent": 85, "color": "blue"},
        {"id": "rp-2", "label": "Power Restoration",  "percent": 60, "color": "yellow"},
        {"id": "rp-3", "label": "Road Clearing",      "percent": 40, "color": "orange"},
        {"id": "rp-4", "label": "Shelter Placement",  "percent": 95, "color": "green"},
    ],

    # ── Recovery Critical Needs ──
    "recoveryNeeds": [
        {"id": "rn-1", "name": "Clean Drinking Water",  "urgency": "CRITICAL"},
        {"id": "rn-2", "name": "Basic Medical Supplies", "urgency": "HIGH"},
        {"id": "rn-3", "name": "Baby Food & Formula",   "urgency": "MEDIUM"},
        {"id": "rn-4", "name": "Warm Blankets",         "urgency": "LOW"},
    ],

    # ── Recovery Updates ──
    "recoveryUpdates": [
        {"id": "ru-1", "title": "Main Highway A9 cleared of debris",      "iconName": "Truck",    "time": "2 hours ago"},
        {"id": "ru-2", "title": "Power restored to Central District",     "iconName": "Zap",      "time": "5 hours ago"},
        {"id": "ru-3", "title": "Mobile medical camps deployed",          "iconName": "Activity", "time": "12 hours ago"},
    ],

    # ── Recovery Resources ──
    "recoveryResources": [
        {"id": "rr-1", "name": "Disaster Relief Fund",      "detail": "Financial assistance application for damaged homes and local businesses."},
        {"id": "rr-2", "name": "Food Distribution Center",  "detail": "Open 24/7 at the main city hall. No registration required."},
        {"id": "rr-3", "name": "Volunteer Signup",          "detail": "Join the local cleanup crews and help restore the community."},
    ],

    # ── Learn Hub Guides ──
    "learnGuides": [
        {"id": "lg-1", "title": "Emergency Kit Preparation",    "iconName": "Package",     "description": "Learn what to pack in your 72-hour survival kit before the flood hits.",                     "accentColor": "blue", "visible": True},
        {"id": "lg-2", "title": "Immediate Evacuation Steps",   "iconName": "Navigation",  "description": "Step-by-step guide on how to safely evacuate your home and find high ground.",              "accentColor": "red",  "visible": True},
        {"id": "lg-3", "title": "Post-Flood Cleanup Safety",    "iconName": "ShieldAlert", "description": "Crucial health and safety protocols for re-entering a flooded building.",                   "accentColor": "green","visible": True},
    ],

    # ── Learn Hub Tips ──
    "learnTips": [
        {
            "id": "lt-1", "title": "Before the Flood",
            "tips": [
                "Move valuable items to higher floors.",
                "Clear gutters and drains around your property.",
                "Keep important documents in waterproof containers.",
            ],
        },
        {
            "id": "lt-2", "title": "During the Flood",
            "tips": [
                "Do not walk, swim or drive through flood waters.",
                "Stay away from power lines and electrical wires.",
                "Listen to emergency broadcasts for evacuation orders.",
            ],
        },
    ],

    # ── Featured Wisdom ──
    "featuredWisdom": {
        "quote": "Preparation through education is less costly than learning through tragedy.",
        "source": "Disaster Management Center",
        "visible": True,
    },

    # ── Frontend Settings ──
    "frontendSettings": {
        "emergencyBannerActive": True,
        "emergencyBannerMessage": "⚠️ SEVERE FLOOD WARNING: Multiple districts affected. Follow evacuation orders immediately.",
        "emergencyBannerRiskLevel": "CRITICAL",
        "siteFloodMode": "flood",
        "pageVisibility": {
            "dashboard": True,
            "riskMap": True,
            "communityReports": True,
            "evacuation": True,
            "history": True,
            "whatIf": True,
            "agriculture": True,
            "recovery": True,
            "learnHub": True,
            "safetyProfile": True,
        },
        "maintenanceMode": False,
    },

    # ── System / Alert levels ──
    "systemStatus": "online",
    "alertLevel": "RED",
    "maintenanceMode": False,
    "broadcastsEnabled": True,
    "reportsEnabled": True,
}

# ═══════════════════════════════════════════════════════════════════════════
# 2. MAINTENANCE DATA (persisted as JSON in system_settings)
# ═══════════════════════════════════════════════════════════════════════════

MAINTENANCE_DATA = {
    # ── Map Zones ──
    "mapZones": [
        {"id": "mz-1",  "name": "Colombo District, Western",              "zoneType": "critical",  "description": "Highest flood risk. Major rivers: Kelani, Attanagalu, Bolgoda Lake. Monsoon season critical.",                               "visible": True},
        {"id": "mz-2",  "name": "Gampaha District, Western",              "zoneType": "high-risk", "description": "Urban expansion increased flooding. Dual monsoons affect. Major rivers: Negombo Lagoon, Attanagalu.",                           "visible": True},
        {"id": "mz-3",  "name": "Kalutara District, Western",             "zoneType": "high-risk", "description": "Coastal district vulnerable to both monsoons and storm surges. Kalutara River flashfloods common.",                              "visible": True},
        {"id": "mz-4",  "name": "Batticaloa District, Eastern",           "zoneType": "critical",  "description": "High monsoon risk. Batticaloa Lagoon overflow during heavy rains. Rural agriculture heavily impacted.",                          "visible": True},
        {"id": "mz-5",  "name": "Kandy District, Central",                "zoneType": "high-risk", "description": "Mountainous terrain causes landslides and flashfloods. Tea plantations vulnerable. Mahaweli River key risk.",                     "visible": True},
        {"id": "mz-6",  "name": "Matara District, Southern",              "zoneType": "high-risk", "description": "Southwest monsoon directly impacts. Nilwala River prone to overflow. Coastal erosion during floods.",                             "visible": True},
        {"id": "mz-7",  "name": "Galle District, Southern",               "zoneType": "high-risk", "description": "Coastal vulnerability. Flash floods in low-lying coastal areas. Tourism infrastructure at risk.",                                 "visible": True},
        {"id": "mz-8",  "name": "Hambantota District, Southern",          "zoneType": "safe",      "description": "Relatively dry region but monsoon season still requires monitoring. Port infrastructure risk.",                                   "visible": True},
        {"id": "mz-9",  "name": "Jaffna District, Northern",              "zoneType": "safe",      "description": "Semi-arid climate. Minimal flooding but lagoons require careful management during monsoons.",                                     "visible": True},
        {"id": "mz-10", "name": "Vavuniya District, Northern",            "zoneType": "safe",      "description": "Inland district with moderate water retention. Post-war infrastructure recovery underway.",                                       "visible": True},
        {"id": "mz-11", "name": "Kurunegala District, North Western",     "zoneType": "high-risk", "description": "Dual monsoon effects. Major reservoirs and irrigation systems. Chandrika Samudra lake management critical.",                       "visible": True},
        {"id": "mz-12", "name": "Puttalam District, North Western",       "zoneType": "high-risk", "description": "Lagoon-based district prone to overflow. Illegal sand mining affected natural barriers. Climate refugee area.",                     "visible": True},
        {"id": "mz-13", "name": "Anuradhapura District, North Central",   "zoneType": "safe",      "description": "Ancient tank irrigation system. Dry zone requires flood management during monsoon transition periods.",                            "visible": True},
        {"id": "mz-14", "name": "Polonnaruwa District, North Central",    "zoneType": "safe",      "description": "Historical flood management systems. Large tanks regulate water. Agriculture-dependent economy.",                                  "visible": True},
        {"id": "mz-15", "name": "Badulla District, Uva",                  "zoneType": "high-risk", "description": "Hill country elevation. Tea plantations vulnerable. Flashfloods in valleys. Steep slopes cause landslides.",                        "visible": True},
        {"id": "mz-16", "name": "Monaragala District, Uva",               "zoneType": "safe",      "description": "Rural district with valley drainage challenges. Agricultural communities vulnerable to seasonal floods.",                          "visible": True},
        {"id": "mz-17", "name": "Ratnapura District, Sabaragamuwa",       "zoneType": "high-risk", "description": "Gemstone mining areas prone to flooding. Hill terrain causes rapid runoff. Gem industry dependent on water.",                       "visible": True},
        {"id": "mz-18", "name": "Kegalle District, Sabaragamuwa",         "zoneType": "high-risk", "description": "Tea country with plantation flooding risk. Steep terrain and deforestation increase vulnerability.",                                "visible": True},
        {"id": "mz-19", "name": "Matale District, Central",               "zoneType": "high-risk", "description": "Dry zone transition. Irrigation dependency. Upper Mahaweli basin affects. Landslide risk in hills.",                                "visible": True},
        {"id": "mz-20", "name": "Nuwara Eliya District, Central",         "zoneType": "safe",      "description": "Highest elevation district. Cool climate. Water sources for downstream regions. Dam management critical.",                         "visible": True},
    ],

    # ── Chatbot Knowledge ──
    "chatbotKnowledge": [
        {"id": "ck-1", "category": "Evacuation",       "keywords": ["evacuate", "evacuation", "leave", "safe place", "shelter"],    "response": "Follow local evacuation notices and move to the nearest designated shelter on higher ground. Carry water, medicine, documents, and emergency numbers (112, 117)."},
        {"id": "ck-2", "category": "Emergency Numbers", "keywords": ["number", "hotline", "call", "emergency", "phone"],            "response": "Emergency Hotline: 112 | Police: 119 | Ambulance/Fire: 110 | Disaster Management Centre: 117."},
        {"id": "ck-3", "category": "Flood Safety",      "keywords": ["flood", "water", "rising", "rain", "safety"],                 "response": "Move to higher ground if water is rising. Avoid flooded roads and bridges. Do not attempt to swim through floodwaters. Turn off electricity and gas mains before evacuating."},
        {"id": "ck-4", "category": "First Aid",         "keywords": ["first aid", "injury", "hurt", "medical", "health"],           "response": "For medical emergencies call 110. Clean wounds with boiled or purified water. Avoid floodwater contact with open wounds due to contamination risk."},
        {"id": "ck-5", "category": "Supplies",           "keywords": ["food", "water", "supplies", "kit", "prepare"],                "response": "Keep a 72-hour emergency kit: 3L water per person per day, non-perishable food, flashlight, batteries, first aid kit, important documents in waterproof bag, medications."},
        {"id": "ck-6", "category": "Post-Flood",        "keywords": ["after flood", "cleanup", "return", "post flood", "recovery"],"response": "Do not return home until authorities declare it safe. Check for structural damage before entering. Disinfect everything that was touched by floodwater. Document damage for insurance claims."},
    ],

    # ── System Settings ──
    "systemSettings": {
        "defaultMapCenter": [7.8731, 80.7718],
        "defaultMapZoom": 8,
        "riskThresholds": {"critical": 80, "high": 60, "moderate": 40},
        "alertMessages": {
            "critical": "CRITICAL: Immediate evacuation required in affected areas.",
            "high": "HIGH ALERT: Prepare for possible evacuation.",
            "moderate": "MODERATE: Monitor water levels and stay alert.",
            "safe": "All clear. No immediate flood risk detected.",
        },
    },

    # ── History Data ──
    "historyData": [
        {"id": "fh-1",  "year": 2024, "floods": 12, "rainfall": 450, "description": "Southwest monsoon with multiple river overflows. Colombo and Gampaha districts severely affected. 15,000 evacuated."},
        {"id": "fh-2",  "year": 2023, "floods": 8,  "rainfall": 320, "description": "Two-week downpour in May-June. Tea country landslides. Kandy district declared disaster area."},
        {"id": "fh-3",  "year": 2022, "floods": 14, "rainfall": 520, "description": "Consecutive cyclones in October. Heavy flooding in Eastern and Northern provinces. 45,000+ affected."},
        {"id": "fh-4",  "year": 2021, "floods": 9,  "rainfall": 280, "description": "Localized flooding in Western province. Batticaloa district experienced river breach."},
        {"id": "fh-5",  "year": 2020, "floods": 11, "rainfall": 380, "description": "Extended Southwest monsoon. Agriculture sector losses estimated at $2.5 billion."},
        {"id": "fh-6",  "year": 2019, "floods": 7,  "rainfall": 220, "description": "Minor flooding during April showers. Quick recovery with minimal economic impact."},
        {"id": "fh-7",  "year": 2018, "floods": 15, "rainfall": 580, "description": "Worst monsoon season in 20 years. Nationwide disaster response activated. 200+ deaths."},
        {"id": "fh-8",  "year": 2017, "floods": 5,  "rainfall": 150, "description": "Dry monsoon period. Below-average rainfall. Drought conditions in some areas."},
        {"id": "fh-9",  "year": 2016, "floods": 9,  "rainfall": 340, "description": "Flash flooding in central highlands. Multiple landslides. Infrastructure damage widespread."},
        {"id": "fh-10", "year": 2015, "floods": 6,  "rainfall": 280, "description": "Moderate monsoon activity. Foreseeable flooding managed well through early warnings."},
        {"id": "fh-11", "year": 2014, "floods": 13, "rainfall": 490, "description": "Unexpected early monsoon onset. Emergency preparations inadequate. $1.8B in damages."},
        {"id": "fh-12", "year": 2013, "floods": 8,  "rainfall": 310, "description": "Normal monsoon season. Organized response protocols tested and validated."},
        {"id": "fh-13", "year": 2012, "floods": 10, "rainfall": 420, "description": "Erratic rainfall patterns. Sudden urban flooding. Water management infrastructure overwhelmed."},
        {"id": "fh-14", "year": 2011, "floods": 7,  "rainfall": 260, "description": "Below-average season. Agriculture required irrigation support despite flooding in some pockets."},
        {"id": "fh-15", "year": 2010, "floods": 14, "rainfall": 550, "description": "Record rainfall recorded. Most severe season since 2003. National disaster declared."},
        {"id": "fh-16", "year": 2009, "floods": 6,  "rainfall": 190, "description": "Dry year. Groundwater levels depleted. Managed through reservoirs and water imports."},
        {"id": "fh-17", "year": 2008, "floods": 11, "rainfall": 380, "description": "Extended post-war recovery period. Floods complicated reconstruction efforts significantly."},
        {"id": "fh-18", "year": 2007, "floods": 9,  "rainfall": 330, "description": "Moderate activity. Post-conflict areas vulnerable due to weak drainage infrastructure."},
        {"id": "fh-19", "year": 2006, "floods": 8,  "rainfall": 300, "description": "Ongoing conflict limited relief operations. Civilian casualties higher than expected."},
        {"id": "fh-20", "year": 2005, "floods": 10, "rainfall": 400, "description": "Concurrent with tsunami recovery. Double disaster compounded humanitarian crisis."},
    ],

    # ── Evacuation Routes ──
    "evacuationRoutes": [
        {"id": "route-1", "name": "Colombo North Emergency Route",          "from": "Colombo City Center",      "to": "Negombo Sanctuary",         "distance": "35 km",  "status": "active",  "path": [[6.9271, 80.6393], [6.9500, 80.7000], [7.2000, 80.7500]]},
        {"id": "route-2", "name": "Gampaha Western Route",                  "from": "Gampaha Town",             "to": "Kurunegala Safe Zone",       "distance": "42 km",  "status": "active",  "path": [[7.0833, 80.7500], [7.1000, 80.6000], [7.2800, 80.6350]]},
        {"id": "route-3", "name": "Kalutara Southern Route",                "from": "Kalutara District",        "to": "Matara Higher Ground",       "distance": "28 km",  "status": "active",  "path": [[6.5910, 80.3546], [6.6500, 80.3000], [5.9497, 80.5353]]},
        {"id": "route-4", "name": "Batticaloa Eastward Route",              "from": "Batticaloa Lagoon Area",   "to": "Trincomalee Shelter",        "distance": "55 km",  "status": "caution", "path": [[7.7097, 81.7926], [7.9000, 81.8000], [8.5500, 81.1833]]},
        {"id": "route-5", "name": "Kandy Highland Route",                   "from": "Kandy City",               "to": "Nuwara Eliya Hill Sanctuary","distance": "65 km",  "status": "active",  "path": [[7.2906, 80.6337], [7.1500, 80.7800], [6.9497, 80.7778]]},
        {"id": "route-6", "name": "Galle South Coast Route",                "from": "Galle Fort Area",          "to": "Mirissa Elevated Zone",      "distance": "22 km",  "status": "blocked", "path": [[6.0535, 80.2172], [5.9500, 80.4500]]},
        {"id": "route-7", "name": "Batticaloa Alternative North Route",     "from": "Batticaloa Town",          "to": "Ampara Safe Corridor",       "distance": "38 km",  "status": "active",  "path": [[7.7097, 81.7926], [7.6500, 81.6000], [7.0000, 81.3000]]},
        {"id": "route-8", "name": "Jaffna Northern Safe Route",             "from": "Jaffna Peninsula",         "to": "Vavuniya Shelter",           "distance": "125 km", "status": "active",  "path": [[9.6667, 80.1333], [9.0000, 80.3000], [8.7603, 80.8042]]},
    ],

    # ── Simulation Defaults ──
    "simulationDefaults": {
        "rainfall": 50,
        "drainage": 50,
        "urbanization": 50,
    },

    # ── Dashboard Overrides ──
    "dashboardOverrides": {
        "windSpeed": 18,
        "rainfall": 12,
        "riskStatus": "MODERATE",
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# 3. CITIZEN REPORTS (into citizen_reports table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_REPORTS = [
    {"type": "FLOOD",                 "district": "Colombo",       "urgency": "CRITICAL", "status": "VERIFIED",   "desc": "Flash flooding in Colombo district - main roads blocked",                        "lat": 6.9271, "lon": 79.8612},
    {"type": "RESCUE_NEEDED",         "district": "Gampaha",       "urgency": "CRITICAL", "status": "DISPATCHED", "desc": "Multiple people trapped in flooded area",                                        "lat": 7.0674, "lon": 80.1987},
    {"type": "INFRASTRUCTURE_DAMAGE", "district": "Kalutara",      "urgency": "CRITICAL", "status": "DISPATCHED", "desc": "Bridge damaged - emergency repairs needed",                                      "lat": 6.4278, "lon": 80.0700},
    {"type": "FLOOD",                 "district": "Kandy",         "urgency": "HIGH",     "status": "VERIFIED",   "desc": "Moderate flooding in residential areas",                                         "lat": 7.2906, "lon": 80.6337},
    {"type": "ROAD_BLOCKED",          "district": "Matale",        "urgency": "HIGH",     "status": "VERIFIED",   "desc": "Multiple roads blocked by debris",                                               "lat": 7.4833, "lon": 80.7833},
    {"type": "LANDSLIDE",             "district": "Nuwara Eliya",  "urgency": "HIGH",     "status": "DISPATCHED", "desc": "Small landslide affecting mountain road",                                        "lat": 6.9497, "lon": 80.7891},
    {"type": "POWER_OUTAGE",          "district": "Galle",         "urgency": "HIGH",     "status": "VERIFIED",   "desc": "Power lines down across the district",                                           "lat": 6.0535, "lon": 80.2170},
    {"type": "WATER_SUPPLY",          "district": "Matara",        "urgency": "MEDIUM",   "status": "VERIFIED",   "desc": "Water supply interrupted in some areas",                                         "lat": 5.7489, "lon": 80.5470},
    {"type": "SHELTER_ISSUE",         "district": "Hambantota",    "urgency": "MEDIUM",   "status": "PENDING",    "desc": "Shelter accommodations at capacity",                                             "lat": 6.1243, "lon": 81.2120},
    {"type": "DEBRIS",                "district": "Jaffna",        "urgency": "MEDIUM",   "status": "VERIFIED",   "desc": "Debris scattered across streets - cleanup in progress",                          "lat": 9.6615, "lon": 80.0255},
    {"type": "FLOOD",                 "district": "Kilinochchi",   "urgency": "MEDIUM",   "status": "VERIFIED",   "desc": "Localized flooding in agricultural areas",                                       "lat": 8.8667, "lon": 80.3833},
    {"type": "CONTAMINATION",         "district": "Mannar",        "urgency": "LOW",      "status": "VERIFIED",   "desc": "Minor water contamination detected",                                             "lat": 8.9000, "lon": 79.9500},
    {"type": "OTHER",                 "district": "Vavuniya",      "urgency": "LOW",      "status": "PENDING",    "desc": "General safety concern reported",                                                "lat": 8.7589, "lon": 80.5167},
    {"type": "ROAD_BLOCKED",          "district": "Mullaitivu",    "urgency": "LOW",      "status": "RESOLVED",   "desc": "Minor road obstruction - cleared",                                               "lat": 8.2667, "lon": 81.8333},
    {"type": "FLOOD",                 "district": "Batticaloa",    "urgency": "HIGH",     "status": "VERIFIED",   "desc": "Significant water level rise in lagoon areas",                                   "lat": 7.7064, "lon": 81.6964},
    {"type": "RESCUE_NEEDED",         "district": "Ampara",        "urgency": "CRITICAL", "status": "DISPATCHED", "desc": "People stuck on rooftops awaiting rescue",                                       "lat": 7.2833, "lon": 81.6667},
    {"type": "INFRASTRUCTURE_DAMAGE", "district": "Trincomalee",   "urgency": "HIGH",     "status": "VERIFIED",   "desc": "Port facilities damaged by storm surge",                                        "lat": 8.5874, "lon": 81.2328},
    {"type": "FLOOD",                 "district": "Kurunegala",    "urgency": "MEDIUM",   "status": "VERIFIED",   "desc": "Moderate flooding - communities relocated",                                      "lat": 7.4833, "lon": 80.3667},
    {"type": "POWER_OUTAGE",          "district": "Puttalam",      "urgency": "MEDIUM",   "status": "DISPATCHED", "desc": "Electrical infrastructure damaged",                                               "lat": 8.0281, "lon": 79.8333},
    {"type": "LANDSLIDE",             "district": "Anuradhapura",  "urgency": "LOW",      "status": "RESOLVED",   "desc": "Small landslide - no significant damage",                                        "lat": 8.3242, "lon": 80.4167},
    {"type": "FLOOD",                 "district": "Polonnaruwa",   "urgency": "MEDIUM",   "status": "VERIFIED",   "desc": "Flood affecting irrigation systems",                                             "lat": 7.9333, "lon": 81.0000},
    {"type": "RESCUE_NEEDED",         "district": "Badulla",       "urgency": "HIGH",     "status": "DISPATCHED", "desc": "Mountain village isolated - emergency supplies needed",                           "lat": 6.9900, "lon": 81.2644},
    {"type": "WATER_SUPPLY",          "district": "Monaragala",    "urgency": "LOW",      "status": "PENDING",    "desc": "Water shortage in rural areas",                                                  "lat": 6.8158, "lon": 81.3500},
    {"type": "DEBRIS",                "district": "Ratnapura",     "urgency": "LOW",      "status": "VERIFIED",   "desc": "Tree debris on roads - cleanup ongoing",                                         "lat": 6.6964, "lon": 80.3933},
    {"type": "FLOOD",                 "district": "Kegalle",       "urgency": "MEDIUM",   "status": "VERIFIED",   "desc": "River overflow threatening homes",                                                "lat": 7.2667, "lon": 80.6333},
]

# ═══════════════════════════════════════════════════════════════════════════
# 4. BROADCASTS (into broadcasts table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_BROADCASTS = [
    {"title": "🚨 NATIONAL DISASTER ALERT - SEVERE WEATHER WARNING",    "message": "Heavy rainfall and flooding expected across western provinces. Residents advised to evacuate low-lying areas immediately.",       "priority": "CRITICAL", "districts": ["CMB", "GAM", "KLT"], "channels": ["push", "sms", "in_app"]},
    {"title": "⚠️  FLOOD WARNING - CENTRAL PROVINCE",                  "message": "Rivers in Kandy and Matale districts showing dangerous water levels. Emergency services deployed.",                            "priority": "CRITICAL", "districts": ["KND", "MTL"],         "channels": ["push", "sms"]},
    {"title": "📢 EVACUATION ORDER - LOW-LYING AREAS",                  "message": "Mandatory evacuation from coastal low-lying areas in Southern Province. Move to designated shelters.",                          "priority": "HIGH",     "districts": ["GAL", "MTR", "HMB"],  "channels": ["push", "in_app"]},
    {"title": "🏥 EMERGENCY MEDICAL SUPPORT AVAILABLE",                 "message": "Mobile medical teams deployed to affected areas. Call emergency hotline for assistance.",                                      "priority": "HIGH",     "districts": ["JAF", "KIL", "MNR"],  "channels": ["in_app"]},
    {"title": "🛣️  ROAD CLOSURE - A1 HIGHWAY SECTION",                 "message": "Main highway sections closed due to flooding. Use alternative routes.",                                                       "priority": "MEDIUM",   "districts": ["GAM", "KND"],         "channels": ["push", "in_app"]},
    {"title": "💧 WATER SUPPLY DISRUPTION",                             "message": "Water supply interrupted in some areas. Store drinking water. Updates every 2 hours.",                                        "priority": "MEDIUM",   "districts": ["MTL", "NWE"],         "channels": ["in_app"]},
    {"title": "🏠 EMERGENCY SHELTERS OPENED",                           "message": "Temporary shelters at schools and community centers. Contact district office for details.",                                    "priority": "MEDIUM",   "districts": ["VAV", "MLP"],         "channels": ["push"]},
    {"title": "⚡ POWER RESTORATION IN PROGRESS",                       "message": "Electrical infrastructure repairs underway. Power expected to restore within 24 hours.",                                      "priority": "LOW",      "districts": ["BTK", "AMP", "TRN"],  "channels": ["in_app"]},
    {"title": "✅ STATUS UPDATE - NORTHERN PROVINCE",                   "message": "Situation stabilizing. Emergency teams continuing recovery operations.",                                                      "priority": "LOW",      "districts": ["VAV"],                "channels": ["in_app"]},
    {"title": "📞 EMERGENCY HELPLINE ACTIVE",                           "message": "Call 117 for emergency assistance 24/7. SMS hotline available for regions without connectivity.",                              "priority": "MEDIUM",   "districts": ["CMB", "GAM", "KND"],  "channels": ["push", "sms"]},
    {"title": "National Disaster Alert - Severe Weather Warning",       "message": "Emergency broadcast for Colombo district",                                                                                     "priority": "CRITICAL", "districts": ["CMB"],                "channels": ["push", "sms", "in_app"]},
    {"title": "Flood Warning - All Western Province",                   "message": "Emergency broadcast for Gampaha district",                                                                                     "priority": "CRITICAL", "districts": ["GAM"],                "channels": ["push", "sms", "in_app"]},
    {"title": "Evacuation Order - Low-lying areas",                     "message": "Emergency broadcast for Kalutara district",                                                                                    "priority": "HIGH",     "districts": ["KLT"],                "channels": ["push", "sms", "in_app"]},
    {"title": "Emergency Shelters Opened",                              "message": "Emergency broadcast for Kandy district",                                                                                       "priority": "HIGH",     "districts": ["KND"],                "channels": ["push", "sms", "in_app"]},
    {"title": "Road Closure - A1 Highway",                              "message": "Emergency broadcast for Matale district",                                                                                      "priority": "MEDIUM",   "districts": ["MTL"],                "channels": ["push", "sms", "in_app"]},
    {"title": "Water Supply Disruption Notice",                         "message": "Emergency broadcast for Nuwara Eliya district",                                                                                "priority": "MEDIUM",   "districts": ["NWE"],                "channels": ["push", "sms", "in_app"]},
    {"title": "Power Restoration Timeline",                             "message": "Emergency broadcast for Galle district",                                                                                       "priority": "LOW",      "districts": ["GAL"],                "channels": ["push", "sms", "in_app"]},
]

# ═══════════════════════════════════════════════════════════════════════════
# 5. SHELTERS (into shelters table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_SHELTERS = [
    {"name": "Colombo Town Hall Community Center",       "district": "Colombo",       "type": "community_center","capacity": 500,  "occupancy": 320,  "lat": 6.9170, "lon": 79.8615, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Royal College Emergency Shelter",          "district": "Colombo",       "type": "school",          "capacity": 800,  "occupancy": 650,  "lat": 6.9105, "lon": 79.8645, "status": "full",     "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Gampaha District Hospital Annex",          "district": "Gampaha",       "type": "hospital",        "capacity": 200,  "occupancy": 180,  "lat": 7.0873, "lon": 80.0030, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Negombo Buddhist Temple Shelter",          "district": "Gampaha",       "type": "temple",          "capacity": 350,  "occupancy": 120,  "lat": 7.2100, "lon": 79.8400, "status": "active",   "medical": False, "food": True,  "water": True,  "power": False, "accessible": False},
    {"name": "Kalutara Vidyalaya Shelter",               "district": "Kalutara",      "type": "school",          "capacity": 400,  "occupancy": 250,  "lat": 6.5854, "lon": 79.9607, "status": "active",   "medical": False, "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Kandy Municipal Center",                   "district": "Kandy",         "type": "government_building","capacity": 600,"occupancy": 400, "lat": 7.2913, "lon": 80.6368, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Peradeniya University Hall",                "district": "Kandy",         "type": "school",          "capacity": 1000, "occupancy": 550,  "lat": 7.2563, "lon": 80.5965, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Galle Fort Community Shelter",              "district": "Galle",         "type": "community_center","capacity": 300,  "occupancy": 290,  "lat": 6.0291, "lon": 80.2189, "status": "full",     "medical": False, "food": True,  "water": True,  "power": True,  "accessible": False},
    {"name": "Batticaloa Central School",                "district": "Batticaloa",    "type": "school",          "capacity": 450,  "occupancy": 200,  "lat": 7.7170, "lon": 81.7000, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Jaffna Public Library Relief Center",      "district": "Jaffna",        "type": "community_center","capacity": 250,  "occupancy": 80,   "lat": 9.6610, "lon": 80.0260, "status": "standby",  "medical": False, "food": False, "water": True,  "power": True,  "accessible": True},
    {"name": "Trincomalee Harbor Shelter",               "district": "Trincomalee",   "type": "government_building","capacity": 350,"occupancy": 150, "lat": 8.5876, "lon": 81.2250, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Ratnapura Temple Emergency",               "district": "Ratnapura",     "type": "temple",          "capacity": 200,  "occupancy": 170,  "lat": 6.6828, "lon": 80.3994, "status": "active",   "medical": False, "food": True,  "water": True,  "power": False, "accessible": False},
    {"name": "Matara District Assembly Hall",             "district": "Matara",        "type": "government_building","capacity": 400,"occupancy": 310, "lat": 5.9549, "lon": 80.5550, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": True},
    {"name": "Badulla Highland Shelter",                 "district": "Badulla",       "type": "school",          "capacity": 300,  "occupancy": 100,  "lat": 6.9934, "lon": 81.0550, "status": "active",   "medical": True,  "food": True,  "water": True,  "power": True,  "accessible": False},
    {"name": "Hambantota Sports Complex",                "district": "Hambantota",    "type": "community_center","capacity": 500,  "occupancy": 50,   "lat": 6.1242, "lon": 81.1185, "status": "standby",  "medical": False, "food": False, "water": True,  "power": True,  "accessible": True},
]

# ═══════════════════════════════════════════════════════════════════════════
# 6. FLOOD HISTORY (into flood_history table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_FLOOD_HISTORY = [
    {"year": 2024, "event": "2024 Southwest Monsoon",          "count": 12, "rainfall": 450, "desc": "Southwest monsoon with multiple river overflows. Colombo and Gampaha districts severely affected. 15,000 evacuated.",                   "casualties": 42,  "affected": 150000,  "damage": 75000000000},
    {"year": 2023, "event": "2023 May-June Downpour",          "count": 8,  "rainfall": 320, "desc": "Two-week downpour in May-June. Tea country landslides. Kandy district declared disaster area.",                                        "casualties": 28,  "affected": 85000,   "damage": 45000000000},
    {"year": 2022, "event": "2022 October Cyclones",           "count": 14, "rainfall": 520, "desc": "Consecutive cyclones in October. Heavy flooding in Eastern and Northern provinces. 45,000+ affected.",                                  "casualties": 65,  "affected": 220000,  "damage": 120000000000},
    {"year": 2021, "event": "2021 Western Province Floods",    "count": 9,  "rainfall": 280, "desc": "Localized flooding in Western province. Batticaloa district experienced river breach.",                                                  "casualties": 15,  "affected": 45000,   "damage": 22000000000},
    {"year": 2020, "event": "2020 Extended Monsoon",           "count": 11, "rainfall": 380, "desc": "Extended Southwest monsoon. Agriculture sector losses estimated at $2.5 billion.",                                                      "casualties": 35,  "affected": 130000,  "damage": 95000000000},
    {"year": 2019, "event": "2019 April Showers",              "count": 7,  "rainfall": 220, "desc": "Minor flooding during April showers. Quick recovery with minimal economic impact.",                                                      "casualties": 8,   "affected": 25000,   "damage": 8000000000},
    {"year": 2018, "event": "2018 Mega Monsoon",               "count": 15, "rainfall": 580, "desc": "Worst monsoon season in 20 years. Nationwide disaster response activated. 200+ deaths.",                                                 "casualties": 210, "affected": 500000,  "damage": 250000000000},
    {"year": 2017, "event": "2017 Drought Year",               "count": 5,  "rainfall": 150, "desc": "Dry monsoon period. Below-average rainfall. Drought conditions in some areas.",                                                          "casualties": 3,   "affected": 10000,   "damage": 2000000000},
    {"year": 2016, "event": "2016 Central Highlands Flash Floods","count": 9, "rainfall": 340, "desc": "Flash flooding in central highlands. Multiple landslides. Infrastructure damage widespread.",                                          "casualties": 45,  "affected": 95000,   "damage": 55000000000},
    {"year": 2015, "event": "2015 Managed Monsoon",            "count": 6,  "rainfall": 280, "desc": "Moderate monsoon activity. Foreseeable flooding managed well through early warnings.",                                                   "casualties": 12,  "affected": 30000,   "damage": 12000000000},
]

# ═══════════════════════════════════════════════════════════════════════════
# 7. INFRASTRUCTURE ASSETS (into infrastructure_assets table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_INFRASTRUCTURE = [
    {"name": "Kelani River Bridge - A1",        "type": "bridge",        "condition": "at_risk",     "district": "Colombo",     "lat": 6.9500, "lon": 79.8900},
    {"name": "Attanagalu Oya Bridge",           "type": "bridge",        "condition": "degraded",    "district": "Gampaha",     "lat": 7.0800, "lon": 79.9500},
    {"name": "Victoria Dam Control Center",     "type": "dam",           "condition": "operational", "district": "Kandy",       "lat": 7.2330, "lon": 80.7950},
    {"name": "Colombo South Pump Station #1",   "type": "pump_station",  "condition": "operational", "district": "Colombo",     "lat": 6.9100, "lon": 79.8500},
    {"name": "Kelani River Gauge Station",      "type": "gauge_station", "condition": "operational", "district": "Colombo",     "lat": 6.9350, "lon": 79.8750, "reading": 8.5, "warn": 7.0, "crit": 9.0},
    {"name": "Mahaweli Diversion Tunnel",       "type": "drainage",      "condition": "operational", "district": "Kandy",       "lat": 7.2710, "lon": 80.6400},
    {"name": "Batticaloa Lagoon Drainage",      "type": "drainage",      "condition": "damaged",     "district": "Batticaloa",  "lat": 7.7300, "lon": 81.6900},
    {"name": "Galle Road Main Section (A2)",    "type": "road",          "condition": "degraded",    "district": "Galle",       "lat": 6.0500, "lon": 80.2100},
    {"name": "Colombo Grid Power Station",      "type": "power_station", "condition": "operational", "district": "Colombo",     "lat": 6.9400, "lon": 79.8300},
    {"name": "Puttalam Water Supply Intake",    "type": "water_supply",  "condition": "at_risk",     "district": "Puttalam",    "lat": 8.0300, "lon": 79.8300},
    {"name": "Nilwala River Gauge",             "type": "gauge_station", "condition": "operational", "district": "Matara",      "lat": 5.9500, "lon": 80.5400, "reading": 5.2, "warn": 5.0, "crit": 7.0},
    {"name": "Kalu Ganga Bridge - A4",          "type": "bridge",        "condition": "at_risk",     "district": "Ratnapura",   "lat": 6.6800, "lon": 80.4000},
]

# ═══════════════════════════════════════════════════════════════════════════
# 8. WEATHER OBSERVATIONS (into weather_observations table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_WEATHER = [
    {"district": "Colombo",     "temp": 28.5, "humidity": 92, "wind": 22.0,  "rainfall": 45.2, "pressure": 1008},
    {"district": "Gampaha",     "temp": 27.8, "humidity": 88, "wind": 18.5,  "rainfall": 38.1, "pressure": 1009},
    {"district": "Kalutara",    "temp": 29.1, "humidity": 86, "wind": 15.3,  "rainfall": 28.7, "pressure": 1010},
    {"district": "Kandy",       "temp": 22.3, "humidity": 95, "wind": 12.0,  "rainfall": 35.4, "pressure": 1005},
    {"district": "Batticaloa",  "temp": 30.5, "humidity": 90, "wind": 25.0,  "rainfall": 52.3, "pressure": 1006},
    {"district": "Galle",       "temp": 28.9, "humidity": 87, "wind": 20.0,  "rainfall": 22.5, "pressure": 1011},
    {"district": "Matara",      "temp": 29.3, "humidity": 85, "wind": 17.5,  "rainfall": 18.2, "pressure": 1012},
    {"district": "Jaffna",      "temp": 31.2, "humidity": 78, "wind": 14.0,  "rainfall": 8.5,  "pressure": 1013},
    {"district": "Trincomalee", "temp": 30.8, "humidity": 82, "wind": 19.0,  "rainfall": 15.3, "pressure": 1010},
    {"district": "Ratnapura",   "temp": 26.5, "humidity": 96, "wind": 8.0,   "rainfall": 65.0, "pressure": 1004},
    {"district": "Badulla",     "temp": 20.5, "humidity": 94, "wind": 10.0,  "rainfall": 42.0, "pressure": 1003},
    {"district": "Kurunegala",  "temp": 28.0, "humidity": 84, "wind": 12.5,  "rainfall": 22.0, "pressure": 1011},
]

# ═══════════════════════════════════════════════════════════════════════════
# 9. RIVER GAUGE READINGS (into river_gauge_readings table)
# ═══════════════════════════════════════════════════════════════════════════

DEMO_RIVER_GAUGES = [
    {"station": "Kelani River at Nagalagam", "district": "Colombo",    "level": 8.5,  "flow": 1250.0, "warn": 7.0, "crit": 9.0, "lat": 6.9371, "lon": 79.8812},
    {"station": "Kalu Ganga at Ratnapura",   "district": "Ratnapura",  "level": 6.8,  "flow": 980.0,  "warn": 6.0, "crit": 8.0, "lat": 6.6864, "lon": 80.3933},
    {"station": "Mahaweli at Peradeniya",    "district": "Kandy",      "level": 5.2,  "flow": 720.0,  "warn": 5.5, "crit": 7.5, "lat": 7.2563, "lon": 80.5965},
    {"station": "Nilwala at Matara",         "district": "Matara",     "level": 5.1,  "flow": 450.0,  "warn": 5.0, "crit": 7.0, "lat": 5.9549, "lon": 80.5370},
    {"station": "Gin Ganga at Baddegama",    "district": "Galle",      "level": 4.2,  "flow": 380.0,  "warn": 4.5, "crit": 6.5, "lat": 6.2300, "lon": 80.1900},
    {"station": "Batticaloa Lagoon Gauge",   "district": "Batticaloa", "level": 3.8,  "flow": 200.0,  "warn": 3.5, "crit": 5.0, "lat": 7.7170, "lon": 81.7000},
    {"station": "Walawe at Uda Walawe",      "district": "Ratnapura",  "level": 4.5,  "flow": 550.0,  "warn": 5.0, "crit": 7.0, "lat": 6.4700, "lon": 80.8900},
    {"station": "Deduru Oya at Chilaw",      "district": "Puttalam",   "level": 3.2,  "flow": 280.0,  "warn": 3.5, "crit": 5.5, "lat": 7.5750, "lon": 79.7950},
]


# ═══════════════════════════════════════════════════════════════════════════
# MAIN SEED FUNCTION
# ═══════════════════════════════════════════════════════════════════════════

async def seed_all():
    print("=" * 70)
    print("🌊 FLOOD RESILIENCE SYSTEM - MASTER DATA SEEDER")
    print("=" * 70)

    async with async_session_factory() as db:
        now = datetime.now(timezone.utc)

        # ─────────────────────────────
        # 0. Preflight: Load districts
        # ─────────────────────────────
        districts_result = await db.execute(select(District))
        all_districts = districts_result.scalars().all()
        districts_by_name = {d.name: d for d in all_districts}
        districts_by_code = {d.code: d for d in all_districts}

        if not districts_by_name:
            print("❌ No districts found! Run alembic migrations + initial seed_db.py first.")
            return

        print(f"\n✅ Found {len(districts_by_name)} districts\n")

        # ─────────────────────────────
        # 1. System Settings: adminControl
        # ─────────────────────────────
        print("━" * 50)
        print("📊 1/8 Seeding adminControl JSON blob...")

        admin_result = await db.execute(
            select(SystemSetting).where(
                SystemSetting.category == "integration",
                SystemSetting.key == "adminControl",
            )
        )
        admin_setting = admin_result.scalar_one_or_none()

        if admin_setting:
            existing = json.loads(admin_setting.value)
            existing.update(ADMIN_CONTROL_DATA)
            admin_setting.value = json.dumps(existing, ensure_ascii=False)
            admin_setting.last_modified_at = now
        else:
            admin_setting = SystemSetting(
                key="adminControl",
                category="integration",
                value=json.dumps(ADMIN_CONTROL_DATA, ensure_ascii=False),
                value_type="json",
                last_modified_at=now,
            )
            db.add(admin_setting)

        await db.commit()
        print("  ✅ adminControl: broadcastFeed, dashboardResources, agriculture,")
        print("     recovery, learnHub, inundation, frontendSettings – ALL seeded!")

        # ─────────────────────────────
        # 2. System Settings: maintenance
        # ─────────────────────────────
        print("\n━" * 50)
        print("🔧 2/8 Seeding maintenance JSON blob...")

        maint_result = await db.execute(
            select(SystemSetting).where(
                SystemSetting.category == "integration",
                SystemSetting.key == "maintenance",
            )
        )
        maint_setting = maint_result.scalar_one_or_none()

        if maint_setting:
            existing_maint = json.loads(maint_setting.value)
            existing_maint.update(MAINTENANCE_DATA)
            maint_setting.value = json.dumps(existing_maint, ensure_ascii=False)
            maint_setting.last_modified_at = now
        else:
            maint_setting = SystemSetting(
                key="maintenance",
                category="integration",
                value=json.dumps(MAINTENANCE_DATA, ensure_ascii=False),
                value_type="json",
                last_modified_at=now,
            )
            db.add(maint_setting)

        await db.commit()
        print("  ✅ maintenance: mapZones, chatbotKnowledge, historyData,")
        print("     evacuationRoutes, simulationDefaults, dashboardOverrides – ALL seeded!")

        # ─────────────────────────────
        # 3. Citizen Reports
        # ─────────────────────────────
        print("\n━" * 50)
        print(f"📝 3/8 Seeding {len(DEMO_REPORTS)} citizen reports...")

        for i, rpt in enumerate(DEMO_REPORTS):
            district = districts_by_name.get(rpt["district"])
            if not district:
                continue

            if rpt["status"] == "RESOLVED":
                submitted_at = now - timedelta(hours=2 + i)
            elif rpt["status"] == "DISPATCHED":
                submitted_at = now - timedelta(minutes=30 + i * 2)
            else:
                submitted_at = now - timedelta(minutes=15 + i)

            report = CitizenReport(
                public_id=generate_report_id(),
                report_type=ReportType(rpt["type"].lower()),
                status=ReportStatus(rpt["status"].lower()),
                urgency=UrgencyLevel(rpt["urgency"].lower()),
                title=f"{rpt['type'].replace('_', ' ').title()} Report - {rpt['district']}",
                description=rpt["desc"],
                location_description=f"{rpt['district']}, Sri Lanka",
                latitude=rpt["lat"],
                longitude=rpt["lon"],
                district_id=district.id,
                submitted_at=submitted_at,
                verified_at=submitted_at + timedelta(minutes=5) if rpt["status"] != "PENDING" else None,
                urgency_score={"CRITICAL": 100, "HIGH": 75, "MEDIUM": 50, "LOW": 25}[rpt["urgency"]],
                created_at=submitted_at,
                updated_at=submitted_at,
            )
            db.add(report)

        await db.commit()
        print(f"  ✅ {len(DEMO_REPORTS)} citizen reports created!")

        # ─────────────────────────────
        # 4. Broadcasts
        # ─────────────────────────────
        print("\n━" * 50)
        print(f"📢 4/8 Seeding {len(DEMO_BROADCASTS)} broadcasts...")

        for i, bc in enumerate(DEMO_BROADCASTS):
            created_time = now - timedelta(hours=len(DEMO_BROADCASTS) - i)
            target_districts = [c for c in bc["districts"] if c in districts_by_code]

            broadcast = Broadcast(
                title=bc["title"],
                message=bc["message"],
                broadcast_type=BroadcastType.ALERT,
                priority=BroadcastPriority(bc["priority"].lower()),
                status=BroadcastStatus.ACTIVE,
                active_from=created_time,
                active_to=now + timedelta(hours=48),
                target_districts=target_districts,
                channels=bc["channels"],
                created_at=created_time,
                updated_at=now,
            )
            db.add(broadcast)

        await db.commit()
        print(f"  ✅ {len(DEMO_BROADCASTS)} broadcasts created!")

        # ─────────────────────────────
        # 5. Shelters
        # ─────────────────────────────
        print("\n━" * 50)
        print(f"🏠 5/8 Seeding {len(DEMO_SHELTERS)} shelters...")

        for sh in DEMO_SHELTERS:
            district = districts_by_name.get(sh["district"])
            if not district:
                continue

            shelter = Shelter(
                name=sh["name"],
                facility_type=FacilityType(sh["type"]),
                status=FacilityStatus(sh["status"]),
                district_id=district.id,
                total_capacity=sh["capacity"],
                current_occupancy=sh["occupancy"],
                has_medical=sh["medical"],
                has_food=sh["food"],
                has_water=sh["water"],
                has_electricity=sh["power"],
                is_wheelchair_accessible=sh["accessible"],
                is_visible=True,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(shelter)

        await db.commit()
        print(f"  ✅ {len(DEMO_SHELTERS)} shelters created!")

        # ─────────────────────────────
        # 6. Flood History
        # ─────────────────────────────
        print("\n━" * 50)
        print(f"📚 6/8 Seeding {len(DEMO_FLOOD_HISTORY)} flood history entries...")

        for fh in DEMO_FLOOD_HISTORY:
            history = FloodHistory(
                year=fh["year"],
                event_name=fh["event"],
                floods_count=fh["count"],
                total_rainfall_mm=fh["rainfall"],
                description=fh["desc"],
                casualties=fh["casualties"],
                affected_population=fh["affected"],
                estimated_damage_lkr=fh["damage"],
            )
            db.add(history)

        await db.commit()
        print(f"  ✅ {len(DEMO_FLOOD_HISTORY)} flood history entries created!")

        # ─────────────────────────────
        # 7. Infrastructure Assets
        # ─────────────────────────────
        print("\n━" * 50)
        print(f"🏗️  7/8 Seeding {len(DEMO_INFRASTRUCTURE)} infrastructure assets...")

        for infra in DEMO_INFRASTRUCTURE:
            district = districts_by_name.get(infra["district"])

            asset = InfrastructureAsset(
                name=infra["name"],
                asset_type=AssetType(infra["type"]),
                condition=AssetCondition(infra["condition"]),
                district_id=district.id if district else None,
                current_reading=infra.get("reading"),
                threshold_warning=infra.get("warn"),
                threshold_critical=infra.get("crit"),
                is_visible=True,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(asset)

        await db.commit()
        print(f"  ✅ {len(DEMO_INFRASTRUCTURE)} infrastructure assets created!")

        # ─────────────────────────────
        # 8. Weather & River Gauges
        # ─────────────────────────────
        print("\n━" * 50)
        print(f"🌦️  8/8 Seeding {len(DEMO_WEATHER)} weather observations + {len(DEMO_RIVER_GAUGES)} river gauges...")

        for wx in DEMO_WEATHER:
            district = districts_by_name.get(wx["district"])
            obs = WeatherObservation(
                source=WeatherSource.MANUAL,
                station_id=f"WX-{wx['district'][:3].upper()}",
                latitude=district.centroid_lat if district and district.centroid_lat else 7.0,
                longitude=district.centroid_lon if district and district.centroid_lon else 80.0,
                observed_at=now - timedelta(minutes=random.randint(5, 30)),
                temperature_c=wx["temp"],
                humidity_percent=wx["humidity"],
                wind_speed_kmh=wx["wind"],
                precipitation_mm=wx["rainfall"],
                pressure_hpa=wx["pressure"],
                district_id=district.id if district else None,
            )
            db.add(obs)

        for rg in DEMO_RIVER_GAUGES:
            district = districts_by_name.get(rg["district"])
            gauge = RiverGaugeReading(
                station_id=f"RG-{rg['station'][:3].upper()}-{uuid4().hex[:4]}",
                station_name=rg["station"],
                latitude=rg["lat"],
                longitude=rg["lon"],
                measured_at=now - timedelta(minutes=random.randint(5, 20)),
                water_level_m=rg["level"],
                discharge_m3s=rg["flow"],
                alert_level_m=rg["warn"],
                danger_level_m=rg["crit"],
                is_above_alert=rg["level"] > rg["warn"],
                is_above_danger=rg["level"] > rg["crit"],
                district_id=district.id if district else None,
            )
            db.add(gauge)

        await db.commit()
        print(f"  ✅ {len(DEMO_WEATHER)} weather observations created!")
        print(f"  ✅ {len(DEMO_RIVER_GAUGES)} river gauge readings created!")

    # ─────────────────────────────
    # Reset integration cache
    # ─────────────────────────────
    print("\n━" * 50)
    print("🔄 Resetting integration state cache...")
    await integration_state_service.reset_cache()
    print("  ✅ Cache reset – frontend will get fresh data on next load!")

    # ─────────────────────────────
    # Summary
    # ─────────────────────────────
    print("\n" + "=" * 70)
    print("✨ MASTER SEED COMPLETE! All sections populated:")
    print("=" * 70)
    print(f"""
  📊 Admin Control (JSON blob):
     • Broadcast Feed:          {len(ADMIN_CONTROL_DATA['broadcastFeed'])} items
     • Dashboard Resources:     {len(ADMIN_CONTROL_DATA['dashboardResources'])} items
     • Agriculture Advisories:  {len(ADMIN_CONTROL_DATA['agricultureAdvisories'])} items
     • Agriculture Actions:     {len(ADMIN_CONTROL_DATA['agricultureActions'])} items
     • Agriculture Zones:       {len(ADMIN_CONTROL_DATA['agricultureZones'])} items
     • Inundation Forecasts:    {len(ADMIN_CONTROL_DATA['inundationForecasts'])} items
     • Recovery Progress:       {len(ADMIN_CONTROL_DATA['recoveryProgress'])} items
     • Recovery Needs:          {len(ADMIN_CONTROL_DATA['recoveryNeeds'])} items
     • Recovery Updates:        {len(ADMIN_CONTROL_DATA['recoveryUpdates'])} items
     • Recovery Resources:      {len(ADMIN_CONTROL_DATA['recoveryResources'])} items
     • Learn Hub Guides:        {len(ADMIN_CONTROL_DATA['learnGuides'])} items
     • Learn Hub Tips:          {len(ADMIN_CONTROL_DATA['learnTips'])} items
     • Featured Wisdom:         1 item
     • Frontend Settings:       ✅

  🔧 Maintenance (JSON blob):
     • Map Zones:               {len(MAINTENANCE_DATA['mapZones'])} items
     • Chatbot Knowledge:       {len(MAINTENANCE_DATA['chatbotKnowledge'])} items
     • History Data:            {len(MAINTENANCE_DATA['historyData'])} items
     • Evacuation Routes:       {len(MAINTENANCE_DATA['evacuationRoutes'])} items
     • Simulation Defaults:     ✅
     • Dashboard Overrides:     ✅
     • System Settings:         ✅

  🗃️  Database Tables:
     • Citizen Reports:         {len(DEMO_REPORTS)} rows
     • Broadcasts:              {len(DEMO_BROADCASTS)} rows
     • Shelters:                {len(DEMO_SHELTERS)} rows
     • Flood History:           {len(DEMO_FLOOD_HISTORY)} rows
     • Infrastructure Assets:   {len(DEMO_INFRASTRUCTURE)} rows
     • Weather Observations:    {len(DEMO_WEATHER)} rows
     • River Gauge Readings:    {len(DEMO_RIVER_GAUGES)} rows

  🔗 Visit: http://localhost:5173
     • Dashboard → Resources, Weather, Graph data
     • Risk Map → Map zones, markers
     • Community Reports → 25 live reports
     • Evacuation → Routes, shelters
     • History → 20 years of flood data
     • What-If Lab → Simulation defaults
     • Agriculture → Advisories, zones, forecasts
     • Recovery → Progress, needs, updates
     • Learn Hub → Guides, tips, wisdom
""")


if __name__ == "__main__":
    asyncio.run(seed_all())
