import os
import re
import uuid
import base64
import logging
from PIL import Image, ImageDraw, ImageFont, ExifTags
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
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
            # For text extraction
            self.doc_ai_client = DocumentAnalysisClient(
                endpoint=settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT, 
                credential=AzureKeyCredential(settings.AZURE_DOCUMENT_INTELLIGENCE_KEY)
            )
            # Removed: For language detection (TextAnalyticsClient)
            # For text translation
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
        """Extracts text from an image, treating each line as a separate block."""
        with open(image_path, "rb") as f:
            image_data = f.read()

        poller = self.doc_ai_client.begin_analyze_document("prebuilt-layout", image_data)
        result = poller.result()

        text_blocks = []
        if result.pages:
            for page in result.pages:
                for line in page.lines:
                    points = line.polygon
                    x_coords = [p.x for p in points]
                    y_coords = [p.y for p in points]
                    
                    line_info = {
                        'text': line.content,
                        'x': min(x_coords),
                        'y': min(y_coords),
                        'width': max(x_coords) - min(x_coords),
                        'height': max(y_coords) - min(y_coords)
                    }
                    text_blocks.append({
                        'text': line.content,
                        'x': line_info['x'], 'y': line_info['y'],
                        'width': line_info['width'], 'height': line_info['height'],
                        'lines': [line_info], 'line_count': 1
                    })
        return text_blocks

    def translate_text(self, text: str, from_language: str, to_language: str) -> str:
        """Translates a string of text, automatically detecting the source language."""
        if not text.strip() or not re.search('[a-zA-Z0-9]', text):
             return text
        
        try:
            # The translate method expects a list of dictionaries.
            # Source language will be auto-detected if 'from' parameter is not provided.
            response = self.translator_client.translate(body=[{"text": text}], from_language=from_language, to_language=[to_language])
            logger.info(f"Translation response: {response}")
            if response and len(response) > 0 and response[0].translations:
                logger.info(f"Translated text: {response[0].translations[0].text}")
                return response[0].translations[0].text
            else:
                logger.warning(f"No translation returned for text: '{text}' from language: '{from_language}' to target language: '{to_language}'. Response: {response}")
        except Exception as e:
            logger.error(f"Translation Error: {e}")
        return text

    def get_premium_font(self, size: int, weight: str = 'regular') -> ImageFont.FreeTypeFont:
        """Loads a high-quality local font, with fallbacks."""
        # macOS-specific font path for Apple SD Gothic Neo
        font_path_mac = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
        
        # Font indices within the .ttc collection
        font_indices = {
            'regular': 2, # AppleSDGothicNeo-Regular
            'bold': 5     # AppleSDGothicNeo-Bold
        }

        try:
            # Check if we are on macOS and the font exists
            if os.path.exists(font_path_mac):
                font_index = font_indices.get(weight, font_indices['regular'])
                logger.info(f"✅ Loading macOS font: {font_path_mac} with index {font_index}")
                return ImageFont.truetype(font_path_mac, size, index=font_index)
        except (IOError, IndexError) as e:
            logger.warning(f"⚠️ Failed to load macOS system font '{font_path_mac}': {e}. Falling back.")

        # Original fallback for other systems (will likely fail if assets aren't there)
        font_paths = {
            'bold': ["/usr/share/fonts/truetype/nanum/NanumBarunGothicBold.ttf", "assets/fonts/NanumBarunGothicBold.ttf"],
            'regular': ["/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf", "assets/fonts/NanumBarunGothic.ttf"]
        }
        for font_path in font_paths.get(weight, font_paths['regular']):
            if os.path.exists(font_path):
                try: 
                    logger.info(f"✅ Loading fallback font: {font_path}")
                    return ImageFont.truetype(font_path, size)
                except IOError: 
                    continue
        
        # Final fallback to default PIL font
        logger.warning("⚠️ All premium fonts failed. Falling back to default PIL font.")
        return ImageFont.load_default()

    def create_artistic_overlay(self, image_path: str, text_blocks: list, translations: list, output_path: str) -> str:
        """Creates an overlay with translated text."""
        pil_image = Image.open(image_path).convert("RGBA")
        overlay = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        for block, translation in zip(text_blocks, translations):
            if not translation.strip(): 
                continue

            logger.info(f"Attempting to draw translation: '{translation}'") # Added log

            original_line = block['lines'][0]
            font_size = max(int(original_line['height'] * 0.8), 10)
            font = self.get_premium_font(font_size, 'regular')
            
            max_width = original_line['width'] * 1.1
            
            while font.getlength(translation) > max_width and font_size > 9:
                font_size -= 1
                font = self.get_premium_font(font_size, 'regular')

            bbox = font.getbbox(translation)
            text_width, text_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
            padding_x, padding_y = int(font_size * 0.4), int(font_size * 0.2)
            
            box_width, box_height = text_width + padding_x * 2, text_height + padding_y * 2
            box_x = original_line['x'] + (original_line['width'] - box_width) / 2
            box_y = original_line['y'] + (original_line['height'] - box_height) / 2

            draw.rounded_rectangle(
                [(box_x, box_y), (box_x + box_width, box_y + box_height)],
                radius=6, fill=(255, 255, 255, 255) # Changed to solid white
            )
            
            text_x = box_x + padding_x
            text_y = box_y + padding_y - bbox[1]
            draw.text((text_x, text_y), translation, fill=(30, 30, 30), font=font)
        
        final_image = Image.alpha_composite(pil_image, overlay).convert('RGB')
        final_image.save(output_path, "PNG", quality=95)
        return output_path

    def translate_image(self, image_path: str, from_language: str, to_language: str, output_path: str) -> str | None:
        """Main function to translate an image, with automatic source language detection."""
        try:
            rotate_image_if_needed(image_path)
            text_blocks = self.extract_text_blocks_grouped(image_path)
            if not text_blocks:
                logger.info("No text blocks found in image.")
                return None

            # Source language will be automatically detected by translate_text
            # target_language is now directly passed as the second argument
            
            logger.info(f"Translating from {from_language} to {to_language}")

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