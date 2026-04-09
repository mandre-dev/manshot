"""
models/campaign.py — Manshot
Tabela de campanhas no banco de dados.
Uma campanha pode disparar em um ou mais canais simultaneamente.
"""

import json
import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy import Text
from sqlalchemy.sql import func
from api.database import Base


class StatusEnum(str, enum.Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    owner_email = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    message = Column(String, nullable=False)
    email_subject = Column(String, nullable=True)  # Assunto do email
    sms_from = Column(String, nullable=True)  # Remetente customizado do SMS
    telegram_signature = Column(
        String, nullable=True
    )  # Assinatura customizada no Telegram
    image_url = Column(String, nullable=True)  # URL da imagem no ImgBB
    attachments_json = Column(Text, nullable=True)  # Lista de anexos em JSON
    task_id = Column(String, nullable=True)  # ID da task Celery associada

    # Canais — o usuário escolhe um ou mais
    use_email = Column(Boolean, default=False)
    use_sms = Column(Boolean, default=False)
    use_telegram = Column(Boolean, default=False)

    # Métricas
    status = Column(Enum(StatusEnum), default=StatusEnum.pending)
    total = Column(Integer, default=0)
    success = Column(Integer, default=0)
    failed = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())

    @property
    def attachments(self):
        if not self.attachments_json:
            return []

        try:
            parsed = json.loads(self.attachments_json)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []

    @attachments.setter
    def attachments(self, value):
        self.attachments_json = json.dumps(value or [], ensure_ascii=False)

    def __repr__(self):
        return f"<Campaign {self.name}>"
