"""
Core configuration settings for the Flood Resilience System.
Uses pydantic-settings for environment variable management.
"""
from functools import lru_cache
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # =========================================================================
    # APPLICATION
    # =========================================================================
    app_name: str = "Flood Resilience System"
    version: str = "1.0.0"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field(..., min_length=32)
    allowed_hosts: List[str] = ["localhost", "127.0.0.1"]
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # =========================================================================
    # DATABASE
    # =========================================================================
    database_url: str
    database_url_sync: Optional[str] = None
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # =========================================================================
    # REDIS
    # =========================================================================
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_prefix: str = "flood:cache:"
    redis_session_prefix: str = "flood:session:"

    # =========================================================================
    # CELERY
    # =========================================================================
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # =========================================================================
    # JWT
    # =========================================================================
    jwt_secret_key: str = Field(..., min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # =========================================================================
    # STORAGE
    # =========================================================================
    storage_backend: str = "local"  # local, s3
    storage_local_path: str = "./storage"
    storage_s3_endpoint: Optional[str] = None
    storage_s3_access_key: Optional[str] = None
    storage_s3_secret_key: Optional[str] = None
    storage_s3_bucket: str = "flood-resilience"
    storage_s3_region: str = "us-east-1"

    # =========================================================================
    # EXTERNAL APIS
    # =========================================================================
    open_meteo_api_url: str = "https://api.open-meteo.com"
    rainviewer_api_url: str = "https://api.rainviewer.com"
    openrouter_api_key: Optional[str] = None
    openrouter_api_url: str = "https://openrouter.ai/api/v1"
    llm_model: str = "qwen/qwen3-vl-30b-a3b-thinking"
    llm_fallback_models: List[str] = ["google/gemma-3-1b-it:free"]
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # =========================================================================
    # RATE LIMITING
    # =========================================================================
    rate_limit_enabled: bool = True
    rate_limit_requests_per_minute: int = 60
    rate_limit_chat_requests_per_minute: int = 10
    rate_limit_report_requests_per_minute: int = 5

    # =========================================================================
    # FILE UPLOAD
    # =========================================================================
    max_upload_size_mb: int = 10
    allowed_image_types: List[str] = ["image/jpeg", "image/png", "image/webp"]
    allowed_data_types: List[str] = ["text/csv", "application/json", "application/geo+json"]
    allowed_document_types: List[str] = ["application/pdf", "text/plain", "text/markdown"]

    # =========================================================================
    # OBSERVABILITY
    # =========================================================================
    otel_enabled: bool = False
    otel_service_name: str = "flood-resilience-backend"
    otel_exporter_otlp_endpoint: Optional[str] = None
    log_level: str = "INFO"
    log_format: str = "json"

    # =========================================================================
    # SRI LANKA DEFAULTS
    # =========================================================================
    default_latitude: float = 8.3593
    default_longitude: float = 80.5103
    default_timezone: str = "Asia/Colombo"
    country_code: str = "LK"

    # =========================================================================
    # SEED DATA
    # =========================================================================
    seed_admin_email: str = "admin@floodresilience.lk"
    seed_admin_password: str = "AdminPass123!"
    seed_admin_name: str = "System Administrator"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    # -----------------------------------------------------------------
    # Backwards-compatible aliases (legacy uppercase accessors)
    # -----------------------------------------------------------------
    @property
    def PROJECT_NAME(self) -> str:
        return self.app_name

    @property
    def VERSION(self) -> str:
        return self.version

    @property
    def ENVIRONMENT(self) -> str:
        return self.app_env

    @property
    def DEBUG(self) -> bool:
        return self.debug

    @property
    def API_V1_PREFIX(self) -> str:
        return self.api_v1_prefix

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return self.cors_origins

    @property
    def REDIS_URL(self) -> str:
        return self.redis_url

    @property
    def DATABASE_URL(self) -> str:
        return self.database_url

    @property
    def JWT_SECRET_KEY(self) -> str:
        return self.jwt_secret_key

    @property
    def JWT_ALGORITHM(self) -> str:
        return self.jwt_algorithm

    @property
    def ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        return self.jwt_access_token_expire_minutes

    @property
    def REFRESH_TOKEN_EXPIRE_DAYS(self) -> int:
        return self.jwt_refresh_token_expire_days


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()  # pyright: ignore[reportCallIssue]


settings = get_settings()
