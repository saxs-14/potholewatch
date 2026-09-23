# PotholeWatch production status

## Implemented
- React/Vite frontend with mobile camera capture and GPS capture.
- FastAPI backend with SQLite-compatible persistence.
- AI-assisted image analysis using the bundled TorchScript classifier plus OpenCV analysis.
- Account registration/login with signed bearer tokens and PBKDF2 password hashing.
- Configurable admin bootstrap email and role-aware maintenance permissions.
- Report ownership for citizen accounts.
- Report status workflow and status history.
- Maintenance work orders with priorities and lifecycle statuses.
- Protected evidence delivery; uploaded files are no longer mounted publicly.
- GPS-aware map using OpenStreetMap/Leaflet.
- Installable PWA shell and CI for backend tests and frontend builds.
- HTTP security headers, upload type/size/dimension validation, safe filenames and coordinate validation.
- Alembic baseline migration for production schema management.

## Required deployment configuration
Set these environment variables in the backend deployment:
- `DATABASE_URL`
- `CORS_ORIGINS`
- `UPLOAD_DIR`
- `API_KEY` (long random deployment key; used only for controlled service/admin access)
- `AUTH_SECRET` (different long random signing secret)
- `ADMIN_EMAIL` (the account that should receive the admin role when registered)
- `AUTO_CREATE_SCHEMA=false`

Run `alembic upgrade head` from `backend/` before starting the API when automatic schema creation is disabled.

## Important operational limitations
The AI is advisory, not a certified road-engineering measurement system. The current model is a classifier combined with classical computer vision; it is not a bounding-box object detector. Human review remains required before maintenance decisions.

The repository does not claim a hosted production deployment is already configured. A deployment provider, domain, HTTPS, backups, monitoring and retention policy must be configured by the operator.

The PWA currently provides an offline application shell; queued offline photo submission is not yet enabled.
