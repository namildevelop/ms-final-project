from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import ProfileComplete
from app.models.user import User
from app.core.security import decode_jwt_or_raise
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/check/email")
async def check_email(email: str = Query(...), db: Session = Depends(get_db)):
    """이메일 중복 확인"""
    user = db.query(User).filter(User.email == email).first()
    return {"available": user is None}

@router.get("/check/username")
async def check_username(username: str = Query(...), db: Session = Depends(get_db)):
    """사용자명 중복 확인"""
    user = db.query(User).filter(User.username == username).first()
    return {"available": user is None}

@router.post("/profile/complete")
async def complete_profile(
    body: ProfileComplete,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    """프로필 완성"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "인증 토큰이 필요합니다.")
    
    token = authorization.split(" ")[1]
    user_id = decode_jwt_or_raise(token)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    
    # 프로필 정보 업데이트
    user.address = body.address
    user.phone = body.phone
    user.gender = body.gender
    user.mbti = body.mbti
    user.birthdate = body.birthdate
    user.profile_completed = True
    
    db.commit()
    db.refresh(user)
    
    return {
        "msg": "프로필이 완성되었습니다.",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "username": user.username,
            "profile_completed": user.profile_completed
        }
    }

@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    """현재 로그인한 사용자 정보 조회"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "인증 토큰이 필요합니다.")
    
    token = authorization.split(" ")[1]
    user_id = decode_jwt_or_raise(token)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "username": user.username,
        "profile_completed": user.profile_completed,
        "address": user.address,
        "phone": user.phone,
        "gender": user.gender,
        "mbti": user.mbti,
        "birthdate": user.birthdate
    }



