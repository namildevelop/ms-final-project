from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import SignUp, Login, EmailOnly, VerifyCode, ResetPassword, ProfileComplete
from app.services.auth_service import (
    create_pending_signup, authenticate_user, create_user_from_pending,
    create_access_token_for_user
)
from app.services.email_service import request_verification
from app.core.security import get_password_hash, make_random_token
from app.models.user import User
from datetime import datetime, timedelta
from typing import Optional
import os

router = APIRouter(prefix="/auth", tags=["authentication"])

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
async def signup(body: SignUp, db: Session = Depends(get_db)):
    """회원가입"""
    try:
        pending = create_pending_signup(db, body)
        
        # 이메일 인증 코드 발송
        mail_sent = False
        if pending:
            try:
                # 실제로는 /email/request-verify에서 발송하도록 안내
                mail_sent = True
            except Exception as e:
                print(f"메일 발송 오류: {e}")
                mail_sent = False
        
        payload = {
            "msg": "이메일 인증이 필요합니다. 메일의 6자리 코드로 인증을 완료하세요.",
            "user_id": pending.id,
            "email": pending.email
        }
        
        if not mail_sent:
            payload["msg"] += " (메일 발송 실패. /email/request-verify로 재시도하세요)"
        
        return payload
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"회원가입 중 오류가 발생했습니다: {str(e)}")

@router.post("/login")
async def login(body: Login, db: Session = Depends(get_db)):
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

@router.post("/google/callback")
async def google_oauth_callback(body: dict, request: Request, db: Session = Depends(get_db)):
    """Google OAuth callback - authorization code를 받아서 사용자 정보 처리"""
    try:
        code = body.get("code")
        redirect_uri = body.get("redirect_uri")
        
        if not code:
            raise HTTPException(400, "Authorization code가 필요합니다")
        
        # Google OAuth 클라이언트 정보 가져오기
        oauth_client = get_google_oauth_client(request)
        client_id = oauth_client["client_id"]
        client_secret = oauth_client["client_secret"]
        
        if not client_id:
            raise HTTPException(500, "Google OAuth 클라이언트 ID가 설정되지 않았습니다")
        
        # Google OAuth 토큰 교환
        import requests
        
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        token_response = requests.post(token_url, data=token_data)
        if not token_response.ok:
            print(f"Google 토큰 교환 실패: {token_response.text}")
            raise HTTPException(400, "Google OAuth 토큰 교환에 실패했습니다")
        
        token_info = token_response.json()
        access_token = token_info.get("access_token")
        
        if not access_token:
            raise HTTPException(400, "Google access token을 받지 못했습니다")
        
        # Google 사용자 정보 가져오기
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        userinfo_response = requests.get(userinfo_url, headers=headers)
        if not userinfo_response.ok:
            print(f"Google 사용자 정보 가져오기 실패: {userinfo_response.text}")
            raise HTTPException(400, "Google 사용자 정보를 가져오지 못했습니다")
        
        user_info = userinfo_response.json()
        google_id = user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        
        if not email:
            raise HTTPException(400, "Google 계정에서 이메일을 가져올 수 없습니다")
        
        # 기존 사용자 확인
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            # 기존 사용자 로그인
            access_token = create_access_token_for_user(existing_user)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": existing_user.id,
                    "email": existing_user.email,
                    "nickname": existing_user.nickname,
                    "profile_completed": existing_user.profile_completed
                },
                "is_new_user": False
            }
        else:
            # 새 사용자 생성
            from app.services.auth_service import create_user_from_google
            
            new_user = create_user_from_google(db, {
                "google_id": google_id,
                "email": email,
                "nickname": name,
                "profile_image_url": picture
            })
            
            access_token = create_access_token_for_user(new_user)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": new_user.id,
                    "email": new_user.email,
                    "nickname": new_user.nickname,
                    "profile_completed": new_user.profile_completed
                },
                "is_new_user": True
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google OAuth callback 오류: {e}")
        raise HTTPException(500, f"Google OAuth 처리 중 오류가 발생했습니다: {str(e)}")

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

def decode_jwt_or_raise(token: str) -> int:
    """JWT 토큰 디코딩 (임시로 여기에 정의)"""
    from app.core.security import decode_jwt_or_raise as _decode_jwt_or_raise
    return _decode_jwt_or_raise(token)






