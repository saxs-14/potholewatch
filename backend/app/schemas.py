from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReportOut(BaseModel):
    id: int
    source_filename: str
    pothole_count: int
    severity: str
    confidence: float
    coverage_pct: float
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    evidence_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_reports: int
    total_potholes: int
    severe_count: int
    avg_confidence: float
