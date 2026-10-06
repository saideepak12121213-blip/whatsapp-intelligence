import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "ClassFlow AI"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "classflow-hackathon-supersecret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./classflow.db")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://palquzoqhfpomouzfupv.supabase.co")
    AI_API_KEY: str = os.getenv("AI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto")  # 'gemini', 'openai', or 'heuristic'
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
