"""
sms.py — Manshot
Canal de disparo via SMS usando Vonage.
Imagens são enviadas como link no corpo da mensagem.
"""

from vonage import Auth, Vonage
from vonage_sms import SmsMessage, SmsResponse
import re
from html import unescape
import unicodedata

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class SMSChannel(BaseChannel):
    """
    Disparo de SMS em massa via Vonage.
    Imagens são incluídas como link na mensagem.
    """

    def __init__(self):
        self.client = Vonage(
            Auth(api_key=settings.VONAGE_API_KEY, api_secret=settings.VONAGE_API_SECRET)
        )

    @staticmethod
    def _sanitize_phone(phone: str) -> str:
        # Mantem apenas digitos para evitar falha por espacos, parenteses, tracos e +
        return re.sub(r"\D", "", phone or "")

    @staticmethod
    def _html_to_text(message: str) -> str:
        if not message:
            return ""

        text = message
        text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", "", text)
        text = unescape(text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return unicodedata.normalize("NFC", text.strip())

    @staticmethod
    def _is_valid_br_international(phone: str) -> bool:
        # Formato esperado: 55 + DDD + numero (12 ou 13 digitos)
        return phone.startswith("55") and len(phone) in (12, 13)

    def send(
        self, contact: Contact, message: str, image_url: str = None
    ) -> DispatchResult:
        """
        Envia SMS para um contato.
        Se image_url for fornecida, adiciona o link da imagem na mensagem.
        O número deve estar no formato internacional sem +: 5521999999999
        """
        try:
            sanitized_phone = self._sanitize_phone(contact.destination)
            if not self._is_valid_br_international(sanitized_phone):
                return DispatchResult(
                    contact=contact,
                    success=False,
                    error=(
                        f"Telefone invalido para SMS: '{contact.destination}'. "
                        "Use o formato 55DDDNXXXXXXXX (ex: 5521999999999)."
                    ),
                )

            plain_message = self._html_to_text(message)
            personalized_message = plain_message.format(name=contact.name)

            # Adiciona o link da imagem no SMS se houver
            if image_url:
                personalized_message += f"\n\nVer imagem: {image_url}"

            msg = SmsMessage(
                to=sanitized_phone,
                from_=settings.VONAGE_PHONE_FROM,
                text=personalized_message,
                type="unicode",
            )

            response: SmsResponse = self.client.sms.send(msg)
            status = response.messages[0].status
            success = status == "0"
            error = response.messages[0].error_text if not success else ""

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
