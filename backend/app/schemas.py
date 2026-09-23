from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


STATUSES = ("reported", "reviewed", "scheduled", "fixed", "rejected")


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


class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in STATUSES:
            raise ValueError(f"status must be one of: {', '.join(STATUSES)}")
        return value


class StatusHistoryOut(BaseModel):
    id: int
    report_id: int
    from_status: Optional[str]
    to_status: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_reports: int
    total_potholes: int
    severe_count: int
    avg_confidence: float
    open_reports: int
    fixed_reports: int
