import os
import uuid
import traceback
import logging # 로깅 모듈 import
from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from waitress import serve

from docIntelliTranslator import ProfessionalImageTranslator
from speechTranslator import SpeechTranslatorAPI

# --- 핵심 추가: 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

# --- 두 개의 번역기 클래스 인스턴스를 각각 생성 ---
try:
    image_translator = ProfessionalImageTranslator()
    app.logger.info("✅ 이미지 번역 모듈 초기화 완료.")
except Exception as e:
    app.logger.error(f"❌ 이미지 번역기 초기화 실패: {e}")
    image_translator = None

try:
    speech_translator = SpeechTranslatorAPI()
    app.logger.info("✅ 음성 번역 모듈 초기화 완료.")
except Exception as e:
    app.logger.error(f"❌ 음성 번역기 초기화 실패: {e}")
    raise RuntimeError(f"음성 번역기 초기화 실패: {e}")

# --- 파일 저장을 위한 폴더 설정 ---
IMAGE_UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = os.path.join('static', 'results')
AUDIO_UPLOAD_FOLDER = 'audio_uploads'
os.makedirs(IMAGE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)
os.makedirs(AUDIO_UPLOAD_FOLDER, exist_ok=True)

# --- 언어 코드 매핑 (음성 번역용) ---
SPEECH_TRANSLATION_MAPPING = {
    "en": ("en-US", "en-US-AvaMultilingualNeural"),
    "ko": ("ko-KR", "ko-KR-SunHiNeural"),
    "zh-Hans": ("zh-CN", "zh-CN-XiaoxiaoNeural"),
    "ja": ("ja-JP", "ja-JP-NanamiNeural"),
    # ... (기타 언어) ...
}


@app.route('/translate', methods=['POST'])
def translate_image_from_web():
    """웹캠 이미지를 받아 번역하고 결과 이미지 URL을 반환합니다."""
    app.logger.info("\n[서버 로그] /translate (이미지) 엔드포인트에 POST 요청이 도착했습니다.")
    # ... (이하 기존 이미지 번역 로직은 동일) ...
    if not image_translator:
        return jsonify({'error': 'Image Translator not initialized'}), 500
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file in request'}), 400
        image_file = request.files['image']
        target_lang = request.form.get('language', 'ko')
        filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join(IMAGE_UPLOAD_FOLDER, filename)
        image_file.save(image_path)
        output_filename = f"result_{filename}"
        output_path = os.path.join(RESULT_FOLDER, output_filename)
        result_path_on_disk = image_translator.translate_image(
            image_path=image_path,
            target_language=target_lang,
            output_path=output_path
        )
        if result_path_on_disk:
            result_url = url_for('static', filename=f'results/{output_filename}', _external=True, _scheme='http')
            app.logger.info(f"[서버 로그] 성공! 결과 URL: {result_url}")
            return jsonify({'result_url': result_url})
        else:
            return jsonify({'error': 'Translation failed'}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': '서버 내부 처리 중 오류가 발생했습니다.'}), 500


@app.route('/speech-translate', methods=['POST'])
def handle_speech_translation():
    """React Native 앱에서 음성 파일을 받아 번역하고 결과를 반환합니다."""
    app.logger.info("\n[서버 로그] /speech-translate (음성) 엔드포인트에 POST 요청이 도착했습니다.")
    # ... (이하 기존 음성 번역 로직은 동일) ...
    if 'audio' not in request.files:
        return jsonify({'error': '요청에 오디오 파일이 없습니다.'}), 400
    from_lang_code = request.form.get('from_lang')
    to_lang_code = request.form.get('to_lang')
    if not from_lang_code or not to_lang_code:
        return jsonify({'error': '원본 또는 대상 언어 코드가 누락되었습니다.'}), 400
    if from_lang_code not in SPEECH_TRANSLATION_MAPPING or to_lang_code not in SPEECH_TRANSLATION_MAPPING:
        return jsonify({'error': '지원되지 않는 언어 코드입니다.'}), 400
    from_stt_code, _ = SPEECH_TRANSLATION_MAPPING[from_lang_code]
    _, to_tts_voice = SPEECH_TRANSLATION_MAPPING[to_lang_code]
    audio_file = request.files['audio']
    filename = f"{uuid.uuid4()}_{audio_file.filename}"
    audio_path = os.path.join(AUDIO_UPLOAD_FOLDER, filename)
    audio_file.save(audio_path)
    result = {}
    try:
        result = speech_translator.translate_audio_file(
            audio_path=audio_path,
            from_lang_code=from_stt_code,
            to_lang_code=to_lang_code,
            to_lang_voice=to_tts_voice
        )
    except Exception as e:
        traceback.print_exc()
        result = {'success': False, 'error': str(e)}
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)
    if not result.get('success'):
        return jsonify({'error': result.get('error', '알 수 없는 서버 오류')}), 500
    return jsonify(result)


if __name__ == '__main__':
    app.logger.info("🚀 통합 번역 API 서버를 시작합니다. http://0.0.0.0:5000")
    serve(app, host='0.0.0.0', port=5000)

