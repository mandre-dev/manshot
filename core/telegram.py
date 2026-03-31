"""
telegram.py — Manshot
Canal de disparo via Telegram Bot API.
100% gratuito, sem limites de envio.
Suporta envio de imagem + legenda.
"""

import httpx
import re
from html import unescape
from html import escape
import unicodedata

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class TelegramChannel(BaseChannel):
    """
    Disparo de mensagens em massa via Telegram.
    O contato precisa ter iniciado uma conversa com o bot antes de receber mensagens.
    O campo 'destination' do Contact deve ser o chat_id do usuário.
    """

    def __init__(self):
        self.base_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"

    @staticmethod
    def _editor_html_to_telegram_html(message: str) -> str:
        if not message:
            return ""

        text = unescape(message)

        # Normaliza tags de formato suportadas pelo Telegram.
        text = re.sub(r"<\s*(strong|b)(\s+[^>]*)?>", "<b>", text, flags=re.IGNORECASE)
        text = re.sub(r"<\s*/\s*(strong|b)\s*>", "</b>", text, flags=re.IGNORECASE)
        text = re.sub(r"<\s*(em|i)(\s+[^>]*)?>", "<i>", text, flags=re.IGNORECASE)
        text = re.sub(r"<\s*/\s*(em|i)\s*>", "</i>", text, flags=re.IGNORECASE)
        text = re.sub(r"<\s*u(\s+[^>]*)?>", "<u>", text, flags=re.IGNORECASE)
        text = re.sub(r"<\s*/\s*u\s*>", "</u>", text, flags=re.IGNORECASE)

        # Blocos viram quebra de linha para manter legibilidade.
        text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"<p\s*[^>]*>", "", text, flags=re.IGNORECASE)

        # Remove qualquer tag nao suportada pelo Telegram.
        text = re.sub(r"<(?!/?(?:b|i|u)\b)[^>]+>", "", text, flags=re.IGNORECASE)

        # Executa unescape novamente para casos duplamente escapados.
        text = unescape(text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return unicodedata.normalize("NFC", text.strip())

    def send(
        self,
        contact: Contact,
        message: str,
        image_url: str = None,
        signature: str = None,
    ) -> DispatchResult:
        """
        Envia mensagem para um contato via Telegram.
        Se image_url for fornecida, envia imagem + legenda.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            telegram_html = self._editor_html_to_telegram_html(message)
            personalized_message = telegram_html.format(name=contact.name)

            if signature and signature.strip():
                sig = unicodedata.normalize("NFC", signature.strip())
                sig = sig.replace("[", "").replace("]", "")
                sig = escape(sig)
                prefix = f"[{sig}]"
                personalized_message = (
                    f"{prefix}\n{personalized_message}"
                    if personalized_message
                    else prefix
                )

            if image_url:
                # Envia imagem com legenda
                response = httpx.post(
                    f"{self.base_url}/sendPhoto",
                    json={
                        "chat_id": contact.destination,
                        "photo": image_url,
                        "caption": personalized_message,
                        "parse_mode": "HTML",
                    },
                    timeout=10,
                )
            else:
                # Envia só texto
                response = httpx.post(
                    f"{self.base_url}/sendMessage",
                    json={
                        "chat_id": contact.destination,
                        "text": personalized_message,
                        "parse_mode": "HTML",
                    },
                    timeout=10,
                )

            data = response.json()
            success = data.get("ok", False)
            error = data.get("description", "") if not success else ""

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
