"""
database.py — Manshot
Configura a conexão com o banco de dados SQLite.
SQLite é perfeito para desenvolvimento local — sem precisar instalar nada.
Na Fase de deploy migramos para PostgreSQL no Supabase.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Banco de dados local — arquivo manshot.db na raiz do projeto
DATABASE_URL = "sqlite:///./manshot.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # necessário para SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency do FastAPI — injeta a sessão do banco em cada endpoint.
    Garante que a sessão seja fechada após cada requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
