"""add owner_email to contacts and campaigns

Revision ID: b3f1a2c9d8e0
Revises: 4a47b6a23fb4
Create Date: 2026-04-08 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b3f1a2c9d8e0"
down_revision: Union[str, Sequence[str], None] = "4a47b6a23fb4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_OWNER_EMAIL = "admin@manshot.local"


def upgrade() -> None:
    op.add_column("contacts", sa.Column("owner_email", sa.String(), nullable=True))
    op.add_column("campaigns", sa.Column("owner_email", sa.String(), nullable=True))

    # Dados legados ficam associados ao admin existente.
    op.execute(
        sa.text(
            "UPDATE contacts SET owner_email = :owner WHERE owner_email IS NULL OR owner_email = ''"
        ).bindparams(owner=DEFAULT_OWNER_EMAIL)
    )
    op.execute(
        sa.text(
            "UPDATE campaigns SET owner_email = :owner WHERE owner_email IS NULL OR owner_email = ''"
        ).bindparams(owner=DEFAULT_OWNER_EMAIL)
    )

    op.create_index("ix_contacts_owner_email", "contacts", ["owner_email"], unique=False)
    op.create_index("ix_campaigns_owner_email", "campaigns", ["owner_email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_campaigns_owner_email", table_name="campaigns")
    op.drop_index("ix_contacts_owner_email", table_name="contacts")
    op.drop_column("campaigns", "owner_email")
    op.drop_column("contacts", "owner_email")
