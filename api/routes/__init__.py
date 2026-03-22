"""
routes/__init__.py — Manshot
Exporta todos os routers para uso simples.
"""

from .contacts import router as contacts_router
from .campaigns import router as campaigns_router

__all__ = ["contacts_router", "campaigns_router"]
