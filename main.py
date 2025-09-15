from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

# Import routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.email import router as email_router
from app.api.geocode import router as geocode_router

# Import core components
from app.core.database import Base, engine
from app.core.config import settings
from app.core.migrations import run_migrations

# Create FastAPI app
app = FastAPI(title="AIR TRAVEL")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",      # Expo 개발 서버
        "http://127.0.0.1:8081",     # Expo 개발 서버
        "http://localhost:19006",     # Expo Go 앱
        "http://127.0.0.1:19006",    # Expo Go 앱
        "exp://localhost:8081",       # Expo 개발 서버 (스키마)
        "exp://127.0.0.1:8081",      # Expo 개발 서버 (스키마)
        "http://localhost:3000",      # 기존 웹 (필요시)
        "http://127.0.0.1:3000",     # 기존 웹 (필요시)
        "*",                          # 개발용 - 모든 origin 허용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware
app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SESSION_SECRET
)

# Health check
@app.get("/health")
def health():
    return {"ok": True}

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "AIR TRAVEL Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Include all routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(email_router)
app.include_router(geocode_router)

# Legacy endpoints for backward compatibility
@app.post("/signup")
async def legacy_signup():
    """Legacy signup endpoint - use /auth/signup instead"""
    return {"message": "Use /auth/signup instead"}

@app.post("/login")
async def legacy_login():
    """Legacy login endpoint - use /auth/login instead"""
    return {"message": "Use /auth/login instead"}

@app.post("/email/request-verify")
async def legacy_email_request():
    """Legacy email request endpoint - use /email/request-verify instead"""
    return {"message": "Use /email/request-verify instead"}

@app.post("/email/verify/code")
async def legacy_email_verify():
    """Legacy email verify endpoint - use /email/verify/code instead"""
    return {"message": "Use /email/verify/code instead"}

@app.post("/profile/complete")
async def legacy_profile_complete():
    """Legacy profile complete endpoint - use /users/profile/complete instead"""
    return {"message": "Use /users/profile/complete instead"}

@app.get("/me")
async def legacy_me():
    """Legacy me endpoint - use /users/me instead"""
    return {"message": "Use /users/me instead"}

@app.get("/check/email")
async def legacy_check_email():
    """Legacy check email endpoint - use /users/check/email instead"""
    return {"message": "Use /users/check/email instead"}

@app.get("/check/username")
async def legacy_check_username():
    """Legacy check username endpoint - use /users/check/username instead"""
    return {"message": "Use /users/check/username instead"}

# Database initialization
@app.on_event("startup")
async def startup_event():
    """앱 시작 시 데이터베이스 테이블 생성 및 마이그레이션"""
    try:
        # 1. 먼저 테이블 생성 (SQLAlchemy가 모델 기반으로 생성)
        Base.metadata.create_all(bind=engine)
        print("✅ 데이터베이스 테이블 생성 완료")
        
        # 2. 그 다음 마이그레이션 실행 (누락된 컬럼 추가 등)
        run_migrations()
        
    except Exception as e:
        print(f"⚠️ 데이터베이스 초기화 실패: {e}")
        # 데이터베이스 초기화 실패해도 앱은 계속 실행

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
