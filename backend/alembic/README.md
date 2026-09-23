# Database migrations

Production deployments should set `AUTO_CREATE_SCHEMA=false` and run `alembic upgrade head` from the `backend` directory before starting FastAPI.

For a fresh local database, `AUTO_CREATE_SCHEMA=true` remains the default so tests and first-time development are simple.

The initial migration is `0001_initial` and represents the current PotholeWatch schema.
