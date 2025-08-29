from sqlalchemy.orm import Session
from app.db.models import TripChat, User
from sqlalchemy.sql import func
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone

def create_chat_message(db: Session, trip_id: int, sender_id: int, message: str, is_from_gpt: bool = False, created_at: datetime = None):
    if created_at is None:
        db_chat = TripChat(
            trip_id=trip_id,
            sender_id=sender_id,
            message=message,
            is_from_gpt=is_from_gpt
        )
    else:
        db_chat = TripChat(
            trip_id=trip_id,
            sender_id=sender_id,
            message=message,
            is_from_gpt=is_from_gpt,
            created_at=created_at
        )
    db.add(db_chat)
    return db_chat

def get_chat_messages(db: Session, trip_id: int):
    return db.query(TripChat).options(joinedload(TripChat.sender)).filter(TripChat.trip_id == trip_id).order_by(TripChat.created_at).all()