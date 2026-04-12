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
