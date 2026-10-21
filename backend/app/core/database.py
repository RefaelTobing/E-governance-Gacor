from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Supabase Pooler (PgBouncer, transaction mode port 6543) tidak mendukung
# prepared statements lintas transaksi. NullPool + prepare_threshold=None
# mencegah error "prepared statement already exists".
# pool_pre_ping tidak dipakai karena NullPool membuka koneksi baru tiap sesi.
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    connect_args={"prepare_threshold": None},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
