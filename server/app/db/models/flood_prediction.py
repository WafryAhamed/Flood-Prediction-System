from sqlalchemy import Column, Float, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base_class import Base

class FloodPrediction(Base):
    __tablename__ = "flood_predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Assuming there's a locations table. If not, this can be nullable or removed if locations are tracked differently.
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    
    prediction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    flood_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    
    prediction_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Optionally relationship if Location model exists
    # location = relationship("Location", back_populates="predictions")

# Add indexes outside or through __table_args__
Index('idx_flood_pred_location', FloodPrediction.location_id)
Index('idx_flood_pred_date', FloodPrediction.prediction_date)
