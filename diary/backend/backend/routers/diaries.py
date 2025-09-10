from fastapi import APIRouter, Depends, UploadFile, File, Request, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from datetime import date
import os, uuid, shutil

router = APIRouter(prefix="/api/diaries", tags=["diaries"])

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
            thumb = row.ai_image_url
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
    try:
        dto = schemas.DiaryCreateText(**data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid json: {e}")

    row = models.DiaryEntry(
        title=dto.title,
        content=dto.content,
        date_iso=dto.date_iso,
        ai_image_url=dto.ai_image_url,
        photo_path=None
    )
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id}

@router.post("/generate-image")
async def generate_image(payload: dict):
    title = (payload.get("title") or "").strip()
    content = (payload.get("content") or "").strip()
    seed = (title or content or "diary").replace(" ", "+")[:50]
    url = f"https://picsum.photos/seed/{seed}/800/600"
    return {"image_url": url}
