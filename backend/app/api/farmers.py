from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.farmer import FarmerProfileResponse, FarmerProfileUpdate
from app.services.auth_service import get_current_user
from app.services.farmer_service import get_farmer_profile, update_farmer_profile
from app.models.user import User

router = APIRouter(prefix="/api/farmer", tags=["Farmer Profile"])


@router.get("/profile", response_model=FarmerProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_farmer_profile(db, current_user.id)


@router.put("/profile", response_model=FarmerProfileResponse)
def update_profile(
    profile_in: FarmerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_farmer_profile(db, current_user.id, profile_in)
