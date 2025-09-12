import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Travel AI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://yubin:1234@localhost:5432/travel_ai")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BASE_URL: str = os.getenv("BASE_URL", "http://0.0.0.0:8000") # Added BASE_URL

    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = "https://team2-openai.openai.azure.com/"
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4.1"

    # Google Maps API Key
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

settings = Settings()