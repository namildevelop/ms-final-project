from pydantic import BaseModel
from datetime import date

class DiaryCreateText(BaseModel):
    title: str
    content: str
    date_iso: date
    ai_image_url: str | None = None

class DiaryOut(BaseModel):
    id: str
    title: str
    content: str
    date_iso: str
    date_human: str
    thumbnail_url: str | None = None

    class Config:
        from_attributes = True
