import os
import uuid
import traceback
import logging
import shutil
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 기존 번역 모듈들을 그대로 import합니다.
from docIntelliTranslator import ProfessionalImageTranslator
from speechTranslator import SpeechTranslatorAPI

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- FastAPI 앱 초기화 ---
app = FastAPI()

# --- CORS 설정 ---
# 모든 출처에서의 요청을 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 번역기 인스턴스 생성 ---
try:
    image_translator = ProfessionalImageTranslator()
    logger.info("✅ 이미지 번역 모듈 초기화 완료.")
except Exception as e:
    logger.error(f"❌ 이미지 번역기 초기화 실패: {e}")
    image_translator = None

try:
    speech_translator = SpeechTranslatorAPI()
    logger.info("✅ 음성 번역 모듈 초기화 완료.")
except Exception as e:
    logger.error(f"❌ 음성 번역기 초기화 실패: {e}")
    raise RuntimeError(f"음성 번역기 초기화 실패: {e}")

# --- 파일 저장을 위한 폴더 및 정적 파일 경로 설정 ---
IMAGE_UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'static/results'
AUDIO_UPLOAD_FOLDER = 'audio_uploads'
os.makedirs(IMAGE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)
os.makedirs(AUDIO_UPLOAD_FOLDER, exist_ok=True)

# '/static' 경로로 들어오는 요청을 'static' 폴더의 파일과 연결합니다.
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 언어 코드 매핑 (음성 번역용) ---
SPEECH_TRANSLATION_MAPPING = {
    "en": ("en-US", "en-US-AvaMultilingualNeural"),
    "ko": ("ko-KR", "ko-KR-SunHiNeural"),
    "zh-Hans": ("zh-CN", "zh-CN-XiaoxiaoNeural"),
    "ja": ("ja-JP", "ja-JP-NanamiNeural"),
    # ... (기타 언어) ...
}

# =============================================================
# API 엔드포인트 1: 이미지 번역
# =============================================================
@app.post("/translate")
async def translate_image_from_web(
    request: Request,
    image: UploadFile = File(...), 
    language: str = Form("ko")
):
    """웹캠 이미지를 받아 번역하고 결과 이미지 URL을 반환합니다."""
    logger.info("\n[서버 로그] /translate (이미지) 엔드포인트에 POST 요청이 도착했습니다.")

    if not image_translator:
        raise HTTPException(status_code=500, detail="Image Translator not initialized")

    try:
        filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join(IMAGE_UPLOAD_FOLDER, filename)
        
        # 업로드된 파일을 디스크에 저장
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        output_filename = f"result_{filename}"
        output_path = os.path.join(RESULT_FOLDER, output_filename)
        
        result_path_on_disk = image_translator.translate_image(
            image_path=image_path,
            target_language=language,
            output_path=output_path
        )

        if result_path_on_disk:
            # 요청 URL을 기반으로 결과 파일의 전체 URL 생성
            base_url = str(request.base_url)
            result_url = f"{base_url}static/results/{output_filename}"
            logger.info(f"[서버 로그] 성공! 결과 URL: {result_url}")
            return JSONResponse(content={'result_url': result_url})
        else:
            raise HTTPException(status_code=500, detail="Translation failed")

    except Exception as e:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="서버 내부 처리 중 오류가 발생했습니다.")

# =============================================================
# API 엔드포인트 2: 음성 번역
# =============================================================
@app.post("/speech-translate")
async def handle_speech_translation(
    audio: UploadFile = File(...), 
    from_lang: str = Form(...), 
    to_lang: str = Form(...)
):
    """React Native 앱에서 음성 파일을 받아 번역하고 결과를 반환합니다."""
    logger.info("\n[서버 로그] /speech-translate (음성) 엔드포인트에 POST 요청이 도착했습니다.")
    
    if from_lang not in SPEECH_TRANSLATION_MAPPING or to_lang not in SPEECH_TRANSLATION_MAPPING:
        raise HTTPException(status_code=400, detail="지원되지 않는 언어 코드입니다.")

    from_stt_code, _ = SPEECH_TRANSLATION_MAPPING[from_lang]
    _, to_tts_voice = SPEECH_TRANSLATION_MAPPING[to_lang]

    filename = f"{uuid.uuid4()}_{audio.filename}"
    audio_path = os.path.join(AUDIO_UPLOAD_FOLDER, filename)

    try:
        # 업로드된 오디오 파일을 임시 저장
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        result = speech_translator.translate_audio_file(
            audio_path=audio_path,
            from_lang_code=from_stt_code,
            to_lang_code=to_lang,
            to_lang_voice=to_tts_voice
        )
    except Exception as e:
        logger.error(traceback.format_exc())
        result = {'success': False, 'error': str(e)}
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

    if not result.get('success'):
        raise HTTPException(status_code=500, detail=result.get('error', '알 수 없는 서버 오류'))

    return JSONResponse(content=result)