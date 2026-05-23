"""Application configuration loaded from environment variables via pydantic-settings."""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/parapo"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    REFRESH_SECRET_KEY: str = "change-me-refresh-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Expo Push
    EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:8081,http://localhost:3000,exp://localhost:8081"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Return ALLOWED_ORIGINS as a list of strings."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
