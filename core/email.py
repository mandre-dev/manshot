"""
email.py — Manshot
Canal de disparo via Email usando Gmail SMTP.
Suporta personalização de mensagem e envio de imagem.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


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

    def send(self, contact: Contact, message: str, image_url: str = None, subject: str = None) -> DispatchResult:
        """
        Envia email para um contato via Gmail SMTP.
        Se image_url for fornecida, incorpora a imagem no corpo do email em HTML.
        Se a mensagem contiver HTML, renderiza corretamente.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject or f"Mensagem de {settings.EMAIL_FROM_NAME}"
            msg["From"]    = f"{settings.EMAIL_FROM_NAME} <{settings.GMAIL_USER}>"
            msg["To"]      = contact.destination

            if image_url:
                html_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <img src="{image_url}" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />
                    <div style="font-size: 16px; color: #333; line-height: 1.6;">{personalized_message}</div>
                </div>
                """
                msg.attach(MIMEText(html_body, "html"))
            else:
                if self._is_html(personalized_message):
                    # Mensagem com formatação HTML (negrito, itálico, sublinhado)
                    html_body = f"""
                    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
                        {personalized_message}
                    </div>
                    """
                    msg.attach(MIMEText(html_body, "html"))
                else:
                    # Mensagem texto puro
                    msg.attach(MIMEText(personalized_message, "plain"))

            with self._get_connection() as conn:
                conn.sendmail(settings.GMAIL_USER, contact.destination, msg.as_string())

            return DispatchResult(contact=contact, success=True)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))