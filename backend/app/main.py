from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.auth import require_auth
from app.rate_limit import rate_limit
from app.routers import auth, health, reports

Base.metadata.create_all(bind=engine)
app = FastAPI(title=settings.app_name, version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "X-API-Key", "Content-Type"],
)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(reports.router, dependencies=[Depends(require_auth), Depends(rate_limit(max_requests=30, window_seconds=60))])
@app.get("/")
def root():
    return {"service": settings.app_name, "docs": "/docs", "version": "2.0.0"}
