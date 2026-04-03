"""
models/__init__.py — Manshot
Exporta todos os modelos para uso simples.
"""

from .contact import Contact
from .campaign import Campaign
from .user import User

__all__ = ["Contact", "Campaign", "User"]
