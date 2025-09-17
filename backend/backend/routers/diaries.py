from fastapi import APIRouter, Depends, UploadFile, File, Request, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from datetime import date, datetime
import os, uuid, shutil, requests
import openai
from openai import AzureOpenAI
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

router = APIRouter(prefix="/api/diaries", tags=["diaries"])

def build_abs_url(request: Request, rel_path: str) -> str:
    """상대 경로를 절대 URL로 변환"""
    return f"{request.url.scheme}://{request.url.netloc}/media/{rel_path}"

async def save_image_permanently(dalle_url: str) -> str:
    """DALL-E 3 이미지를 로컬에 영구 저장"""
    try:
        # 1. DALL-E 이미지 다운로드
        print(f"이미지 다운로드 시작: {dalle_url}")
        response = requests.get(dalle_url, timeout=30)
        response.raise_for_status()
        
        # 2. 로컬에 저장할 경로 생성
        filename = f"ai_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.png"
        filepath = f"media/uploads/{filename}"
        
        # 3. 디렉토리 생성
        os.makedirs("media/uploads", exist_ok=True)
        
        # 4. 파일 저장
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"이미지 영구 저장 완료: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"이미지 영구 저장 실패: {e}")
        raise e

def to_human(d: date) -> str:
    wd = ["월","화","수","목","금","토","일"][d.weekday()]
    return f"{d.year}년 {d.month}월 {d.day}일 {wd}요일"

def build_abs_url(request: Request, rel_path: str) -> str:
    base = str(request.base_url).rstrip("/")
    if rel_path.startswith("/"):
        return base + rel_path
    return base + "/" + rel_path

@router.get("", response_model=dict)
def list_diaries(request: Request, db: Session = Depends(get_db)):
    q = db.query(models.DiaryEntry).order_by(models.DiaryEntry.date_iso.desc(), models.DiaryEntry.created_at.desc())
    items = []
    for row in q.all():
        thumb = None
        if row.photo_path:
            thumb = build_abs_url(request, row.photo_path)
        elif row.ai_image_url:
            # ai_image_url이 로컬 경로인지 URL인지 확인
            if row.ai_image_url.startswith('http'):
                thumb = row.ai_image_url  # 외부 URL (임시 DALL-E URL)
            else:
                thumb = build_abs_url(request, row.ai_image_url)  # 로컬 경로
        items.append({
            "id": row.id,
            "title": row.title,
            "content": row.content,
            "date_iso": row.date_iso.isoformat(),
            "date_human": to_human(row.date_iso),
            "thumbnail_url": thumb
        })
    return {"items": items}

@router.post("")
async def create_diary(request: Request, db: Session = Depends(get_db), file: UploadFile | None = File(default=None, alias="photo")):
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        title = (form.get("title") or "").strip()
        content = (form.get("content") or "").strip()
        date_iso_raw = (form.get("date_iso") or "").strip()
        if not (title and content and date_iso_raw):
            raise HTTPException(status_code=400, detail="missing fields")
        d = date.fromisoformat(date_iso_raw)

        photo = form.get("photo")
        saved_rel = None
        if photo and isinstance(photo, UploadFile):
            ext = os.path.splitext(photo.filename or "")[1] or ".jpg"
            fname = f"{uuid.uuid4().hex}{ext}"
            upload_dir = "media/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            dst_path = os.path.join(upload_dir, fname)
            with open(dst_path, "wb") as f:
                shutil.copyfileobj(photo.file, f)
            saved_rel = f"/{dst_path.replace(os.sep, '/')}"

        row = models.DiaryEntry(
            title=title, content=content, date_iso=d, photo_path=saved_rel, ai_image_url=None
        )
        db.add(row); db.commit(); db.refresh(row)
        return {"id": row.id}

    # JSON
    data = await request.json()
    print(f"DEBUG - 받은 JSON 데이터: {data}")  # 디버그 로그
    try:
        dto = schemas.DiaryCreateText(**data)
        print(f"DEBUG - 파싱된 DTO: title={dto.title}, content={dto.content}, date_iso={dto.date_iso}, ai_image_url={dto.ai_image_url}")  # 디버그 로그
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid json: {e}")

    row = models.DiaryEntry(
        title=dto.title,
        content=dto.content,
        date_iso=dto.date_iso,
        ai_image_url=dto.ai_image_url,
        photo_path=None
    )
    print(f"DEBUG - 저장할 데이터: ai_image_url={row.ai_image_url}")  # 디버그 로그
    db.add(row); db.commit(); db.refresh(row)
    print(f"DEBUG - 저장 완료: ID={row.id}, ai_image_url={row.ai_image_url}")  # 디버그 로그
    return {"id": row.id}

@router.post("/generate-image")
async def generate_image(payload: dict, request: Request):
    title = (payload.get("title") or "").strip()
    content = (payload.get("content") or "").strip()
    
    if not title and not content:
        raise HTTPException(status_code=400, detail="제목 또는 내용이 필요합니다")
    
    try:
        # Azure OpenAI 클라이언트 설정
        client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        
        # 일기 내용을 바탕으로 프롬프트 생성
        text = f"{title} {content}".lower()
        
        # 시간/분위기 감지
        time_of_day = "daytime"
        if any(word in text for word in ['저녁', '밤', '야간']):
            time_of_day = "evening"
        elif any(word in text for word in ['새벽', '아침']):
            time_of_day = "morning"
        
        # 활동/감정 감지
        activity = ""
        if any(word in text for word in ['놀다', '놀이', '즐기다', '재미']):
            activity = "people enjoying and having fun"
        elif any(word in text for word in ['걷다', '산책', '걸어']):
            activity = "people walking and exploring"
        elif any(word in text for word in ['먹다', '식사', '맛집']):
            activity = "people dining and eating"
        
        # 그림체 스타일 감지
        art_style = "diary illustration style"
        if any(word in text for word in ['수채화', '수채', 'watercolor', '그림체', '그림', '일러스트', '감성', '따뜻한']):
            art_style = "watercolor illustration, warm colors, emotional art style, soft brushstrokes"
        
        # 간단하고 명확한 프롬프트 생성
        prompt = f"Beautiful {time_of_day} scene: {title}. {content}. {activity}. Peaceful atmosphere, {art_style}."
        
        print(f"DEBUG - Original: {title} | {content}")
        print(f"DEBUG - Generated prompt: {prompt}")
        
        # DALL-E 3로 이미지 생성
        response = client.images.generate(
            model=os.getenv("AZURE_DALL_E_DEPLOYMENT_NAME", "team2-dall-e-3"),
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )
        
        image_url = response.data[0].url
        
        # 🔥 새로 추가: 영구 저장소로 복사
        try:
            permanent_path = await save_image_permanently(image_url)
            print(f"영구 저장 완료: {permanent_path}")
            # 절대 URL로 변환
            absolute_url = build_abs_url(request, permanent_path)
            print(f"절대 URL 변환: {absolute_url}")
            return {"image_url": absolute_url}  # 절대 URL 반환
        except Exception as save_error:
            print(f"영구 저장 실패, 임시 URL 사용: {save_error}")
            return {"image_url": image_url}  # 임시 URL 사용
        
    except Exception as e:
        print(f"DALL-E 3 API 오류: {str(e)}")
        # 오류 발생 시 fallback으로 기존 방식 사용
        seed = (title or content or "diary").replace(" ", "+")[:50]
        fallback_url = f"https://picsum.photos/seed/{seed}/800/600"
        return {"image_url": fallback_url}

@router.delete("/{diary_id}")
def delete_diary(diary_id: str, db: Session = Depends(get_db)):
    """일기 삭제"""
    try:
        # 1. DB에서 일기 찾기
        diary = db.query(models.DiaryEntry).filter(models.DiaryEntry.id == diary_id).first()
        if not diary:
            raise HTTPException(status_code=404, detail="일기를 찾을 수 없습니다")
        
        # 2. 연결된 파일들 삭제 (선택사항)
        try:
            if diary.ai_image_url and not diary.ai_image_url.startswith('http'):
                # 로컬 AI 이미지 파일 삭제
                if os.path.exists(diary.ai_image_url):
                    os.remove(diary.ai_image_url)
                    print(f"AI 이미지 파일 삭제: {diary.ai_image_url}")
            
            if diary.photo_path:
                # 업로드된 사진 파일 삭제
                if os.path.exists(diary.photo_path):
                    os.remove(diary.photo_path)
                    print(f"사진 파일 삭제: {diary.photo_path}")
        except Exception as file_error:
            print(f"파일 삭제 중 오류 (무시됨): {file_error}")
        
        # 3. DB에서 일기 삭제
        db.delete(diary)
        db.commit()
        
        print(f"일기 삭제 완료: ID={diary_id}")
        return {"message": "일기가 성공적으로 삭제되었습니다"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"일기 삭제 중 오류: {e}")
        raise HTTPException(status_code=500, detail="일기 삭제 중 오류가 발생했습니다")
