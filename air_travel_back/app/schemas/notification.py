from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    receiver_id: int
    sender_id: Optional[int] = None
    type: str
    message: str
    related_trip_id: Optional[int] = None
    status: str
    created_at: datetime
