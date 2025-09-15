from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserCreate, UserLogin, VerifyCode, EmailOnly
from app.services.auth_service import (
    create_pending_signup, authenticate_user, create_user_from_pending,
    create_access_token_for_user, regenerate_verification_code
)
from app.services.email_service import send_verification_email
from app.core.security import get_password_hash, make_random_token, decode_jwt_or_raise
from app.db.models import User, PendingSignup
from datetime import datetime, timedelta
from typing import Optional
import os

router = APIRouter(tags=["authentication"])

def get_google_oauth_client(request: Request):
    """플랫폼별 Google OAuth 클라이언트 반환"""
    user_agent = request.headers.get("user-agent", "").lower()
    
    # Android 감지
    if "android" in user_agent:
        return {
            "client_id": os.getenv("GOOGLE_ANDROID_CLIENT_ID"),
            "client_secret": None,  # Android는 시크릿 불필요
        }
    # iOS 감지
    elif "iphone" in user_agent or "ipad" in user_agent or "ipod" in user_agent:
        return {
            "client_id": os.getenv("GOOGLE_IOS_CLIENT_ID"),
            "client_secret": None,  # iOS는 시크릿 불필요
        }
    # 웹 (기본값)
    else:
        return {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        }

@router.post("/signup")
async def signup(body: UserCreate, db: Session = Depends(get_db)):
    """회원가입 요청 및 인증 이메일 발송"""
    try:
        pending_user = create_pending_signup(db, body)
        try:
            await send_verification_email(
                recipients=[pending_user.email],
                code=pending_user.verify_code
            )
            return {
                "msg": "이메일 인증이 필요합니다. 메일의 6자리 코드로 인증을 완료하세요.",
                "email": pending_user.email
            }
        except Exception as e:
            print(f"메일 발송 오류: {e}")
            raise HTTPException(status_code=500, detail=f"메일 발송에 실패했습니다. 관리자에게 문의하세요.")

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"회원가입 중 오류가 발생했습니다: {str(e)}")

@router.post("/verify-code")
async def verify_code(body: VerifyCode, db: Session = Depends(get_db)):
    """이메일 인증 코드 검증 및 회원가입 완료"""
    pending_user = db.query(PendingSignup).filter(PendingSignup.email == body.email).first()

    if not pending_user:
        raise HTTPException(status_code=404, detail="가입 대기 중인 사용자를 찾을 수 없습니다.")

    if pending_user.verify_code != body.code:
        raise HTTPException(status_code=400, detail="인증 코드가 올바르지 않습니다.")

    if datetime.utcnow() > pending_user.verify_code_exp:
        raise HTTPException(status_code=400, detail="인증 코드가 만료되었습니다.")

    # 정식 사용자로 전환
    new_user = create_user_from_pending(db, pending_user)

    # 자동 로그인을 위한 토큰 발급
    access_token = create_access_token_for_user(new_user)

    return {
        "msg": "회원가입이 성공적으로 완료되었습니다.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "nickname": new_user.nickname,
            "profile_completed": getattr(new_user, 'profile_completed', False)
        }
    }

@router.post("/resend-verification")
async def resend_verification_code(body: EmailOnly, db: Session = Depends(get_db)):
    """인증 코드 재전송"""
    try:
        pending_user = regenerate_verification_code(db, body.email)
        try:
            await send_verification_email(
                recipients=[pending_user.email],
                code=pending_user.verify_code
            )
            return {"msg": "새로운 인증 코드가 이메일로 발송되었습니다."}
        except Exception as e:
            print(f"메일 발송 오류: {e}")
            raise HTTPException(status_code=500, detail="메일 발송에 실패했습니다. 관리자에게 문의하세요.")
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인증 코드 재전송 중 오류가 발생했습니다: {str(e)}")

@router.post("/login")
async def login(body: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    try:
        user = authenticate_user(db, body.email, body.password)
        access_token = create_access_token_for_user(user)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "nickname": user.nickname,
                "profile_completed": user.profile_completed
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"로그인 중 오류가 발생했습니다: {str(e)}")

@router.post("/google/verify")
async def verify_google_token(body: dict, request: Request, db: Session = Depends(get_db)):
    """Google ID 토큰 검증 및 사용자 생성/로그인"""
    try:
        from google.auth.transport import requests
        from google.oauth2 import id_token
        
        id_token_str = body.get("id_token")
        if not id_token_str:
            raise HTTPException(400, "ID 토큰이 필요합니다.")
        
        # 플랫폼별 Google OAuth 클라이언트 가져오기
        oauth_client = get_google_oauth_client(request)
        client_id = oauth_client["client_id"]
        
        if not client_id:
            raise HTTPException(400, "플랫폼에 맞는 Google OAuth 클라이언트 ID가 설정되지 않았습니다.")
        
        # Google ID 토큰 검증
        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str, 
                requests.Request(), 
                client_id
            )
        except Exception as e:
            raise HTTPException(400, f"Google ID 토큰 검증 실패: {str(e)}")
        
        email = idinfo["email"]
        nickname = idinfo.get("name", email.split("@")[0])
        google_sub = idinfo["sub"]
        
        # 기존 사용자 확인
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # 기존 사용자 로그인
            if user.provider != "google":
                user.provider = "google"
                user.provider_sub = google_sub
                db.commit()
            
            access_token = create_access_token_for_user(user)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "nickname": user.nickname,
                    "profile_completed": user.profile_completed
                }
            }
        else:
            # 새 사용자 생성
            nickname = f"google_{google_sub[:8]}"
            while db.query(User).filter(User.nickname == nickname).first():
                nickname = f"google_{google_sub[:8]}_{make_random_token(4)}"
            
            user = User(
                nickname=nickname,
                email=email,
                password="",  # Google 사용자는 비밀번호 없음
                provider="google",
                provider_sub=google_sub,
                is_verified=True,
                profile_completed=False
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            access_token = create_access_token_for_user(user)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "nickname": user.nickname,
                    "profile_completed": user.profile_completed
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Google 인증 중 오류가 발생했습니다: {str(e)}")

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
        "nickname": user.nickname,
        "profile_completed": user.profile_completed
    }
