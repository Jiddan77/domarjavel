# Development Guide

This guide covers development setup, workflows, and best practices for the Dommarjävel project.

## Quick Start

Run the setup script to get started quickly:

```bash
./setup.sh
```

Then start both servers:

```bash
# Terminal 1 - Backend
cd Backend
source .venv/bin/activate
python run.py

# Terminal 2 - Frontend  
cd Frontend
npm run dev
```

## Project Architecture

### Backend (FastAPI)
- **Location**: `Backend/`
- **Framework**: FastAPI with Python 3.13+
- **Data**: JSON-based match database
- **API**: RESTful endpoints for matches, referees, teams, stats

### Frontend (Next.js)
- **Location**: `Frontend/`
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR for caching and error handling
- **TypeScript**: Strict mode enabled

## Development Workflow

### Data Updates

Keep match data up-to-date with the automated update system:

```bash
# Quick update - fetches new matches and backfills missing data
bash Backend/scripts/update_matches.sh

# Check current data status
python3 Backend/scripts/check_status.py

# See what would be updated (dry run)
bash Backend/scripts/update_matches.sh --dry-run
```

For detailed information, see [Backend/UPDATE_WORKFLOW.md](Backend/UPDATE_WORKFLOW.md).

### Backend Development

1. **Activate virtual environment**:
   ```bash
   cd Backend
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run development server**:
   ```bash
   python run.py
   # Or: uvicorn app.main:app --reload --port 8000
   ```

4. **API Documentation**: http://localhost:8000/docs

### Frontend Development

1. **Install dependencies**:
   ```bash
   cd Frontend
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Available scripts**:
   - `npm run dev` - Development server
   - `npm run build` - Production build
   - `npm run start` - Production server
   - `npm run lint` - ESLint check
   - `npm run lint:fix` - Fix ESLint issues
   - `npm run type-check` - TypeScript check

## Code Quality

### TypeScript
- Strict mode enabled
- No unused variables/parameters allowed
- Explicit return types required
- Null checks enforced

### Error Handling
- React Error Boundaries for component errors
- SWR error handling with retry logic
- User-friendly error messages
- Loading states for all async operations

### Performance
- SWR caching with 5-second deduplication
- Pagination for large datasets (50 items per page)
- Optimized re-renders with useMemo
- Lazy loading where appropriate

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /matches` - Get matches with filtering and pagination
- `GET /seasons` - Get available seasons
- `GET /referees` - Get referees with match counts
- `GET /teams` - Get teams with match counts
- `GET /stats` - Get aggregated statistics
- `GET /leaderboard` - Get referee rankings

### Query Parameters
- `season` - Filter by season(s) (array)
- `referee` - Filter by referee(s) (array)
- `team` - Filter by team(s) (array)
- `side` - Filter by home/away
- `limit` - Results per page (max 1000)
- `offset` - Pagination offset
- `includeTotal` - Include total count
- `minMatches` - Minimum matches for referees/teams

## Data Management

### Data Structure
```json
{
  "matches": [
    {
      "match_id": 3508502,
      "season": 2020,
      "date": "15 juni 2020",
      "referee": "KASPAR SJÖBERG",
      "home": "Falkenberg",
      "away": "BK Häcken",
      "score": "1–1",
      "yellow": "0–2",
      "red": "0–0",
      "penalty": "0–0"
    }
  ]
}
```

### Data Scripts
Located in `Backend/scripts/`:
- Data processing and enrichment scripts
- Update scripts for new seasons
- Data validation and repair tools

## Environment Configuration

### Backend (.env)
```bash
DATA_DIR=data
API_CORS_ORIGINS=http://localhost:3000
PORT=8000
HOST=0.0.0.0
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set build directory to `Frontend`
3. Configure environment variables
4. Deploy automatically on push

### Environment Variables for Production
```bash
DATA_DIR=../Backend/data
API_CORS_ORIGINS=https://yourdomain.vercel.app
```

## Testing

### Backend Testing
```bash
cd Backend
source .venv/bin/activate
python -m pytest  # When tests are added
```

### Frontend Testing
```bash
cd Frontend
npm test  # When tests are added
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -ti:8000 | xargs kill -9  # Kill process on port 8000
   lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
   ```

2. **Python virtual environment issues**:
   ```bash
   rm -rf .venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Node modules issues**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **CORS errors**:
   - Check API_CORS_ORIGINS in backend .env
   - Ensure frontend is running on allowed origin

### Debug Mode

Enable debug logging:
```bash
# Backend
export FASTMCP_LOG_LEVEL=DEBUG
python run.py

# Frontend
export NODE_ENV=development
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following code quality guidelines
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Add proper error handling
- Include loading states
- Write descriptive commit messages