##  백엔드 AI 모델 파일들
air_travel_back/app/ai_models/
├── init.py
├── clip_model.py # CLIP 모델 (장소 인식)
├── yolo_model.py # YOLO 모델 (객체 탐지)
└── label_mapping.py # 라벨 매핑

shell
코드 복사

##  백엔드 AI 서비스 파일들
air_travel_back/app/ai_services/
├── init.py
├── detection_service.py # YOLO + CLIP 통합 서비스
├── rag_service.py # RAG 기반 설명 생성
└── tts_service.py # TTS 음성 안내

shell
코드 복사

##  백엔드 API 엔드포인트
air_travel_back/app/api/v1/endpoints/
└── ai_analysis.py # AI 분석 API 엔드포인트

shell
코드 복사

##  프론트엔드 AI 카메라 화면
frontend/rn-app/app/ai-camera/
└── index.tsx # AI 카메라 UI 컴포넌트

shell
코드 복사

##  AI 데이터 파일들
air_travel_back/ai_data/
├── index.faiss # FAISS 벡터 인덱스
├── meta_baked.json # 메타데이터 (베이킹된)
├── meta.json # 원본 메타데이터
└── [여러 이미지 파일들] # 훈련용 이미지들

yaml
코드 복사

---

##  수정 파일

###  백엔드 설정 파일
air_travel_back/app/core/config.py

vbnet
코드 복사

추가된 설정들:
```python
AI_MODELS_DIR: str = "ai_data 경로"
FAISS_INDEX_PATH: str = "FAISS 인덱스 경로"
META_DATA_PATH: str = "메타데이터 경로"
YOLO_MODEL_PATH: str = "YOLO 모델 경로"
YOLO_DEVICE: str = "cpu"

AZURE_SEARCH_ENDPOINT: str
AZURE_SEARCH_KEY: str
AZURE_SEARCH_INDEX: str
AZURE_SPEECH_KEY: str
AZURE_SPEECH_REGION: str

STATIC_DIR: str = "정적 파일 경로"
 백엔드 API 라우터
bash
코드 복사
air_travel_back/app/api/v1/api.py
추가된 라인:

python
코드 복사
from app.api.v1.endpoints import ai_analysis
api_router.include_router(ai_analysis.router, prefix="/ai-analysis", tags=["ai-analysis"])
 프론트엔드 홈 화면
tsx
코드 복사
onPress={() => router.push('/ai-camera')}  // 카메라 버튼 → AI 카메라 화면
markdown
코드 복사
