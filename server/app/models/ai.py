"""
AI/ML models for chatbot, knowledge base, embeddings, and model registry.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel, AuditedModel


class ModelType(str, enum.Enum):
    """ML model types."""
    FLOOD_PREDICTION = "flood_prediction"
    REPORT_VERIFICATION = "report_verification"
    IMAGE_CLASSIFICATION = "image_classification"
    TEXT_EMBEDDING = "text_embedding"
    CHATBOT_LLM = "chatbot_llm"
    ANOMALY_DETECTION = "anomaly_detection"


class ModelStatus(str, enum.Enum):
    """Model deployment status."""
    TRAINING = "training"
    VALIDATING = "validating"
    READY = "ready"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    FAILED = "failed"


class DocumentType(str, enum.Enum):
    """Knowledge document types."""
    FAQ = "faq"
    GUIDE = "guide"
    PROCEDURE = "procedure"
    REGULATION = "regulation"
    NEWS = "news"
    RESEARCH = "research"
    GLOSSARY = "glossary"


class ChatSessionStatus(str, enum.Enum):
    """Chat session status."""
    ACTIVE = "active"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    ABANDONED = "abandoned"


# ============================================================================
# Model Registry
# ============================================================================

class ModelRegistry(AuditedModel):
    """Registry of ML models."""
    
    __tablename__ = "model_registry"
    __table_args__ = (
        Index("ix_model_registry_model_type", "model_type"),
        Index("ix_model_registry_status", "status"),
        Index("ix_model_registry_is_active", "is_active"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    model_type: Mapped[ModelType] = mapped_column(
        SQLEnum(ModelType, name="model_type"),
        nullable=False,
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[ModelStatus] = mapped_column(
        SQLEnum(ModelStatus, name="model_status"),
        default=ModelStatus.TRAINING,
        nullable=False,
    )
    
    # Model location
    model_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # External API (for LLMs like OpenRouter)
    api_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    api_model_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Performance metrics
    metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # accuracy, f1, etc.
    
    # Configuration
    config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    hyperparameters: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Training info
    trained_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    training_data_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Deployment
    deployed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deprecated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Usage tracking
    inference_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_inference_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Active flag
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationships
    predictions: Mapped[List["FloodPrediction"]] = relationship("FloodPrediction", back_populates="model")


# ============================================================================
# Knowledge Base
# ============================================================================

class KnowledgeDocument(AuditedModel):
    """Knowledge base documents for RAG."""
    
    __tablename__ = "knowledge_documents"
    __table_args__ = (
        Index("ix_knowledge_documents_doc_type", "doc_type"),
        Index("ix_knowledge_documents_category", "category"),
        Index("ix_knowledge_documents_is_active", "is_active"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    doc_type: Mapped[DocumentType] = mapped_column(
        SQLEnum(DocumentType, name="document_type"),
        nullable=False,
    )
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Source
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Metadata
    tags: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Language
    primary_language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)
    
    # Processing status
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    chunks: Mapped[List["DocumentChunk"]] = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(BaseModel):
    """Chunked document content for embeddings."""
    
    __tablename__ = "document_chunks"
    __table_args__ = (
        Index("ix_document_chunks_document_id", "document_id"),
        Index("ix_document_chunks_language", "language"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Token count for context management
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Language
    language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)
    
    # Semantic metadata
    topics: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    document: Mapped["KnowledgeDocument"] = relationship("KnowledgeDocument", back_populates="chunks")
    embedding: Mapped[Optional["ChunkEmbedding"]] = relationship("ChunkEmbedding", back_populates="chunk", uselist=False, cascade="all, delete-orphan")


class ChunkEmbedding(BaseModel):
    """Vector embeddings for document chunks using pgvector."""
    
    __tablename__ = "chunk_embeddings"
    __table_args__ = (
        Index(
            "ix_chunk_embeddings_vector",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    chunk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_chunks.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Vector embedding (1536 dimensions for OpenAI ada-002, adjust as needed)
    embedding: Mapped[list] = mapped_column(Vector(1536), nullable=False)
    
    # Model used for embedding
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Relationships
    chunk: Mapped["DocumentChunk"] = relationship("DocumentChunk", back_populates="embedding")


# ============================================================================
# Chatbot Models
# ============================================================================

class ChatSession(BaseModel):
    """Chat sessions with the AI chatbot."""
    
    __tablename__ = "chat_sessions"
    __table_args__ = (
        Index("ix_chat_sessions_user_id", "user_id"),
        Index("ix_chat_sessions_status", "status"),
        Index("ix_chat_sessions_started_at", "started_at"),
    )

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Session tracking
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    
    status: Mapped[ChatSessionStatus] = mapped_column(
        SQLEnum(ChatSessionStatus, name="chat_session_status"),
        default=ChatSessionStatus.ACTIVE,
        nullable=False,
    )
    
    # Timestamps
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Context
    context: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # User context, location, etc.
    
    # Language
    language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)
    
    # Metrics
    message_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Feedback
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(BaseModel):
    """Individual chat messages."""
    
    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("ix_chat_messages_session_id", "session_id"),
        Index("ix_chat_messages_sent_at", "sent_at"),
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Model info
    model_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("model_registry.id"),
        nullable=True,
    )
    
    # Token usage
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # RAG context
    retrieved_chunks: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # IDs of chunks used
    
    # Metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")


class ChatbotKnowledgeEntry(AuditedModel):
    """Quick knowledge entries for chatbot (FAQs, quick responses)."""
    
    __tablename__ = "chatbot_knowledge_entries"
    __table_args__ = (
        Index("ix_chatbot_knowledge_entries_category", "category"),
        Index("ix_chatbot_knowledge_entries_is_active", "is_active"),
    )

    question: Mapped[str] = mapped_column(Text, nullable=False)
    question_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    question_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    answer_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    answer_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Matching keywords
    keywords: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Priority for matching
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Usage tracking
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


# ============================================================================
# AI Processing Jobs
# ============================================================================

class EmbeddingJob(BaseModel):
    """Background jobs for generating embeddings."""
    
    __tablename__ = "embedding_jobs"
    __table_args__ = (
        Index("ix_embedding_jobs_status", "status"),
        Index("ix_embedding_jobs_created_at", "created_at"),
    )

    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    
    # Progress
    total_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
