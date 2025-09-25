from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.models import DiaryEntry
from app.schemas.diary import DiaryCreate


def create_diary_entry(db: Session, diary_data: DiaryCreate, creator_id: int, photo_path: Optional[str] = None, ai_image_url: Optional[str] = None) -> DiaryEntry:
    db_diary = DiaryEntry(
        **diary_data.model_dump(),
        creator_id=creator_id,
        photo_path=photo_path,
        ai_image_url=ai_image_url
    )
    db.add(db_diary)
    db.commit()
    db.refresh(db_diary)
    return db_diary

def get_diary_entry(db: Session, diary_id: int, creator_id: int) -> Optional[DiaryEntry]:
    return db.query(DiaryEntry).filter(DiaryEntry.id == diary_id, DiaryEntry.creator_id == creator_id).first()

def get_diaries_by_user(db: Session, creator_id: int) -> List[DiaryEntry]:
    return db.query(DiaryEntry).filter(DiaryEntry.creator_id == creator_id).order_by(DiaryEntry.date.desc()).all()

def delete_diary_entry(db: Session, diary_id: int, creator_id: int) -> bool:
    db_diary = get_diary_entry(db, diary_id=diary_id, creator_id=creator_id)
    if not db_diary:
        return False
    db.delete(db_diary)
    db.commit()
    return True
