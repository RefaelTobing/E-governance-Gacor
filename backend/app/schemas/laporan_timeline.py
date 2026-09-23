from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)
