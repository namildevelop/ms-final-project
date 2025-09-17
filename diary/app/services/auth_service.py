import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, PendingSignup
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import SignUp, Login
from fastapi import HTTPException

def make_unique_nickname(db: Session, email: str) -> str:
    """이메일 로컬파트 기반으로 nickname 생성, 중복이면 숫자 접미사"""
    base = email.split("@")[0]
    base = re.sub(r"[^a-zA-Z0-9._-]", "", base) or "user"
    candidate = base
    i = 1
    while db.query(User).filter(User.nickname == candidate).first():
        i += 1
        candidate = f"{base}{i}"
    return candidate

def create_pending_signup(db: Session, signup_data: SignUp) -> PendingSignup:
    """회원가입 대기 사용자 생성"""
    # 이메일 중복 확인
    if db.query(User).filter(User.email == signup_data.email).first():
        raise HTTPException(400, "이미 등록된 이메일입니다.")
    
    if db.query(PendingSignup).filter(PendingSignup.email == signup_data.email).first():
        raise HTTPException(400, "이미 가입 대기 중인 이메일입니다.")
    
    # 비밀번호 확인
    if signup_data.password != signup_data.password_confirm:
        raise HTTPException(400, "비밀번호가 일치하지 않습니다.")
    
    # 비밀번호 해시
    password_hash = get_password_hash(signup_data.password)
    
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
        profile_image_url=signup_data.profile_image_url
    )
    
    db.add(pending)
    db.commit()
    db.refresh(pending)
    
    return pending

def authenticate_user(db: Session, email: str, password: str) -> User:
    """사용자 인증"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(400, "이메일 또는 비밀번호가 올바르지 않습니다.")
    
    if not verify_password(password, user.password):
        raise HTTPException(400, "이메일 또는 비밀번호가 올바르지 않습니다.")
    
    if not user.is_verified:
        raise HTTPException(400, "이메일 인증이 완료되지 않았습니다.")
    
    return user

def create_user_from_pending(db: Session, email: str, verify_code: str) -> User:
    """인증 완료된 PendingSignup을 User로 변환"""
    pending = db.query(PendingSignup).filter(PendingSignup.email == email).first()
    if not pending:
        raise HTTPException(400, "가입 대기 중인 사용자를 찾을 수 없습니다.")
    
    # 인증 코드 확인
    if not pending.verify_code or pending.verify_code != verify_code:
        raise HTTPException(400, "인증 코드가 올바르지 않습니다.")
    
    if pending.verify_code_exp and datetime.utcnow() > pending.verify_code_exp:
        raise HTTPException(400, "인증 코드가 만료되었습니다.")
    
    # nickname 생성
    nickname = make_unique_nickname(db, email)
    
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



