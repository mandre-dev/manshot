"""
config.py — Manshot
Centraliza todas as configurações do projeto.
Lê as credenciais do arquivo .env para nunca expor chaves no código.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Gmail SMTP (Email) ---
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""
    EMAIL_FROM_NAME: str = "Manshot"

    # --- Vonage (SMS) ---
    VONAGE_API_KEY: str = ""
    VONAGE_API_SECRET: str = ""
    VONAGE_PHONE_FROM: str = "Manshot"

    # --- Telegram ---
    TELEGRAM_BOT_TOKEN: str = ""

    # --- Redis (Celery) ---
    REDIS_URL: str = ""

    # --- ImgBB (upload de imagens) ---
    IMGBB_API_KEY: str = ""

    # --- Auth (login) ---
    ADMIN_EMAIL: str = "admin@manshot.local"
    ADMIN_PASSWORD: str = "admin123"
    JWT_SECRET_KEY: str = "change-this-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    CORS_ALLOW_ORIGINS: str = ""

    # --- Google OAuth ---
    google_client_id: str = ""
    google_client_secret: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
