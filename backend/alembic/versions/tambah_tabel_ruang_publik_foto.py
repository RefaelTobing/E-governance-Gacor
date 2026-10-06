"""tambah tabel ruang_publik_foto + backfill image_url

Revision ID: tambah_tabel_ruang_publik_foto
Revises: hapus_lokasi_spesifik_fasilitas
Create Date: 2026-10-06 12:00:00.000000

"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.models.base import utcnow

revision: str = 'tambah_tabel_ruang_publik_foto'
down_revision: Union[str, None] = 'hapus_lokasi_spesifik_fasilitas'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ruang_publik_foto',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('ruang_publik_id', sa.String(length=50), nullable=False),
        sa.Column('foto_url', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['ruang_publik_id'], ['ruang_publik.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_ruang_publik_foto_ruang_publik_id'),
        'ruang_publik_foto',
        ['ruang_publik_id'],
        unique=False,
    )

    # Backfill: kolom tunggal image_url menjadi baris foto resmi pertama.
    # Dijalankan lewat Core (bukan SQL literal) supaya binding datetime mengikuti
    # dialek database, dan id diisi Python karena kolomnya tidak punya server default.
    ruang_publik = sa.table(
        'ruang_publik',
        sa.column('id', sa.String),
        sa.column('image_url', sa.Text),
    )
    foto = sa.table(
        'ruang_publik_foto',
        sa.column('id', sa.String),
        sa.column('ruang_publik_id', sa.String),
        sa.column('foto_url', sa.Text),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime),
    )

    bind = op.get_bind()
    baris = bind.execute(
        sa.select(ruang_publik.c.id, ruang_publik.c.image_url).where(
            sa.and_(
                ruang_publik.c.image_url.is_not(None),
                ruang_publik.c.image_url != "",
            )
        )
    ).fetchall()

    for rp_id, image_url in baris:
        waktu = utcnow()
        bind.execute(
            foto.insert().values(
                id=uuid.uuid4().hex,
                ruang_publik_id=rp_id,
                foto_url=image_url,
                created_at=waktu,
                updated_at=waktu,
            )
        )


def downgrade() -> None:
    # Tidak drop_index terpisah: di MySQL index ix_... adalah bagian dari
    # foreign key, dan drop tabel otomatis menghapusnya.
    op.drop_table('ruang_publik_foto')
