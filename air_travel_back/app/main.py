from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.database import Base, engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"/openapi.json"
)

# CORS Configuration
origins = [
    "http://localhost",
    "http://localhost:8081", # Default Expo web port
    "http://localhost:19006", # Another common Expo web port
    "http://localhost:19000", # Another common Expo web port
    # Add any other origins where your frontend might be running
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/v1")

# Create database tables
Base.metadata.create_all(bind=engine)