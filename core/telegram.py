"""
telegram.py — Manshot
Canal de disparo via Telegram Bot API.
100% gratuito, sem limites de envio.
Suporta envio de imagem + legenda e documentos.
"""

import httpx
import re
import mimetypes
import unicodedata
from html import escape
from html import unescape
from pathlib import Path
from urllib.parse import urlparse

from .base import BaseChannel, Contact, DispatchResult
from .config import settings

PROJECT_ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = PROJECT_ROOT / "uploads"
PREFIX_RE = re.compile(r"^[0-9a-f]{8}_(.+)$", re.IGNORECASE)


class TelegramChannel(BaseChannel):
    """
    Disparo de mensagens em massa via Telegram.
    O contato precisa ter iniciado uma conversa com o bot antes de receber mensagens.
    O campo 'destination' do Contact deve ser o chat_id do usuário.
    """

    @staticmethod
    def _build_base_url(bot_token: str | None = None) -> str:
        token = (bot_token or settings.TELEGRAM_BOT_TOKEN or "").strip()
        return f"https://api.telegram.org/bot{token}"

    @staticmethod
    def _is_image_attachment(attachment_url: str) -> bool:
        if not attachment_url:
            return False

        lower_url = urlparse(attachment_url).path.lower()
        return lower_url.endswith(
            (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg")
        )

    @staticmethod
    def _resolve_attachment(attachment_url: str):
        def display_name(name: str) -> str:
            match = PREFIX_RE.match(name or "")
            return match.group(1) if match else name

        if not attachment_url:
            return None

        parsed_path = urlparse(attachment_url).path.lstrip("/")
        candidate_path = Path(parsed_path)
        if candidate_path.exists():
            filename = display_name(candidate_path.name)
            mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            return filename, candidate_path.read_bytes(), mime_type

        uploads_candidate = UPLOADS_DIR / Path(parsed_path).name
        if uploads_candidate.exists():
            filename = display_name(uploads_candidate.name)
            mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            return filename, uploads_candidate.read_bytes(), mime_type

        response = httpx.get(attachment_url, timeout=30)
        response.raise_for_status()
        filename = display_name(Path(urlparse(attachment_url).path).name or "anexo")
        mime_type = (
            response.headers.get("content-type")
            or mimetypes.guess_type(filename)[0]
            or "application/octet-stream"
        )
        return filename, response.content, mime_type

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

    @staticmethod
    def _normalize_attachment_items(
        attachments: list | None, image_url: str = None
    ) -> list[dict]:
        normalized = []

        for item in attachments or []:
            if isinstance(item, dict) and item.get("url"):
                normalized.append(item)
            elif isinstance(item, str) and item:
                normalized.append({"url": item})

        if not normalized and image_url:
            normalized.append({"url": image_url})

        return normalized

    @staticmethod
    def _friendly_telegram_error(raw_error: str) -> str:
        message = (raw_error or "").strip()
        lowered = message.lower()

        if (
            "bot can't initiate conversation" in lowered
            or "chat not found" in lowered
            or "bot was blocked by the user" in lowered
        ):
            return (
                "Contato sem ativacao no Telegram. "
                "Peca para o usuario abrir o bot e clicar em /start antes do disparo."
            )

        if "user is deactivated" in lowered:
            return "Conta Telegram desativada para este contato."

        return message

    def send(
        self,
        contact: Contact,
        message: str,
        image_url: str = None,
        signature: str = None,
        attachments: list | None = None,
        bot_token: str | None = None,
    ) -> DispatchResult:
        """
        Envia mensagem para um contato via Telegram.
        Se image_url for fornecida, envia imagem + legenda.
        Se image_url apontar para um arquivo não-imagem, envia como documento.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            resolved_bot_token = (
                bot_token or settings.TELEGRAM_BOT_TOKEN or ""
            ).strip()
            if not resolved_bot_token:
                return DispatchResult(
                    contact=contact,
                    success=False,
                    error="Token do bot Telegram não configurado para este usuário.",
                )

            base_url = self._build_base_url(resolved_bot_token)
            telegram_html = self._editor_html_to_telegram_html(message)
            personalized_message = telegram_html.format(name=contact.name)
            attachment_items = self._normalize_attachment_items(attachments, image_url)

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

            if attachment_items:
                response = None
                for index, item in enumerate(attachment_items):
                    resolved = self._resolve_attachment(item.get("url"))
                    if not resolved:
                        continue

                    filename, file_bytes, mime_type = resolved
                    kind = item.get("kind") or (
                        "image" if mime_type.startswith("image/") else "file"
                    )
                    caption = personalized_message if index == 0 else ""

                    if kind == "image":
                        response = httpx.post(
                            f"{base_url}/sendPhoto",
                            data={
                                "chat_id": contact.destination,
                                "caption": caption,
                                "parse_mode": "HTML",
                            },
                            files={"photo": (filename, file_bytes, mime_type)},
                            timeout=30,
                        )
                    else:
                        response = httpx.post(
                            f"{base_url}/sendDocument",
                            data={
                                "chat_id": contact.destination,
                                "caption": caption,
                                "parse_mode": "HTML",
                            },
                            files={"document": (filename, file_bytes, mime_type)},
                            timeout=30,
                        )
            else:
                # Envia só texto
                response = httpx.post(
                    f"{base_url}/sendMessage",
                    json={
                        "chat_id": contact.destination,
                        "text": personalized_message,
                        "parse_mode": "HTML",
                    },
                    timeout=10,
                )

            data = response.json()
            success = data.get("ok", False)
            error = (
                self._friendly_telegram_error(data.get("description", ""))
                if not success
                else ""
            )

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
