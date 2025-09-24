

## 📂 프로젝트 구조

### 1. 백엔드 (FastAPI)

- **AI 데이터 (`air_travel_back/ai_data/`)**
  - `index.faiss` → FAISS 벡터 인덱스
  - `meta_baked.json` → 메타데이터
  - `yolov8n.pt` → YOLOv8 모델
  - 서울 관광지 이미지 (광화문, 세종대왕, 이순신, 교보생명)

- **AI 모델 (`air_travel_back/app/ai_models/`)**
  - `clip_model.py` → CLIP 모델 래퍼
  - `yolo_model.py` → YOLO 모델 래퍼
  - `label_mapping.py` → 라벨 매핑

- **AI 서비스 (`air_travel_back/app/ai_services/`)**
  - `detection_service.py` → YOLO 기반 객체 탐지
  - `rag_service.py` → RAG (Retrieval-Augmented Generation)
  - `tts_service.py` → Azure Speech TTS

- **API 엔드포인트**
  - `app/api/v1/endpoints/ai_analysis.py` → AI 분석 API

- **설정**
  - `app/core/config.py` → AI 모델 경로 설정
  - `app/api/v1/api.py` → AI 분석 라우터 등록

---

### 2. 프론트엔드 (React Native + Expo)

- **AI 카메라 화면**
  - `frontend/app/ai-camera/index.tsx` → 카메라 기반 AI 분석 메인 화면

- **홈 화면 수정**
  - `frontend/app/(tabs)/index.tsx` → AR 아이콘 버튼 추가

- **설정**
  - `frontend/app.config.js` → 환경 변수 설정

---

## 📦 의존성 패키지

### 백엔드
- `torch` → PyTorch (CLIP 실행)
- `clip-by-openai` → OpenAI CLIP 모델
- `faiss-cpu` → FAISS 벡터 검색
- `azure-cognitiveservices-speech` → Azure Speech TTS

### 프론트엔드
- `expo-camera` → 카메라 기능
- `expo-location` → GPS 위치
- `expo-speech` → TTS 음성 출력

---

## 🔑 환경 변수 (.env)

```env
AZURE_OPENAI_API_KEY=   # Azure OpenAI API 키
AZURE_SEARCH_ENDPOINT=  # Azure Search 엔드포인트
AZURE_SPEECH_KEY=       # Azure Speech 키
FAISS_INDEX_PATH=       # FAISS 인덱스 경로 (예: ./ai_data/index.faiss)
META_DATA_PATH=         # 메타데이터 경로 (예: ./ai_data/meta_baked.json)
