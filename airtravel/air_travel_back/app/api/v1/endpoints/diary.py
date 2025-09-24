from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil
import requests
# from openai import AzureOpenAI # Removed as it's now in the service layer
from datetime import date

from app.db.database import get_db
from app.api.deps import get_current_user
from app.db.models import User, DiaryEntry
from app.schemas.diary import Diary, DiaryCreate, DiaryImageRequest
from app.crud import diary as crud_diary
from app.core.config import settings
from app.services import openai as openai_service # Added import for the service

router = APIRouter()

UPLOAD_DIR = "uploads/diary_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def build_abs_url(request: Request, rel_path: str) -> str:
    """Converts a relative path to an absolute URL based on server settings."""
    if not rel_path.startswith('/'):
        rel_path = '/' + rel_path
    return str(request.base_url).rstrip('/') + rel_path

async def save_image_permanently(dalle_url: str) -> str:
    """Downloads an image from a URL and saves it to a permanent local directory."""
    try:
        print(f"DEBUG: save_image_permanently - Starting download from: {dalle_url}")
        response = requests.get(dalle_url, timeout=90, stream=True) # Use stream=True for large files
        response.raise_for_status()
        print("DEBUG: save_image_permanently - Download response received, status OK.")
        
        filename = f"ai_image_{uuid.uuid4().hex[:12]}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        print(f"DEBUG: save_image_permanently - Saving to: {filepath}")
        
        with open(filepath, 'wb') as f:
            shutil.copyfileobj(response.raw, f) # This writes the file
        print("DEBUG: save_image_permanently - File writing complete.")
        
        return filepath # This returns the path
        
    except Exception as e:
        print(f"ERROR: save_image_permanently - Failed to save image permanently: {e}")
        raise e

@router.get("", response_model=List[Diary])
def list_diaries(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all diary entries for the current user."""
    db_diaries = crud_diary.get_diaries_by_user(db, creator_id=current_user.id)
    
    response_diaries = []
    for diary in db_diaries:
        diary_data = Diary.model_validate(diary)
        if diary.photo_path:
            diary_data.photo_path = build_abs_url(request, diary.photo_path)
        if diary.ai_image_url:
            if diary.ai_image_url.startswith('http'):
                diary_data.ai_image_url = diary.ai_image_url
            else:
                diary_data.ai_image_url = build_abs_url(request, diary.ai_image_url)
        response_diaries.append(diary_data)

    return response_diaries

@router.post("", response_model=Diary, status_code=status.HTTP_201_CREATED)
async def create_diary_entry(
    request: Request,
    title: str = File(...),
    content: str = File(...),
    date_str: str = File(...),
    ai_image_url: Optional[str] = File(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new diary entry, handling photo upload or an AI image URL."""
    photo_path = None
    if photo:
        ext = os.path.splitext(photo.filename or "")[1] or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_path = file_path

    try:
        parsed_date = date.fromisoformat(date_str)
        diary_data = DiaryCreate(title=title, content=content, date=parsed_date)
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Invalid date format. Please use YYYY-MM-DD.")

    # If an AI image URL is provided, it's already permanently saved by /generate-image endpoint.
    # So, we directly use the provided ai_image_url.
    final_ai_url = ai_image_url

    db_diary = crud_diary.create_diary_entry(
        db=db, 
        diary_data=diary_data, 
        creator_id=current_user.id, 
        photo_path=photo_path,
        ai_image_url=final_ai_url
    )
    
    # Re-fetch to construct response with absolute URLs
    response_diary = Diary.model_validate(db_diary)
    if response_diary.photo_path:
        response_diary.photo_path = build_abs_url(request, response_diary.photo_path)
    if response_diary.ai_image_url and not response_diary.ai_image_url.startswith('http'):
        response_diary.ai_image_url = build_abs_url(request, response_diary.ai_image_url)
        
    return response_diary


@router.post("/generate-image", status_code=status.HTTP_200_OK)
async def generate_ai_image(payload: DiaryImageRequest, request: Request):
    """Generates an image using Azure DALL-E 3 based on diary content."""
    try:
        print(f"DEBUG: generate_ai_image endpoint received payload: {payload.model_dump_json()}")
        # Call the service to get the temporary image URL
        temp_image_url = openai_service.generate_diary_image_url(
            title=payload.title, 
            content=payload.content
        )
        print(f"DEBUG: Service returned temporary image URL: {temp_image_url}")
        
        # Save the image locally and get its path
        permanent_path = await save_image_permanently(temp_image_url)
        print(f"DEBUG: Image permanently saved to: {permanent_path}")
        
        # Return the absolute URL for the client to use
        absolute_url = build_abs_url(request, permanent_path)
        print(f"DEBUG: Absolute URL for client: {absolute_url}")
        
        return {"image_url": absolute_url}

    except ValueError as e: # Catch specific error from the service
        print(f"ERROR: generate_ai_image endpoint caught ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"ERROR: generate_ai_image endpoint caught unexpected Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a diary entry."""
    db_diary = crud_diary.get_diary_entry(db, diary_id=diary_id, creator_id=current_user.id)
    if not db_diary:
        raise HTTPException(status_code=404, detail="Diary entry not found")

    if db_diary.photo_path and os.path.exists(db_diary.photo_path):
        os.remove(db_diary.photo_path)
    
    if db_diary.ai_image_url and not db_diary.ai_image_url.startswith('http') and os.path.exists(db_diary.ai_image_url):
        os.remove(db_diary.ai_image_url)

    crud_diary.delete_diary_entry(db, diary_id=diary_id, creator_id=current_user.id)
    return