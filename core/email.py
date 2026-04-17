"""
email.py — Manshot
Canal de disparo via Email usando Gmail SMTP.
Suporta personalização de mensagem, imagem inline e anexos de arquivo.
"""

import mimetypes
import smtplib
from smtplib import SMTPAuthenticationError
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

    def _get_connection(
        self,
        smtp_host: str | None = None,
        smtp_port: int | None = None,
        smtp_user: str | None = None,
        smtp_password: str | None = None,
    ):
        """Conexão SMTP (SSL na porta 465 ou STARTTLS na 587)."""
        host = (smtp_host or "smtp.gmail.com").strip()
        port = int(smtp_port or 465)
        user = (smtp_user or settings.GMAIL_USER or "").strip()
        password = smtp_password or settings.GMAIL_APP_PASSWORD or ""

        if port == 587:
            conn = smtplib.SMTP(host, port, timeout=30)
            conn.starttls()
            conn.login(user, password)
            return conn

        conn = smtplib.SMTP_SSL(host, port, timeout=30)
        conn.login(user, password)
        return conn

    def _is_html(self, text: str) -> bool:
        """Verifica se o texto contém tags HTML."""
        return "<" in text and ">" in text

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
        mime_type = (
            response.headers.get("content-type")
            or mimetypes.guess_type(filename)[0]
            or "application/octet-stream"
        )
        return filename, response.content, mime_type

    @staticmethod
    def _build_inline_image_part(
        image_url: str, content_id: str = "manshot-inline-image"
    ):
        resolved = EmailChannel._resolve_attachment(image_url)
        if not resolved:
            return None

        filename, file_bytes, mime_type = resolved
        maintype, subtype = (
            mime_type.split("/", 1) if "/" in mime_type else ("image", "jpeg")
        )
        if maintype != "image":
            return None

        image_part = MIMEImage(file_bytes, _subtype=subtype)
        image_part.add_header("Content-ID", f"<{content_id}>")
        image_part.add_header("Content-Disposition", "inline", filename=filename)
        return image_part

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

    def send(
        self,
        contact: Contact,
        message: str,
        image_url: str = None,
        subject: str = None,
        attachments: list | None = None,
        smtp_host: str | None = None,
        smtp_port: int | None = None,
        smtp_user: str | None = None,
        smtp_password: str | None = None,
        from_display_name: str | None = None,
    ) -> DispatchResult:
        """
        Envia email para um contato via Gmail SMTP.
        Se image_url for fornecida, incorpora a imagem no corpo do email em HTML.
        Se image_url apontar para um arquivo não-imagem, envia o arquivo como anexo.
        Se a mensagem contiver HTML, renderiza corretamente.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            effective_smtp_user = (smtp_user or settings.GMAIL_USER or "").strip()
            effective_from_name = (
                from_display_name
                or effective_smtp_user
                or settings.EMAIL_FROM_NAME
                or ""
            ).strip() or "Manshot"

            personalized_message = message.format(name=contact.name)
            attachment_items = self._normalize_attachment_items(attachments, image_url)
            resolved_items = []

            for item in attachment_items:
                resolved = self._resolve_attachment(item.get("url"))
                if resolved:
                    filename, file_bytes, mime_type = resolved
                    resolved_items.append(
                        {
                            "url": item.get("url"),
                            "filename": item.get("filename") or filename,
                            "kind": item.get("kind")
                            or ("image" if mime_type.startswith("image/") else "file"),
                            "bytes": file_bytes,
                            "mime_type": mime_type,
                        }
                    )

            is_image = bool(resolved_items) and resolved_items[0]["kind"] == "image"

            msg = MIMEMultipart("mixed")
            msg["Subject"] = subject or f"Mensagem de {effective_from_name}"
            msg["From"] = f"{effective_from_name} <{effective_smtp_user}>"
            msg["To"] = contact.destination

            body = MIMEMultipart("related")
            body_alt = MIMEMultipart("alternative")

            if resolved_items and is_image:
                first_image = resolved_items[0]
                image_part = self._build_inline_image_part(first_image["url"])
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

            attachment_payloads = resolved_items[1:] if is_image else resolved_items
            if not resolved_items and image_url:
                legacy = self._resolve_attachment(image_url)
                if legacy:
                    filename, file_bytes, mime_type = legacy
                    attachment_payloads = [
                        {
                            "filename": filename,
                            "bytes": file_bytes,
                            "mime_type": mime_type,
                        }
                    ]

            for item in attachment_payloads:
                filename = item["filename"]
                file_bytes = item["bytes"]
                mime_type = item["mime_type"]
                maintype, subtype = (
                    mime_type.split("/", 1)
                    if "/" in mime_type
                    else ("application", "octet-stream")
                )
                attachment_part = MIMEBase(maintype, subtype)
                attachment_part.set_payload(file_bytes)
                encoders.encode_base64(attachment_part)
                attachment_part.add_header(
                    "Content-Disposition", "attachment", filename=filename
                )
                msg.attach(attachment_part)

            with self._get_connection(
                smtp_host=smtp_host,
                smtp_port=smtp_port,
                smtp_user=smtp_user,
                smtp_password=smtp_password,
            ) as conn:
                conn.sendmail(effective_smtp_user, contact.destination, msg.as_string())

            return DispatchResult(contact=contact, success=True)

        except SMTPAuthenticationError as e:
            return DispatchResult(
                contact=contact,
                success=False,
                error=(
                    "Falha na autenticacao SMTP. Verifique se o email e a senha salvos "
                    "sao da conta que vai enviar e se a senha e uma app password do Gmail. "
                    f"Detalhe: {e}"
                ),
            )
        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
