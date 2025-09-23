import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Travel AI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:1234@4.230.16.32:5432/air_travel")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BASE_URL: str = os.getenv("BASE_URL", "http://0.0.0.0:8000") # Added BASE_URL

    # Mail Settings
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() in ("true", "1", "t")
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() in ("true", "1", "t")

    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = "https://team2-openai.openai.azure.com/"
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4.1"

    # Google Maps API Key
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

    # Azure Translation and Speech Services
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: str = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "")
    AZURE_DOCUMENT_INTELLIGENCE_KEY: str = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY", "")
    TRANSLATOR_ENDPOINT: str = os.getenv("TRANSLATOR_ENDPOINT", "")
    TRANSLATOR_API_KEY: str = os.getenv("TRANSLATOR_API_KEY", "")
    TRANSLATOR_REGION: str = os.getenv("TRANSLATOR_REGION", "")
    SPEECH_API_KEY: str = os.getenv("SPEECH_API_KEY", "")
    SPEECH_REGION: str = os.getenv("SPEECH_REGION", "")

    # AI Models and Services (from Jeju YOLO)
    AI_MODELS_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "ai_data")
    FAISS_INDEX_PATH: str = os.path.join(AI_MODELS_DIR, "index.faiss")
    META_DATA_PATH: str = os.path.join(AI_MODELS_DIR, "meta_baked.json")
    YOLO_MODEL_PATH: str = os.path.join(AI_MODELS_DIR, "yolov8n.pt")
    YOLO_DEVICE: str = "cpu"

    # Azure Search for RAG
    AZURE_SEARCH_ENDPOINT: str = os.getenv("AZURE_SEARCH_ENDPOINT", "")
    AZURE_SEARCH_KEY: str = os.getenv("AZURE_SEARCH_KEY", "")
    AZURE_SEARCH_INDEX: str = os.getenv("AZURE_SEARCH_INDEX", "")

    # Azure Speech for TTS
    AZURE_SPEECH_KEY: str = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "")

    # Static files directory
    STATIC_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "static")

settings = Settings()