from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LaporanTimelineBase(BaseModel):
    laporan_id: str
    status: str
    title: str
    description: Optional[str] = None

class LaporanTimelineCreate(LaporanTimelineBase):
    pass

class LaporanTimelineResponse(LaporanTimelineBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
