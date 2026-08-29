from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    preferred_language = Column(String(50), nullable=True, default="English")
    location = Column(String(200), nullable=True)
    farm_size = Column(String(100), nullable=True)
    primary_crop = Column(String(100), nullable=True)
    soil_type = Column(String(100), nullable=True)
    current_crop_stage = Column(String(100), nullable=True)
    voice_response_enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


    # Relationships
    user = relationship("User", back_populates="profile")
