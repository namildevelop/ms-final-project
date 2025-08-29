from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.schemas.trip import TripResponse
from app.crud import user as crud_user
from app.crud import trip as crud_trip
from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.db.models import User as UserModel

router = APIRouter()

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

@router.get("/me/trips", response_model=List[TripResponse])
async def read_my_trips(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    trips = crud_trip.get_trips_by_user_id(db, user_id=current_user.id)
    return trips

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


