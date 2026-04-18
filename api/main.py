from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from api.database import engine, Base, SessionLocal
from api.routes import contacts_router, campaigns_router, auth_router
from api.upload import router as upload_router

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
        connection.execute(
            text("ALTER TABLE contacts ADD COLUMN pinned BOOLEAN DEFAULT 0")
        )


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


def ensure_user_is_admin_column() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    if "is_admin" in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        )


def create_admin_user() -> None:
    from api.models import User
    from core.auth import get_password_hash
    from core.config import settings

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin criado: {settings.ADMIN_EMAIL}")
        else:
            print(f"ℹ️ Admin já existe: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


# Cria as tabelas no banco de dados automaticamente
Base.metadata.create_all(bind=engine)
ensure_campaign_attachments_column()
ensure_contact_pinned_column()
ensure_user_sender_credential_columns()
ensure_user_is_admin_column()
create_admin_user()

app = FastAPI(
    title="Manshot API",
    description="Ferramenta de disparo em massa multi-canal — Email, SMS e Telegram",
    version="1.0.0",
)

# CORS — permite o dashboard React fazer requisições para a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
