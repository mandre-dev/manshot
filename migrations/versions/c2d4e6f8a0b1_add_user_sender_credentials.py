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
    op.add_column("users", sa.Column("sender_email_smtp_host", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_email_smtp_port", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("sender_email_user", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_email_password", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_email_from_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_sms_vonage_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_sms_vonage_secret", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_sms_default_from", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sender_telegram_bot_token", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "sender_telegram_bot_token")
    op.drop_column("users", "sender_sms_default_from")
    op.drop_column("users", "sender_sms_vonage_secret")
    op.drop_column("users", "sender_sms_vonage_key")
    op.drop_column("users", "sender_email_from_name")
    op.drop_column("users", "sender_email_password")
    op.drop_column("users", "sender_email_user")
    op.drop_column("users", "sender_email_smtp_port")
    op.drop_column("users", "sender_email_smtp_host")
