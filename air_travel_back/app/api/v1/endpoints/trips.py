from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.database import get_db
from app.schemas.trip import (
    TripCreate, TripResponse, TripFullResponse, TripChatResponse, 
    TripMemberCreate, TripItineraryItemCreate, TripItineraryItemUpdate, TripItineraryItemResponse,
    TripItineraryOrderUpdate
)
from app.schemas.notification import NotificationResponse
from app.crud import trip as crud_trip, chat as crud_chat
from app.crud import user as crud_user
from app.crud import notification as crud_notification
from app.api.deps import get_current_user, get_user_from_token
from app.db.models import User
from app.api.websockets import manager

router = APIRouter()

async def plan_generation_task(trip_id: int):
    """A background task to generate a trip itinerary and notify via WebSocket."""
    print(f"Starting background itinerary generation for trip {trip_id}")
    with next(get_db()) as db:
        crud_trip.generate_and_save_trip_plan(db, trip_id)
    await manager.broadcast(
        trip_id,
        json.dumps({"type": "plan_update", "payload": {"message": "Trip itinerary has been generated!"}})
    )
    print(f"Finished background itinerary generation and sent notification for trip {trip_id}")

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

@router.post("/{trip_id}/invite", response_model=NotificationResponse)
def invite_user_to_trip(
    trip_id: int,
    member_data: TripMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to invite members to this trip")

    receiver_id = member_data.user_id
    if receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    receiver = crud_user.get_user(db, user_id=receiver_id)
    if not receiver:
        raise HTTPException(status_code=404, detail="User to invite not found")

    is_already_member = any(member.user_id == receiver_id for member in db_trip.members)
    if is_already_member:
        raise HTTPException(status_code=400, detail="User is already a member of this trip")

    notification = crud_notification.create_invitation_notification(
        db=db, sender=current_user, receiver=receiver, trip=db_trip
    )
    return notification

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
    return crud_chat.get_chat_messages(db=db, trip_id=trip_id)

# --- New Itinerary Item Endpoints ---

@router.post("/{trip_id}/itinerary-items/", response_model=TripItineraryItemResponse, status_code=status.HTTP_201_CREATED)
def create_itinerary_item(
    trip_id: int,
    item: TripItineraryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip's itinerary")
    return crud_trip.create_itinerary_item(db=db, trip_id=trip_id, item=item)

@router.put("/{trip_id}/itinerary-items/{item_id}", response_model=TripItineraryItemResponse)
def update_itinerary_item(
    trip_id: int, # Included for URL structure, though not directly used in CRUD after check
    item_id: int,
    item_update: TripItineraryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip's itinerary")
    
    db_item = crud_trip.get_itinerary_item(db, item_id=item_id)
    if not db_item or db_item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Itinerary item not found")

    return crud_trip.update_itinerary_item(db=db, item_id=item_id, item_update=item_update)

@router.put("/{trip_id}/itinerary/order", response_model=List[TripItineraryItemResponse])
def update_itinerary_order(
    trip_id: int,
    order_update: TripItineraryOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip's itinerary")

    updated_items = crud_trip.update_itinerary_order(db=db, trip_id=trip_id, order_update=order_update)
    return updated_items

@router.delete("/{trip_id}/itinerary-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary_item(
    trip_id: int, # Included for URL structure
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = crud_trip.get_trip_by_id(db, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    is_member = any(member.user_id == current_user.id for member in db_trip.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to modify this trip's itinerary")

    db_item = crud_trip.delete_itinerary_item(db=db, item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    return


@router.websocket("/{trip_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    trip_id: int,
    token: str = Query(...),
):
    user = None
    db_trip = None
    with next(get_db()) as db:
        user = get_user_from_token(db, token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return

        db_trip = crud_trip.get_trip_by_id(db, trip_id)
        if not db_trip:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Trip not found")
            return

        is_member = any(member.user_id == user.id for member in db_trip.members)
        if not is_member:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not a member of this trip")
            return

    await manager.connect(websocket, trip_id)

    # For AI planning page: if plan is already generated when client connects, notify immediately.
    if db_trip and db_trip.itinerary_items:
        await manager.send_personal_message(
            json.dumps({"type": "initial_plan_ready"}),
            websocket
        )

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_type = message_data.get("type")
            payload = message_data.get("payload")

            if message_type == "chat_message":
                with next(get_db()) as db:
                    db_chat_message = crud_chat.create_chat_message(
                        db=db,
                        trip_id=trip_id,
                        sender_id=user.id,
                        message=payload['message']
                    )
                    db.commit()
                    db.refresh(db_chat_message)
                    db.refresh(db_chat_message.sender)
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
                await manager.broadcast(trip_id, json.dumps({"type": "chat_message", "payload": response_payload}), exclude_websocket=websocket)

            elif message_type == "gpt_prompt":
                try:
                    with next(get_db()) as db:
                        gpt_response, new_messages, itinerary_updated = crud_trip.process_gpt_prompt_for_trip(
                            db=db,
                            trip_id=trip_id,
                            user_prompt=payload['user_prompt'],
                            current_user_id=user.id
                        )

                        if gpt_response is None:
                            await websocket.send_text(json.dumps({"type": "system_message", "payload": {"message": "Error processing GPT prompt."}}))
                            continue

                        for chat in new_messages:
                            response_payload = {
                                "id": chat.id,
                                "trip_id": chat.trip_id,
                                "sender": {
                                    "id": chat.sender.id if chat.sender else None,
                                    "nickname": chat.sender.nickname if chat.sender else "GPT"
                                },
                                "message": chat.message,
                                "is_from_gpt": chat.is_from_gpt,
                                "created_at": chat.created_at.isoformat()
                            }
                            await manager.broadcast(trip_id, json.dumps({"type": "chat_message", "payload": response_payload}))

                        if itinerary_updated:
                            await manager.broadcast(
                                trip_id,
                                json.dumps({"type": "plan_update", "payload": {"message": "Trip itinerary has been updated by GPT."}})
                            )
                except Exception as e:
                    print(f"Error processing GPT prompt: {e}")
                    await websocket.send_text(json.dumps({"type": "system_message", "payload": {"message": "An error occurred while talking to GPT."}}))

    except WebSocketDisconnect:
        manager.disconnect(websocket, trip_id)
        if user:
            await manager.broadcast(trip_id, json.dumps({"type": "system_message", "payload": {"message": f"{user.nickname} has left the chat."}}))
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, trip_id)
