"""
sms.py — Manshot
Canal de disparo via SMS usando Twilio.
Trial gratuito inclui crédito para testes.
"""

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class SMSChannel(BaseChannel):
    """
    Disparo de SMS em massa via Twilio.
    No trial gratuito, só envia para números verificados na conta.
    """

    def __init__(self):
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )

    def send(self, contact: Contact, message: str) -> DispatchResult:
        """
        Envia SMS para um contato.
        O número deve estar no formato internacional: +5521999999999
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)

            self.client.messages.create(
                body=personalized_message,
                from_=settings.TWILIO_PHONE_FROM,
                to=contact.destination
            )

            return DispatchResult(contact=contact, success=True)

        except TwilioRestException as e:
            return DispatchResult(contact=contact, success=False, error=str(e))

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
