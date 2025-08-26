from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, Date, text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    student_id = Column(String(20))
    password_hash = Column(String, nullable=False)
    mbti = Column(String(10))
    address = Column(String)
    gender = Column(String(10))
    birthdate = Column(Date, nullable=True)
    phone = Column(String(20), nullable=True)
    nickname = Column(String(50), unique=True, nullable=True)

    is_verified = Column(Boolean, server_default=text("FALSE"))
    verify_token = Column(String, nullable=True)
    verify_token_exp = Column(TIMESTAMP, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_exp = Column(TIMESTAMP, nullable=True)

    # New: email verification code (6 digits) + exp
    verify_code = Column(String(6), nullable=True)
    verify_code_exp = Column(TIMESTAMP, nullable=True)

    # ✅ 추가(구글/프로필 플래그)
    provider = Column(String(20), default="local")           # "local" | "google"
    provider_sub = Column(String(255), nullable=True)        # Google subject
    profile_completed = Column(Boolean, server_default=text("FALSE"))

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class PendingSignup(Base):
    __tablename__ = "pending_signups"

    id = Column(Integer, primary_key=True, index=True)
    # fields captured at signup time
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    student_id = Column(String(20))
    password_hash = Column(String, nullable=False)
    mbti = Column(String(10))
    address = Column(String)
    gender = Column(String(10))
    birthdate = Column(Date, nullable=True)
    phone = Column(String(20), nullable=True)
    nickname = Column(String(50), unique=True, nullable=True)

    # verification token/code
    verify_token = Column(String, nullable=True)
    verify_token_exp = Column(TIMESTAMP, nullable=True)
    verify_code = Column(String(6), nullable=True)
    verify_code_exp = Column(TIMESTAMP, nullable=True)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
