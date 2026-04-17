"""
schemas/contact.py — Manshot
Define o formato dos dados de contato que a API aceita e retorna.
Pydantic valida automaticamente os tipos e campos obrigatórios.
"""

from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


class ContactCreate(BaseModel):
    """Dados necessários para criar um contato."""

    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        if value is None:
            return None

        normalized = str(value).strip().lower()
        return normalized or None


class ContactResponse(BaseModel):
    """Dados retornados pela API ao consultar um contato."""

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None
    pinned: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ContactPinRequest(BaseModel):
    pinned: bool
