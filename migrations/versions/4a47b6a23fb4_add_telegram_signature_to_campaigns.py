"""add telegram_signature to campaigns

Revision ID: 4a47b6a23fb4
Revises: 0f3d2be63a91
Create Date: 2026-03-31 00:25:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "4a47b6a23fb4"
down_revision: Union[str, Sequence[str], None] = "0f3d2be63a91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "campaigns", sa.Column("telegram_signature", sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("campaigns", "telegram_signature")
