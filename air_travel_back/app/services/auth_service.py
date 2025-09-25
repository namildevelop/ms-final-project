import re
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import User, PendingSignup
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate
from fastapi import HTTPException

def ensure_unique_nickname(db: Session, nickname: str) -> str:
    """Checks if a nickname is unique and appends a number if not."""
    candidate = nickname
    i = 1
    while db.query(User).filter(User.nickname == candidate).first():
        i += 1
        candidate = f"{nickname}{i}"
    return candidate

def create_pending_signup(db: Session, signup_data: UserCreate) -> PendingSignup:
    """회원가입 대기 사용자 생성 및 인증 코드 발급"""
    # 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == signup_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")

    # 기존 가입 대기 중인 이메일 확인 및 삭제
    existing_pending = db.query(PendingSignup).filter(PendingSignup.email == signup_data.email).first()
    if existing_pending:
        db.delete(existing_pending)
        db.commit()

    # 비밀번호 확인
    if signup_data.password != signup_data.password_confirm:
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    # 비밀번호 해시
    password_hash = get_password_hash(signup_data.password)

    # 6자리 인증 코드 생성
    verify_code = ''.join(random.choices(string.digits, k=6))
    verify_code_exp = datetime.utcnow() + timedelta(minutes=10) # 10분 후 만료

    # PendingSignup 생성
    pending = PendingSignup(
        email=signup_data.email,
        password=password_hash,
        nickname=signup_data.nickname,
        phone=signup_data.phone,
        gender=signup_data.gender,
        birth_date=signup_data.birth_date,
        address=signup_data.address,
        mbti=signup_data.mbti,
        profile_image_url=signup_data.profile_image_url,
        verify_code=verify_code,
        verify_code_exp=verify_code_exp
    )

    db.add(pending)
    db.commit()
    db.refresh(pending)

    return pending

def regenerate_verification_code(db: Session, email: str) -> PendingSignup:
    """인증 코드 재생성 및 DB 업데이트"""
    pending_user = db.query(PendingSignup).filter(PendingSignup.email == email).first()

    if not pending_user:
        raise HTTPException(status_code=404, detail="가입 대기 중인 사용자를 찾을 수 없습니다.")

    # 새 인증 코드 생성
    pending_user.verify_code = ''.join(random.choices(string.digits, k=6))
    pending_user.verify_code_exp = datetime.utcnow() + timedelta(minutes=10) # 10분 후 만료

    db.commit()
    db.refresh(pending_user)

    return pending_user

def authenticate_user(db: Session, email: str, password: str) -> User:
    """사용자 인증"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(400, "이메일 또는 비밀번호가 올바르지 않습니다.")
    
    if not user.password or not verify_password(password, user.password):
        raise HTTPException(400, "이메일 또는 비밀번호가 올바르지 않습니다.")
    
    if not user.is_verified:
        raise HTTPException(400, "이메일 인증이 완료되지 않았습니다.")
    
    return user

def create_user_from_pending(db: Session, pending: PendingSignup) -> User:
    """PendingSignup 객체를 User로 변환"""
    # nickname 생성
    nickname = ensure_unique_nickname(db, pending.nickname)

    # User 생성
    user = User(
        email=pending.email,
        password=pending.password,
        nickname=nickname,
        phone=pending.phone,
        gender=pending.gender,
        birth_date=pending.birth_date,
        address=pending.address,
        mbti=pending.mbti,
        profile_image_url=pending.profile_image_url,
        is_verified=True
    )

    db.add(user)
    db.delete(pending)  # PendingSignup 삭제
    db.commit()
    db.refresh(user)

    return user

def create_user_from_google(db: Session, google_data: dict) -> User:
    """Google OAuth로 새 사용자 생성"""
    email = google_data["email"]
    nickname = google_data["nickname"]
    google_id = google_data.get("google_id")
    profile_image_url = google_data.get("profile_image_url", "")
    
    # 이메일 중복 확인
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "이미 등록된 이메일입니다.")
    
    # 고유한 nickname 생성 (email 기반)
    base_nickname = email.split('@')[0][:15]  # @ 앞부분, 최대 15자
    nickname = base_nickname
    counter = 1
    
    while db.query(User).filter(User.nickname == nickname).first():
        nickname = f"{base_nickname}{counter}"
        counter += 1
        if counter > 999:  # 무한 루프 방지
            raise HTTPException(500, "닉네임 생성에 실패했습니다.")
    
    # User 생성
    user = User(
        email=email,
        password="",  # Google 사용자는 비밀번호 없음
        nickname=nickname,
        google_id=google_id,
        profile_image_url=profile_image_url,
        provider="google",
        is_verified=True,  # Google 계정은 이미 인증됨
        profile_completed=False  # 추가 정보 입력 필요
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def create_access_token_for_user(user: User) -> str:
    """사용자용 액세스 토큰 생성"""
    return create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(days=7)
    )

