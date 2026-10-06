"""hapus kolom fasilitas.lokasi_spesifik

Revision ID: hapus_lokasi_spesifik_fasilitas
Revises: 37c407708e27
Create Date: 2026-10-06 09:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'hapus_lokasi_spesifik_fasilitas'
down_revision: Union[str, None] = '37c407708e27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('fasilitas', 'lokasi_spesifik')


def downgrade() -> None:
    op.add_column('fasilitas', sa.Column('lokasi_spesifik', sa.String(length=255), nullable=True))
