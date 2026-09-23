from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from app.database import Base


class PotholeReport(Base):
    __tablename__ = "pothole_reports"

    id = Column(Integer, primary_key=True)
    source_filename = Column(String, nullable=False)
    pothole_count = Column(Integer, nullable=False, default=0)
    severity = Column(String, nullable=False)  # none | minor | moderate | severe
    confidence = Column(Float, nullable=False, default=0.0)
    coverage_pct = Column(Float, nullable=False, default=0.0)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="reported")
    evidence_path = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey("pothole_reports.id"), nullable=False, index=True)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
