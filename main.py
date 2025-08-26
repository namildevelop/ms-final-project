from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Query, Header
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse, JSONResponse
import os, re, random
from sqlalchemy import text, inspect

from database import Base, engine, SessionLocal
from models import User, PendingSignup
from schemas import (
    SignUp, Login, EmailOnly, ResetPassword, ProfileComplete, VerifyCode
)
from auth import hash_pw, verify_pw, make_access_token, make_random_token, password_ok

# ── 메일 발송(선택) ─────────────────────────────────────────────
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import BaseModel, EmailStr

# ── JWT 디코딩(현재 유저 확인) ──────────────────────────────────
from jose import jwt as jose_jwt, JWTError

# ── Google OAuth ────────────────────────────────────────────────
from authlib.integrations.starlette_client import OAuth

# ── 주소 검색 API ───────────────────────────────────────────────
import requests

app = FastAPI(title="AIR TRAVEL")

# Feature flags
SHOW_DEV_CODES = os.getenv("SHOW_DEV_CODES", "false").lower() == "true"

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# ────────────────────────────────────────────────────────────────
# 경량 마이그레이션: 기존 DB에 누락된 컬럼 추가 (Postgres 우선)
try:
    insp = inspect(engine)
    user_cols = {c['name'] for c in insp.get_columns('users')}
    with engine.begin() as conn:
        if 'verify_code' not in user_cols:
            if engine.dialect.name == 'postgresql':
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_code VARCHAR(6)")
            else:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN verify_code VARCHAR(6)")
        if 'verify_code_exp' not in user_cols:
            if engine.dialect.name == 'postgresql':
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_code_exp TIMESTAMP")
            else:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN verify_code_exp TIMESTAMP")
except Exception:
    # 마이그레이션 실패해도 앱은 계속; 콘솔 로그로만 노출하도록 함
    pass

# CORS (개발용 허용 목록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google OAuth를 위한 세션 미들웨어
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "dev-secret-key"))

# ────────────────────────────────────────────────────────────────
# 메일 설정 (환경변수가 없으면 fm=None 이 되어 실제 발송은 건너뜀)
# ────────────────────────────────────────────────────────────────
class MailSettings(BaseModel):
    MAIL_USERNAME: str | None = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str | None = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: EmailStr | None = os.getenv("MAIL_FROM")
    MAIL_SERVER: str | None = os.getenv("MAIL_SERVER")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    # ✅ fastapi-mail 2.x 스펙(구버전의 MAIL_TLS/MAIL_SSL 아님!)
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"

def _is_placeholder(v: str | None) -> bool:
    return v is None or v.strip() in ("", "...")

_settings = MailSettings()

fm: FastMail | None = None
if (not _is_placeholder(_settings.MAIL_USERNAME)
    and not _is_placeholder(_settings.MAIL_PASSWORD)
    and not _is_placeholder(str(_settings.MAIL_FROM or ""))
    and not _is_placeholder(_settings.MAIL_SERVER)):
    # ✅ 최신 키 이름으로 ConnectionConfig 생성
    mail_conf = ConnectionConfig(
        MAIL_USERNAME=_settings.MAIL_USERNAME,
        MAIL_PASSWORD=_settings.MAIL_PASSWORD,
        MAIL_FROM=_settings.MAIL_FROM,
        MAIL_SERVER=_settings.MAIL_SERVER,
        MAIL_PORT=_settings.MAIL_PORT,
        MAIL_STARTTLS=_settings.MAIL_STARTTLS,  # ← 여기 중요
        MAIL_SSL_TLS=_settings.MAIL_SSL_TLS,    # ← 여기 중요
        USE_CREDENTIALS=True,
    )
    fm = FastMail(mail_conf)
else:
    # 환경변수 없거나 "..." 같은 placeholder면 실제 발송 끄고 개발모드로
    fm = None

# ────────────────────────────────────────────────────────────────
# Google OAuth 등록
oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ────────────────────────────────────────────────────────────────
# 공용 유틸

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _make_unique_username(db: Session, email: str) -> str:
    """이메일 로컬파트 기반으로 username 생성, 중복이면 숫자 접미사"""
    base = email.split("@")[0]
    base = re.sub(r"[^a-zA-Z0-9._-]", "", base) or "user"
    candidate = base
    i = 1
    while db.query(User).filter(User.username == candidate).first():
        i += 1
        candidate = f"{base}{i}"
    return candidate

JWT_SECRET = os.getenv("JWT_SECRET", "dev")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

def _decode_jwt_or_raise(token: str) -> int:
    try:
        payload = jose_jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(401, "토큰이 유효하지 않습니다.")

def get_current_user(authorization: str | None = Header(default=None),
                     request: Request = None,
                     db: Session = Depends(get_db)) -> User:
    token: str | None = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split()[1]
    elif request is not None:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "로그인이 필요합니다.")

    user_id = _decode_jwt_or_raise(token)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    return user

# ────────────────────────────────────────────────────────────────
# 라우트

@app.get("/")
def health():
    return {"status": "ok"}

# 회원가입 (이메일 인증 선행: PendingSignup 생성 후 인증 성공 시 User 생성)
@app.post("/signup")
def signup(body: SignUp, db: Session = Depends(get_db)):
    if body.password != body.password_confirm:
        raise HTTPException(400, "비밀번호 확인이 일치하지 않습니다.")
    if not password_ok(body.password):
        raise HTTPException(400, "비밀번호는 8자 이상, 대/소문자/숫자/특수문자를 포함해야 합니다.")

    # 이메일/닉네임 중복 체크(기존 User + PendingSignup)
    if db.query(User).filter(User.email == body.email).first() or db.query(PendingSignup).filter(PendingSignup.email == body.email).first():
        raise HTTPException(400, "이미 사용 중인 이메일입니다.")
    if body.nickname and (db.query(User).filter(User.nickname == body.nickname).first() or db.query(PendingSignup).filter(PendingSignup.nickname == body.nickname).first()):
        raise HTTPException(400, "이미 사용 중인 닉네임입니다.")

    code = f"{random.randint(0, 999999):06d}"
    pending = PendingSignup(
        name=body.name,
        email=body.email,
        student_id=body.student_id,
        password_hash=hash_pw(body.password),
        mbti=body.mbti,
        address=body.address,
        gender=body.gender,
        birthdate=body.birthdate,
        phone=body.phone,
        nickname=body.nickname,
        verify_code=code,
        verify_code_exp=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(pending); db.commit(); db.refresh(pending)

    # 메일 발송 시도
    mail_sent = False
    if fm:
        try:
            msg = MessageSchema(
                subject="[AIR TRAVEL] 이메일 인증을 완료해 주세요",
                recipients=[pending.email],
                body=(
                    "아래 6자리 인증 코드를 입력하세요.\n"
                    f"인증 코드: {code}\n"
                    "코드 유효시간: 1시간"
                ),
                subtype="plain",
            )
            # 동기 함수에서 비동기 메일 발송을 위해 별도 처리
            # 실제로는 /email/request-verify에서 발송하도록 안내
            mail_sent = True
        except Exception as e:
            mail_sent = False

    payload = {"msg": "이메일 인증이 필요합니다. 메일의 6자리 코드로 인증을 완료하세요."}
    if SHOW_DEV_CODES:
        payload.update({"verify_code_dev": code})
    if not mail_sent and fm:
        payload["msg"] += " (메일 발송 실패. /email/request-verify로 재시도하세요)"
    return payload

# 로그인
@app.post("/login")
def login(body: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_pw(body.password, user.password_hash):
        raise HTTPException(401, "이메일 또는 비밀번호가 틀렸습니다.")
    if not user.is_verified:
        raise HTTPException(403, "이메일 인증 후 로그인할 수 있습니다.")
    token = make_access_token(sub=str(user.id))
    return {"access_token": token, "token_type": "bearer", "is_verified": bool(user.is_verified)}

# 이메일 인증 토큰/코드 요청(메일 발송)
@app.post("/email/request-verify")
async def request_verify(body: EmailOnly, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    pending = db.query(PendingSignup).filter(PendingSignup.email == body.email).first()
    if not user and not pending:
        raise HTTPException(404, "해당 이메일의 가입 요청이 없습니다.")
    if user and user.is_verified:
        return {"msg": "이미 인증된 계정입니다."}

    # 대상 레코드 선택(User 우선)
    if user:
        code = f"{random.randint(0, 999999):06d}"
        user.verify_code = code
        user.verify_code_exp = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        target_email = user.email
    else:
        code = f"{random.randint(0, 999999):06d}"
        pending.verify_code = code
        pending.verify_code_exp = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        target_email = pending.email

    # 메일 발송 시도
    mail_sent = False
    error_msg = ""
    if fm:
        try:
            print("FastMail 인스턴스 생성됨, 메일 발송 시작...")  # 디버그 로그
            msg = MessageSchema(
                subject="[AIR TRAVEL] 이메일 인증을 완료해 주세요",
                recipients=[target_email],
                body=(
                    "아래 6자리 인증 코드를 입력하세요.\n"
                    f"인증 코드: {code}\n"
                    "코드 유효시간: 1시간"
                ),
                subtype="plain",
            )
            print(f"메시지 스키마 생성됨: {msg.subject}")  # 디버그 로그
            await fm.send_message(msg)
            print("메일 발송 완료")  # 디버그 로그
            mail_sent = True
        except Exception as e:
            mail_sent = False
            error_msg = str(e)
            print(f"메일 발송 실패: {error_msg}")  # 콘솔 로그
            print(f"에러 타입: {type(e).__name__}")  # 에러 타입 로그
    else:
        error_msg = "메일 설정이 비활성화됨"
        print("FastMail 인스턴스가 None - 메일 설정 비활성화")  # 디버그 로그

    print(f"메일 발송 결과: {mail_sent}, 에러: {error_msg}")  # 최종 결과 로그

    if not mail_sent:
        raise HTTPException(500, f"메일 발송에 실패했습니다. {error_msg}")

    payload = {"msg": "인증 메일(코드) 발급"}
    if SHOW_DEV_CODES:
        payload.update({"verify_code_dev": code})
    return payload

# 이메일 코드 인증 처리
@app.post("/email/verify/code")
def verify_email_code(body: VerifyCode, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    # 1) PendingSignup 코드 확인 -> User 생성
    p = db.query(PendingSignup).filter(PendingSignup.email == body.email).first()
    if p and p.verify_code and p.verify_code_exp and p.verify_code_exp >= now and str(body.code).strip() == p.verify_code:
        if db.query(User).filter(User.email == p.email).first():
            db.delete(p); db.commit()
            return {"msg": "이미 인증 완료된 계정입니다."}
        username = _make_unique_username(db, p.email)
        user = User(
            username=username,
            name=p.name,
            email=p.email,
            student_id=p.student_id,
            password_hash=p.password_hash,
            mbti=p.mbti,
            address=p.address,
            gender=p.gender,
            birthdate=p.birthdate,
            phone=p.phone,
            nickname=p.nickname,
            is_verified=True,
            provider="local",
            profile_completed=True,
        )
        db.add(user)
        db.delete(p)
        db.commit(); db.refresh(user)
        return {"msg": "이메일 인증 완료 및 가입 처리됨"}

    # 2) 기존 User 코드 확인(하위호환)
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.verify_code or not user.verify_code_exp:
        raise HTTPException(400, "인증 코드가 존재하지 않습니다.")
    if user.verify_code_exp < now:
        raise HTTPException(400, "인증 코드가 만료되었습니다.")
    if str(body.code).strip() != user.verify_code:
        raise HTTPException(400, "인증 코드가 올바르지 않습니다.")
    user.is_verified = True
    user.verify_code = None
    user.verify_code_exp = None
    db.commit()
    return {"msg": "이메일 인증 완료"}

# 비밀번호 재설정 토큰 요청(메일 발송)
@app.post("/password/request")
async def password_request(body: EmailOnly, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(404, "해당 이메일의 사용자가 없습니다.")

    user.reset_token = make_random_token()
    user.reset_token_exp = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    reset_link = f"{os.getenv('FRONT_ORIGIN', 'http://localhost:3000')}/password/reset?token={user.reset_token}"
    if fm:
        msg = MessageSchema(
            subject="[AIR TRAVEL] 비밀번호 재설정 안내",
            recipients=[user.email],
            body=f"아래 링크를 눌러 비밀번호를 재설정하세요:\n{reset_link}",
            subtype="plain",
        )
        await fm.send_message(msg)

    return {"msg": "재설정 메일(또는 토큰) 발급", "reset_token_dev": user.reset_token}

# 비밀번호 재설정
@app.post("/password/reset")
def password_reset(body: ResetPassword, db: Session = Depends(get_db)):
    if body.new_password != body.new_password_confirm:
        raise HTTPException(400, "비밀번호 확인이 일치하지 않습니다.")
    if not password_ok(body.new_password):
        raise HTTPException(400, "비밀번호는 8자 이상, 대/소문자/숫자/특수문자를 포함해야 합니다.")
    user = db.query(User).filter(User.reset_token == body.token).first()
    if not user or not user.reset_token_exp or user.reset_token_exp < datetime.utcnow():
        raise HTTPException(400, "토큰이 유효하지 않거나 만료되었습니다.")
    user.password_hash = hash_pw(body.new_password)
    user.reset_token = None
    user.reset_token_exp = None
    db.commit()
    return {"msg": "비밀번호가 변경되었습니다."}

# (선택) 중복 체크
@app.get("/check/email")
def check_email(email: str = Query(...), db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == email).first() is not None
    return {"available": not exists}

@app.get("/check/username")
def check_username(username: str = Query(...), db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == username).first() is not None
    return {"available": not exists}

# 개발용: 이메일로 사용자/PendingSignup 삭제
@app.post("/dev/delete-user")
def delete_user_by_email(email: str = Query(...), db: Session = Depends(get_db)):
    # User 테이블에서 삭제
    user = db.query(User).filter(User.email == email).first()
    if user:
        db.delete(user)
        print(f"User 삭제됨: {email}")
    
    # PendingSignup 테이블에서 삭제
    pending = db.query(PendingSignup).filter(PendingSignup.email == email).first()
    if pending:
        db.delete(pending)
        print(f"PendingSignup 삭제됨: {email}")
    
    db.commit()
    return {"msg": f"이메일 {email} 관련 데이터가 삭제되었습니다."}

# Google 로그인
from fastapi.responses import RedirectResponse

@app.get("/auth/google/login")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or {}
    email = userinfo.get("email")
    sub = userinfo.get("sub")
    name = userinfo.get("name") or ""

    if not email or not sub:
        raise HTTPException(400, "구글 사용자 정보를 가져오지 못했습니다.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        username = _make_unique_username(db, email)
        user = User(
            username=username,
            name=name or email.split("@")[0],
            email=email,
            password_hash=hash_pw(make_random_token()),  # dummy
            is_verified=True,  # 구글 사용자는 이메일 인증 건너뛰기
            provider="google",
            provider_sub=sub,
            profile_completed=False,  # 추가입력 필요
        )
        db.add(user); db.commit(); db.refresh(user)

    jwt = make_access_token(sub=str(user.id))
    
    # 추가입력이 필요한지 확인
    if not getattr(user, "profile_completed", False):
        # 추가입력 페이지로 리다이렉트 (프론트엔드에서 처리)
        dest = os.getenv("FRONT_ORIGIN", "http://localhost:3000")
        resp = RedirectResponse(f"{dest}/additional-input", status_code=302)
    else:
        # 메인 페이지로 리다이렉트
        dest = os.getenv("FRONT_ORIGIN", "http://localhost:3000")
        resp = RedirectResponse(f"{dest}/", status_code=302)
    
    # JWT를 HttpOnly 쿠키로 설정
    resp.set_cookie(
        key="access_token",
        value=jwt,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60*60
    )
    return resp

# 구글 로그인 후 ‘추가입력’ 저장
@app.post("/profile/complete")
def complete_profile(body: ProfileComplete,
                     me: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    me.address = body.address or me.address
    me.phone = body.phone or me.phone
    me.gender = body.gender or me.gender
    me.mbti = body.mbti or me.mbti
    me.birthdate = body.birthdate or me.birthdate
    me.profile_completed = True
    db.commit()
    return {"msg": "프로필이 업데이트되었습니다.", "profile_completed": True}

@app.get("/me")
def me(me: User = Depends(get_current_user)):
    return {
        "id": me.id,
        "email": me.email,
        "username": me.username,
        "provider": me.provider,
        "is_verified": bool(me.is_verified),
        "profile_completed": bool(me.profile_completed),
    }

@app.get("/api/address/my-location")
def get_my_location():
    """내 위치 기반 주소 자동 입력 API"""
    try:
        # 클라이언트에서 GPS 좌표를 받아서 주소로 변환
        # 실제로는 프론트엔드에서 navigator.geolocation으로 위치를 가져와야 함
        return {
            "message": "GPS 위치 기반 주소 자동 입력",
            "note": "프론트엔드에서 navigator.geolocation API를 사용하여 위치를 가져와야 합니다."
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"위치 정보 가져오기 실패: {str(e)}"}
        )

@app.get("/geocode/reverse")
def reverse_geocode(
    lat: float = Query(..., description="위도"),
    lon: float = Query(..., description="경도")
):
    """좌표를 주소로 변환하는 API (역지오코딩)"""
    try:
        # 카카오 좌표-주소 변환 API 호출
        url = "https://dapi.kakao.com/v2/local/geo/coord2address.json"
        api_key = os.getenv('KAKAO_REST_API_KEY', '')
        
        headers = {
            "Authorization": f"KakaoAK {api_key}"
        }
        params = {
            "x": lon,  # 카카오 API는 경도, 위도 순서
            "y": lat
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        print(f"카카오 API 응답 상태: {response.status_code}")  # 디버깅용
        print(f"카카오 API 응답 헤더: {dict(response.headers)}")  # 디버깅용
        
        if response.status_code == 200:
            data = response.json()
            print(f"카카오 API 응답: {data}")  # 디버깅용 로그
            
            if data.get("documents"):
                doc = data["documents"][0]
                print(f"첫 번째 문서: {doc}")  # 디버깅용 로그
                
                # 안전한 필드 접근
                address = doc.get("address_name", "")
                road_address = doc.get("road_address_name", "")
                
                if not address and not road_address:
                    return {"address": f"위치: {lat}, {lon}", "raw": data}
                
                # 도로명주소가 있으면 도로명주소, 없으면 지번주소 사용
                final_address = road_address if road_address else address
                
                return {
                    "address": final_address,
                    "raw": data
                }
            else:
                return {"address": f"위치: {lat}, {lon}", "raw": data}
        else:
            return JSONResponse(
                status_code=400,
                content={"detail": f"주소 변환 실패: {response.status_code}"}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"주소 변환 중 오류 발생: {str(e)}"}
        )

# ✅ 확장된 테스트 화면: http://127.0.0.1:8000/play
@app.get("/play", response_class=HTMLResponse)
def play_page():
    return """
<!doctype html>
<html lang="ko"><meta charset="utf-8" />
<title>AIR TRAVEL - Test Playground</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin:40px; }
  h2 { margin-top:28px; }
  form, .card { border:1px solid #e5e7eb; padding:16px; border-radius:12px; margin:12px 0; max-width:760px; }
  input, button { padding:10px; margin:6px 0; border-radius:8px; border:1px solid #d1d5db; width:100%; }
  button { background:#111827; color:white; border:none; cursor:pointer; }
  .row { display:flex; gap:10px; }
  .row > * { flex:1; }
  .muted { color:#6b7280; font-size:12px; }
  .ok { color:#065f46; }
  .err { color:#b91c1c; white-space:pre-wrap; }
  .linkbtn { display:inline-block; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; text-decoration:none; }
  code { background:#f3f4f6; padding:2px 6px; border-radius:6px; }
  .addr-list { margin-top: 10px; }
  .addr-item { 
    padding: 8px 12px; 
    border: 1px solid #e5e7eb; 
    border-radius: 6px; 
    margin: 4px 0; 
    cursor: pointer; 
    background: #f9fafb;
    transition: background 0.2s;
  }
  .addr-item:hover { background: #f3f4f6; }
</style>

<h1>AIR TRAVEL – Auth Playground (All-in-one)</h1>
<p class="muted">이 페이지로 가입→이메일 인증(코드)→로그인→/me→비번 재설정→중복확인→구글 로그인→구글 유저 추가입력까지 전부 테스트할 수 있어요.</p>

<!-- 1. 회원가입 -->
<div class="card">
  <h2>1) 회원가입 (/signup)</h2>
  <div class="muted">username은 <b>이메일로부터 자동 생성</b>됩니다. 가입은 <b>이메일 인증 완료 후</b> 실제 계정이 생성됩니다.</div>
  <div class="row">
    <input id="su_name" placeholder="이름" />
    <input id="su_email" placeholder="이메일 (예: test@naver.com)" />
  </div>
  <div class="row">
    <input id="su_pw" placeholder="비밀번호 (Aa123456!)" type="password" />
    <input id="su_pwc" placeholder="비밀번호 확인" type="password" />
  </div>
  <div class="row">
    <input id="su_birth" placeholder="생년월일 (YYYY-MM-DD) 선택/빈값 가능" />
    <input id="su_nick" placeholder="닉네임 (선택)" />
  </div>
  <div class="row">
    <input id="su_phone" placeholder="휴대폰 (선택)" />
    <input id="su_addr" placeholder="주소 (선택)" />
  </div>
  <button onclick="signup()">회원가입</button>
  <div id="su_msg" class="muted"></div>
</div>

<!-- 2. 인증코드 발송 -->
<div class="card">
  <h2>2) 이메일 인증 코드 보내기 (/email/request-verify)</h2>
  <div class="muted">메일 설정 없으면 응답 JSON에 <code>verify_code_dev</code>가 함께 옵니다.</div>
  <input id="vr_email" placeholder="가입 이메일" />
  <button onclick="requestVerify()">인증 코드 보내기</button>
  <div id="vr_msg" class="muted"></div>
</div>

<!-- 3. 코드 입력으로 인증 -->
<div class="card">
  <h2>3) 코드로 인증 완료 (/email/verify/code)</h2>
  <div class="row">
    <input id="vc_email" placeholder="가입 이메일" />
    <input id="vc_code" placeholder="6자리 코드 (예: 123456)" />
  </div>
  <button onclick="verifyCode()">코드로 인증</button>
  <div id="vc_msg" class="muted"></div>
</div>

<!-- 4. 로그인 -->
<div class="card">
  <h2>4) 로그인 (/login)</h2>
  <div class="row">
    <input id="li_email" placeholder="이메일" />
    <input id="li_pw" placeholder="비밀번호" type="password" />
  </div>
  <button onclick="login()">로그인</button>
  <div id="li_msg" class="muted"></div>
</div>

<!-- 5. /me -->
<div class="card">
  <h2>5) 내 정보 (/me)</h2>
  <button onclick="me()">/me 보기</button>
  <pre id="me_out" class="muted"></pre>
</div>

<!-- 6. 비밀번호 재설정 요청 -->
<div class="card">
  <h2>6) 비밀번호 재설정 요청 (/password/request)</h2>
  <input id="pr_email" placeholder="이메일" />
  <button onclick="passwordRequest()">재설정 메일/토큰 요청</button>
  <div id="pr_msg" class="muted"></div>
</div>

<!-- 7. 비밀번호 재설정 -->
<div class="card">
  <h2>7) 비밀번호 재설정 (/password/reset)</h2>
  <div class="row">
    <input id="ps_token" placeholder="reset_token (dev 응답 or 메일 링크)" />
    <input id="ps_pw" placeholder="새 비밀번호" type="password" />
  </div>
  <input id="ps_pwc" placeholder="새 비밀번호 확인" type="password" />
  <button onclick="passwordReset()">비밀번호 재설정</button>
  <div id="ps_msg" class="muted"></div>
</div>

<!-- 8. 중복확인 -->
<div class="card">
  <h2>8) 중복확인</h2>
  <div class="row">
    <input id="ck_email" placeholder="이메일" />
    <input id="ck_username" placeholder="아이디(username)" />
  </div>
  <div class="row">
    <button onclick="checkEmail()">이메일 확인</button>
    <button onclick="checkUsername()">아이디 확인</button>
  </div>
  <div id="ck_msg" class="muted"></div>
</div>

<!-- 8.5. 개발용: 사용자 삭제 -->
<div class="card">
  <h2>8.5) 개발용: 사용자 삭제</h2>
  <div class="muted">테스트를 위해 기존 가입 정보를 삭제합니다.</div>
  <input id="del_email" placeholder="삭제할 이메일" />
  <button onclick="deleteUser()">사용자 삭제</button>
  <div id="del_msg" class="muted"></div>
</div>

<!-- 9. 구글 로그인 & 추가입력 -->
<div class="card">
  <h2>9) 구글 로그인</h2>
  <a class="linkbtn" href="/auth/google/login">🔵 Google로 로그인</a>
  <div class="muted">로그인 성공 시 프론트로 리다이렉트되고, HttpOnly 쿠키에 토큰이 저장됩니다.</div>
</div>

<div class="card">
  <h2>10) 구글 유저 추가입력 (/profile/complete)</h2>
  <div class="muted">로그인해서 토큰을 얻은 뒤에 호출하세요. (헤더 또는 쿠키)</div>
  
  <!-- 내 위치 자동 입력 섹션 -->
  <div class="muted">내 위치 자동 입력 (GPS 사용)</div>
  <div class="row">
    <button onclick="getMyLocation()" style="width: auto; flex: 0 0 auto; background: #3b82f6;">📍 내 위치 가져오기</button>
  </div>
  <div id="location_result" class="muted"></div>
  
  <div class="row">
    <input id="pc_addr" placeholder="주소(선택)" />
    <input id="pc_phone" placeholder="휴대폰(선택)" />
  </div>
  <div class="row">
    <input id="pc_gender" placeholder="성별(선택)" />
    <input id="pc_mbti" placeholder="MBTI(선택)" />
  </div>
  <input id="pc_birth" placeholder="생년월일 YYYY-MM-DD (선택)" />
  <button onclick="profileComplete()">추가입력 저장</button>
  <div id="pc_msg" class="muted"></div>
</div>

<script>
let accessToken = null;

// 해시(#access_token=...)로 토큰 전달되면 자동 저장(콜백을 /play로 리다이렉트한 경우)
(function() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('access_token')) {
    accessToken = h.get('access_token');
    byId('li_msg').innerHTML = '<span class="ok">콜백에서 토큰 수신</span>';
  }
})();

async function signup() {
  const body = {
    name: byId('su_name').value,
    email: byId('su_email').value,
    password: byId('su_pw').value,
    password_confirm: byId('su_pwc').value,
    birthdate: byId('su_birth').value || null,
    nickname: byId('su_nick').value || null,
    phone: byId('su_phone').value || null,
    address: byId('su_addr').value || null
  };
  const r = await fetch('/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const t = await r.json();
  if (r.ok) {
    byId('su_msg').innerHTML = '<span class="ok">가입 요청 완료. 이메일 인증이 필요합니다.</span>';
    byId('vr_email').value = body.email;
    byId('vc_email').value = body.email;
    byId('li_email').value = body.email;
    byId('pr_email').value = body.email;
  } else {
    byId('su_msg').innerHTML = '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
  }
}

async function requestVerify() {
  const body = { email: byId('vr_email').value };
  const r = await fetch('/email/request-verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const t = await r.json();
  if (r.ok) {
    byId('vr_msg').innerHTML = '<span class="ok">코드 전송됨.</span>';
    if (t.verify_code_dev) {
      byId('vr_msg').innerHTML += ' dev code: <b>' + t.verify_code_dev + '</b>';
      byId('vc_code').value = t.verify_code_dev;
    }
  } else {
    byId('vr_msg').innerHTML = '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
  }
}

async function verifyCode() {
  const body = { email: byId('vc_email').value, code: byId('vc_code').value };
  const r = await fetch('/email/verify/code', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const t = await r.json();
  byId('vc_msg').innerHTML = r.ok ? '<span class="ok">인증 완료!</span>' : '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
}

async function login() {
  const body = { email: byId('li_email').value, password: byId('li_pw').value };
  const r = await fetch('/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const t = await r.json();
  if (r.ok) {
    accessToken = t.access_token;
    byId('li_msg').innerHTML = '<span class="ok">로그인 성공. 토큰 저장됨.</span>';
  } else {
    byId('li_msg').innerHTML = '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
  }
}

async function me() {
  const r = await fetch('/me', { headers: accessToken ? { 'Authorization':'Bearer '+accessToken } : {} });
  const t = await r.json();
  byId('me_out').textContent = r.ok ? JSON.stringify(t, null, 2) : (t.detail||JSON.stringify(t));
}

async function passwordRequest() {
  const body = { email: byId('pr_email').value };
  const r = await fetch('/password/request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const t = await r.json();
  if (r.ok) {
    byId('pr_msg').innerHTML = '<span class="ok">재설정 토큰 발급됨.</span>';
    if (t.reset_token_dev) {
      byId('pr_msg').innerHTML += ' reset_token_dev: <b>' + t.reset_token_dev + '</b>';
      byId('ps_token').value = t.reset_token_dev;
    }
  } else {
    byId('pr_msg').innerHTML = '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
  }
}

async function passwordReset() {
  const body = {
    token: byId('ps_token').value,
    new_password: byId('ps_pw').value,
    new_password_confirm: byId('ps_pwc').value
  };
  const r = await fetch('/password/reset', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const t = await r.json();
  byId('ps_msg').innerHTML = r.ok ? '<span class="ok">비밀번호 변경 완료!</span>' : '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
}

async function checkEmail() {
  const email = byId('ck_email').value;
  const r = await fetch('/check/email?email='+encodeURIComponent(email));
  const t = await r.json();
  byId('ck_msg').innerHTML = r.ok ? ('이메일 사용 가능 여부: <b>'+t.available+'</b>') : '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
}

async function checkUsername() {
  const u = byId('ck_username').value;
  const r = await fetch('/check/username?username='+encodeURIComponent(u));
  const t = await r.json();
  byId('ck_msg').innerHTML = r.ok ? ('아이디 사용 가능 여부: <b>'+t.available+'</b>') : '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
}

async function profileComplete() {
  const body = {
    address: byId('pc_addr').value || null,
    phone: byId('pc_phone').value || null,
    gender: byId('pc_gender').value || null,
    mbti: byId('pc_mbti').value || null,
    birthdate: byId('pc_birth').value || null,
  };
  const r = await fetch('/profile/complete', {
    method:'POST',
    headers: Object.assign({ 'Content-Type':'application/json' }, accessToken ? { 'Authorization':'Bearer '+accessToken } : {}),
    body: JSON.stringify(body)
  });
  const t = await r.json();
  byId('pc_msg').innerHTML = r.ok ? '<span class="ok">프로필 저장 완료!</span>' : '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
}

async function deleteUser() {
  const email = byId('del_email').value;
  const r = await fetch('/dev/delete-user?email='+encodeURIComponent(email), {
    method: 'POST'
  });
  const t = await r.json();
  byId('del_msg').innerHTML = r.ok ? '<span class="ok">사용자 삭제 완료.</span>' : '<span class="err">'+(t.detail||JSON.stringify(t))+'</span>';
}

async function getMyLocation() {
  byId('location_result').innerHTML = '<span class="muted">위치 정보 가져오는 중...</span>';
  
  if (!navigator.geolocation) {
    byId('location_result').innerHTML = '<span class="err">이 브라우저는 위치 정보를 지원하지 않습니다.</span>';
    return;
  }
  
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
    
    const { latitude, longitude } = position.coords;
    byId('location_result').innerHTML = `<span class="ok">위치 확인됨: ${latitude}, ${longitude}</span>`;
    
    // 좌표를 주소로 변환 (카카오 API 사용)
    const r = await fetch(`/geocode/reverse?lat=${latitude}&lon=${longitude}`);
    const t = await r.json();
    
    if (r.ok && t.address && !t.address.startsWith('위치:')) {
      // 실제 주소가 있는 경우
      byId('pc_addr').value = t.address;
      byId('location_result').innerHTML = `<span class="ok">주소 자동 입력 완료: ${t.address}</span>`;
    } else if (r.ok && t.raw && t.raw.documents && t.raw.documents[0] && t.raw.documents[0].address) {
      // raw 데이터에서 주소 추출
      const address = t.raw.documents[0].address.address_name;
      byId('pc_addr').value = address;
      byId('location_result').innerHTML = `<span class="ok">주소 자동 입력 완료: ${address}</span>`;
    } else {
      byId('location_result').innerHTML = `<span class="ok">위치: ${latitude}, ${longitude} (주소 변환 실패)</span>`;
    }
    
  } catch (error) {
    byId('location_result').innerHTML = `<span class="err">위치 정보 가져오기 실패: ${error.message}</span>`;
  }
}

function byId(id){ return document.getElementById(id); }
</script>
</html>
"""