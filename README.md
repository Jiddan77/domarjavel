# Dommarjävel

**Swedish Allsvenskan referee statistics — every card, every call, every pattern.**

[![Live Demo](https://img.shields.io/badge/live-dommarjavel.vercel.app-brightgreen)](https://dommarjavel.vercel.app)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.13-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)

---

## What it does

Dommarjävel ("referee devil" in Swedish) tracks every referee in Allsvenskan — who gives the most cards, which teams they favour, how their decisions correlate with match outcomes. It's the stats site that frustrated fans always wanted.

**[→ Try it live at dommarjavel.vercel.app](https://dommarjavel.vercel.app)**

---

## Features

- **Referee leaderboards** — cards per game, red card rate, home/away bias
- **Team breakdowns** — which referee is your team's worst nightmare
- **Match history** — every match with full referee assignment and card log
- **Multi-filter search** — filter by season, team, referee, or card type simultaneously
- **Instant responses** — pre-computed data chunks mean zero wait time on common queries
- **Mobile-friendly** — works on phone at half-time

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Data fetching | SWR (client-side caching) |
| Backend API | FastAPI + Python 3.13 (local dev / data pipeline) |
| Validation | Pydantic |
| Storage | Static JSON + pre-computed chunks |
| Deployment | Vercel (frontend + API routes) |

**No database required in production.** Data is static JSON bundled at deploy time. Updates are: fetch new data → rebuild chunks → push to GitHub → Vercel redeploys automatically.

---

## Local development

```bash
# Clone
git clone https://github.com/Jiddan77/domarjavel.git
cd domarjavel

# Backend (data API)
cd Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
# API at http://localhost:8000 · docs at http://localhost:8000/docs

# Frontend (new terminal)
cd Frontend
npm install
npm run dev
# App at http://localhost:3000
```

---

## Updating match data

```bash
# Fetch latest matches and rebuild chunks
bash Backend/scripts/update_matches.sh

# Dry run (see what would change)
bash Backend/scripts/update_matches.sh --dry-run

# Rebuild chunks only
python3 Backend/scripts/lib/create_optimized_chunks.py --season 2025
```

Data updates are idempotent — safe to run repeatedly.

---

## API

| Endpoint | Description |
|---|---|
| `GET /matches` | Matches with filtering and pagination |
| `GET /referees` | Referee list with career stats |
| `GET /teams` | Team list with match counts |
| `GET /stats` | Aggregated stats for current filter set |
| `GET /leaderboard` | Referee rankings |
| `GET /api/chunks/season/{season}/stats` | Instant pre-computed season stats |
| `GET /api/chunks/season/{season}/referee/{referee}` | Referee match history |
| `GET /api/chunks/season/{season}/team/{team}` | Team match history |

Full interactive docs available at `/docs` when running locally.

---

## Documentation

- [Development setup](DEVELOPMENT.md)
- [Data update workflow](Backend/UPDATE_WORKFLOW.md)
- [Chunks system architecture](Backend/CHUNKS_SYSTEM.md)
- [Contributing](CONTRIBUTING.md)

---

## License

MIT — see [LICENSE](LICENSE).
