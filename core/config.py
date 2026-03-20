"""
config.py — Manshot
Centraliza todas as configurações do projeto.
Lê as credenciais do arquivo .env para nunca expor chaves no código.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- SendGrid (Email) ---
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = ""        # ex: seuemail@gmail.com
    EMAIL_FROM_NAME: str = "Manshot"

    # --- Twilio (SMS) ---
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_FROM: str = ""  # ex: +5521999999999

    # --- Telegram ---
    TELEGRAM_BOT_TOKEN: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instância global — importada pelos outros módulos
settings = Settings()
