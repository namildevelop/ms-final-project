from sqlalchemy.orm import Session, joinedload
import requests
from typing import Optional, List
from app.db.models import Trip, TripMember, TripInterest, User, TripChat, TripItineraryItem, PackingListItem
from app.schemas.trip import TripCreate, TripItineraryItemCreate, TripItineraryItemUpdate, TripItineraryOrderUpdate, PackingListItemCreate, PackingListItemUpdate
from app.services.openai import generate_trip_plan_with_gpt, get_gpt_chat_response, get_gpt_place_description
from app.crud.user import get_user_by_email
from app.crud.chat import create_chat_message
from app.core.config import settings
from datetime import datetime, timezone, time
import logging
import json # Import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _geocode_address(address: str) -> Optional[dict]:
    """Helper function to geocode an address using Google Geocoding API."""
    if not address:
        logger.info("No address provided, skipping geocoding.")
        return None
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.error("GOOGLE_MAPS_API_KEY is not set.")
        return None
    
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={settings.GOOGLE_MAPS_API_KEY}"
        logger.info(f"Geocoding URL: {url}")
        response = requests.get(url, timeout=10) # Added timeout
        response.raise_for_status() 
        data = response.json()
        logger.info(f"Geocoding response for '{address}': {data.get('status')}")
        if data.get('status') == 'OK' and data.get('results'):
            location = data['results'][0]['geometry']['location']
            coords = {"latitude": location['lat'], "longitude": location['lng']}
            logger.info(f"Successfully geocoded '{address}' to {coords}")
            return coords
        else:
            logger.warning(f"Geocoding failed for '{address}'. Status: {data.get('status')}, Error: {data.get('error_message')}")
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Geocoding request failed for '{address}': {e}")
    except (KeyError, IndexError) as e:
        logger.error(f"Failed to parse geocoding response for '{address}': {e}")
    return None

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
                logger.warning(f"User with email '{email}' not found for invitation.")
    
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

def generate_and_save_trip_plan(db: Session, trip_id: int, member_count: int, companion_relation: Optional[str]):
    logger.info(f"Starting plan generation for trip_id: {trip_id}")
    db_trip = db.query(Trip).options(joinedload(Trip.interests)).filter(Trip.id == trip_id).first()
    if not db_trip:
        logger.error(f"Trip with ID {trip_id} not found for plan generation.")
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
        "interests": [interest.interest for interest in db_trip.interests],
        "member_count": member_count,
        "companion_relation": companion_relation
    }

    try:
        logger.info(f"Calling GPT for trip {trip_id}...")
        gpt_response = generate_trip_plan_with_gpt(trip_data_for_gpt)
        logger.info(f"Received GPT response for trip {trip_id}")

        itinerary_items = gpt_response.get("itinerary", [])
        if not itinerary_items:
            logger.warning(f"GPT returned no itinerary items for trip {trip_id}")

        # Handle packing list
        packing_list_items = gpt_response.get("packing_list", [])
        if packing_list_items:
            for item_name in packing_list_items:
                db_packing_item = PackingListItem(
                    trip_id=trip_id,
                    item_name=item_name,
                    is_packed=False,
                    quantity=1  # Default quantity
                )
                db.add(db_packing_item)
            logger.info(f"Saved {len(packing_list_items)} packing list items for trip {trip_id}")

        for item_data in itinerary_items:
            coords = _geocode_address(item_data.get('address'))
            
            db_item = TripItineraryItem(
                trip_id=trip_id,
                day=item_data['day'],
                order_in_day=item_data['order_in_day'],
                place_name=item_data['place_name'],
                description=item_data.get('description'),
                start_time=datetime.strptime(item_data['start_time'], '%H:%M').time() if item_data.get('start_time') else None,
                end_time=datetime.strptime(item_data['end_time'], '%H:%M').time() if item_data.get('end_time') else None,
                address=item_data.get('address'),
                latitude=coords['latitude'] if coords else None,
                longitude=coords['longitude'] if coords else None
            )
            db.add(db_item)
        
        logger.info(f"Adding {len(itinerary_items)} itinerary items and packing list to session for trip {trip_id}")
        db.commit()
        logger.info(f"Successfully generated and saved plan for trip {trip_id}")
    except Exception as e:
        logger.error(f"An error occurred during plan generation for trip {trip_id}: {e}", exc_info=True)
        db.rollback()


def get_trip_by_id(db: Session, trip_id: int):
    return db.query(Trip).options(
        joinedload(Trip.members).joinedload(TripMember.user),
        joinedload(Trip.interests),
        joinedload(Trip.itinerary_items),
        joinedload(Trip.chats),
        joinedload(Trip.packing_list_items)  # Eager load packing list items
    ).filter(Trip.id == trip_id).first()

def get_trips_by_user_id(db: Session, user_id: int):
    return db.query(Trip).join(TripMember).filter(TripMember.user_id == user_id).options(joinedload(Trip.members).joinedload(TripMember.user)).all()

def get_itinerary_item(db: Session, item_id: int):
    return db.query(TripItineraryItem).filter(TripItineraryItem.id == item_id).first()

def create_itinerary_item(db: Session, trip_id: int, item: TripItineraryItemCreate):
    coords = _geocode_address(item.address)
    item_data = item.model_dump()
    item_data['latitude'] = coords['latitude'] if coords else None
    item_data['longitude'] = coords['longitude'] if coords else None

    db_item = TripItineraryItem(**item_data, trip_id=trip_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_itinerary_item(db: Session, item_id: int, item_update: TripItineraryItemUpdate):
    db_item = get_itinerary_item(db, item_id)
    if not db_item:
        return None
    update_data = item_update.model_dump(exclude_unset=True)

    if 'address' in update_data and update_data['address'] != db_item.address:
        logger.info(f"Address changed for item {item_id}. Re-geocoding.")
        coords = _geocode_address(update_data['address'])
        update_data['latitude'] = coords['latitude'] if coords else None
        update_data['longitude'] = coords['longitude'] if coords else None

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
    logger.info(f"Processing GPT prompt for trip {trip_id}")
    db_trip = get_trip_by_id(db, trip_id)
    if not db_trip:
        return None, [], False

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
        "member_count": db_trip.member_count,
        "companion_relation": db_trip.companion_relation
    }
    
    try:
        gpt_response = get_gpt_chat_response(
            trip_details=trip_details_for_chat,
            current_plan=current_plan_for_gpt,
            user_prompt=user_prompt
        )

        print(f"DEBUG: GPT Response Content: {gpt_response}")

        itinerary_updated = False
        new_itinerary_data = gpt_response.get("itinerary")

        if new_itinerary_data and new_itinerary_data != current_plan_for_gpt:
            logger.info(f"GPT returned updated itinerary for trip {trip_id}. Updating DB.")
            # Delete old itinerary items
            for item in db_trip.itinerary_items:
                db.delete(item)
            db.flush()

            # Add new itinerary items
            for item_data in new_itinerary_data:
                coords = _geocode_address(item_data.get('address'))
                db_item = TripItineraryItem(
                    trip_id=trip_id,
                    day=item_data['day'],
                    order_in_day=item_data['order_in_day'],
                    place_name=item_data['place_name'],
                    description=item_data.get('description'),
                    start_time=datetime.strptime(item_data['start_time'], '%H:%M').time() if item_data.get('start_time') else None,
                    end_time=datetime.strptime(item_data['end_time'], '%H:%M').time() if item_data.get('end_time') else None,
                    address=item_data.get('address'),
                    latitude=coords['latitude'] if coords else None,
                    longitude=coords['longitude'] if coords else None
                )
                db.add(db_item)
            itinerary_updated = True
            logger.info(f"DB updated with new itinerary for trip {trip_id}.")
        
        gpt_message_content = gpt_response.get("notes", "GPT가 응답했습니다.")
        gpt_message_time = datetime.now(timezone.utc)
        gpt_chat_message = create_chat_message(db, trip_id, None, gpt_message_content, is_from_gpt=True, created_at=gpt_message_time)

        db.commit()
        db.refresh(gpt_chat_message)

        return gpt_response, [gpt_chat_message], itinerary_updated

    except Exception as e:
        logger.error(f"Error processing GPT prompt for trip {trip_id}: {e}", exc_info=True)
        db.rollback()
        return None, [], False

def update_itinerary_order(db: Session, trip_id: int, order_update: TripItineraryOrderUpdate) -> List[TripItineraryItem]:
    """
    Bulk updates the day and order for a list of itinerary items for a specific trip.
    """
    updated_items = []
    item_ids_to_update = [item.id for item in order_update.items]

    # Fetch all items to be updated in a single query to ensure they belong to the trip
    db_items_map = {
        item.id: item for item in db.query(TripItineraryItem)
        .filter(TripItineraryItem.trip_id == trip_id, TripItineraryItem.id.in_(item_ids_to_update))
        .all()
    }

    if len(db_items_map) != len(item_ids_to_update):
        logger.error(f"Mismatch in itinerary items for trip {trip_id}. Requested: {len(item_ids_to_update)}, Found: {len(db_items_map)}")
        # Depending on requirements, you might want to raise an HTTPException here
        # For now, we proceed with the items that were found and matched.
    
    for item_data in order_update.items:
        db_item = db_items_map.get(item_data.id)
        if db_item:
            db_item.day = item_data.day
            db_item.order_in_day = item_data.order_in_day
            db.add(db_item) # Add to session to mark for update
            updated_items.append(db_item)

    db.commit()
    return updated_items

def generate_and_save_gpt_description(db: Session, item_id: int) -> Optional[TripItineraryItem]:
    """
    Generates a GPT description for an itinerary item and saves it to the database.
    """
    db_item = get_itinerary_item(db, item_id=item_id)
    if not db_item:
        logger.error(f"Itinerary item with ID {item_id} not found.")
        return None

    # If description already exists, no need to generate again.
    # Although the front-end should prevent this, it's a good safeguard.
    if db_item.gpt_description:
        logger.info(f"GPT description for item {item_id} already exists.")
        return db_item

    try:
        logger.info(f"Generating GPT description for place: {db_item.place_name}")
        description = get_gpt_place_description(place_name=db_item.place_name)
        
        db_item.gpt_description = description
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        logger.info(f"Successfully generated and saved GPT description for item {item_id}.")
        return db_item
    except Exception as e:
        logger.error(f"An error occurred during GPT description generation for item {item_id}: {e}", exc_info=True)
        db.rollback()
        return None

def leave_trip(db: Session, trip_id: int, user_id: int) -> bool:
    """
    Allows a user to leave a trip. If the user is the last member, deletes the trip.
    """
    # Find the specific membership record
    db_member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user_id
    ).first()

    if not db_member:
        logger.warning(f"User {user_id} is not a member of trip {trip_id}. Cannot leave.")
        return False

    # Delete the membership
    db.delete(db_member)
    db.commit()
    logger.info(f"User {user_id} has left trip {trip_id}.")

    # Check if there are any members left
    remaining_members_count = db.query(TripMember).filter(TripMember.trip_id == trip_id).count()
    
    if remaining_members_count == 0:
        logger.info(f"Trip {trip_id} has no members left. Deleting trip.")
        db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if db_trip:
            db.delete(db_trip)
            db.commit()
            logger.info(f"Trip {trip_id} has been deleted.")
    
    return True

# CRUD operations for PackingListItems

def get_packing_list_item(db: Session, item_id: int) -> Optional[PackingListItem]:
    return db.query(PackingListItem).filter(PackingListItem.id == item_id).first()

def get_packing_list_items_by_trip_id(db: Session, trip_id: int) -> List[PackingListItem]:
    return db.query(PackingListItem).filter(PackingListItem.trip_id == trip_id).all()

def create_packing_list_item(db: Session, trip_id: int, item: PackingListItemCreate) -> PackingListItem:
    db_item = PackingListItem(
        **item.model_dump(),
        trip_id=trip_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_packing_list_item(db: Session, item_id: int, item_update: PackingListItemUpdate) -> Optional[PackingListItem]:
    db_item = get_packing_list_item(db, item_id)
    if not db_item:
        return None
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_packing_list_item(db: Session, item_id: int) -> Optional[PackingListItem]:
    db_item = get_packing_list_item(db, item_id)
    if not db_item:
        return None
    db.delete(db_item)
    db.commit()
    return db_item
