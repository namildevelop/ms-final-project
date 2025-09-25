from pydantic import BaseModel

class ImageTranslationResponse(BaseModel):
    result_url: str

class SpeechTranslationResponse(BaseModel):
    success: bool
    detected_lang: str | None = None
    source_text: str | None = None
    translated_text: str | None = None
    tts_audio: str | None = None # Base64 encoded audio
    error: str | None = None
