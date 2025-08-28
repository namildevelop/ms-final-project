from sqlalchemy.orm import Session
from app.db.models import Trip, TripMember, TripInterest, TripPlan, User, TripChat
from app.schemas.trip import TripCreate
import json
from sqlalchemy.orm import joinedload
from app.services.openai import generate_trip_plan_with_gpt, get_gpt_chat_response
from app.crud.user import get_user_by_username # Import user lookup function

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

    # Add invited members by username
    if trip.invited_member_usernames:
        creator_username = db.query(User).filter(User.id == creator_id).first().username
        for username in trip.invited_member_usernames:
            if username == creator_username:
                continue
            user_to_invite = get_user_by_username(db, username=username)
            if user_to_invite:
                db.add(TripMember(trip_id=db_trip.id, user_id=user_to_invite.id, role="member"))
            else:
                # Handle case where username is not found
                print(f"Warning: User '{username}' not found for invitation.")
    
    # Add interests
    if trip.interests:
        for interest_str in trip.interests:
            db.add(TripInterest(trip_id=db_trip.id, interest=interest_str))

    db.commit() # Commit trip, members, and interests
    db.refresh(db_trip)

    return db_trip

def generate_and_save_trip_plan(db: Session, trip_id: int):
    """
    Fetches trip details, generates a plan with GPT, and saves it to the database.
    This is intended to be run in a background task.
    """
    db_trip = db.query(Trip).options(joinedload(Trip.interests)).filter(Trip.id == trip_id).first()
    if not db_trip:
        print(f"Error: Trip with ID {trip_id} not found for plan generation.")
        return

    # Prepare data for GPT
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

    # Call GPT Integration
    gpt_generated_plan_content = generate_trip_plan_with_gpt(trip_data_for_gpt)

    # Save the new plan
    db_trip_plan = TripPlan(
        trip_id=db_trip.id,
        content=json.dumps(gpt_generated_plan_content)
    )
    db.add(db_trip_plan)
    db.commit()
    db.refresh(db_trip_plan)
    print(f"Successfully generated and saved plan for trip {trip_id}")


def get_trip_by_id(db: Session, trip_id: int):
    return db.query(Trip).options(joinedload(Trip.members), joinedload(Trip.interests), joinedload(Trip.plans), joinedload(Trip.chats)).filter(Trip.id == trip_id).first()

def get_trips_by_user_id(db: Session, user_id: int):
    return db.query(Trip).join(TripMember).filter(TripMember.user_id == user_id).all()

def create_chat_message(db: Session, trip_id: int, sender_id: int, message: str, is_from_gpt: bool = False):
    db_chat = TripChat(
        trip_id=trip_id,
        sender_id=sender_id,
        message=message,
        is_from_gpt=is_from_gpt
    )
    db.add(db_chat)
    return db_chat

def get_chat_messages(db: Session, trip_id: int):
    return db.query(TripChat).filter(TripChat.trip_id == trip_id).order_by(TripChat.created_at).all()

def process_gpt_prompt_for_trip(db: Session, trip_id: int, user_prompt: str, current_user_id: int):
    db_trip = get_trip_by_id(db, trip_id)
    if not db_trip:
        return None, []

    # Get current plan content
    current_plan_content = {}
    if db_trip.plans:
        current_plan_content = json.loads(db_trip.plans[0].content)

    # Prepare details for the new chat-focused GPT function
    trip_details_for_chat = {
        "title": db_trip.title,
        "start_date": str(db_trip.start_date),
        "end_date": str(db_trip.end_date),
        "destination_country": db_trip.destination_country,
        "destination_city": db_trip.destination_city,
    }
    
    # Call the new chat-focused GPT function
    gpt_response = get_gpt_chat_response(
        trip_details=trip_details_for_chat,
        current_plan=current_plan_content,
        user_prompt=user_prompt
    )

    # Update trip plan if GPT returned a new one
    if "itinerary" in gpt_response and gpt_response["itinerary"]:
        # We assume the response for a plan modification will contain the full plan
        full_plan_response = {
            "trip_title": db_trip.title,
            "destination": f"{db_trip.destination_city}, {db_trip.destination_country}",
            "duration": f"{db_trip.start_date} - {db_trip.end_date}",
            "itinerary": gpt_response["itinerary"],
            "notes": gpt_response.get("notes", "")
        }
        if db_trip.plans:
            db_trip.plans[0].content = json.dumps(full_plan_response)
            db.add(db_trip.plans[0])
        else:
            new_plan = TripPlan(trip_id=trip_id, content=json.dumps(full_plan_response))
            db.add(new_plan)
    
    # Save user prompt as a chat message
    user_chat_message = create_chat_message(db, trip_id, current_user_id, user_prompt, is_from_gpt=False)

    # Save GPT response as a chat message
    gpt_message_content = gpt_response.get("notes", "GPT가 응답했습니다.")
    gpt_chat_message = create_chat_message(db, trip_id, None, gpt_message_content, is_from_gpt=True)

    db.commit()
    db.refresh(user_chat_message)
    db.refresh(gpt_chat_message)

    return gpt_response, [user_chat_message, gpt_chat_message]