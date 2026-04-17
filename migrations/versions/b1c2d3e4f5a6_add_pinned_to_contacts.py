"""add pinned to contacts

Revision ID: b1c2d3e4f5a6
Revises: 9d1f8f2b2e11
Create Date: 2026-04-11 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "9d1f8f2b2e11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("contacts")}

    if "pinned" not in existing_columns:
        op.add_column(
            "contacts",
            sa.Column("pinned", sa.Boolean(), nullable=True, server_default=sa.false()),
        )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("contacts")}

    if "pinned" in existing_columns:
        op.drop_column("contacts", "pinned")
