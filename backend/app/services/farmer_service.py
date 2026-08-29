from sqlalchemy.orm import Session
from app.models.farmer_profile import FarmerProfile
from app.models.user import User
from app.schemas.farmer import FarmerProfileUpdate, FarmerProfileResponse


def get_farmer_profile(db: Session, user_id: int) -> FarmerProfileResponse:
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).first()
    if not profile:
        profile = FarmerProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user else "Farmer"

    return FarmerProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        name=user_name,
        age=profile.age,
        preferred_language=profile.preferred_language or "English",
        location=profile.location,
        farm_size=profile.farm_size,
        primary_crop=profile.primary_crop,
        soil_type=profile.soil_type,
        current_crop_stage=profile.current_crop_stage,
        updated_at=profile.updated_at
    )


def update_farmer_profile(db: Session, user_id: int, profile_in: FarmerProfileUpdate) -> FarmerProfileResponse:
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).first()
    if not profile:
        profile = FarmerProfile(user_id=user_id)
        db.add(profile)

    user = db.query(User).filter(User.id == user_id).first()
    if user and profile_in.name:
        user.name = profile_in.name

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(profile, field):
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return get_farmer_profile(db, user_id)

