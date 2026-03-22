"""
sms.py — Manshot
Canal de disparo via SMS usando Vonage.
Trial gratuito funciona com números brasileiros.
"""

from vonage import Auth, Vonage
from vonage_sms import SmsMessage, SmsResponse

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class SMSChannel(BaseChannel):
    """
    Disparo de SMS em massa via Vonage.
    """

    def __init__(self):
        self.client = Vonage(Auth(
            api_key=settings.VONAGE_API_KEY,
            api_secret=settings.VONAGE_API_SECRET
        ))

    def send(self, contact: Contact, message: str) -> DispatchResult:
        """
        Envia SMS para um contato.
        O número deve estar no formato internacional sem +: 5521999999999
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)

            msg = SmsMessage(
                to=contact.destination,
                from_=settings.VONAGE_PHONE_FROM,
                text=personalized_message
            )

            response: SmsResponse = self.client.sms.send(msg)
            status = response.messages[0].status
            success = status == "0"
            error = response.messages[0].error_text if not success else ""

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
