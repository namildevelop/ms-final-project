"""
Text-to-Speech service using Azure Speech.
"""
import os
import hashlib
from typing import Optional
from app.core.config import settings

# Try importing Azure speech; if unavailable or environment variables are missing we fall back
try:
    import azure.cognitiveservices.speech as speechsdk  # type: ignore
except ImportError:
    speechsdk = None

class TTSService:
    """Service for text-to-speech conversion."""
    
    def __init__(self):
        self.speech_key = settings.AZURE_SPEECH_KEY
        self.speech_region = settings.AZURE_SPEECH_REGION
        self.static_dir = settings.STATIC_DIR
    
    def generate_audio(self, text: str) -> Optional[str]:
        """Generate TTS audio file and return URL."""
        if not text or speechsdk is None:
            print("TTS: SDK missing or empty text")
            return None

        if not self.speech_key or not self.speech_region:
            print("TTS: missing env")
            return None

        h = hashlib.md5(text.encode("utf-8")).hexdigest()[:16]
        filename = f"tts_{h}.mp3"
        file_path = os.path.join(self.static_dir, filename)

        if os.path.exists(file_path):
            print("TTS reuse:", file_path)
            return f"/static/{filename}"

        try:
            speech_config = speechsdk.SpeechConfig(subscription=self.speech_key, region=self.speech_region)
            speech_config.speech_synthesis_language = "ko-KR"
            speech_config.speech_synthesis_voice_name = "ko-KR-SunHiNeural"
            audio_config = speechsdk.audio.AudioOutputConfig(filename=file_path)
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
            result = synthesizer.speak_text_async(text).get()
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted and os.path.exists(file_path):
                print("TTS saved:", file_path)
                return f"/static/{filename}"
            else:
                print("TTS failed:", result.reason)
        except Exception as e:
            print("Azure TTS error:", e)
        return None
