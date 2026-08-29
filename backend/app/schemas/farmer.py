from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class FarmerProfileBase(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    preferred_language: Optional[str] = "English"
    location: Optional[str] = None
    farm_size: Optional[str] = None
    primary_crop: Optional[str] = None
    soil_type: Optional[str] = None
    current_crop_stage: Optional[str] = None


class FarmerProfileCreate(FarmerProfileBase):
    pass


class FarmerProfileUpdate(FarmerProfileBase):
    pass


class FarmerOnboardRequest(BaseModel):
    uuid: str
    name: str
    age: Optional[int] = None
    location: Optional[str] = None
    farm_size: Optional[str] = None
    primary_crop: Optional[str] = None
    preferred_language: Optional[str] = "English"


class FarmerProfileResponse(FarmerProfileBase):
    id: int
    user_id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

