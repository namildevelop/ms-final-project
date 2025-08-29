from pydantic import BaseModel, validator, ConfigDict, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import json

# New simplified User model for nested responses
class UserSimpleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nickname: str

class TripCreate(BaseModel):
    title: str
    start_date: date
    end_date: date
    destination_country: str
    destination_city: Optional[str] = None
    transport_method: Optional[str] = None
    accommodation: Optional[str] = None
    trend: bool = False
    invited_member_emails: Optional[List[EmailStr]] = []
    interests: Optional[List[str]] = []

class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creator_id: int
    title: str
    start_date: date
    end_date: date
    destination_country: str
    destination_city: Optional[str] = None
    transport_method: Optional[str] = None
    accommodation: Optional[str] = None
    trend: bool
    created_at: datetime

class TripMemberCreate(BaseModel):
    user_id: int

class TripMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_id: int
    user_id: int
    role: str
    joined_at: datetime

class TripInterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_id: int
    interest: str

class TripPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_id: int
    content: Dict[str, Any]
    created_at: datetime

    @validator('content', pre=True, allow_reuse=True)
    def parse_content_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError('Content is not valid JSON string')
        return v

class TripChatCreate(BaseModel):
    message: str
    is_from_gpt: bool = False

class TripChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_id: int
    sender: Optional[UserSimpleResponse] = None # Replaced sender_id
    message: str
    is_from_gpt: bool
    created_at: datetime

class TripFullResponse(TripResponse):
    members: List[TripMemberResponse] = []
    interests: List[TripInterestResponse] = []
    plans: List[TripPlanResponse] = []
    chats: List[TripChatResponse] = []