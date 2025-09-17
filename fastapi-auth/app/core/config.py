import os
from pydantic import BaseModel, EmailStr
from typing import Optional

class Settings(BaseModel):
    # Project Settings
    PROJECT_NAME: str = "Air Travel"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://yubin:1234@localhost:5432/travel_ai")
    
    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = "https://team2-openai.openai.azure.com/"
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4.1"
    
    # Google Maps API Key
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    # Email Settings
    MAIL_USERNAME: Optional[str] = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: Optional[str] = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: Optional[EmailStr] = os.getenv("MAIL_FROM")
    MAIL_SERVER: Optional[str] = os.getenv("MAIL_SERVER")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"
    
    # Google OAuth Settings
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_ANDROID_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_ANDROID_CLIENT_ID")
    GOOGLE_IOS_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_IOS_CLIENT_ID")
    
    # Kakao API Settings
    KAKAO_REST_API_KEY: Optional[str] = os.getenv("KAKAO_REST_API_KEY")
    
    # App Settings
    SHOW_DEV_CODES: bool = os.getenv("SHOW_DEV_CODES", "false").lower() == "true"
    NGROK_URL: Optional[str] = os.getenv("NGROK_URL")
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "dev-secret-key")
    API_ORIGIN: str = os.getenv("API_ORIGIN", "http://localhost:8000")
    FRONT_ORIGIN: str = os.getenv("FRONT_ORIGIN", "http://localhost:3000")

# Create settings instance
settings = Settings()

# Additional DATABASE_URL configurations (as shown in the image)
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://yubin:1234@localhost:5432/travel_ai")
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:1234@4.230.16.32:5432/travel_ai")

# Legacy compatibility - keep existing variable names for backward compatibility
mail_settings = settings
google_oauth_settings = settings
database_settings = settings
jwt_settings = settings
kakao_api_settings = settings
app_settings = settings

def _is_placeholder(v: Optional[str]) -> bool:
    """Check if value is a placeholder or empty"""
    return v is None or v.strip() in ("", "...")

def is_mail_enabled() -> bool:
    """Check if mail service is properly configured"""
    return (not _is_placeholder(settings.MAIL_USERNAME)
            and not _is_placeholder(settings.MAIL_PASSWORD)
            and not _is_placeholder(str(settings.MAIL_FROM or ""))
            and not _is_placeholder(settings.MAIL_SERVER))













