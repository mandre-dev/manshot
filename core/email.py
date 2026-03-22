"""
email.py — Manshot
Canal de disparo via Email usando SendGrid.
Suporta personalização de mensagem e envio de imagem.
"""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class EmailChannel(BaseChannel):
    """
    Disparo de emails em massa via SendGrid.
    Plano gratuito: até 100 emails/dia.
    """

    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)

    def send(self, contact: Contact, message: str, image_url: str = None) -> DispatchResult:
        """
        Envia email para um contato.
        Se image_url for fornecida, incorpora a imagem no corpo do email em HTML.
        A mensagem suporta variáveis: use {name} para personalizar.
        """
        try:
            personalized_message = message.format(name=contact.name)

            if image_url:
                # Email com imagem em HTML
                html_content = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <img src="{image_url}" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">{personalized_message}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #999;">Enviado via Manshot</p>
                </div>
                """
                mail = Mail(
                    from_email=(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
                    to_emails=contact.destination,
                    subject=f"Mensagem de {settings.EMAIL_FROM_NAME}",
                    html_content=html_content
                )
            else:
                # Email só texto
                mail = Mail(
                    from_email=(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
                    to_emails=contact.destination,
                    subject=f"Mensagem de {settings.EMAIL_FROM_NAME}",
                    plain_text_content=personalized_message
                )

            response = self.client.send(mail)
            success = response.status_code == 202
            return DispatchResult(contact=contact, success=success)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))