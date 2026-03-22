"""
schemas/contact.py — Manshot
Define o formato dos dados de contato que a API aceita e retorna.
Pydantic valida automaticamente os tipos e campos obrigatórios.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class ContactCreate(BaseModel):
    """Dados necessários para criar um contato."""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None


class ContactResponse(BaseModel):
    """Dados retornados pela API ao consultar um contato."""
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
