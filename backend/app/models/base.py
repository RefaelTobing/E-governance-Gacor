from datetime import datetime, timezone

from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utcnow() -> datetime:
    """Waktu UTC tanpa tzinfo, konsisten dengan kolom timestamp yang naive."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
