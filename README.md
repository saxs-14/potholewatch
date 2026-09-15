# PotholeWatch

AI-assisted pothole detection and road-condition reporting MVP.

## Problem statement

Potholes damage vehicles and cause accidents, but municipalities and fleets often lack
timely, structured data on where road damage actually is.

## Solution

Upload a road photo and PotholeWatch detects damaged regions, rates severity, and logs a
reviewable record — with or without GPS — building a dashboard of road conditions over
time.

## Features

- Pothole detection from a single photo (no video required)
- Severity classification (none / minor / moderate / severe)
- Manual location entry (works without GPS)
- Road-condition dashboard: counts, severity breakdown, average confidence
- Report status field (reported → reviewed → scheduled → fixed)
- CSV export
- Demo mode using bundled real road-damage sample photos

## Architecture

```text
frontend (React/Vite/TS/Tailwind)  ->  backend (FastAPI)  ->  SQLite
                                              |
                            classical CV (count/coverage) + trained MobileNetV2
                                  severity classifier (none/minor/moderate/severe)
```

## Technology stack

Python, FastAPI, SQLAlchemy, SQLite, OpenCV, PyTorch/TorchVision; React, TypeScript, Vite,
Tailwind CSS.

## Folder structure

```text
potholewatch/
├── backend/
│   ├── app/
│   │   └── ml_model/  # Trained TorchScript classifier (potholewatch_classifier.pt)
│   ├── demo/          # Bundled sample road-damage photos
│   └── tests/
├── frontend/
│   └── src/             # Landing page + dashboard
├── docker-compose.yml
└── README.md
```

## Installation

```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

```bash
cd frontend && npm install
```

## Environment variables

`UPLOAD_DIR`, `MAX_UPLOAD_MB`, `CORS_ORIGINS` — see `backend/.env.example`.

## Running locally

```bash
# Terminal 1
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173. Docker: `docker compose up --build`.

## Demo instructions

Click **Run demo sample** — it analyzes one of the bundled real road-damage photos
(sourced from Wikimedia Commons, CC-licensed). Upload your own road photo to try it with
different footage; manual location entry is available since GPS isn't always present in a
photo upload flow.

## API documentation

Docs at `/docs`. Key endpoints: `POST /api/analyze`, `POST /api/analyze/demo`,
`GET /api/reports`, `GET /api/reports/export`, `GET /api/dashboard/summary`.

## Database

SQLite: `pothole_reports` (count, severity, confidence, coverage %, location, status).

## Security considerations

- **API key required on every endpoint except `/api/health`.** Set `API_KEY` (backend
  `.env`) and `VITE_API_KEY` (frontend `.env`) to the same value before deploying anywhere
  reachable outside your own machine — the default (`dev-local-key-change-me`) is for
  local development only. Single-tenant "licensed instance" model, not per-user accounts.
- Rate limiting (30 req/60s/IP) on the API.
- Upload size/type validated server-side, CORS restricted, no secrets in source.

## Privacy considerations

Road photos may incidentally include people, vehicles or license plates. No facial or
plate recognition is performed by this system, but deployers should apply their own
redaction policy before publishing raw photos externally.

## Limitations

- **Pothole count and coverage % still come from classical image analysis** (adaptive
  thresholding + contour shape filtering) — a model can't produce a blob count on its own.
  This will still misfire on shadows, drain covers, oil stains, and other dark irregular
  patches that aren't actually potholes; confidence scores are capped well below 1.0 to
  reflect this.
- **The "severity" label comes from a trained MobileNetV2 classifier** (frozen ImageNet
  backbone + trained classifier head), fine-tuned on ~300 labeled road-damage photos
  (none/minor/moderate/severe). It reached **67.8% held-out validation accuracy** — real,
  but noticeably weaker than the other trained models in this portfolio (SmartWaste AI:
  83.8%, FireWatch AI: 94.8%), a direct consequence of the much smaller and class-imbalanced
  training set (40-105 images per class). Treat severity labels as indicative, not
  authoritative, until the model is retrained on more/better-balanced data.
- Single-image analysis only — no cross-photo deduplication of the same physical pothole.

## Business model

**Target customers**: municipalities, transport/logistics companies, insurance companies,
road maintenance contractors.

**Revenue**: SaaS subscription, per-vehicle fleet subscription, municipal contracts,
data/reporting services.

## Future improvements

- Train a proper object-detection model on labeled pothole imagery
- Map-based visualization (the schema already carries lat/lon)
- Duplicate-report clustering by location
- Integration with municipal work-order systems

## Screenshots

Run locally (see "Running locally") and click **Run demo sample** on `/app`.
