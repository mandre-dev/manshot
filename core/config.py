"""
config.py — Manshot
Centraliza todas as configurações do projeto.
Lê as credenciais do arquivo .env para nunca expor chaves no código.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- SendGrid (Email) ---
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "Manshot"

    # --- Vonage (SMS) ---
    VONAGE_API_KEY: str = ""
    VONAGE_API_SECRET: str = ""
    VONAGE_PHONE_FROM: str = "Manshot"

    # --- Telegram ---
    TELEGRAM_BOT_TOKEN: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instância global — importada pelos outros módulos
settings = Settings()
