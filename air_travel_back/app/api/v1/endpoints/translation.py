import os
import uuid
import shutil
import logging
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Request
from pydub import AudioSegment

from app.services.translation_service import ProfessionalImageTranslator, SpeechTranslatorAPI
from app.schemas.translation import ImageTranslationResponse, SpeechTranslationResponse

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# 서비스 인스턴스 생성 (싱글턴처럼 사용)
image_translator = ProfessionalImageTranslator()
speech_translator = SpeechTranslatorAPI()

# --- 파일 저장을 위한 폴더 설정 ---
IMAGE_UPLOAD_FOLDER = 'uploads/translation_images/originals'
RESULT_FOLDER = 'uploads/translation_images/results'
AUDIO_UPLOAD_FOLDER = 'uploads/translation_audio'

os.makedirs(IMAGE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)
os.makedirs(AUDIO_UPLOAD_FOLDER, exist_ok=True)

# --- 언어 코드 매핑 (음성 번역용) ---
SPEECH_TRANSLATION_MAPPING = {
    "en": ("en-US", "en-US-AvaMultilingualNeural"),
    "ko": ("ko-KR", "ko-KR-SunHiNeural"),
    "zh-Hans": ("zh-CN", "zh-CN-XiaoxiaoNeural"),
    "ja": ("ja-JP", "ja-JP-NanamiNeural"),
    "es": ("es-ES", "es-ES-ElviraNeural"),
    "fr": ("fr-FR", "fr-FR-DeniseNeural"),
    "de": ("de-DE", "de-DE-KatjaNeural"),
    "it": ("it-IT", "it-IT-IsabellaNeural"),
    "pt": ("pt-BR", "pt-BR-FranciscaNeural"),
    "ru": ("ru-RU", "ru-RU-SvetlanaNeural"),
    "vi": ("vi-VN", "vi-VN-HoaiMyNeural"),
    "th": ("th-TH", "th-TH-PremwadeeNeural"),
}

@router.post("/translate", response_model=ImageTranslationResponse)
async def translate_image_from_web(request: Request, image: UploadFile = File(...), language: str = Form('ko')):
    """웹캠 이미지를 받아 번역하고 결과 이미지 URL을 반환합니다."""
    logger.info("\n[서버 로그] /translate (이미지) 엔드포인트에 POST 요청이 도착했습니다.")
    
    try:
        filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join(IMAGE_UPLOAD_FOLDER, filename)
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
            result_url = f"{request.base_url}{output_path}"
            logger.info(f"[서버 로그] 성공! 결과 URL: {result_url}")
            return ImageTranslationResponse(result_url=result_url)
        else:
            raise HTTPException(status_code=500, detail="Translation failed")

    except Exception as e:
        logger.error(f"/translate 엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 내부 처리 중 오류가 발생했습니다: {e}")

@router.post("/speech-translate", response_model=SpeechTranslationResponse)
async def handle_speech_translation(from_lang: str = Form(...), to_lang: str = Form(...), audio: UploadFile = File(...)):
    """React Native 앱에서 음성 파일을 받아 번역하고 결과를 반환합니다."""
    logger.info("\n[서버 로그] /speech-translate (음성) 엔드포인트에 POST 요청이 도착했습니다.")

    if from_lang not in SPEECH_TRANSLATION_MAPPING or to_lang not in SPEECH_TRANSLATION_MAPPING:
        raise HTTPException(status_code=400, detail="지원되지 않는 언어 코드입니다.")

    from_stt_code, _ = SPEECH_TRANSLATION_MAPPING[from_lang]
    _, to_tts_voice = SPEECH_TRANSLATION_MAPPING[to_lang]

    temp_audio_path = None
    wav_audio_path = None
    try:
        # 1. 임시 파일로 오디오 저장 (원본 형식 그대로)
        file_extension = os.path.splitext(audio.filename)[1] if audio.filename else '.m4a'
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_audio_path = os.path.join(AUDIO_UPLOAD_FOLDER, temp_filename)
        with open(temp_audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # 2. WAV로 변환
        wav_filename = f"{uuid.uuid4()}.wav"
        wav_audio_path = os.path.join(AUDIO_UPLOAD_FOLDER, wav_filename)
        audio_segment = AudioSegment.from_file(temp_audio_path)
        audio_segment.export(wav_audio_path, format="wav")
        logger.info(f"오디오 파일을 WAV로 변환 완료: {wav_audio_path}")

        # 3. 번역 실행 (WAV 파일 사용)
        result = speech_translator.translate_audio_file(
            audio_path=wav_audio_path,
            from_lang_code=from_stt_code,
            to_lang_code=to_lang,
            to_lang_voice=to_tts_voice
        )

        if not result.get('success'):
            error_detail = result.get('error', '알 수 없는 서버 오류')
            raise HTTPException(status_code=500, detail=error_detail)
        
        return SpeechTranslationResponse(**result)

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"/speech-translate 엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 내부 처리 중 오류가 발생했습니다: {e}")
    finally:
        # 처리 후 임시 파일들 삭제
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        if wav_audio_path and os.path.exists(wav_audio_path):
            os.remove(wav_audio_path)
