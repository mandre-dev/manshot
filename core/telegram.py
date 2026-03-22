"""
telegram.py — Manshot
Canal de disparo via Telegram Bot API.
100% gratuito, sem limites de envio.
Suporta envio de imagem + legenda.
"""

import httpx

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

    def send(self, contact: Contact, message: str, image_url: str = None) -> DispatchResult:
        """
        Envia mensagem para um contato via Telegram.
        Se image_url for fornecida, envia imagem + legenda.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)

            if image_url:
                # Envia imagem com legenda
                response = httpx.post(
                    f"{self.base_url}/sendPhoto",
                    json={
                        "chat_id": contact.destination,
                        "photo": image_url,
                        "caption": personalized_message,
                        "parse_mode": "Markdown"
                    },
                    timeout=10
                )
            else:
                # Envia só texto
                response = httpx.post(
                    f"{self.base_url}/sendMessage",
                    json={
                        "chat_id": contact.destination,
                        "text": personalized_message,
                        "parse_mode": "Markdown"
                    },
                    timeout=10
                )

            data = response.json()
            success = data.get("ok", False)
            error = data.get("description", "") if not success else ""

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))