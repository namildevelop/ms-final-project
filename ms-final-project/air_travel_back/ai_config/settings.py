"""
Application settings and configuration management.
"""
import os
from openai import AzureOpenAI
from dotenv import load_dotenv

class Settings:
    """Application settings class."""
    
    def __init__(self):
        # Base directory setup
        self.BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        load_dotenv(os.path.join(self.BASE_DIR, ".env"), override=True)
        
        # Model paths
        self.MODEL_PATH = os.path.join(self.BASE_DIR, "runs", "detect", "train11", "weights", "best.pt")
        self.STATIC_DIR = os.path.join(self.BASE_DIR, "static")
        self.FAISS_PATH = os.path.join(self.BASE_DIR, "refs", "index.faiss")
        self.META_PATH = os.path.join(self.BASE_DIR, "refs", "meta_baked.json")
        
        # Create static directory if it doesn't exist
        os.makedirs(self.STATIC_DIR, exist_ok=True)
        
        # Device settings
        self.YOLO_DEVICE = "cpu"
        
        # Azure OpenAI settings
        self.AOAI = AzureOpenAI(
            api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT"),
            api_version="2024-02-01",
        )
        self.AOAI_DEPLOY = os.environ.get("AZURE_OPENAI_DEPLOYMENT")
        self.SEARCH_EP = os.environ.get("AZURE_SEARCH_ENDPOINT")
        self.SEARCH_KEY = os.environ.get("AZURE_SEARCH_KEY")
        self.SEARCH_IDX = os.environ.get("AZURE_SEARCH_INDEX")
        
        # Azure Speech settings
        self.AZURE_SPEECH_KEY = os.environ.get("AZURE_SPEECH_KEY")
        self.AZURE_SPEECH_REGION = os.environ.get("AZURE_SPEECH_REGION")

