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
        for contact in contacts:
            # Aguarda o intervalo configurado antes de processar cada contato.
            if interval_seconds > 0:
                time.sleep(interval_seconds)

            name = contact["name"]

            # Disparo via Email
            if use_email and contact.get("email"):
                core_contact = CoreContact(name=name, destination=contact["email"])
                result = EmailChannel().send(
                    core_contact,
                    message,
                    image_url=image_url,
                    subject=email_subject,
                    attachments=campaign_attachments,
                )
                total += 1
                success += 1 if result.success else 0
                failed += 1 if not result.success else 0

            # Disparo via SMS
            if use_sms and contact.get("phone"):
                core_contact = CoreContact(name=name, destination=contact["phone"])
                result = SMSChannel().send(
                    core_contact,
                    message,
                    image_url=image_url,
                    sms_from=sms_from,
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
