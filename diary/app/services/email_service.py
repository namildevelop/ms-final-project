import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, PendingSignup
from app.core.config import settings, is_mail_enabled
from fastapi import HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# FastMail 인스턴스 생성
fm: FastMail | None = None
if is_mail_enabled():
    mail_conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=True,
    )
    fm = FastMail(mail_conf)

def generate_verification_code() -> str:
    """6자리 인증 코드 생성"""
    return str(random.randint(100000, 999999))

def send_verification_email(email: str, verify_code: str) -> bool:
    """인증 코드 이메일 발송"""
    if not fm:
        return False
    
    try:
        message = MessageSchema(
            subject="AIR TRAVEL - 이메일 인증 코드",
            recipients=[email],
            body=f"""
            안녕하세요! AIR TRAVEL입니다.
            
            이메일 인증을 위한 6자리 코드는 다음과 같습니다:
            
            🔐 인증 코드: {verify_code}
            
            이 코드는 10분간 유효합니다.
            본인이 요청하지 않은 경우 이 메일을 무시하세요.
            
            감사합니다.
            AIR TRAVEL 팀
            """,
            subtype="html"
        )
        
        fm.send_message(message)
        return True
    except Exception as e:
        print(f"메일 발송 오류: {e}")
        return False

def send_password_reset_email(email: str, reset_token: str) -> bool:
    """비밀번호 재설정 이메일 발송"""
    if not fm:
        return False
    
    try:
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
        
        message = MessageSchema(
            subject="AIR TRAVEL - 비밀번호 재설정",
            recipients=[email],
            body=f"""
            안녕하세요! AIR TRAVEL입니다.
            
            비밀번호 재설정을 요청하셨습니다.
            아래 링크를 클릭하여 새 비밀번호를 설정하세요:
            
            🔗 비밀번호 재설정: {reset_url}
            
            이 링크는 1시간간 유효합니다.
            본인이 요청하지 않은 경우 이 메일을 무시하세요.
            
            감사합니다.
            AIR TRAVEL 팀
            """,
            subtype="html"
        )
        
        fm.send_message(message)
        return True
    except Exception as e:
        print(f"메일 발송 오류: {e}")
        return False

def update_verification_code(db: Session, email: str, verify_code: str) -> bool:
    """사용자 또는 PendingSignup의 인증 코드 업데이트"""
    # 먼저 User 테이블에서 찾기
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.verify_code = verify_code
        user.verify_code_exp = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        return True
    
    # User에 없으면 PendingSignup에서 찾기
    pending = db.query(PendingSignup).filter(PendingSignup.email == email).first()
    if pending:
        pending.verify_code = verify_code
        pending.verify_code_exp = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        return True
    
    return False

def request_verification(db: Session, email: str) -> dict:
    """이메일 인증 요청 처리"""
    # 인증 코드 생성
    verify_code = generate_verification_code()
    
    # 데이터베이스에 인증 코드 저장
    if not update_verification_code(db, email, verify_code):
        raise HTTPException(400, "등록되지 않은 이메일입니다.")
    
    # 이메일 발송
    mail_sent = False
    error_msg = ""
    
    if fm:
        try:
            print("FastMail 인스턴스 생성됨, 메일 발송 시작...")
            mail_sent = send_verification_email(email, verify_code)
        except Exception as e:
            error_msg = str(e)
            mail_sent = False
    else:
        print("FastMail 인스턴스가 None - 메일 설정 비활성화")
    
    print(f"메일 발송 결과: {mail_sent}, 에러: {error_msg}")
    
    # 개발 모드에서 인증 코드 표시
    response_data = {
        "msg": "인증 코드가 이메일로 전송되었습니다.",
        "verify_code_dev": verify_code if not mail_sent else None
    }
    
    if not mail_sent:
        response_data["msg"] += " (메일 발송 실패. /email/request-verify로 재시도하세요)"
    
    return response_data










