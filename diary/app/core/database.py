import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from app.core.config import settings

# 1) 환경 변수 로드
# BASE_DIR: 프로젝트 루트(app 기준 상위 3단계)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

# 2) DB URL 가져오기 (환경 설정 → 없으면 SQLite로 fallback)
DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL:
    # DATABASE_URL이 설정되지 않았다면 SQLite 사용
    sqlite_path = BASE_DIR / "app.db"
    DATABASE_URL = f"sqlite:///{sqlite_path}"

# 3) SQLAlchemy 엔진/세션 생성
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)# SQLite는 멀티스레드 기본 제한 → 예외 설정 필요

# 세션팩토리: 요청마다 DB 세션을 새로 만들어서 사용
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# ORM 모델이 상속할 Base 클래스 (테이블 매핑용)
Base = declarative_base()
# 4) DB 세션 의존성 (FastAPI Depends에서 사용)
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
