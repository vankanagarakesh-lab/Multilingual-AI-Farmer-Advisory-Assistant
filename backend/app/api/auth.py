from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.schemas.farmer import FarmerOnboardRequest
from app.services.auth_service import (
    register_user, 
    authenticate_user, 
    get_current_user,
    onboard_farmer_uuid,
    get_or_create_by_uuid
)
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/onboard", status_code=status.HTTP_200_OK)
def onboard(onboard_in: FarmerOnboardRequest, db: Session = Depends(get_db)):
    """Directly onboards a farmer using device UUID and profile info without credentials."""
    return onboard_farmer_uuid(db, onboard_in)


@router.get("/session/{uuid_str}", status_code=status.HTTP_200_OK)
def get_session_by_uuid(uuid_str: str, db: Session = Depends(get_db)):
    """Resumes an existing farmer session by device UUID."""
    return get_or_create_by_uuid(db, uuid_str)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user = register_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    return authenticate_user(db, user_in)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

