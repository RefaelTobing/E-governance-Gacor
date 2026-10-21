"""tambah tabel token_blacklist

Revision ID: tambah_tabel_token_blacklist
Revises: a1b2c3d4e5f6
Create Date: 2026-10-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'tambah_tabel_token_blacklist'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'token_blacklist',
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('jti'),
    )
    op.create_index('ix_token_blacklist_expires_at', 'token_blacklist', ['expires_at'])


def downgrade() -> None:
    op.drop_index('ix_token_blacklist_expires_at', table_name='token_blacklist')
    op.drop_table('token_blacklist')
