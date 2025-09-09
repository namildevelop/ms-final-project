from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import date, datetime, time

# --- Base Schemas ---

class UserSimpleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nickname: str

class TripBase(BaseModel):
    title: str
    start_date: date
    end_date: date
    destination_country: str
    destination_city: Optional[str] = None
    transport_method: Optional[str] = None
    accommodation: Optional[str] = None
    trend: bool = False

class TripItineraryItemBase(BaseModel):
    day: int
    order_in_day: int
    place_name: str
    description: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gpt_description: Optional[str] = None

# --- Create Schemas ---

class TripCreate(TripBase):
    invited_member_emails: Optional[List[EmailStr]] = []
    interests: Optional[List[str]] = []

class TripMemberCreate(BaseModel):
    user_id: int

class TripItineraryItemCreate(TripItineraryItemBase):
    pass

class TripChatCreate(BaseModel):
    message: str
    is_from_gpt: bool = False
    sent_to_gpt: bool = False

# --- Update Schemas ---

class TripItineraryItemUpdate(BaseModel):
    day: Optional[int] = None
    order_in_day: Optional[int] = None
    place_name: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gpt_description: Optional[str] = None

class TripItineraryItemOrderUpdate(BaseModel):
    id: int
    day: int
    order_in_day: int

class TripItineraryOrderUpdate(BaseModel):
    items: List[TripItineraryItemOrderUpdate]

# --- Response Schemas ---

class TripResponse(TripBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creator_id: int
    created_at: datetime

class TripResponseWithMemberCount(TripResponse):
    member_count: int

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

class TripItineraryItemResponse(TripItineraryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_id: int
    created_at: datetime
    updated_at: datetime

class TripChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_id: int
    sender: Optional[UserSimpleResponse] = None
    message: str
    is_from_gpt: bool
    sent_to_gpt: bool
    created_at: datetime

class TripFullResponse(TripResponse):
    members: List[TripMemberResponse] = []
    interests: List[TripInterestResponse] = []
    itinerary_items: List[TripItineraryItemResponse] = []
    chats: List[TripChatResponse] = []