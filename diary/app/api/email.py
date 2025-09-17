from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import EmailOnly, VerifyCode, ResetPassword
from app.services.email_service import request_verification
from app.services.auth_service import create_user_from_pending
from app.core.security import get_password_hash, make_random_token
from app.models.user import User, PendingSignup
from datetime import datetime, timedelta

router = APIRouter(prefix="/email", tags=["email"])

@router.post("/request-verify")
async def request_verify(body: EmailOnly, db: Session = Depends(get_db)):
    """이메일 인증 코드 요청"""
    try:
        return request_verification(db, body.email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"인증 코드 요청 중 오류가 발생했습니다: {str(e)}")

@router.post("/verify/code")
async def verify_email_code(body: VerifyCode, db: Session = Depends(get_db)):
    """이메일 인증 코드 검증"""
    try:
        # PendingSignup에서 인증 코드 확인
        p = db.query(PendingSignup).filter(PendingSignup.email == body.email).first()
        if not p:
            raise HTTPException(400, "가입 대기 중인 사용자를 찾을 수 없습니다.")
        
        # 이미 User로 생성되었는지 확인
        if db.query(User).filter(User.email == p.email).first():
            raise HTTPException(400, "이미 인증이 완료된 사용자입니다.")
        
        # 인증 코드 확인
        if not p.verify_code or p.verify_code != body.code:
            raise HTTPException(400, "인증 코드가 올바르지 않습니다.")
        
        if p.verify_code_exp and datetime.utcnow() > p.verify_code_exp:
            raise HTTPException(400, "인증 코드가 만료되었습니다.")
        
        # User 생성
        user = create_user_from_pending(db, body.email, body.code)
        
        return {
            "msg": "이메일 인증이 완료되었습니다!",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "username": user.username
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"인증 코드 검증 중 오류가 발생했습니다: {str(e)}")

@router.post("/password/request")
async def password_request(body: EmailOnly, db: Session = Depends(get_db)):
    """비밀번호 재설정 요청"""
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user:
            raise HTTPException(400, "등록되지 않은 이메일입니다.")
        
        # 재설정 토큰 생성
        reset_token = make_random_token()
        user.reset_token = reset_token
        user.reset_token_exp = datetime.utcnow() + timedelta(hours=1)
        
        db.commit()
        
        # 이메일 발송
        from app.services.email_service import send_password_reset_email
        mail_sent = send_password_reset_email(body.email, reset_token)
        
        return {
            "msg": "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
            "reset_token_dev": reset_token if not mail_sent else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"비밀번호 재설정 요청 중 오류가 발생했습니다: {str(e)}")

@router.post("/password/reset")
async def password_reset(body: ResetPassword, db: Session = Depends(get_db)):
    """비밀번호 재설정"""
    try:
        # 토큰으로 사용자 찾기
        user = db.query(User).filter(
            User.reset_token == body.token,
            User.reset_token_exp > datetime.utcnow()
        ).first()
        
        if not user:
            raise HTTPException(400, "유효하지 않거나 만료된 토큰입니다.")
        
        # 비밀번호 확인
        if body.new_password != body.new_password_confirm:
            raise HTTPException(400, "새 비밀번호가 일치하지 않습니다.")
        
        # 새 비밀번호 설정
        user.password_hash = get_password_hash(body.new_password)
        user.reset_token = None
        user.reset_token_exp = None
        
        db.commit()
        
        return {"msg": "비밀번호가 성공적으로 변경되었습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"비밀번호 재설정 중 오류가 발생했습니다: {str(e)}")










