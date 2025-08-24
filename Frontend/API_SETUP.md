# Vercel API Setup (Auto-generated)

Backend detected at: `domarjavel/Backend`
Frontend detected at: `domarjavel/Frontend`

## Deploy
1. Set Vercel Project Root to `domarjavel/Frontend`.
2. Environment variables:
   - `DATA_DIR` = path to your public data inside the backend (e.g. `domarjavel/Backend/public`)
   - `API_CORS_ORIGINS` = your production domain (optional).
3. Deploy. API endpoints:
   - `/api/health`
   - `/api/index`
   - `/api/matches?season=2024&limit=100`

This folder contains `api/index.py` which mounts your FastAPI app (from backend) as a Vercel Python Function.
