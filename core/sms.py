"""
sms.py — Manshot
Canal de disparo via SMS usando Vonage.
Imagens são enviadas como link no corpo da mensagem.
"""

from vonage import Auth, Vonage
from vonage_sms import SmsMessage, SmsResponse

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class SMSChannel(BaseChannel):
    """
    Disparo de SMS em massa via Vonage.
    Imagens são incluídas como link na mensagem.
    """

    def __init__(self):
        self.client = Vonage(Auth(
            api_key=settings.VONAGE_API_KEY,
            api_secret=settings.VONAGE_API_SECRET
        ))

    def send(self, contact: Contact, message: str, image_url: str = None) -> DispatchResult:
        """
        Envia SMS para um contato.
        Se image_url for fornecida, adiciona o link da imagem na mensagem.
        O número deve estar no formato internacional sem +: 5521999999999
        """
        try:
            personalized_message = message.format(name=contact.name)

            # Adiciona o link da imagem no SMS se houver
            if image_url:
                personalized_message += f"\n\nVer imagem: {image_url}"

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