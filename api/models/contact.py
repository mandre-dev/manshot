"""
models/contact.py — Manshot
Tabela de contatos no banco de dados.
Cada contato tem nome e destinos para cada canal.
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from api.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    owner_email = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    telegram_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Contact {self.name}>"
