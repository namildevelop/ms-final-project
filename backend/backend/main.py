from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine
from .routers import diaries
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Diary API")

# CORS (dev: * ; prod: set from env)
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media
os.makedirs("media/uploads", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Routes
app.include_router(diaries.router)

@app.get("/health")
def health():
    return {"status": "ok"}
