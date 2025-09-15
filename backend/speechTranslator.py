import os
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
import base64

# .env 파일에서 환경변수 로드
load_dotenv()

class SpeechTranslatorAPI:
    def __init__(self):
        """Azure Speech 서비스 인증 정보를 초기화합니다."""
        try:
            self.speech_api_key = os.getenv("SPEECH_API_KEY")
            self.region = os.getenv("SPEECH_REGION")
            if not all([self.speech_api_key, self.region]):
                raise ValueError("SPEECH_API_KEY 또는 SPEECH_REGION이 .env 파일에 없습니다.")
            print("✅ Azure Speech API 모듈이 성공적으로 초기화되었습니다.")
        except Exception as e:
            print(f"❌ SpeechTranslatorAPI 초기화 실패: {e}")
            raise

    def get_speech_config(self, from_lang, to_lang):
        """언어 설정에 맞는 SpeechTranslationConfig 객체를 생성합니다."""
        config = speechsdk.translation.SpeechTranslationConfig(
            subscription=self.speech_api_key, region=self.region
        )
        config.speech_recognition_language = from_lang
        config.add_target_language(to_lang)
        return config

    def get_tts_config(self, voice_name):
        """언어 설정에 맞는 TTS용 SpeechConfig 객체를 생성합니다."""
        config = speechsdk.SpeechConfig(subscription=self.speech_api_key, region=self.region)
        config.speech_synthesis_voice_name = voice_name
        return config

    def translate_audio_file(self, audio_path, from_lang_code, to_lang_code, to_lang_voice):
        """
        오디오 파일을 받아 번역하고, 번역된 텍스트와 TTS 오디오 데이터를 반환합니다.
        """
        try:
            # 1. 번역 설정
            translation_config = self.get_speech_config(from_lang_code, to_lang_code)
            audio_config = speechsdk.audio.AudioConfig(filename=audio_path)
            
            recognizer = speechsdk.translation.TranslationRecognizer(
                translation_config=translation_config, audio_config=audio_config
            )

            # 2. 음성 인식 및 번역 실행
            print(f"🎤 오디오 파일({audio_path}) 번역 중...")
            result = recognizer.recognize_once_async().get()

            if result.reason != speechsdk.ResultReason.TranslatedSpeech:
                error_reason = result.cancellation_details.reason if result.reason == speechsdk.ResultReason.Canceled else result.reason
                print(f"❌ 번역 실패: {error_reason}")
                return {"success": False, "error": str(error_reason)}

            original_text = result.text
            translated_text = result.translations.get(to_lang_code, "")
            print(f"✅ 원본 ({from_lang_code}): {original_text}")
            print(f"🔄 번역 ({to_lang_code}): {translated_text}")

            if not translated_text:
                return {
                    "success": True, 
                    "original": original_text, 
                    "translated": "", 
                    "tts_audio": None
                }

            # 3. 번역된 텍스트로 TTS 실행 (오디오 데이터만 추출)
            tts_config = self.get_tts_config(to_lang_voice)
            # audio_config=None으로 설정하여 파일로 저장하지 않고 메모리에서 처리
            synthesizer = speechsdk.SpeechSynthesizer(tts_config, audio_config=None)
            tts_result = synthesizer.speak_text_async(translated_text).get()

            if tts_result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
                print(f"❌ TTS 실패: {tts_result.cancellation_details.reason}")
                tts_audio_base64 = None
            else:
                # 오디오 데이터를 Base64 문자열로 인코딩하여 JSON으로 전달
                tts_audio_data = tts_result.audio_data
                tts_audio_base64 = base64.b64encode(tts_audio_data).decode('utf-8')
                print("🔊 TTS 오디오 데이터 생성 완료")

            return {
                "success": True,
                "original": original_text,
                "translated": translated_text,
                "tts_audio": tts_audio_base64
            }
        except Exception as e:
            print(f"❌ translate_audio_file 처리 중 심각한 오류 발생: {e}")
            return {"success": False, "error": str(e)}

