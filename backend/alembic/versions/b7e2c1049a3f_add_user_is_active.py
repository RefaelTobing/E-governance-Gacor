"""tambah kolom users.is_active

Revision ID: b7e2c1049a3f
Revises: 34fc1fc4d761
Create Date: 2026-09-29 08:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e2c1049a3f'
down_revision: Union[str, None] = '34fc1fc4d761'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baris users yang sudah ada dianggap aktif, supaya admin lama tidak ikut
    # terkunci saat migrasi ini jalan.
    op.add_column(
        'users',
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
    )
    op.execute('UPDATE users SET is_active = 1 WHERE is_active IS NULL')
    # existing_type wajib diisi: MySQL menolak CHANGE/MODIFY tanpa tipe lama.
    op.alter_column(
        'users',
        'is_active',
        existing_type=sa.Boolean(),
        nullable=False,
        server_default='1',
    )


def downgrade() -> None:
    op.drop_column('users', 'is_active')
