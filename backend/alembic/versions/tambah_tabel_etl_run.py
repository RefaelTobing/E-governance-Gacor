"""tambah tabel etl_run

Revision ID: tambah_tabel_etl_run
Revises: d7b19b0b82cc
Create Date: 2026-10-04 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'tambah_tabel_etl_run'
down_revision: Union[str, None] = 'd7b19b0b82cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'etl_run',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pemicu', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('mulai', sa.DateTime(), nullable=False),
        sa.Column('selesai', sa.DateTime(), nullable=True),
        sa.Column('tahap_gagal', sa.String(length=50), nullable=True),
        sa.Column('hitung', sa.JSON(), nullable=True),
        sa.Column('tahap', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('etl_run')
