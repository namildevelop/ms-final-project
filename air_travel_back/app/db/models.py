from sqlalchemy import Column, Integer, String, Date, Text, TIMESTAMP, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    nickname = Column(String(50), nullable=False)
    phone = Column(String(20))
    gender = Column(String(10))
    birth_date = Column(Date)
    address = Column(Text)
    mbti = Column(String(10))
    created_at = Column(TIMESTAMP, server_default=func.now())

    trips_created = relationship("Trip", back_populates="creator")
    trip_memberships = relationship("TripMember", back_populates="member")
    chats = relationship("TripChat", back_populates="sender")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    destination_country = Column(String(100), nullable=False)
    destination_city = Column(String(100))
    transport_method = Column(String(50))
    accommodation = Column(String(50))
    trend = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    creator = relationship("User", back_populates="trips_created")
    members = relationship("TripMember", back_populates="trip")
    interests = relationship("TripInterest", back_populates="trip")
    plans = relationship("TripPlan", back_populates="trip")
    chats = relationship("TripChat", back_populates="trip")

class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String(20), default="member")
    joined_at = Column(TIMESTAMP, server_default=func.now())

    trip = relationship("Trip", back_populates="members")
    member = relationship("User", back_populates="trip_memberships")

class TripInterest(Base):
    __tablename__ = "trip_interests"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"))
    interest = Column(String(50), nullable=False)

    trip = relationship("Trip", back_populates="interests")

class TripPlan(Base):
    __tablename__ = "trip_plans"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False) # Storing JSON as Text for simplicity, will parse/dump
    created_at = Column(TIMESTAMP, server_default=func.now())

    trip = relationship("Trip", back_populates="plans")

class TripChat(Base):
    __tablename__ = "trip_chats"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    message = Column(Text, nullable=False)
    is_from_gpt = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    trip = relationship("Trip", back_populates="chats")
    sender = relationship("User", back_populates="chats")