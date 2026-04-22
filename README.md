# Tsunami & Tide Alert System

A full-stack, location-based early-warning demo for coastal communities. It ingests public seismic and ocean data, applies the rule-based **detection engine** from the product spec, stores events and alerts in **PostGIS**, targets users in impact polygons, and can deliver **FCM** pushes (with optional Twilio SMS in code).

## Stack

| Area | Technology |
|------|------------|
| API | Python 3.11, FastAPI |
| Data | PostgreSQL 15, PostGIS |
| Async jobs | Celery, Redis |
| Web | Vite, React, Tailwind, Mapbox GL JS, Recharts, Zustand |
| Push | Firebase Cloud Messaging (browser) |

## Environment files

All environment configuration lives **only inside** this folder (`tsunami-alert-system/`), not in any parent directory:

- **`./.env`** — Docker Compose, FastAPI, Celery, Alembic (copy from `.env.example`)
- **`./frontend/.env`** — Vite / browser (`Mapbox`, `Firebase`); copy from `frontend/.env.example`

The API loads `tsunami-alert-system/.env` by an absolute path, so you can run `uvicorn` from `backend/` without a separate `backend/.env`.

## Quick start (Docker)

1. Copy the environment file and add secrets if needed:

   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

2. For the **map and optional push**, set `VITE_*` in `frontend/.env` or pass Docker `build` args for the frontend image (Mapbox and Firebase are required for real tiles/push; the UI still loads with reduced functionality without them).

3. From this directory:

   ```bash
   docker compose up --build
   ```

4. **Backend:** `http://localhost:8000` (OpenAPI: `/docs`)  
5. **Frontend (container):** `http://localhost:3000`  
6. **Postgres:** `localhost:5432` (user `postgres` / `postgres`, db `tsunami_alert`)

Migrations run automatically via `backend/entrypoint.sh` before the API and Celery start.

## Local dev (no Docker, optional)

**Backend**

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # or source .venv/bin/activate
pip install -r requirements.txt
# Start Postgres+PostGIS and Redis; set DATABASE_URL / REDIS_URL in ../.env, then:
alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
cp .env.example .env
# Set VITE_MAPBOX_TOKEN and optionally Firebase keys
npm install
npm run dev
```

**Celery (optional)**

```bash
cd backend
celery -A app.celery_app worker -B -l info
```

## Notable API routes

- `GET /health`
- `POST /users/register` — `{ name, fcm_token?, lat, lng }`
- `PUT /users/{id}/location` — `{ lat, lng, fcm_token? }` (FCM is optional; used when enabling push for an existing user)
- `GET /alerts/active` — active alerts with GeoJSON impact when stored
- `GET /alerts/{id}` — one alert
- `GET /events/recent` — last seismic rows
- `POST /admin/simulate-event` — full pipeline; use `force_trigger: true` for a demo if live DART data does not show an anomaly

## Threat detection (reference)

- **Magnitude and depth** rules, plus a **DART** heave check, live in `backend/app/services/detection_engine.py`.
- Shallow-water **ETA** uses \( v = \sqrt{g h} \) in `app/utils/wave_model.py`.
- **Impact targeting** uses PostGIS `ST_Within` in `app/services/location_targeting.py`.

## GIS

See `gis/README.md` and `gis/preprocess_zones.py` for shapefile → GeoJSON workflows. Sample polygons ship as `public/impact_zones.geojson` and `gis/sample_impact_zones.geojson`.

## License

This repository is a demonstration scaffold. Validate life-safety decisions with official government agencies; do not use this as a production maritime warning system without a full risk and compliance review.
