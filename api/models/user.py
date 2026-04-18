"""
models/user.py — Manshot
Tabela de usuários para autenticação na plataforma.
"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from api.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Credenciais de remetente por usuário (campanhas). Se vazio, usa .env do servidor.
    sender_email_smtp_host = Column(String, nullable=True)
    sender_email_smtp_port = Column(Integer, nullable=True)
    sender_email_user = Column(String, nullable=True)
    sender_email_password = Column(String, nullable=True)
    sender_email_from_name = Column(String, nullable=True)
    sender_sms_vonage_key = Column(String, nullable=True)
    sender_sms_vonage_secret = Column(String, nullable=True)
    sender_sms_default_from = Column(String, nullable=True)
    sender_telegram_bot_token = Column(String, nullable=True)
