from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import datetime, date

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    password_confirm: str
    nickname: str = Field(..., min_length=1, max_length=50, description="닉네임 (1-50자)")
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    mbti: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    mbti: Optional[str] = None
    gender: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserInDB(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    nickname: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    mbti: Optional[str] = None
    created_at: Optional[datetime] = None
    profile_image_url: Optional[str] = None

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
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    mbti: Optional[str] = None
    profile_image_url: Optional[str] = None
    profile_completed: bool = False


    class Config:
        from_attributes = True

class EmailOnly(BaseModel):
    email: EmailStr

class VerifyCode(BaseModel):
    email: EmailStr
    code: str

class ResetPassword(BaseModel):
    token: str
    new_password: str
    new_password_confirm: str

class ProfileComplete(BaseModel):
    address: str | None = None
    phone: str | None = None
    gender: str | None = None
    mbti: str | None = None
    birth_date: date | None = None
    profile_image_url: str | None = None
