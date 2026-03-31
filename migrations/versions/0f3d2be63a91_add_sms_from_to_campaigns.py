"""add sms_from to campaigns

Revision ID: 0f3d2be63a91
Revises: 7f7ee160ac56
Create Date: 2026-03-30 23:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0f3d2be63a91"
down_revision: Union[str, Sequence[str], None] = "7f7ee160ac56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("campaigns", sa.Column("sms_from", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("campaigns", "sms_from")
