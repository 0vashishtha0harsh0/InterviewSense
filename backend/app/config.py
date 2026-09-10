from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://127.0.0.1:27017"
    mongodb_db_name: str = "interviewsense"
    jwt_secret: str = "change-this-to-a-strong-random-secret-at-least-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    whisper_model: str = "base"  # base primary, fallback tiny if OOM
    question_count: int = 10
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def get_cors_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
