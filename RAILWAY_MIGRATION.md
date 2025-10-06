# Railway Data Migration Guide

## 🔄 Migrate Your JSON Data to PostgreSQL

### Option A: Run Migration Locally (Recommended)

1. **Get your DATABASE_URL from Railway**:
   - Go to Railway dashboard
   - Click on PostgreSQL service
   - Copy the "DATABASE_URL" from Variables tab

2. **Run migration locally**:
   ```bash
   cd Backend
   
   # Set the database URL (replace with your actual URL)
   export DATABASE_URL="postgresql://postgres:password@host:port/database"
   
   # Install dependencies if needed
   pip install asyncpg
   
   # Run migration
   python scripts/migrate_to_postgres.py
   ```

### Option B: Run Migration on Railway

1. **Connect to Railway CLI**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Connect to your project
   railway link
   ```

2. **Run migration**:
   ```bash
   railway run python scripts/migrate_to_postgres.py
   ```

### Expected Output:
```
📁 Loading data from data/data.json
📊 Found 1440 matches to migrate
🔌 Connecting to database...
✅ Database connection successful
✅ Database tables created successfully
🔄 Migrating 1440 matches...
   Migrated 100 matches...
   Migrated 200 matches...
   ...
✅ Migration complete: 1440 matches migrated, 0 errors
📊 Total matches in database: 1440
📅 Matches by season:
   2020: 240 matches
   2021: 240 matches
   2022: 240 matches
   2023: 240 matches
   2024: 240 matches
   2025: 240 matches
👨‍⚖️ Unique referees: 46
⚽ Unique teams: 16
🎉 Migration completed successfully!
```

## ✅ Verification

Test your deployed backend:
```bash
# Test health endpoint
curl https://your-backend-url.railway.app/health

# Test seasons endpoint
curl https://your-backend-url.railway.app/seasons

# Test matches endpoint
curl https://your-backend-url.railway.app/matches?limit=5
```

## 🔧 Troubleshooting

**If migration fails**:
1. Check DATABASE_URL is correct
2. Ensure PostgreSQL service is running on Railway
3. Check Railway logs for errors

**If backend doesn't start**:
1. Check Railway build logs
2. Verify requirements.txt includes all dependencies
3. Check environment variables are set correctly