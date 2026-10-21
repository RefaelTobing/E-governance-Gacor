"""tambah_kolom_lokasi_pilihan_laporan

Revision ID: 3996fdaf0f5f
Revises: 74d05cd21291
Create Date: 2026-10-07 13:52:30.171824

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3996fdaf0f5f'
down_revision: Union[str, None] = '74d05cd21291'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('laporan', sa.Column('lat_lokasi_pilihan', sa.Float(), nullable=True))
    op.add_column('laporan', sa.Column('long_lokasi_pilihan', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('laporan', 'long_lokasi_pilihan')
    op.drop_column('laporan', 'lat_lokasi_pilihan')
