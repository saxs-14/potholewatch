import csv
import glob
import io
import os
import random
import re
import uuid
from typing import List, Optional

import cv2
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.detection import analyze_image
from app.models import PotholeReport, ReportStatusHistory
from app.schemas import DashboardSummary, ReportOut, StatusHistoryOut, StatusUpdate

router = APIRouter(prefix="/api", tags=["reports"])
DEMO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "demo"))
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _safe_filename(filename: Optional[str]) -> str:
    raw = os.path.basename(filename or "road-image")
    stem, ext = os.path.splitext(raw)
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._")[:80] or "road-image"
    return f"{stem}{ext}"


def _validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> None:
    if latitude is not None and not -90 <= latitude <= 90:
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if longitude is not None and not -180 <= longitude <= 180:
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")


def _persist(db, filename, result, location, lat, lon, evidence_path):
    report = PotholeReport(
        source_filename=filename,
        pothole_count=result["pothole_count"],
        severity=result["severity"],
        confidence=result["confidence"],
        coverage_pct=result["coverage_pct"],
        location=location,
        latitude=lat,
        longitude=lon,
        evidence_path=evidence_path,
    )
    db.add(report)
    db.flush()
    db.add(ReportStatusHistory(report_id=report.id, from_status=None, to_status="reported", note="Report submitted"))
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
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are accepted")
    _validate_coordinates(latitude, longitude)

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(contents) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large; maximum is {settings.max_upload_mb} MB")

    img_array = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    result = analyze_image(frame)
    safe_name = _safe_filename(file.filename)
    evidence_name = f"{uuid.uuid4().hex}_{safe_name}"
    evidence_path = os.path.join(settings.upload_dir, evidence_name)
    if not cv2.imwrite(evidence_path, frame):
        raise HTTPException(status_code=500, detail="Could not store image evidence")

    return _persist(db, safe_name, result, location, latitude, longitude, evidence_name)


@router.post("/analyze/demo", response_model=ReportOut)
def analyze_demo(db: Session = Depends(get_db)):
    samples = glob.glob(os.path.join(DEMO_DIR, "*.jpg")) + glob.glob(os.path.join(DEMO_DIR, "*.png"))
    if not samples:
        raise HTTPException(status_code=404, detail="No demo images found on server")
    path = random.choice(samples)
    frame = cv2.imread(path)
    if frame is None:
        raise HTTPException(status_code=500, detail="Demo image could not be read")
    result = analyze_image(frame)
    return _persist(db, os.path.basename(path), result, "Demo sample road", None, None, None)


@router.get("/reports", response_model=List[ReportOut])
def list_reports(limit: int = 200, db: Session = Depends(get_db)):
    limit = min(max(limit, 1), 500)
    return db.query(PotholeReport).order_by(PotholeReport.created_at.desc()).limit(limit).all()


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.get(PotholeReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{report_id}/history", response_model=List[StatusHistoryOut])
def get_report_history(report_id: int, db: Session = Depends(get_db)):
    if db.get(PotholeReport, report_id) is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return (
        db.query(ReportStatusHistory)
        .filter(ReportStatusHistory.report_id == report_id)
        .order_by(ReportStatusHistory.created_at.asc())
        .all()
    )


@router.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_report_status(report_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    report = db.get(PotholeReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status == update.status:
        return report
    previous = report.status
    report.status = update.status
    db.add(ReportStatusHistory(
        report_id=report.id,
        from_status=previous,
        to_status=update.status,
        note=update.note,
    ))
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports/export")
def export_reports(db: Session = Depends(get_db)):
    reports = db.query(PotholeReport).order_by(PotholeReport.created_at.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "filename", "count", "severity", "confidence", "coverage_pct",
        "location", "latitude", "longitude", "status", "created_at"
    ])
    for r in reports:
        writer.writerow([
            r.id, r.source_filename, r.pothole_count, r.severity, r.confidence,
            r.coverage_pct, r.location, r.latitude, r.longitude, r.status, r.created_at
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=potholewatch_reports.csv"},
    )


@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    total_reports = db.query(func.count(PotholeReport.id)).scalar() or 0
    total_potholes = db.query(func.sum(PotholeReport.pothole_count)).scalar() or 0
    severe = db.query(func.count(PotholeReport.id)).filter(PotholeReport.severity == "severe").scalar() or 0
    avg_conf = db.query(func.avg(PotholeReport.confidence)).scalar() or 0.0
    fixed = db.query(func.count(PotholeReport.id)).filter(PotholeReport.status == "fixed").scalar() or 0
    open_reports = db.query(func.count(PotholeReport.id)).filter(PotholeReport.status.notin_(["fixed", "rejected"])).scalar() or 0
    return DashboardSummary(
        total_reports=total_reports,
        total_potholes=total_potholes,
        severe_count=severe,
        avg_confidence=round(float(avg_conf), 2),
        open_reports=open_reports,
        fixed_reports=fixed,
    )
