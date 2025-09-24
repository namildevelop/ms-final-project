"""
AI Analysis endpoints for place recognition and scene analysis.
"""
import base64
import io
import uuid
from typing import Optional, List, Dict, Any
from PIL import Image
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.api.deps import get_current_user
from app.db.models import User
from app.ai_services import DetectionService, RAGService, TTSService
from app.ai_models import normalize_label

router = APIRouter()

# Initialize AI services
detection_service = DetectionService()
rag_service = RAGService()
tts_service = TTSService()

class DetectionResult(BaseModel):
    """Represents a single detection returned to the client."""
    id: str
    label: str
    description: str
    bbox: List[float]  # Normalised [x, y, width, height] relative to the image
    audio_url: Optional[str] = None
    confidence: Optional[float] = None

class AnalyzeRequest(BaseModel):
    """Request body for base64 image analysis."""
    image: str = Field(..., description="Base64-encoded JPEG frame from the camera")
    latitude: Optional[float] = Field(None, description="GPS latitude coordinate")
    longitude: Optional[float] = Field(None, description="GPS longitude coordinate")
    trip_id: Optional[int] = Field(None, description="Associated trip ID")

@router.get("/health")
def ai_health_check():
    """Health check endpoint for AI services."""
    return {
        "status": "ok",
        "services": {
            "detection": detection_service is not None,
            "rag": rag_service is not None,
            "tts": tts_service is not None
        }
    }

@router.post("/analyze-base64", response_model=Dict[str, Any])
async def analyze_base64_image(
    req: AnalyzeRequest
    # current_user: User = Depends(get_current_user)  # 임시로 인증 비활성화
):
    """Analyze base64-encoded image for objects and scenes."""
    try:
        # Decode base64 image
        image_data = base64.b64decode(req.image)
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 디코딩 실패: {e}")

    # Run AI analysis
    detections_data = detection_service.detect_objects_and_scenes(
        pil_image, req.latitude, req.longitude
    )

    # Process results with RAG and TTS
    detections: List[DetectionResult] = []

    for det in detections_data:
        raw_label = det["label"]
        ko_label, aliases = normalize_label(raw_label)

        # Generate description using RAG
        desc = rag_service.summarize(ko_label, aliases) or det.get("description") or ko_label
        
        # Generate audio using TTS
        audio = tts_service.generate_audio(desc)

        detections.append(DetectionResult(
            id=det["id"],
            label=ko_label,
            description=desc,
            bbox=det["bbox"],
            audio_url=audio,
            confidence=det.get("confidence")
        ))

    return {
        "detections": [d.dict() for d in detections],
        "trip_id": req.trip_id,
        "user_id": 1  # 임시로 고정값 사용
    }

@router.post("/analyze-upload", response_model=Dict[str, Any])
async def analyze_uploaded_image(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    trip_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Analyze uploaded image file for objects and scenes."""
    try:
        # Read and convert uploaded image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 처리 실패: {e}")

    # Run AI analysis
    detections_data = detection_service.detect_objects_and_scenes(
        pil_image, latitude, longitude
    )

    # Process results
    detections: List[DetectionResult] = []

    for det in detections_data:
        raw_label = det["label"]
        ko_label, aliases = normalize_label(raw_label)

        # Generate description using RAG
        desc = rag_service.summarize(ko_label, aliases) or det.get("description") or ko_label
        
        # Generate audio using TTS
        audio = tts_service.generate_audio(desc)

        detections.append(DetectionResult(
            id=det["id"],
            label=ko_label,
            description=desc,
            bbox=det["bbox"],
            audio_url=audio,
            confidence=det.get("confidence")
        ))

    return {
        "detections": [d.dict() for d in detections],
        "trip_id": trip_id,
        "user_id": current_user.id
    }

@router.get("/place-info/{place_name}")
async def get_place_information(
    place_name: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific place."""
    try:
        # Generate description using RAG
        description = rag_service.summarize(place_name)
        
        # Generate audio using TTS
        audio_url = tts_service.generate_audio(description) if description else None

        return {
            "place_name": place_name,
            "description": description,
            "audio_url": audio_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"장소 정보 조회 실패: {e}")
