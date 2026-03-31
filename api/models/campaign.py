"""
models/campaign.py — Manshot
Tabela de campanhas no banco de dados.
Uma campanha pode disparar em um ou mais canais simultaneamente.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from api.database import Base
import enum


class StatusEnum(str, enum.Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    message = Column(String, nullable=False)
    email_subject = Column(String, nullable=True)  # Assunto do email
    sms_from = Column(String, nullable=True)  # Remetente customizado do SMS
    image_url = Column(String, nullable=True)  # URL da imagem no ImgBB

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

    def __repr__(self):
        return f"<Campaign {self.name}>"
