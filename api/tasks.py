"""
tasks.py — Manshot
Tarefas assíncronas do Celery.
O disparo em massa acontece aqui em background,
sem travar a API enquanto processa.
"""

from celery import Celery
from core import EmailChannel, SMSChannel, TelegramChannel
from core.base import Contact as CoreContact
from core.config import settings

# Configura o Celery com Redis como broker
celery_app = Celery(
    "manshot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_use_ssl={"ssl_cert_reqs": "CERT_NONE"},
    redis_backend_use_ssl={"ssl_cert_reqs": "CERT_NONE"},
)


@celery_app.task(bind=True, max_retries=3)
def dispatch_campaign(self, campaign_id: int, contacts: list, message: str,
                      use_email: bool, use_sms: bool, use_telegram: bool):
    """
    Tarefa principal de disparo.
    Processa todos os contatos em background.
    Retry automático em caso de falha.
    """
    from api.database import SessionLocal
    from api.models.campaign import Campaign, StatusEnum

    db = SessionLocal()
    total = 0
    success = 0
    failed = 0

    try:
        for contact in contacts:
            name = contact["name"]

            # Disparo via Email
            if use_email and contact.get("email"):
                core_contact = CoreContact(name=name, destination=contact["email"])
                result = EmailChannel().send(core_contact, message)
                total += 1
                success += 1 if result.success else 0
                failed += 1 if not result.success else 0

            # Disparo via SMS
            if use_sms and contact.get("phone"):
                core_contact = CoreContact(name=name, destination=contact["phone"])
                result = SMSChannel().send(core_contact, message)
                total += 1
                success += 1 if result.success else 0
                failed += 1 if not result.success else 0

            # Disparo via Telegram
            if use_telegram and contact.get("telegram_id"):
                core_contact = CoreContact(name=name, destination=contact["telegram_id"])
                result = TelegramChannel().send(core_contact, message)
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
        # Atualiza status para failed e tenta novamente
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = StatusEnum.failed
            db.commit()
        raise self.retry(exc=exc, countdown=60)

    finally:
        db.close()

    return {"total": total, "success": success, "failed": failed}
