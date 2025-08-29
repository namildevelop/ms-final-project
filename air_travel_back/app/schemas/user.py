from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[datetime] = None
    address: Optional[str] = None
    mbti: Optional[str] = None

class UserInDB(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    nickname: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[datetime] = None
    address: Optional[str] = None
    mbti: Optional[str] = None
    created_at: Optional[datetime] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    nickname: str

    class Config:
        from_attributes = True