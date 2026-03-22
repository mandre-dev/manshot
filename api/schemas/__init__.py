"""
schemas/__init__.py — Manshot
Exporta todos os schemas para uso simples.
"""

from .contact import ContactCreate, ContactResponse
from .campaign import CampaignCreate, CampaignResponse

__all__ = [
    "ContactCreate",
    "ContactResponse",
    "CampaignCreate",
    "CampaignResponse",
]
