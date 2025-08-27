from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
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
    username: str
    nickname: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[datetime] = None
    address: Optional[str] = None
    mbti: Optional[str] = None
    created_at: Optional[datetime] = None # Made field optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None