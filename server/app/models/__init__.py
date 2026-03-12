"""
SQLAlchemy models package.
"""
from app.models.base import BaseModel, AuditedModel, TimestampMixin, UUIDPrimaryKeyMixin, SoftDeleteMixin

# Auth models
from app.models.auth import (
    User,
    Role,
    Permission,
    UserRole,
    UserStatus,
    RefreshToken,
    AdminSession,
)

# GIS models
from app.models.gis import (
    District,
    RiskZone,
    Shelter,
    EvacuationRoute,
    InfrastructureAsset,
    TransportUnit,
    DistrictRiskSnapshot,
    RiskLevel,
    ZoneType,
    FacilityType,
    FacilityStatus,
    RouteStatus,
    AssetType,
    AssetCondition,
)

# Weather models
from app.models.weather import (
    WeatherObservation,
    WeatherForecast,
    RadarSnapshot,
    RiverGaugeReading,
    WeatherAlert,
    FloodPrediction,
    WeatherSource,
    AlertSeverity,
    AlertType,
)

# Report models
from app.models.reports import (
    CitizenReport,
    ReportMedia,
    ReportEvent,
    ReportUpvote,
    ReportVerificationScore,
    ReportType,
    ReportStatus,
    UrgencyLevel,
    MediaType,
)

# Alert/Broadcast models
from app.models.alerts import (
    Broadcast,
    BroadcastTarget,
    NotificationDelivery,
    EmergencyContact,
    UserNotificationPreference,
    DeviceToken,
    BroadcastType,
    BroadcastPriority,
    BroadcastStatus,
    ChannelType,
    DeliveryStatus,
)

# Content models
from app.models.content import (
    CropAdvisory,
    FarmDamageReport,
    RecoveryProgram,
    RecoveryMilestone,
    DonationCampaign,
    LearnHubCategory,
    LearnHubArticle,
    LearnHubQuiz,
    Resource,
    Checklist,
    ContentStatus,
    CropStatus,
    RecoveryPhase,
    RecoveryCategory,
)

# AI models
from app.models.ai import (
    ModelRegistry,
    KnowledgeDocument,
    DocumentChunk,
    ChunkEmbedding,
    ChatSession,
    ChatMessage,
    ChatbotKnowledgeEntry,
    EmbeddingJob,
    ModelType,
    ModelStatus,
    DocumentType,
    ChatSessionStatus,
)

# Audit models
from app.models.audit import (
    AuditLog,
    SystemEvent,
    DataUploadJob,
    DataExportJob,
    ScheduledTask,
    SystemSetting,
    MaintenanceWindow,
    AuditAction,
    SystemEventType,
    JobStatus,
)

__all__ = [
    # Base
    "BaseModel",
    "AuditedModel",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "SoftDeleteMixin",
    # Auth
    "User",
    "Role",
    "Permission",
    "UserRole",
    "UserStatus",
    "RefreshToken",
    "AdminSession",
    # GIS
    "District",
    "RiskZone",
    "Shelter",
    "EvacuationRoute",
    "InfrastructureAsset",
    "TransportUnit",
    "DistrictRiskSnapshot",
    "RiskLevel",
    "ZoneType",
    "FacilityType",
    "FacilityStatus",
    "RouteStatus",
    "AssetType",
    "AssetCondition",
    # Weather
    "WeatherObservation",
    "WeatherForecast",
    "RadarSnapshot",
    "RiverGaugeReading",
    "WeatherAlert",
    "FloodPrediction",
    "WeatherSource",
    "AlertSeverity",
    "AlertType",
    # Reports
    "CitizenReport",
    "ReportMedia",
    "ReportEvent",
    "ReportUpvote",
    "ReportVerificationScore",
    "ReportType",
    "ReportStatus",
    "UrgencyLevel",
    "MediaType",
    # Alerts
    "Broadcast",
    "BroadcastTarget",
    "NotificationDelivery",
    "EmergencyContact",
    "UserNotificationPreference",
    "DeviceToken",
    "BroadcastType",
    "BroadcastPriority",
    "BroadcastStatus",
    "ChannelType",
    "DeliveryStatus",
    # Content
    "CropAdvisory",
    "FarmDamageReport",
    "RecoveryProgram",
    "RecoveryMilestone",
    "DonationCampaign",
    "LearnHubCategory",
    "LearnHubArticle",
    "LearnHubQuiz",
    "Resource",
    "Checklist",
    "ContentStatus",
    "CropStatus",
    "RecoveryPhase",
    "RecoveryCategory",
    # AI
    "ModelRegistry",
    "KnowledgeDocument",
    "DocumentChunk",
    "ChunkEmbedding",
    "ChatSession",
    "ChatMessage",
    "ChatbotKnowledgeEntry",
    "EmbeddingJob",
    "ModelType",
    "ModelStatus",
    "DocumentType",
    "ChatSessionStatus",
    # Audit
    "AuditLog",
    "SystemEvent",
    "DataUploadJob",
    "DataExportJob",
    "ScheduledTask",
    "SystemSetting",
    "MaintenanceWindow",
    "AuditAction",
    "SystemEventType",
    "JobStatus",
]
