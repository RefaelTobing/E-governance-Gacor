"""tambah_alasan_penolakan_laporan

Revision ID: a1b2c3d4e5f6
Revises: fe1d83da4fca
Create Date: 2026-10-09 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'fe1d83da4fca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('laporan', sa.Column('alasan_penolakan', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('laporan', 'alasan_penolakan')
