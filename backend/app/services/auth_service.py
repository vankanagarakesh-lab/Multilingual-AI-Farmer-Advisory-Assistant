from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User
from app.models.farmer_profile import FarmerProfile
from app.schemas.auth import UserRegister, UserLogin
from app.schemas.farmer import FarmerOnboardRequest, FarmerProfileResponse
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.database.session import get_db
from app.utils.errors import CredentialsException
from app.services.farmer_service import get_farmer_profile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def onboard_farmer_uuid(db: Session, onboard_in: FarmerOnboardRequest) -> dict:
    """Creates or updates a farmer record identified uniquely by their device UUID."""
    user = db.query(User).filter(User.uuid == onboard_in.uuid).first()
    if not user:
        user = User(
            uuid=onboard_in.uuid,
            name=onboard_in.name or "Farmer",
            email=f"farmer_{onboard_in.uuid[:8]}@krishi.local",
            password_hash="uuid_device_auth"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = FarmerProfile(
            user_id=user.id,
            age=onboard_in.age,
            location=onboard_in.location,
            farm_size=onboard_in.farm_size,
            primary_crop=onboard_in.primary_crop,
            preferred_language=onboard_in.preferred_language or "English"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        # Update existing record
        if onboard_in.name:
            user.name = onboard_in.name
        profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == user.id).first()
        if not profile:
            profile = FarmerProfile(user_id=user.id)
            db.add(profile)
        
        if onboard_in.age is not None:
            profile.age = onboard_in.age
        if onboard_in.location is not None:
            profile.location = onboard_in.location
        if onboard_in.farm_size is not None:
            profile.farm_size = onboard_in.farm_size
        if onboard_in.primary_crop is not None:
            profile.primary_crop = onboard_in.primary_crop
        if onboard_in.preferred_language is not None:
            profile.preferred_language = onboard_in.preferred_language

        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "uuid": user.uuid})
    farmer_profile = get_farmer_profile(db, user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "uuid": user.uuid,
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at
        },
        "profile": farmer_profile
    }


def get_or_create_by_uuid(db: Session, uuid_str: str) -> dict:
    """Resumes an existing session by farmer UUID."""
    user = db.query(User).filter(User.uuid == uuid_str).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found for this device."
        )

    token = create_access_token(data={"sub": str(user.id), "uuid": user.uuid})
    farmer_profile = get_farmer_profile(db, user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "uuid": user.uuid,
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at
        },
        "profile": farmer_profile
    }


def register_user(db: Session, user_in: UserRegister) -> User:
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    db_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Initialize empty farmer profile for the user
    profile = FarmerProfile(user_id=db_user.id)
    db.add(profile)
    db.commit()

    return db_user


def authenticate_user(db: Session, user_in: UserLogin) -> dict:
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # 1. Try Authorization Bearer Token
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload.get("sub")
            try:
                user_id_int = int(user_id)
                user = db.query(User).filter(User.id == user_id_int).first()
                if user:
                    return user
            except (ValueError, TypeError):
                pass

    # 2. Try X-Farmer-UUID header fallback
    farmer_uuid = request.headers.get("x-farmer-uuid") or request.headers.get("X-Farmer-UUID")
    if farmer_uuid:
        user = db.query(User).filter(User.uuid == farmer_uuid).first()
        if user:
            return user

    # 3. Fallback to default first user if present or raise credentials exception
    first_user = db.query(User).first()
    if first_user:
        return first_user

    raise CredentialsException()

