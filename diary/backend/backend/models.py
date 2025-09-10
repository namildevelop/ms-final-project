from sqlalchemy import String, Date, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base
import uuid

def uuid_str() -> str:
    return str(uuid.uuid4())

class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    date_iso: Mapped[Date] = mapped_column(Date)

    photo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[str] = mapped_column(server_default=func.now())
    updated_at: Mapped[str] = mapped_column(server_default=func.now(), onupdate=func.now())
