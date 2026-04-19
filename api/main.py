from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from api.database import engine, Base
from api.routes import contacts_router, campaigns_router, auth_router
from api.upload import router as upload_router
from core.config import settings

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"


def ensure_campaign_attachments_column() -> None:
    inspector = inspect(engine)
    if "campaigns" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("campaigns")}
    required_columns = {
        "attachments_json": "TEXT",
        "task_id": "VARCHAR",
        "pinned": "BOOLEAN DEFAULT 0",
    }

    with engine.begin() as connection:
        for column_name, column_type in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE campaigns ADD COLUMN {column_name} {column_type}"
                    )
                )


def ensure_contact_pinned_column() -> None:
    inspector = inspect(engine)
    if "contacts" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("contacts")}
    if "pinned" in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE contacts ADD COLUMN pinned BOOLEAN DEFAULT 0"))


def ensure_user_sender_credential_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("users")}
    additions = [
        ("sender_email_smtp_host", "VARCHAR"),
        ("sender_email_smtp_port", "INTEGER"),
        ("sender_email_user", "VARCHAR"),
        ("sender_email_password", "VARCHAR"),
        ("sender_email_from_name", "VARCHAR"),
        ("sender_sms_vonage_key", "VARCHAR"),
        ("sender_sms_vonage_secret", "VARCHAR"),
        ("sender_sms_default_from", "VARCHAR"),
        ("sender_telegram_bot_token", "VARCHAR"),
    ]

    with engine.begin() as connection:
        for column_name, column_type in additions:
            if column_name not in existing:
                connection.execute(
                    text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                )


# Cria as tabelas no banco de dados automaticamente
Base.metadata.create_all(bind=engine)
ensure_campaign_attachments_column()
ensure_contact_pinned_column()
ensure_user_sender_credential_columns()

app = FastAPI(
    title="Manshot API",
    description="Ferramenta de disparo em massa multi-canal — Email, SMS e Telegram",
    version="1.0.0",
)


def build_cors_origins() -> list[str]:
    default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
    extra_origins = [
        origin.strip().rstrip("/")
        for origin in settings.CORS_ALLOW_ORIGINS.split(",")
        if origin.strip()
    ]

    # dict.fromkeys preserves order while removing duplicates
    return list(dict.fromkeys(default_origins + extra_origins))


cors_origins = build_cors_origins()

# CORS — permite o dashboard React fazer requisições para a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas
app.include_router(contacts_router)
app.include_router(campaigns_router)
app.include_router(upload_router)
app.include_router(auth_router)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/")
def root():
    return {"app": "Manshot", "version": "1.0.0", "docs": "/docs", "status": "online"}
