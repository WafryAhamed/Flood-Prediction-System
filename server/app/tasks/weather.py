"""
Weather data background tasks.
"""
import logging
from datetime import datetime, timedelta
from uuid import UUID

import httpx
from celery import shared_task

from app.db.session import async_session_maker
from app.core.config import settings


logger = logging.getLogger(__name__)


@shared_task
def fetch_weather_data() -> dict:
    """
    Fetch current weather data from external APIs.
    
    Sources:
    - Open-Meteo (free, no API key required)
    - Sri Lanka Department of Meteorology (if available)
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_fetch_weather_async())


async def _fetch_weather_async() -> dict:
    """Async implementation of weather data fetching."""
    from sqlalchemy import select
    from app.models.gis import District
    from app.models.weather import WeatherObservation, WeatherSource
    
    async with async_session_maker() as db:
        # Get all active districts with coordinates
        query = select(District).where(District.is_active == True)
        result = await db.execute(query)
        districts = result.scalars().all()
        
        observations_created = 0
        
        async with httpx.AsyncClient() as client:
            for district in districts:
                if not district.centroid_lat or not district.centroid_lon:
                    continue
                
                try:
                    # Fetch from Open-Meteo (free weather API)
                    response = await client.get(
                        "https://api.open-meteo.com/v1/forecast",
                        params={
                            "latitude": district.centroid_lat,
                            "longitude": district.centroid_lon,
                            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover",
                            "timezone": "Asia/Colombo",
                        },
                        timeout=30.0,
                    )
                    
                    if response.status_code != 200:
                        logger.warning(f"Open-Meteo API returned {response.status_code} for {district.code}")
                        continue
                    
                    data = response.json()
                    current = data.get("current", {})
                    
                    observation = WeatherObservation(
                        district_id=district.id,
                        latitude=district.centroid_lat,
                        longitude=district.centroid_lon,
                        station_name=f"{district.name_en} Center",
                        observed_at=datetime.utcnow(),
                        source=WeatherSource.OPEN_METEO,
                        temperature_celsius=current.get("temperature_2m"),
                        humidity_percent=current.get("relative_humidity_2m"),
                        precipitation_mm=current.get("precipitation", 0) + current.get("rain", 0),
                        wind_speed_kmh=current.get("wind_speed_10m"),
                        wind_direction_degrees=current.get("wind_direction_10m"),
                        pressure_hpa=current.get("pressure_msl"),
                        cloud_cover_percent=current.get("cloud_cover"),
                        raw_data=data,
                    )
                    
                    db.add(observation)
                    observations_created += 1
                    
                except httpx.TimeoutException:
                    logger.warning(f"Timeout fetching weather for {district.code}")
                except Exception as e:
                    logger.error(f"Error fetching weather for {district.code}: {e}")
        
        await db.commit()
        
        logger.info(f"Created {observations_created} weather observations")
        return {"observations_created": observations_created}


@shared_task
def process_flood_predictions() -> dict:
    """
    Process flood predictions based on weather data.
    
    This task:
    1. Analyzes recent weather patterns
    2. Incorporates river gauge readings
    3. Runs ML model predictions (if configured)
    4. Creates/updates FloodPrediction records
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_process_predictions_async())


async def _process_predictions_async() -> dict:
    """Async implementation of flood prediction processing."""
    from sqlalchemy import select, func
    from app.models.gis import District, RiskZone, RiskLevel
    from app.models.weather import (
        WeatherObservation,
        RiverGaugeReading,
        FloodPrediction,
    )
    
    async with async_session_maker() as db:
        # Get districts with recent heavy rainfall
        past_24h = datetime.utcnow() - timedelta(hours=24)
        
        # Calculate accumulated rainfall per district
        rainfall_query = (
            select(
                WeatherObservation.district_id,
                func.sum(WeatherObservation.precipitation_mm).label("total_rain"),
            )
            .where(WeatherObservation.observed_at >= past_24h)
            .group_by(WeatherObservation.district_id)
        )
        
        rainfall_result = await db.execute(rainfall_query)
        rainfall_data = {row[0]: row[1] or 0 for row in rainfall_result.all()}
        
        # Get river gauge readings above warning levels
        gauge_query = (
            select(RiverGaugeReading)
            .where(
                RiverGaugeReading.observed_at >= past_24h,
                RiverGaugeReading.water_level_m > RiverGaugeReading.warning_level_m,
            )
        )
        
        gauge_result = await db.execute(gauge_query)
        high_gauges = gauge_result.scalars().all()
        
        predictions_created = 0
        
        # Simple rule-based prediction (replace with ML model in production)
        for district_id, total_rain in rainfall_data.items():
            # Check if district has high river levels
            district_high_gauges = [g for g in high_gauges if g.district_id == district_id]
            
            # Calculate flood probability based on simple rules
            probability = 0.0
            
            if total_rain > 100:  # Heavy rain (>100mm in 24h)
                probability += 0.4
            elif total_rain > 50:
                probability += 0.2
            elif total_rain > 25:
                probability += 0.1
            
            if district_high_gauges:
                # Add probability based on how much above warning level
                for gauge in district_high_gauges:
                    if gauge.water_level_m > gauge.danger_level_m:
                        probability += 0.4
                    else:
                        probability += 0.2
            
            probability = min(probability, 0.95)  # Cap at 95%
            
            if probability >= 0.1:  # Only create predictions with meaningful probability
                # Get risk zones for district
                zone_query = select(RiskZone).where(
                    RiskZone.district_id == district_id,
                    RiskZone.is_active == True,
                )
                zone_result = await db.execute(zone_query)
                zones = zone_result.scalars().all()
                
                # Create predictions for next 24, 48, 72 hours
                for hours_ahead in [24, 48, 72]:
                    # Diminishing probability for further forecasts
                    adjusted_prob = probability * (1 - (hours_ahead - 24) * 0.1 / 48)
                    
                    prediction = FloodPrediction(
                        district_id=district_id,
                        predicted_for=datetime.utcnow() + timedelta(hours=hours_ahead),
                        probability=adjusted_prob,
                        predicted_severity=_calculate_severity(adjusted_prob),
                        model_version="rule_based_v1",
                        factors={
                            "rainfall_24h_mm": total_rain,
                            "high_gauge_count": len(district_high_gauges),
                            "hours_ahead": hours_ahead,
                        },
                    )
                    db.add(prediction)
                    predictions_created += 1
        
        await db.commit()
        
        logger.info(f"Created {predictions_created} flood predictions")
        return {"predictions_created": predictions_created}


def _calculate_severity(probability: float) -> str:
    """Calculate severity level from probability."""
    if probability >= 0.8:
        return "extreme"
    elif probability >= 0.6:
        return "severe"
    elif probability >= 0.4:
        return "moderate"
    else:
        return "minor"


@shared_task
def sync_radar_images() -> dict:
    """
    Sync radar images from external sources.
    
    Sources:
    - RainViewer API (global radar data)
    - DMC Sri Lanka (local radar if available)
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_sync_radar_async())


async def _sync_radar_async() -> dict:
    """Async implementation of radar sync."""
    from app.models.weather import RadarSnapshot
    
    async with async_session_maker() as db:
        async with httpx.AsyncClient() as client:
            try:
                # Fetch from RainViewer API
                response = await client.get(
                    "https://api.rainviewer.com/public/weather-maps.json",
                    timeout=30.0,
                )
                
                if response.status_code != 200:
                    return {"error": f"RainViewer API returned {response.status_code}"}
                
                data = response.json()
                radar_frames = data.get("radar", {}).get("past", [])
                
                snapshots_created = 0
                
                for frame in radar_frames[-12:]:  # Last 12 frames (2 hours)
                    timestamp = frame.get("time")
                    path = frame.get("path")
                    
                    if not timestamp or not path:
                        continue
                    
                    # Construct image URL for Sri Lanka region
                    # Using tile at ~z7 centered on Sri Lanka (lat: 7.8, lon: 80.8)
                    image_url = f"https://tilecache.rainviewer.com{path}/256/7/89/60/1/1_1.png"
                    
                    snapshot = RadarSnapshot(
                        captured_at=datetime.fromtimestamp(timestamp),
                        source="rainviewer",
                        image_url=image_url,
                        bounds={
                            "north": 10.0,
                            "south": 5.5,
                            "east": 82.5,
                            "west": 79.0,
                        },
                        raw_data=frame,
                    )
                    
                    db.add(snapshot)
                    snapshots_created += 1
                
                await db.commit()
                
                logger.info(f"Synced {snapshots_created} radar snapshots")
                return {"snapshots_created": snapshots_created}
                
            except Exception as e:
                logger.error(f"Error syncing radar: {e}")
                return {"error": str(e)}


@shared_task
def update_weather_alerts() -> dict:
    """
    Check weather conditions and create/update alerts.
    
    Creates alerts for:
    - Heavy rainfall warnings
    - Flood warnings based on predictions
    - River level warnings
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_update_alerts_async())


async def _update_alerts_async() -> dict:
    """Async implementation of weather alert updates."""
    from sqlalchemy import select, func
    from app.models.gis import District
    from app.models.weather import (
        WeatherObservation,
        WeatherAlert,
        AlertType,
        AlertSeverity,
        FloodPrediction,
    )
    
    async with async_session_maker() as db:
        # Check for heavy rainfall in last 6 hours
        past_6h = datetime.utcnow() - timedelta(hours=6)
        
        rainfall_query = (
            select(
                WeatherObservation.district_id,
                func.sum(WeatherObservation.precipitation_mm).label("rainfall_6h"),
            )
            .where(WeatherObservation.observed_at >= past_6h)
            .group_by(WeatherObservation.district_id)
        )
        
        rainfall_result = await db.execute(rainfall_query)
        alerts_created = 0
        
        for row in rainfall_result.all():
            district_id, rainfall = row
            
            if rainfall and rainfall > 50:  # >50mm in 6h = heavy rain
                # Check if alert already exists
                existing = await db.execute(
                    select(WeatherAlert).where(
                        WeatherAlert.district_id == district_id,
                        WeatherAlert.alert_type == AlertType.RAIN,
                        WeatherAlert.is_active == True,
                    )
                )
                
                if not existing.scalar_one_or_none():
                    severity = AlertSeverity.SEVERE if rainfall > 100 else AlertSeverity.MODERATE
                    
                    alert = WeatherAlert(
                        district_id=district_id,
                        alert_type=AlertType.RAIN,
                        severity=severity,
                        headline_en=f"Heavy Rainfall Warning - {rainfall:.1f}mm in last 6 hours",
                        description_en=f"Heavy rainfall has been recorded in this area. Total precipitation: {rainfall:.1f}mm. Please stay alert and avoid flood-prone areas.",
                        issued_at=datetime.utcnow(),
                        expires_at=datetime.utcnow() + timedelta(hours=12),
                        source="system",
                        is_active=True,
                    )
                    db.add(alert)
                    alerts_created += 1
        
        await db.commit()
        
        return {"alerts_created": alerts_created}
