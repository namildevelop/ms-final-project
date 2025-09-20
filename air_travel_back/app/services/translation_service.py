import os
import re
import uuid
import base64
import logging
from PIL import Image, ImageDraw, ImageFont, ExifTags
from azure.core.credentials import AzureKeyCredential
# from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult 
# Removed: from azure.ai.textanalytics import TextAnalyticsClient
from azure.ai.translation.text import TextTranslationClient
import azure.cognitiveservices.speech as speechsdk

from app.core.config import settings

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Azure SDK HTTP 로깅 레벨 조정
logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)

def rotate_image_if_needed(image_path: str):
    """이미지의 EXIF 데이터를 읽어 필요하면 자동으로 회전시킵니다."""
    try:
        image = Image.open(image_path)
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
        
        exif = image._getexif()

        if exif is not None and orientation in exif:
            exif_orientation = exif[orientation]
            
            if exif_orientation == 3:
                image = image.rotate(180, expand=True)
            elif exif_orientation == 6:
                image = image.rotate(270, expand=True)
            elif exif_orientation == 8:
                image = image.rotate(90, expand=True)
            
            image.save(image_path)
            logger.info(f"✅ 이미지를 EXIF 데이터에 따라 회전했습니다 (Orientation: {exif_orientation}).")
        image.close()
    except (AttributeError, KeyError, IndexError, TypeError):
        logger.warning("⚠️ EXIF 정보가 없거나 처리할 수 없어 자동 회전을 건너뜁니다.")
        pass

class ProfessionalImageTranslator:
    def __init__(self):
        """Initializes the translator with Azure credentials from settings."""
        try:
            self.doc_ai_client = DocumentIntelligenceClient(
                endpoint=settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT, 
                credential=AzureKeyCredential(settings.AZURE_DOCUMENT_INTELLIGENCE_KEY)
            )
            self.translator_client = TextTranslationClient(
                endpoint=settings.TRANSLATOR_ENDPOINT,
                credential=AzureKeyCredential(settings.TRANSLATOR_API_KEY),
                region=settings.TRANSLATOR_REGION
            )
            logger.info("✅ ProfessionalImageTranslator 초기화 완료.")
        except Exception as e:
            logger.error(f"❌ ProfessionalImageTranslator 초기화 실패: {e}")
            raise

    def extract_text_blocks_grouped(self, image_path: str) -> list:
        """이미지에서 텍스트를 '문단(Paragraph)' 단위로 인식하여 블록을 생성합니다."""
        with open(image_path, "rb") as f:
            image_data = f.read()

        poller = self.doc_ai_client.begin_analyze_document("prebuilt-read", body=image_data, content_type="application/octet-stream")
        result: AnalyzeResult = poller.result()

        text_blocks = []
        if result.paragraphs:
            for paragraph in result.paragraphs:
                if not paragraph.bounding_regions or not paragraph.bounding_regions[0].polygon:
                    continue
                points = paragraph.bounding_regions[0].polygon
                x_coords = [points[i] for i in range(0, len(points), 2)]
                y_coords = [points[i] for i in range(1, len(points), 2)]
                
                paragraph_info = {
                    'text': paragraph.content,
                    'x': min(x_coords), 'y': min(y_coords),
                    'width': max(x_coords) - min(x_coords),
                    'height': max(y_coords) - min(y_coords),
                }
                text_blocks.append({
                    'text': paragraph.content,
                    'box_info': paragraph_info,
                })
        return text_blocks

    def translate_text(self, text: str, from_language: str, to_language: str) -> str:
        if not text.strip() or not re.search('[a-zA-Z0-9]', text):
            return text
        try:
            response = self.translator_client.translate(body=[{"text": text}], from_language=from_language, to_language=[to_language])
            if response and response[0].translations:
                return response[0].translations[0].text
        except Exception as e:
            logger.error(f"Translation Error: {e}")
        return text

    def get_premium_font(self, size: int, weight: str = 'regular') -> ImageFont.FreeTypeFont:
        font_path_mac = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
        font_indices = {'regular': 2, 'bold': 5}
        try:
            if os.path.exists(font_path_mac):
                return ImageFont.truetype(font_path_mac, size, index=font_indices.get(weight, 2))
        except Exception as e:
            logger.warning(f"⚠️ macOS 폰트 로드 실패: {e}")
        
        font_paths = {
            'bold': ["/usr/share/fonts/truetype/nanum/NanumBarunGothicBold.ttf", "assets/fonts/NanumBarunGothicBold.ttf"],
            'regular': ["/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf", "assets/fonts/NanumBarunGothic.ttf"]
        }
        for font_path in font_paths.get(weight, []):
            if os.path.exists(font_path):
                try: return ImageFont.truetype(font_path, size)
                except IOError: continue
        return ImageFont.load_default()

    def wrap_text(self, text, font, max_width):
        lines = []
        words = text.split(' ')
        current_line = ''
        for word in words:
            if not word: continue
            test_line = f"{current_line} {word}".strip()
            if font.getbbox(test_line)[2] <= max_width:
                current_line = test_line
            else:
                if current_line: lines.append(current_line)
                current_line = word
        if current_line: lines.append(current_line)
        return lines

    def create_artistic_overlay(self, image_path: str, text_blocks: list, translations: list, output_path: str) -> str:
        pil_image = Image.open(image_path).convert("RGBA")
        overlay = Image.new('RGBA', pil_image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)

        for block, translation in zip(text_blocks, translations):
            if not translation.strip(): continue

            original_box = block['box_info']
            box_width, box_height = original_box['width'], original_box['height']
            min_x, min_y = original_box['x'], original_box['y']

            draw.rectangle([(min_x, min_y), (min_x + box_width, min_y + box_height)], fill=(255, 240, 225, 190))
            
            original_line_count = original_box['text'].count('\n') + 1
            estimated_line_height = box_height / original_line_count
            font_size = max(int(estimated_line_height * 0.8), 10)
            
            font = self.get_premium_font(font_size, 'regular')
            wrapped_lines = self.wrap_text(translation, font, box_width * 0.95)
            
            line_height = (font.getbbox("A")[3] - font.getbbox("A")[1]) * 1.2
            total_text_height = len(wrapped_lines) * line_height
            while total_text_height > box_height and font_size > 10:
                font_size -= 1
                font = self.get_premium_font(font_size, 'regular')
                wrapped_lines = self.wrap_text(translation, font, box_width * 0.95)
                line_height = (font.getbbox("A")[3] - font.getbbox("A")[1]) * 1.2
                total_text_height = len(wrapped_lines) * line_height

            current_y = min_y + (box_height - total_text_height) / 2
            for line in wrapped_lines:
                line_width = font.getbbox(line)[2]
                line_x = min_x + (box_width - line_width) / 2
                draw.text((line_x, current_y), line, fill=(30, 30, 30), font=font)
                current_y += line_height
        
        final_image = Image.alpha_composite(pil_image, overlay).convert('RGB')
        final_image.save(output_path, "PNG", quality=95)
        return output_path

    def translate_image(self, image_path: str, from_language: str, to_language: str, output_path: str) -> str | None:
        try:
            rotate_image_if_needed(image_path)
            text_blocks = self.extract_text_blocks_grouped(image_path)
            if not text_blocks:
                logger.info("이미지에서 텍스트를 찾을 수 없습니다.")
                return None
            
            logger.info(f"{len(text_blocks)}개의 문단을 {from_language}에서 {to_language}(으)로 번역합니다.")
            translations = [self.translate_text(block['text'], from_language, to_language) for block in text_blocks]
            
            return self.create_artistic_overlay(image_path, text_blocks, translations, output_path)
        except Exception as e:
            logger.error(f"❌ translate_image 중 오류 발생: {e}", exc_info=True)
            return None

class SpeechTranslatorAPI:
    def __init__(self):
        """Initializes the Azure Speech service credentials from settings."""
        try:
            self.speech_config = speechsdk.SpeechConfig(subscription=settings.SPEECH_API_KEY, region=settings.SPEECH_REGION)
            logger.info("✅ SpeechTranslatorAPI 초기화 완료.")
        except Exception as e:
            logger.error(f"❌ SpeechTranslatorAPI 초기화 실패: {e}")
            raise

    def translate_audio_file(self, audio_path: str, lang_details: dict) -> dict:
        """Detects the language from an audio file out of a list of possible languages,
        and translates it to the other language.
        lang_details: A dict mapping short codes to tuples, e.g.,
                      {'en': ('en-US', 'en-US-AvaMultilingualNeural'), 'ko': ('ko-KR', 'ko-KR-SunHiNeural')}
        """
        try:
            # 1. Setup auto-detection and translation config
            possible_langs = list(lang_details.keys()) # e.g., ['en', 'ko']
            possible_lang_codes_for_detection = [details[0] for details in lang_details.values()] # e.g., ['en-US', 'ko-KR']
            
            auto_detect_config = speechsdk.AutoDetectSourceLanguageConfig(languages=possible_lang_codes_for_detection)
            
            translation_config = speechsdk.translation.SpeechTranslationConfig(
                subscription=settings.SPEECH_API_KEY,
                region=settings.SPEECH_REGION
            )
            # Do NOT set speech_recognition_language when using auto-detect
            for lang_code in possible_langs:
                translation_config.add_target_language(lang_code)

            # 2. Create recognizer and run recognition
            audio_config = speechsdk.audio.AudioConfig(filename=audio_path)
            recognizer = speechsdk.translation.TranslationRecognizer(
                translation_config=translation_config,
                auto_detect_source_language_config=auto_detect_config,
                audio_config=audio_config
            )

            logger.info(f"🎤 오디오 파일({audio_path})에서 언어 감지 및 번역 중... 후보: {possible_langs}")
            result = recognizer.recognize_once_async().get()

            # 3. Process result
            if result.reason == speechsdk.ResultReason.TranslatedSpeech:
                detected_lang_code_long = result.properties[speechsdk.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguageResult]
                
                detected_lang_short = next((key for key, value in lang_details.items() if value[0] == detected_lang_code_long), None)
                
                if not detected_lang_short:
                    error_msg = f"Could not map detected language code '{detected_lang_code_long}' to a known language."
                    logger.error(f"❌ {error_msg}")
                    return {"success": False, "error": error_msg, "detected_lang": None, "source_text": None, "translated_text": None, "tts_audio": None}

                target_lang_short = next((lang for lang in possible_langs if lang != detected_lang_short), None)

                source_text = result.text
                translated_text = result.translations.get(target_lang_short, "")

                logger.info(f"✅ 언어 감지: {detected_lang_short} ({detected_lang_code_long})")
                logger.info(f"✅ 원본 텍스트: {source_text}")
                logger.info(f"🔄 번역 텍스트 ({target_lang_short}): {translated_text}")

                # 4. Synthesize TTS for the translated text
                tts_audio_base64 = None
                if translated_text:
                    _, target_voice = lang_details[target_lang_short]
                    self.speech_config.speech_synthesis_voice_name = target_voice
                    synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config, audio_config=None)
                    tts_result = synthesizer.speak_text_async(translated_text).get()

                    if tts_result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                        tts_audio_base64 = base64.b64encode(tts_result.audio_data).decode('utf-8')
                        logger.info("🔊 TTS 오디오 데이터 생성 완료")
                    else:
                        logger.warning(f"⚠️ TTS 실패: {tts_result.cancellation_details.reason}")

                return {
                    "success": True,
                    "detected_lang": detected_lang_short,
                    "source_text": source_text,
                    "translated_text": translated_text,
                    "tts_audio": tts_audio_base64
                }

            elif result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning("❌ 음성을 인식할 수 없습니다 (NoMatch).")
                return {"success": False, "error": "Could not recognize speech.", "detected_lang": None, "source_text": None, "translated_text": None, "tts_audio": None}
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation_details = result.cancellation_details
                logger.error(f"❌ 번역 취소됨: {cancellation_details.reason}")
                if cancellation_details.reason == speechsdk.CancellationReason.Error:
                    logger.error(f"❌ 오류 상세: {cancellation_details.error_details}")
                return {"success": False, "error": f"Translation canceled: {cancellation_details.reason}", "detected_lang": None, "source_text": None, "translated_text": None, "tts_audio": None}
            
            return {"success": False, "error": "Unknown translation error.", "detected_lang": None, "source_text": None, "translated_text": None, "tts_audio": None}

        except Exception as e:
            logger.error(f"❌ translate_audio_file 처리 중 심각한 오류 발생: {e}", exc_info=True)
            return {"success": False, "error": str(e), "detected_lang": None, "source_text": None, "translated_text": None, "tts_audio": None}