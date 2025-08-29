from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.notification import NotificationResponse
from app.crud import notification as crud_notification
from app.crud import trip as crud_trip
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notifications for the current user."""
    notifications = crud_notification.get_notifications_for_user(db, user_id=current_user.id)
    return notifications

@router.post("/{notification_id}/accept", response_model=NotificationResponse)
def accept_invitation(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a trip invitation."""
    notification = crud_notification.get_notification(db, notification_id=notification_id)
    
    if not notification or notification.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.type != 'TRIP_INVITATION' or notification.status != 'pending':
        raise HTTPException(status_code=400, detail="This notification cannot be accepted")

    # Add user to the trip
    crud_trip.add_trip_member(db, trip_id=notification.related_trip_id, user_id=current_user.id)
    
    # Update notification status
    updated_notification = crud_notification.update_notification_status(db, notification_id=notification_id, status='accepted')
    
    return updated_notification

@router.post("/{notification_id}/decline", response_model=NotificationResponse)
def decline_invitation(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Decline a trip invitation."""
    notification = crud_notification.get_notification(db, notification_id=notification_id)

    if not notification or notification.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.type != 'TRIP_INVITATION' or notification.status != 'pending':
        raise HTTPException(status_code=400, detail="This notification cannot be declined")

    # Update notification status
    updated_notification = crud_notification.update_notification_status(db, notification_id=notification_id, status='declined')

    return updated_notification
