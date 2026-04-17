"""add per-user sender credentials (email, sms, telegram)

Revision ID: c2d4e6f8a0b1
Revises: b3f1a2c9d8e0, b1c2d3e4f5a6
Create Date: 2026-04-12 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c2d4e6f8a0b1"
down_revision: Union[str, Sequence[str], None] = ("b3f1a2c9d8e0", "b1c2d3e4f5a6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("users")}

    columns_to_add = [
        sa.Column("sender_email_smtp_host", sa.String(), nullable=True),
        sa.Column("sender_email_smtp_port", sa.Integer(), nullable=True),
        sa.Column("sender_email_user", sa.String(), nullable=True),
        sa.Column("sender_email_password", sa.String(), nullable=True),
        sa.Column("sender_email_from_name", sa.String(), nullable=True),
        sa.Column("sender_sms_vonage_key", sa.String(), nullable=True),
        sa.Column("sender_sms_vonage_secret", sa.String(), nullable=True),
        sa.Column("sender_sms_default_from", sa.String(), nullable=True),
        sa.Column("sender_telegram_bot_token", sa.String(), nullable=True),
    ]

    for column in columns_to_add:
        if column.name not in existing_columns:
            op.add_column("users", column)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("users")}

    columns_to_drop = [
        "sender_telegram_bot_token",
        "sender_sms_default_from",
        "sender_sms_vonage_secret",
        "sender_sms_vonage_key",
        "sender_email_from_name",
        "sender_email_password",
        "sender_email_user",
        "sender_email_smtp_port",
        "sender_email_smtp_host",
    ]

    for column_name in columns_to_drop:
        if column_name in existing_columns:
            op.drop_column("users", column_name)
