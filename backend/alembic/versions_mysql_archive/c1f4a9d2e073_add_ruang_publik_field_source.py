"""tambah kolom ruang_publik.field_source

Revision ID: c1f4a9d2e073
Revises: b7e2c1049a3f
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1f4a9d2e073'
down_revision: Union[str, None] = 'b7e2c1049a3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # JSON MySQL tidak boleh punya DEFAULT, cukup nullable.
    # NULL = belum pernah diedit manual, jadi aman ditimpa ETL.
    op.add_column(
        'ruang_publik',
        sa.Column('field_source', sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('ruang_publik', 'field_source')
