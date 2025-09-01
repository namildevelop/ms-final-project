from sqlalchemy.orm import Session, joinedload
from app.db.models import Trip, TripMember, TripInterest, User, TripChat, TripItineraryItem
from app.schemas.trip import TripCreate, TripItineraryItemCreate, TripItineraryItemUpdate
from app.services.openai import generate_trip_plan_with_gpt, get_gpt_chat_response
from app.crud.user import get_user_by_email
from app.crud.chat import create_chat_message
from datetime import datetime, timezone, time

def create_trip(db: Session, trip: TripCreate, creator_id: int):
    db_trip = Trip(
        creator_id=creator_id,
        title=trip.title,
        start_date=trip.start_date,
        end_date=trip.end_date,
        destination_country=trip.destination_country,
        destination_city=trip.destination_city,
        transport_method=trip.transport_method,
        accommodation=trip.accommodation,
        trend=trip.trend
    )
    db.add(db_trip)
    db.flush() # Use flush to get the db_trip.id without committing

    # Add creator as a trip member
    db.add(TripMember(trip_id=db_trip.id, user_id=creator_id, role="creator"))

    # Add invited members by email
    if trip.invited_member_emails:
        creator_email = db.query(User).filter(User.id == creator_id).first().email
        for email in trip.invited_member_emails:
            if email == creator_email:
                continue
            user_to_invite = get_user_by_email(db, email=email)
            if user_to_invite:
                db.add(TripMember(trip_id=db_trip.id, user_id=user_to_invite.id, role="member"))
            else:
                print(f"Warning: User with email '{email}' not found for invitation.")
    
    # Add interests
    if trip.interests:
        for interest_str in trip.interests:
            db.add(TripInterest(trip_id=db_trip.id, interest=interest_str))

    db.commit() # Commit trip, members, and interests
    db.refresh(db_trip)

    return db_trip

def add_trip_member(db: Session, trip_id: int, user_id: int):
    existing_member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user_id
    ).first()

    if existing_member:
        return None

    db_member = TripMember(
        trip_id=trip_id,
        user_id=user_id,
        role="member"
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def generate_and_save_trip_plan(db: Session, trip_id: int):
    db_trip = db.query(Trip).options(joinedload(Trip.interests)).filter(Trip.id == trip_id).first()
    if not db_trip:
        print(f"Error: Trip with ID {trip_id} not found for plan generation.")
        return

    trip_data_for_gpt = {
        "title": db_trip.title,
        "start_date": str(db_trip.start_date),
        "end_date": str(db_trip.end_date),
        "destination_country": db_trip.destination_country,
        "destination_city": db_trip.destination_city,
        "transport_method": db_trip.transport_method,
        "accommodation": db_trip.accommodation,
        "trend": db_trip.trend,
        "interests": [interest.interest for interest in db_trip.interests]
    }

    # IMPORTANT: The function `generate_trip_plan_with_gpt` in `services/openai.py` MUST be updated.
    # It should now return a JSON object with an "itinerary" key, which is a list of dictionaries.
    # Each dictionary should match the structure of TripItineraryItem (day, order_in_day, place_name, etc.).
    # Example: {"itinerary": [{"day": 1, "order_in_day": 1, "place_name": "Eiffel Tower", ...}]}
    gpt_response = generate_trip_plan_with_gpt(trip_data_for_gpt)

    itinerary_items = gpt_response.get("itinerary", [])
    for item_data in itinerary_items:
        # Convert string times to time objects if they exist
        start_time = datetime.strptime(item_data['start_time'], '%H:%M').time() if item_data.get('start_time') else None
        end_time = datetime.strptime(item_data['end_time'], '%H:%M').time() if item_data.get('end_time') else None

        db_item = TripItineraryItem(
            trip_id=trip_id,
            day=item_data['day'],
            order_in_day=item_data['order_in_day'],
            place_name=item_data['place_name'],
            description=item_data.get('description'),
            start_time=start_time,
            end_time=end_time,
            address=item_data.get('address')
        )
        db.add(db_item)
    
    db.commit()
    print(f"Successfully generated and saved itinerary items for trip {trip_id}")

def get_trip_by_id(db: Session, trip_id: int):
    return db.query(Trip).options(
        joinedload(Trip.members),
        joinedload(Trip.interests),
        joinedload(Trip.itinerary_items), # Updated from plans to itinerary_items
        joinedload(Trip.chats)
    ).filter(Trip.id == trip_id).first()

def get_trips_by_user_id(db: Session, user_id: int):
    return db.query(Trip).join(TripMember).filter(TripMember.user_id == user_id).all()

def get_itinerary_item(db: Session, item_id: int):
    return db.query(TripItineraryItem).filter(TripItineraryItem.id == item_id).first()

def create_itinerary_item(db: Session, trip_id: int, item: TripItineraryItemCreate):
    db_item = TripItineraryItem(**item.model_dump(), trip_id=trip_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_itinerary_item(db: Session, item_id: int, item_update: TripItineraryItemUpdate):
    db_item = get_itinerary_item(db, item_id)
    if not db_item:
        return None
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_itinerary_item(db: Session, item_id: int):
    db_item = get_itinerary_item(db, item_id)
    if not db_item:
        return None
    db.delete(db_item)
    db.commit()
    return db_item

def process_gpt_prompt_for_trip(db: Session, trip_id: int, user_prompt: str, current_user_id: int):
    db_trip = get_trip_by_id(db, trip_id)
    if not db_trip:
        return None, []

    # Convert current itinerary to a list of dicts for GPT context
    current_plan_for_gpt = [
        {
            "day": item.day,
            "order_in_day": item.order_in_day,
            "place_name": item.place_name,
            "description": item.description,
            "start_time": item.start_time.strftime('%H:%M') if item.start_time else None,
            "end_time": item.end_time.strftime('%H:%M') if item.end_time else None,
            "address": item.address
        } for item in db_trip.itinerary_items
    ]

    trip_details_for_chat = {
        "title": db_trip.title,
        "start_date": str(db_trip.start_date),
        "end_date": str(db_trip.end_date),
        "destination_country": db_trip.destination_country,
        "destination_city": db_trip.destination_city,
    }
    
    gpt_response = get_gpt_chat_response(
        trip_details=trip_details_for_chat,
        current_plan=current_plan_for_gpt, # Pass the structured plan
        user_prompt=user_prompt
    )

    # If GPT returns a new itinerary, replace the old one
    if "itinerary" in gpt_response and gpt_response["itinerary"]:
        # Delete old itinerary items
        for item in db_trip.itinerary_items:
            db.delete(item)
        db.flush()

        # Add new itinerary items
        for item_data in gpt_response["itinerary"]:
            start_time = datetime.strptime(item_data['start_time'], '%H:%M').time() if item_data.get('start_time') else None
            end_time = datetime.strptime(item_data['end_time'], '%H:%M').time() if item_data.get('end_time') else None
            db_item = TripItineraryItem(
                trip_id=trip_id,
                day=item_data['day'],
                order_in_day=item_data['order_in_day'],
                place_name=item_data['place_name'],
                description=item_data.get('description'),
                start_time=start_time,
                end_time=end_time,
                address=item_data.get('address')
            )
            db.add(db_item)
    
    user_message_time = datetime.now(timezone.utc)
    user_chat_message = create_chat_message(db, trip_id, current_user_id, user_prompt, is_from_gpt=False, created_at=user_message_time)

    gpt_message_content = gpt_response.get("notes", "GPT가 응답했습니다.")
    gpt_message_time = datetime.now(timezone.utc)
    gpt_chat_message = create_chat_message(db, trip_id, None, gpt_message_content, is_from_gpt=True, created_at=gpt_message_time)

    db.commit()
    db.refresh(user_chat_message)
    db.refresh(gpt_chat_message)

    return gpt_response, [user_chat_message, gpt_chat_message]
