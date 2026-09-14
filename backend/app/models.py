from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from datetime import datetime, timezone
from app.database import Base


class PotholeReport(Base):
    __tablename__ = "pothole_reports"

    id = Column(Integer, primary_key=True)
    source_filename = Column(String)
    pothole_count = Column(Integer)
    severity = Column(String)  # none | minor | moderate | severe
    confidence = Column(Float)
    coverage_pct = Column(Float)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="reported")  # reported | reviewed | scheduled | fixed
    evidence_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
