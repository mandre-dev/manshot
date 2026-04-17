"""add attachments_json to campaigns

Revision ID: 9d1f8f2b2e11
Revises: 0f3d2be63a91
Create Date: 2026-04-09 11:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "9d1f8f2b2e11"
down_revision: Union[str, Sequence[str], None] = "0f3d2be63a91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("campaigns")}

    if "attachments_json" not in existing_columns:
        op.add_column(
            "campaigns", sa.Column("attachments_json", sa.Text(), nullable=True)
        )

    if "task_id" not in existing_columns:
        op.add_column("campaigns", sa.Column("task_id", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("campaigns")}

    if "task_id" in existing_columns:
        op.drop_column("campaigns", "task_id")

    if "attachments_json" in existing_columns:
        op.drop_column("campaigns", "attachments_json")
