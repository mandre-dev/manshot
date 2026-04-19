"""add email_subject to campaigns

Revision ID: 7f7ee160ac56
Revises: 
Create Date: 2026-03-28 20:32:37.623656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f7ee160ac56'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("password_hash", sa.String(), nullable=False),
            sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("email"),
        )
        op.create_index("ix_users_email", "users", ["email"], unique=False)
        op.create_index("ix_users_id", "users", ["id"], unique=False)

    if "contacts" not in existing_tables:
        op.create_table(
            "contacts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=True),
            sa.Column("phone", sa.String(), nullable=True),
            sa.Column("telegram_id", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_contacts_id", "contacts", ["id"], unique=False)

    if "campaigns" not in existing_tables:
        op.create_table(
            "campaigns",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("message", sa.String(), nullable=False),
            sa.Column("email_subject", sa.String(), nullable=True),
            sa.Column("image_url", sa.String(), nullable=True),
            sa.Column("use_email", sa.Boolean(), nullable=True, server_default=sa.false()),
            sa.Column("use_sms", sa.Boolean(), nullable=True, server_default=sa.false()),
            sa.Column("use_telegram", sa.Boolean(), nullable=True, server_default=sa.false()),
            sa.Column(
                "status",
                sa.Enum("pending", "running", "done", "failed", name="statusenum"),
                nullable=True,
                server_default="pending",
            ),
            sa.Column("total", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("success", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("failed", sa.Integer(), nullable=True, server_default="0"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_campaigns_id", "campaigns", ["id"], unique=False)
    else:
        existing_columns = {column["name"] for column in inspector.get_columns("campaigns")}
        if "email_subject" not in existing_columns:
            op.add_column(
                "campaigns", sa.Column("email_subject", sa.String(), nullable=True)
            )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "campaigns" in inspector.get_table_names():
        existing_columns = {column["name"] for column in inspector.get_columns("campaigns")}
        if "email_subject" in existing_columns:
            op.drop_column("campaigns", "email_subject")
