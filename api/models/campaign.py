"""
models/campaign.py — Manshot
Tabela de campanhas no banco de dados.
Uma campanha é um disparo em massa para uma lista de contatos.
"""

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from api.database import Base
import enum


class ChannelEnum(str, enum.Enum):
    email = "email"
    sms = "sms"
    telegram = "telegram"


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
    channel = Column(Enum(ChannelEnum), nullable=False)
    status = Column(Enum(StatusEnum), default=StatusEnum.pending)
    total = Column(Integer, default=0)
    success = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Campaign {self.name} - {self.channel}>"
