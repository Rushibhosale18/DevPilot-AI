"""
DevPilot AI - Core Configuration
Loads all environment variables and application settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App metadata
    APP_NAME: str = "DevPilot AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None      # Gemini Pro fallback
    GITHUB_TOKEN: Optional[str] = None

    # GitHub OAuth
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None

    # Database
    DATABASE_URL: str = "sqlite:///./devpilot.db"
    REDIS_URL: str = "redis://localhost:6379"

    # Vector DB (ChromaDB)
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # JWT Auth
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_SECRETS"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Embedding model
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # LLM model
    LLM_MODEL: str = "gpt-4o-mini"      # swap to gpt-4o for production
    LLM_TEMPERATURE: float = 0.1

    # Repo clone dir
    REPO_CLONE_DIR: str = "./repos"

    # Rate limiting
    MAX_FILES_PER_REPO: int = 500
    MAX_FILE_SIZE_KB: int = 200
    MAX_REPOS_PER_USER: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(settings.REPO_CLONE_DIR, exist_ok=True)
