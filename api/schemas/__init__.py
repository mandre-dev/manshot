"""
schemas/__init__.py — Manshot
Exporta todos os schemas para uso simples.
"""

from .contact import ContactCreate, ContactResponse
from .campaign import CampaignCreate, CampaignResponse
from .auth import LoginRequest, TokenResponse, UserResponse

__all__ = [
    "ContactCreate",
    "ContactResponse",
    "CampaignCreate",
    "CampaignResponse",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
]
