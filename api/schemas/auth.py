"""
schemas/auth.py — Manshot
Schemas para autenticação (login).
"""

from pydantic import BaseModel
from pydantic import Field, field_validator


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if (
            "@" not in normalized
            or normalized.startswith("@")
            or normalized.endswith("@")
        ):
            raise ValueError("E-mail inválido")
        return normalized


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if (
            "@" not in normalized
            or normalized.startswith("@")
            or normalized.endswith("@")
        ):
            raise ValueError("E-mail inválido")
        return normalized


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleLoginRequest(BaseModel):
    access_token: str = Field(min_length=20)


class CredentialsCheckResponse(BaseModel):
    valid: bool


class UserResponse(BaseModel):
    email: str
    is_admin: bool = False


class SenderCredentialsResponse(BaseModel):
    """Estado das credenciais de remetente (sem expor segredos)."""

    admin_uses_env: bool = False
    email_smtp_host: str | None = None
    email_smtp_port: int | None = None
    email_user: str | None = None
    email_user_masked: str | None = None
    email_password_set: bool = False
    email_from_name: str | None = None
    sms_vonage_key_masked: str | None = None
    sms_vonage_secret_set: bool = False
    sms_default_from: str | None = None
    telegram_bot_token_set: bool = False


class SenderCredentialsPatch(BaseModel):
    """Atualização parcial. Omita um campo para não alterar. Senha vazia remove o valor salvo."""

    email_smtp_host: str | None = None
    email_smtp_port: int | None = None
    email_user: str | None = None
    email_password: str | None = None
    email_from_name: str | None = None
    sms_vonage_key: str | None = None
    sms_vonage_secret: str | None = None
    sms_default_from: str | None = None
    telegram_bot_token: str | None = None
