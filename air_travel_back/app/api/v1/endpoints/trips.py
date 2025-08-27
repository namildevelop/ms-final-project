from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from app.db.database import get_db
from app.schemas.trip import TripCreate, TripResponse, TripFullResponse, TripChatResponse
from app.crud import trip as crud_trip
from app.api.deps import get_current_user, get_user_from_token
from app.db.models import User
from app.api.websockets import manager

router = APIRouter()

async def plan_generation_task(trip_id: int):
    """A background task to generate a trip plan and notify via WebSocket."""
    print(f"Starting background plan generation for trip {trip_id}")
    with next(get_db()) as db:
        crud_trip.generate_and_save_trip_plan(db, trip_id)
    await manager.broadcast(
        trip_id,
        json.dumps({"type": "plan_update", "payload": {"message": "Trip plan has been generated!"}})
    )
    print(f"Finished background plan generation and sent notification for trip {trip_id}")

@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_trip = crud_trip.create_trip(db=db, trip=trip_data, creator_id=current_user.id)
    background_tasks.add_task(plan_generation_task, new_trip.id)
    return new_trip

@router.get("/{trip_id}", response_model=TripFullResponse)
async def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view this trip")
    return db_trip

@router.get("/{trip_id}/chats", response_model=List[TripChatResponse])
async def get_chats(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view chats")
    return crud_trip.get_chat_messages(db=db, trip_id=trip_id)

@router.websocket("/{trip_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    trip_id: int,
    token: str = Query(...),
):
    with next(get_db()) as db:
        user = get_user_from_token(db, token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return
        is_member = any(member.user_id == user.id for member in crud_trip.get_trip_by_id(db, trip_id).members)
        if not is_member:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not a member of this trip")
            return
        
    await manager.connect(websocket, trip_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_type = message_data.get("type")
            payload = message_data.get("payload")

            if message_type == "chat_message":
                # Save chat message to the database
                with next(get_db()) as db:
                    db_chat_message = crud_trip.create_chat_message(
                        db=db,
                        trip_id=trip_id,
                        sender_id=user.id,
                        message=payload['message']
                    )
                    # Construct response from the DB object to ensure consistency
                    response_payload = {
                        "id": db_chat_message.id,
                        "trip_id": db_chat_message.trip_id,
                        "sender": {
                            "id": db_chat_message.sender.id,
                            "nickname": db_chat_message.sender.nickname
                        },
                        "message": db_chat_message.message,
                        "is_from_gpt": db_chat_message.is_from_gpt,
                        "created_at": db_chat_message.created_at.isoformat()
                    }
                await manager.broadcast(trip_id, json.dumps({"type": "chat_message", "payload": response_payload}))

            elif message_type == "gpt_prompt":
                # For now, just echo back a confirmation for GPT prompts
                await websocket.send_text(json.dumps({"type": "system_message", "payload": {"message": "GPT prompt received, processing disabled for this test."}}))

    except WebSocketDisconnect:
        manager.disconnect(websocket, trip_id)
        await manager.broadcast(trip_id, json.dumps({"type": "system_message", "payload": {"message": f"{user.nickname} has left the chat."}}))
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, trip_id)