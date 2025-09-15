from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, Date, text
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    password = Column(String(255), nullable=False)
    nickname = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    gender = Column(String(10), nullable=True)
    birth_date = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    mbti = Column(String(10), nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    email = Column(String(255), unique=True, index=True, nullable=False)
    profile_image_url = Column(String, nullable=True, server_default=text("''"))

    # 인증 관련 필드들 (기존 기능 유지)
    is_verified = Column(Boolean, server_default=text("FALSE"))
    verify_token = Column(String, nullable=True)
    verify_token_exp = Column(TIMESTAMP, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_exp = Column(TIMESTAMP, nullable=True)
    verify_code = Column(String(6), nullable=True)
    verify_code_exp = Column(TIMESTAMP, nullable=True)

    # Google OAuth 관련 필드
    provider = Column(String(20), default="local")
    provider_sub = Column(String(255), nullable=True)
    profile_completed = Column(Boolean, server_default=text("FALSE"))
    google_id = Column(String(255), nullable=True, unique=True, index=True)

class PendingSignup(Base):
    __tablename__ = "pending_signups"

    id = Column(Integer, primary_key=True, index=True)
    # fields captured at signup time
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nickname = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    gender = Column(String(10), nullable=True)
    birth_date = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    mbti = Column(String(10), nullable=True)
    profile_image_url = Column(String, nullable=True, server_default=text("''"))

    # verification token/code
    verify_token = Column(String, nullable=True)
    verify_token_exp = Column(TIMESTAMP, nullable=True)
    verify_code = Column(String(6), nullable=True)
    verify_code_exp = Column(TIMESTAMP, nullable=True)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))



