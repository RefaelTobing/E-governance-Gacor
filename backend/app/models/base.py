from datetime import datetime, timezone

from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utcnow() -> datetime:
    """Waktu UTC tanpa tzinfo, sesuai kolom MySQL DATETIME yang tidak menyimpan zona waktu."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
