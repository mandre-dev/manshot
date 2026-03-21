"""
sms.py — Manshot
Canal de disparo via SMS usando Vonage.
Trial gratuito funciona com números brasileiros.
"""

import vonage

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class SMSChannel(BaseChannel):
    """
    Disparo de SMS em massa via Vonage.
    """

    def __init__(self):
        self.client = vonage.Client(
            key=settings.VONAGE_API_KEY,
            secret=settings.VONAGE_API_SECRET
        )
        self.sms = vonage.Sms(self.client)

    def send(self, contact: Contact, message: str) -> DispatchResult:
        """
        Envia SMS para um contato.
        O número deve estar no formato internacional: 5521999999999
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)

            response = self.sms.send_message({
                "from": settings.VONAGE_PHONE_FROM,
                "to": contact.destination,
                "text": personalized_message
            })

            status = response["messages"][0]["status"]
            success = status == "0"
            error = response["messages"][0].get("error-text", "") if not success else ""

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
