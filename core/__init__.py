"""
core/__init__.py — Manshot
Exporta os canais e tipos principais para uso simples:

    from core import EmailChannel, SMSChannel, TelegramChannel, Contact
"""

from .base import BaseChannel, Contact, DispatchResult
from .email import EmailChannel
from .sms import SMSChannel
from .telegram import TelegramChannel

__all__ = [
    "BaseChannel",
    "Contact",
    "DispatchResult",
    "EmailChannel",
    "SMSChannel",
    "TelegramChannel",
]
