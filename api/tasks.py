"""
tasks.py — Manshot
Tarefas assíncronas do Celery.
O disparo em massa acontece aqui em background,
sem travar a API enquanto processa.
"""

import ssl
import time
from celery import Celery
from core import EmailChannel, SMSChannel, TelegramChannel
from core.base import Contact as CoreContact
from core.config import settings

# Configura o Celery com Redis como broker
celery_app = Celery("manshot", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
    redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
)


@celery_app.task(bind=True, max_retries=3)
def dispatch_campaign(
    self,
    campaign_id: int,
    owner_email: str,
    contacts: list,
    message: str,
    use_email: bool,
    use_sms: bool,
    use_telegram: bool,
    image_url: str = None,
    attachments: list = None,
    email_subject: str = None,
    sms_from: str = None,
    telegram_signature: str = None,
    interval_seconds: float = 0,
    **kwargs,
):
    """
    Tarefa principal de disparo.
    Processa todos os contatos em background.
    Suporta envio de imagem via ImgBB e assunto personalizado no email.
    """
    from api.database import SessionLocal
    from api.models.campaign import Campaign, StatusEnum
    from api.models.user import User

    def normalize_attachments() -> list[dict]:
        normalized = []
        extra_attachments = kwargs.get("attachments") or []

        for item in extra_attachments:
            if isinstance(item, dict) and item.get("url"):
                normalized.append(item)
            elif isinstance(item, str) and item:
                normalized.append({"url": item})

        for item in attachments or []:
            if isinstance(item, dict) and item.get("url"):
                normalized.append(item)
            elif isinstance(item, str) and item:
                normalized.append({"url": item})

        if not normalized and image_url:
            normalized.append({"url": image_url})

        return normalized

    campaign_attachments = normalize_attachments()

    db = SessionLocal()
    total = 0
    success = 0
    failed = 0

    try:
        sender_user = None
        normalized_owner_email = (owner_email or "").strip().lower()
        is_admin_owner = normalized_owner_email == settings.ADMIN_EMAIL.lower()
        if normalized_owner_email and not is_admin_owner:
            sender_user = (
                db.query(User).filter(User.email == normalized_owner_email).first()
            )

        sender_email_smtp_host = (
            sender_user.sender_email_smtp_host if sender_user else None
        )
        sender_email_smtp_port = (
            sender_user.sender_email_smtp_port if sender_user else None
        )
        sender_email_user = sender_user.sender_email_user if sender_user else None
        sender_email_password = (
            sender_user.sender_email_password if sender_user else None
        )
        sender_email_from_name = (
            sender_user.sender_email_from_name if sender_user else None
        )
        sender_sms_vonage_key = (
            sender_user.sender_sms_vonage_key if sender_user else None
        )
        sender_sms_vonage_secret = (
            sender_user.sender_sms_vonage_secret if sender_user else None
        )
        sender_sms_default_from = (
            sender_user.sender_sms_default_from if sender_user else None
        )
        sender_telegram_bot_token = (
            sender_user.sender_telegram_bot_token if sender_user else None
        )

        can_send_user_email = is_admin_owner or (
            bool((sender_email_user or "").strip())
            and bool((sender_email_password or "").strip())
        )

        for contact in contacts:
            # Aguarda o intervalo configurado antes de processar cada contato.
            if interval_seconds > 0:
                time.sleep(interval_seconds)

            name = contact["name"]

            # Disparo via Email
            if use_email and contact.get("email"):
                if not can_send_user_email:
                    total += 1
                    failed += 1
                    print(
                        f"[EMAIL][campaign={campaign_id}] owner='{normalized_owner_email}' sem email/senha de remetente configurados."
                    )
                    continue

                core_contact = CoreContact(name=name, destination=contact["email"])
                result = EmailChannel().send(
                    core_contact,
                    message,
                    image_url=image_url,
                    subject=email_subject,
                    attachments=campaign_attachments,
                    smtp_host=sender_email_smtp_host,
                    smtp_port=sender_email_smtp_port,
                    smtp_user=sender_email_user,
                    smtp_password=sender_email_password,
                    from_display_name=sender_email_from_name,
                )
                total += 1
                success += 1 if result.success else 0
                failed += 1 if not result.success else 0
                if not result.success:
                    print(
                        f"[EMAIL][campaign={campaign_id}] owner='{normalized_owner_email}' sender='{sender_email_user or ''}' host='{sender_email_smtp_host or ''}' port='{sender_email_smtp_port or ''}' destino='{contact['email']}' erro='{result.error}'"
                    )

            # Disparo via SMS
            if use_sms and contact.get("phone"):
                core_contact = CoreContact(name=name, destination=contact["phone"])
                result = SMSChannel().send(
                    core_contact,
                    message,
                    image_url=image_url,
                    sms_from=sms_from or sender_sms_default_from,
                    vonage_key=sender_sms_vonage_key,
                    vonage_secret=sender_sms_vonage_secret,
                )
                total += 1
                success += 1 if result.success else 0
                failed += 1 if not result.success else 0
                if not result.success:
                    print(
                        f"[SMS][campaign={campaign_id}] contato='{name}' destino='{contact['phone']}' erro='{result.error}'"
                    )

            # Disparo via Telegram
            if use_telegram and contact.get("telegram_id"):
                core_contact = CoreContact(
                    name=name, destination=contact["telegram_id"]
                )
                result = TelegramChannel().send(
                    core_contact,
                    message,
                    image_url=image_url,
                    signature=telegram_signature,
                    attachments=campaign_attachments,
                    bot_token=sender_telegram_bot_token,
                )
                total += 1
                success += 1 if result.success else 0
                failed += 1 if not result.success else 0

        # Atualiza métricas no banco
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.total = total
            campaign.success = success
            campaign.failed = failed
            campaign.status = StatusEnum.done
            db.commit()

    except Exception as exc:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = StatusEnum.failed
            db.commit()
        raise self.retry(exc=exc, countdown=60)

    finally:
        db.close()

    return {"total": total, "success": success, "failed": failed}
