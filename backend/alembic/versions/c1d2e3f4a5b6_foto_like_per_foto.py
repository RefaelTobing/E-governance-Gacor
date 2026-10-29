"""foto_like per foto (BE-58 revisi)

Like dipindah dari `laporan_id` ke `foto_url` supaya semua foto galeri bisa
disukai: foto laporan warga, unggahan admin, maupun foto resmi Satu Data.

Revision ID: c1d2e3f4a5b6
Revises: b7e8c9d0a112
Create Date: 2026-10-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'b7e8c9d0a112'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Kolom baru masih nullable supaya baris lama bisa diisi dulu.
    op.add_column('foto_like', sa.Column('foto_url', sa.Text(), nullable=True))

    # 2. Backfill dari laporan pasangannya (like lama memang menempel di sana).
    op.execute(
        """
        UPDATE foto_like AS fl
        SET foto_url = l.foto_url
        FROM laporan AS l
        WHERE fl.laporan_id = l.id
          AND l.foto_url IS NOT NULL
          AND l.foto_url <> ''
        """
    )

    # 3. Like pada laporan tanpa foto tidak punya target baru; mustahil dilike.
    op.execute("DELETE FROM foto_like WHERE foto_url IS NULL")

    op.alter_column('foto_like', 'foto_url', existing_type=sa.Text(), nullable=False)

    # 4. Ganti kunci unik dan buang kolom lama.
    op.drop_constraint('uq_foto_like_pengguna', 'foto_like', type_='unique')
    op.drop_index(op.f('ix_foto_like_laporan_id'), table_name='foto_like')
    op.drop_column('foto_like', 'laporan_id')

    op.create_index(op.f('ix_foto_like_foto_url'), 'foto_like', ['foto_url'], unique=False)
    op.create_unique_constraint(
        'uq_foto_like_pengguna', 'foto_like', ['foto_url', 'user_id']
    )


def downgrade() -> None:
    op.add_column('foto_like', sa.Column('laporan_id', sa.String(length=50), nullable=True))

    # Kembalikan ke laporan mana pun yang memakai URL foto tersebut.
    op.execute(
        """
        UPDATE foto_like AS fl
        SET laporan_id = (
            SELECT l.id
            FROM laporan AS l
            WHERE l.foto_url = fl.foto_url
            ORDER BY l.created_at DESC, l.id ASC
            LIMIT 1
        )
        """
    )
    op.execute("DELETE FROM foto_like WHERE laporan_id IS NULL")

    op.alter_column('foto_like', 'laporan_id', existing_type=sa.String(length=50), nullable=False)

    op.drop_constraint('uq_foto_like_pengguna', 'foto_like', type_='unique')
    op.drop_index(op.f('ix_foto_like_foto_url'), table_name='foto_like')
    op.drop_column('foto_like', 'foto_url')

    op.create_index(op.f('ix_foto_like_laporan_id'), 'foto_like', ['laporan_id'], unique=False)
    op.create_unique_constraint(
        'uq_foto_like_pengguna', 'foto_like', ['laporan_id', 'user_id']
    )
    op.create_foreign_key(
        'foto_like_laporan_id_fkey', 'foto_like', 'laporan', ['laporan_id'], ['id']
    )