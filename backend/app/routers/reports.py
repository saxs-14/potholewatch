import csv
import glob
import io
import os
import random
import uuid
import cv2
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import PotholeReport
from app.schemas import ReportOut, DashboardSummary
from app.config import settings
from app.detection import analyze_image

router = APIRouter(prefix="/api", tags=["reports"])

DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "demo")


def _persist(db, filename, result, location, lat, lon, evidence_path):
    report = PotholeReport(
        source_filename=filename, pothole_count=result["pothole_count"],
        severity=result["severity"], confidence=result["confidence"],
        coverage_pct=result["coverage_pct"], location=location,
        latitude=lat, longitude=lon, evidence_path=evidence_path,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.post("/analyze", response_model=ReportOut)
async def analyze(
    file: UploadFile = File(...),
    location: Optional[str] = Form(default=None),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    if len(contents) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    img_array = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    result = analyze_image(frame)

    evidence_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    evidence_path = os.path.join(settings.upload_dir, evidence_name)
    cv2.imwrite(evidence_path, frame)

    return _persist(db, file.filename, result, location, latitude, longitude, evidence_name)


@router.post("/analyze/demo", response_model=ReportOut)
def analyze_demo(db: Session = Depends(get_db)):
    samples = glob.glob(os.path.join(DEMO_DIR, "*.jpg")) + glob.glob(os.path.join(DEMO_DIR, "*.png"))
    if not samples:
        raise HTTPException(status_code=404, detail="No demo images found on server")
    path = random.choice(samples)
    frame = cv2.imread(path)
    result = analyze_image(frame)
    return _persist(db, os.path.basename(path), result, "Demo sample road", None, None, None)


@router.get("/reports", response_model=List[ReportOut])
def list_reports(limit: int = 200, db: Session = Depends(get_db)):
    return db.query(PotholeReport).order_by(PotholeReport.created_at.desc()).limit(limit).all()


@router.get("/reports/export")
def export_reports(db: Session = Depends(get_db)):
    reports = db.query(PotholeReport).order_by(PotholeReport.created_at.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "filename", "count", "severity", "confidence", "coverage_pct", "location", "status", "created_at"])
    for r in reports:
        writer.writerow([r.id, r.source_filename, r.pothole_count, r.severity, r.confidence, r.coverage_pct, r.location, r.status, r.created_at])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=potholewatch_reports.csv"},
    )


@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    total_reports = db.query(func.count(PotholeReport.id)).scalar() or 0
    total_potholes = db.query(func.sum(PotholeReport.pothole_count)).scalar() or 0
    severe = db.query(func.count(PotholeReport.id)).filter(PotholeReport.severity == "severe").scalar() or 0
    avg_conf = db.query(func.avg(PotholeReport.confidence)).scalar() or 0.0
    return DashboardSummary(
        total_reports=total_reports, total_potholes=total_potholes,
        severe_count=severe, avg_confidence=round(avg_conf, 2),
    )
