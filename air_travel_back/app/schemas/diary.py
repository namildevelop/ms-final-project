from pydantic import BaseModel, ConfigDict
from datetime import date as DateType, datetime
from typing import Optional

class DiaryBase(BaseModel):
    title: str
    content: str
    date: DateType

class DiaryCreate(DiaryBase):
    pass

class DiaryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date: Optional[DateType] = None

class DiaryImageRequest(BaseModel):
    title: str
    content: str

class Diary(DiaryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    photo_path: Optional[str] = None
    ai_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime