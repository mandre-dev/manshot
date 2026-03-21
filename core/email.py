"""
email.py — Manshot
Canal de disparo via Email usando SendGrid.
Suporta personalização de mensagem por contato (ex: {name}).
"""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class EmailChannel(BaseChannel):
    """
    Disparo de emails em massa via SendGrid.
    Plano gratuito: até 100 emails/dia.
    """

    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)

    def send(self, contact: Contact, message: str) -> DispatchResult:
        """
        Envia email para um contato.
        A mensagem suporta variáveis: use {name} para personalizar.
        Ex: "Olá, {name}! Confira nossa novidade."
        """
        try:
            personalized_message = message.format(name=contact.name)

            mail = Mail(
                from_email=(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
                to_emails=contact.destination,
                subject=f"Mensagem de {settings.EMAIL_FROM_NAME}",
                plain_text_content=personalized_message
            )

            response = self.client.send(mail)

            # SendGrid retorna 202 para envio aceito
            success = response.status_code == 202
            return DispatchResult(contact=contact, success=success)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
