"""
main.py — Manshot
Entrada principal da API FastAPI.
Acesse /docs para ver a documentação automática.
"""

from fastapi import FastAPI
from api.database import engine, Base
from api.routes import contacts_router, campaigns_router

# Cria as tabelas no banco de dados automaticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Manshot API",
    description="Ferramenta de disparo em massa multi-canal — Email, SMS e Telegram",
    version="1.0.0"
)

# Registra as rotas
app.include_router(contacts_router)
app.include_router(campaigns_router)


@app.get("/")
def root():
    return {
        "app": "Manshot",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online"
    }
