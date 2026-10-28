"""tabel foto_like (BE-58)

Revision ID: b7e8c9d0a112
Revises: 05c54b098320
Create Date: 2026-10-28 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e8c9d0a112'
down_revision: Union[str, None] = '05c54b098320'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('foto_like',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('laporan_id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['laporan_id'], ['laporan.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('laporan_id', 'user_id', name='uq_foto_like_pengguna')
    )
    op.create_index(op.f('ix_foto_like_laporan_id'), 'foto_like', ['laporan_id'], unique=False)
    op.create_index(op.f('ix_foto_like_user_id'), 'foto_like', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_foto_like_user_id'), table_name='foto_like')
    op.drop_index(op.f('ix_foto_like_laporan_id'), table_name='foto_like')
    op.drop_table('foto_like')
