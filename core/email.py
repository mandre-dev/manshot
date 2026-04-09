"""
email.py — Manshot
Canal de disparo via Email usando Gmail SMTP.
Suporta personalização de mensagem, imagem inline e anexos de arquivo.
"""

import mimetypes
import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.text import MIMEText
from pathlib import Path
import re
from urllib.parse import urlparse

import httpx

from .base import BaseChannel, Contact, DispatchResult
from .config import settings

PROJECT_ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = PROJECT_ROOT / "uploads"
PREFIX_RE = re.compile(r"^[0-9a-f]{8}_(.+)$", re.IGNORECASE)


class EmailChannel(BaseChannel):
    """
    Disparo de emails em massa via Gmail SMTP.
    Plano gratuito: até 500 emails/dia.
    Requer uma conta Gmail com App Password habilitado.
    """

    def _get_connection(self) -> smtplib.SMTP_SSL:
        """Cria e retorna uma conexão autenticada com o Gmail SMTP."""
        conn = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        conn.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
        return conn

    def _is_html(self, text: str) -> bool:
        """Verifica se o texto contém tags HTML."""
        return "<" in text and ">" in text

    @staticmethod
    def _is_image_attachment(attachment_url: str) -> bool:
        if not attachment_url:
            return False

        lower_url = urlparse(attachment_url).path.lower()
        return lower_url.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"))

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
            # Remove UUID prefix (formato: {8_hex_chars}_{nome_original})
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
        mime_type = response.headers.get("content-type") or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        return filename, response.content, mime_type

    @staticmethod
    def _build_inline_image_part(image_url: str, content_id: str = "manshot-inline-image"):
        resolved = EmailChannel._resolve_attachment(image_url)
        if not resolved:
            return None

        filename, file_bytes, mime_type = resolved
        maintype, subtype = (mime_type.split("/", 1) if "/" in mime_type else ("image", "jpeg"))
        if maintype != "image":
            return None

        image_part = MIMEImage(file_bytes, _subtype=subtype)
        image_part.add_header("Content-ID", f"<{content_id}>")
        image_part.add_header("Content-Disposition", "inline", filename=filename)
        return image_part

    def send(self, contact: Contact, message: str, image_url: str = None, subject: str = None) -> DispatchResult:
        """
        Envia email para um contato via Gmail SMTP.
        Se image_url for fornecida, incorpora a imagem no corpo do email em HTML.
        Se image_url apontar para um arquivo não-imagem, envia o arquivo como anexo.
        Se a mensagem contiver HTML, renderiza corretamente.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)
            is_image = self._is_image_attachment(image_url)

            msg = MIMEMultipart("mixed")
            msg["Subject"] = subject or f"Mensagem de {settings.EMAIL_FROM_NAME}"
            msg["From"]    = f"{settings.EMAIL_FROM_NAME} <{settings.GMAIL_USER}>"
            msg["To"]      = contact.destination

            body = MIMEMultipart("related")
            body_alt = MIMEMultipart("alternative")

            if image_url and is_image:
                image_part = self._build_inline_image_part(image_url)
                html_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <img src="cid:manshot-inline-image" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />
                    <div style="font-size: 16px; color: #333; line-height: 1.6;">{personalized_message}</div>
                </div>
                """
                body_alt.attach(MIMEText(html_body, "html"))
                body.attach(body_alt)
                if image_part:
                    body.attach(image_part)
            else:
                if self._is_html(personalized_message):
                    # Mensagem com formatação HTML (negrito, itálico, sublinhado)
                    html_body = f"""
                    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
                        {personalized_message}
                    </div>
                    """
                    body_alt.attach(MIMEText(html_body, "html"))
                else:
                    # Mensagem texto puro
                    body_alt.attach(MIMEText(personalized_message, "plain"))

                body.attach(body_alt)

            msg.attach(body)

            if image_url and not is_image:
                filename, file_bytes, mime_type = self._resolve_attachment(image_url)
                maintype, subtype = (mime_type.split("/", 1) if "/" in mime_type else ("application", "octet-stream"))
                attachment_part = MIMEBase(maintype, subtype)
                attachment_part.set_payload(file_bytes)
                encoders.encode_base64(attachment_part)
                attachment_part.add_header("Content-Disposition", "attachment", filename=filename)
                msg.attach(attachment_part)

            with self._get_connection() as conn:
                conn.sendmail(settings.GMAIL_USER, contact.destination, msg.as_string())

            return DispatchResult(contact=contact, success=True)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))