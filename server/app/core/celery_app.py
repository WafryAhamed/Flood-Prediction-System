"""
Celery configuration and task queue setup.
"""
from celery import Celery

from app.core.config import settings


def create_celery_app() -> Celery:
    """
    Create and configure Celery application.
    """
    celery_app = Celery(
        "flood_resilience",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
    )
    
    celery_app.conf.update(
        # Task settings
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="Asia/Colombo",
        enable_utc=True,
        
        # Task routing
        task_routes={
            "app.tasks.notifications.*": {"queue": "notifications"},
            "app.tasks.weather.*": {"queue": "weather"},
            "app.tasks.ai.*": {"queue": "ai"},
            "app.tasks.reports.*": {"queue": "reports"},
        },
        
        # Task execution settings
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        worker_prefetch_multiplier=1,
        
        # Result backend settings
        result_expires=3600,  # 1 hour
        
        # Beat scheduler for periodic tasks
        beat_schedule={
            "fetch-weather-data": {
                "task": "app.tasks.weather.fetch_weather_data",
                "schedule": 300.0,  # Every 5 minutes
            },
            "process-flood-predictions": {
                "task": "app.tasks.weather.process_flood_predictions",
                "schedule": 900.0,  # Every 15 minutes
            },
            "cleanup-expired-sessions": {
                "task": "app.tasks.auth.cleanup_expired_sessions",
                "schedule": 3600.0,  # Every hour
            },
            "sync-radar-images": {
                "task": "app.tasks.weather.sync_radar_images",
                "schedule": 600.0,  # Every 10 minutes
            },
            "update-district-risk-snapshots": {
                "task": "app.tasks.gis.update_district_risk_snapshots",
                "schedule": 1800.0,  # Every 30 minutes
            },
        },
        
        # Worker settings
        worker_concurrency=4,
        worker_max_tasks_per_child=1000,
    )
    
    # Auto-discover tasks
    celery_app.autodiscover_tasks([
        "app.tasks.notifications",
        "app.tasks.weather",
        "app.tasks.ai",
        "app.tasks.reports",
        "app.tasks.auth",
        "app.tasks.gis",
    ])
    
    return celery_app


celery_app = create_celery_app()
