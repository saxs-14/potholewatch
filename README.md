# PotholeWatch

PotholeWatch is a road-damage reporting system that combines computer vision, evidence capture, GPS coordinates and a review workflow.

## Working capabilities

- JPEG/PNG/WebP uploads with server-side type, size and decode validation
- Existing OpenCV + MobileNetV2 AI-assisted analysis
- Browser GPS capture
- Persistent reports with stable IDs such as PW-000001
- Evidence image storage
- Report detail view
- Workflow statuses: reported, reviewed, scheduled, fixed and rejected
- Status history for auditability
- Dashboard KPIs for reports, potholes, severe/open/fixed reports and confidence
- CSV export including coordinates and status
- Demo data
- FastAPI Swagger documentation at /docs
- Docker support
- Automated GitHub Actions build/test checks

## Local development

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\\Scripts\\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run build
npm run dev
```

The frontend no longer contains a hard-coded API key. Local/operator deployments may set VITE_API_KEY, but normal users can register and sign in through /login. Bearer access tokens are signed server-side using the deployment secret. Do not treat a browser-exposed API key as a user secret.

## API

- GET /api/health
- POST /api/analyze
- POST /api/analyze/demo
- GET /api/reports
- GET /api/reports/{id}
- GET /api/reports/{id}/history
- PATCH /api/reports/{id}/status
- GET /api/reports/export
- GET /api/dashboard/summary

## Reality roadmap

The current application is a working foundation, but it is not yet a municipal production deployment. The remaining major work is deliberately separated into independent phases:

1. **Identity:** user registration/login and bearer authentication are now present; next add role enforcement and report ownership.
2. **Database:** add migrations and move hosted deployments from SQLite to PostgreSQL.
3. **Maps:** add an interactive OpenStreetMap/Leaflet map, marker clustering and hotspot views.
4. **AI detection:** replace the classical contour count with a properly evaluated object-detection model that returns per-pothole bounding boxes and confidence.
5. **Duplicate handling:** cluster reports referring to the same physical road defect.
6. **Maintenance:** add work orders, teams, assignments, schedules, repair evidence and inspection/closure.
7. **Offline:** make the frontend an offline-first PWA with a queued upload process.
8. **Production operations:** backups, structured logging, monitoring, security testing, audit controls and deployment documentation.

AI output is advisory. A responsible human should verify road damage before maintenance action.
