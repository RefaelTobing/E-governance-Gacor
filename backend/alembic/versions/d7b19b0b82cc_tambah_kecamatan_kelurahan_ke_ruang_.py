"""tambah kolom kecamatan & kelurahan ke ruang_publik

Revision ID: d7b19b0b82cc
Revises: c1f4a9d2e073
Create Date: 2026-10-04 13:23:55.882882

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd7b19b0b82cc'
down_revision: Union[str, None] = 'c1f4a9d2e073'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Dipakai kunci natural saat merge ETL (BE-16); nullable karena baris lama
    # baru terisi saat seed berikutnya.
    op.add_column('ruang_publik', sa.Column('kecamatan', sa.String(length=100), nullable=True))
    op.add_column('ruang_publik', sa.Column('kelurahan', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('ruang_publik', 'kelurahan')
    op.drop_column('ruang_publik', 'kecamatan')
