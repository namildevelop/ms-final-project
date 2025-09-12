from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid

from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin, UserUpdate
from app.schemas.trip import TripResponse, TripResponseWithMemberCount
from app.crud import user as crud_user
from app.crud import trip as crud_trip
from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.db.models import User as UserModel
from app.core.config import settings # Import settings

router = APIRouter()

UPLOAD_DIR = "uploads/profile_images" # Define upload directory
os.makedirs(UPLOAD_DIR, exist_ok=True) # Create directory if it doesn't exist


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud_user.create_user(db=db, user=user)

@router.post("/login", response_model=Token)
def login_for_access_token(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = crud_user.authenticate_user(
        db, email=user_credentials.email, password=user_credentials.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return crud_user.update_user(db=db, user=current_user, user_in=user_in)

@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    profile_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Delete old profile image if it exists
    if current_user.profile_image_url:
        old_image_path = os.path.join(UPLOAD_DIR, os.path.basename(current_user.profile_image_url))
        if os.path.exists(old_image_path):
            os.remove(old_image_path)

    # Generate a unique filename
    file_extension = profile_image.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save the new image
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(profile_image.file, buffer)

    # Construct the URL for the new image
    # Assuming your FastAPI app serves static files from the root or a specific path
    # You might need to adjust this URL based on your static file serving setup
    profile_image_url = f"{settings.BASE_URL}/{UPLOAD_DIR}/{unique_filename}"

    # Update user's profile_image_url in the database
    user_in = UserUpdate(profile_image_url=profile_image_url)
    updated_user = crud_user.update_user(db=db, user=current_user, user_in=user_in)
    
    return updated_user

@router.get("/me/trips", response_model=List[TripResponseWithMemberCount])
async def read_my_trips(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    trips = crud_trip.get_trips_by_user_id(db, user_id=current_user.id)
    trips_with_count = [
        TripResponseWithMemberCount(
            **TripResponse.model_validate(trip).model_dump(),
            member_count=len(trip.members)
        ) for trip in trips
    ]
    return trips_with_count

@router.get("/search", response_model=List[UserResponse])
def search_users(
    email_query: str = Query(..., min_length=2, description="Email to search for"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Search for users by email."""
    users = crud_user.search_users_by_email(
        db, email_query=email_query, current_user_id=current_user.id
    )
    return users
