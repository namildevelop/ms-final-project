# Diary App Backend (FastAPI + PostgreSQL)

프론트의 흐름(목록 → 작성 → [AI 이미지 생성 또는 사진추가] → 저장)에 맞춘 최소 동작 백엔드입니다.

## 1) 설치

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # 또는 직접 .env 생성
```

## 2) PostgreSQL 초기화 (예시)

```sql
CREATE DATABASE diary ENCODING 'UTF8';
CREATE USER diary_user WITH PASSWORD 'StrongPassword!123';
ALTER DATABASE diary OWNER TO diary_user;
GRANT ALL ON SCHEMA public TO diary_user;
```

`.env`의 `DATABASE_URL`을 DB 설정에 맞게 수정하세요.

## 3) 실행

```bash
uvicorn backend.main:app --reload --port 8000
```

- 업로드 파일은 `media/uploads/`에 저장되고, `/media/...` 경로로 접근 가능합니다.
- 프론트 `.env` 예시: `EXPO_PUBLIC_API_BASE=http://127.0.0.1:8000`

## 4) 엔드포인트

- `GET /api/diaries` — 목록
- `POST /api/diaries` — 저장
  - `multipart/form-data` (필드: `title`, `content`, `date_iso`, `photo`) 또는
  - `application/json` (`{title, content, date_iso, ai_image_url?}`)
- `POST /api/diaries/generate-image` — 제목/내용 기반 AI 이미지 URL 생성(현재 placeholder: picsum.photos)

## 5) 프론트 패치

`frontend-patches/diary/index.tsx`, `frontend-patches/diary/write.tsx` 파일을
프로젝트의 `/app/diary/` 경로(또는 네가 사용하는 경로)에 덮어쓰기 하세요.
