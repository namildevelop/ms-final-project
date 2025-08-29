from sqlalchemy.orm import Session
from app.db.models import Notification, User, Trip
from typing import List

def create_invitation_notification(db: Session, sender: User, receiver: User, trip: Trip) -> Notification:
    """Creates and saves a new trip invitation notification."""
    message = f"{sender.nickname}님이 '{trip.title}' 여행에 초대했습니다."
    
    db_notification = Notification(
        receiver_id=receiver.id,
        sender_id=sender.id,
        type='TRIP_INVITATION',
        message=message,
        related_trip_id=trip.id,
        status='pending' # Invitations have a pending status
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_notifications_for_user(db: Session, user_id: int) -> List[Notification]:
    """Retrieves all notifications for a specific user."""
    return db.query(Notification).filter(Notification.receiver_id == user_id).order_by(Notification.created_at.desc()).all()

def get_notification(db: Session, notification_id: int) -> Notification | None:
    """Retrieves a single notification by its ID."""
    return db.query(Notification).filter(Notification.id == notification_id).first()

def update_notification_status(db: Session, notification_id: int, status: str) -> Notification | None:
    """Updates the status of a notification (e.g., 'read', 'accepted', 'declined')."""
    db_notification = get_notification(db, notification_id)
    if db_notification:
        db_notification.status = status
        db.commit()
        db.refresh(db_notification)
    return db_notification
