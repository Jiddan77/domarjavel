# Backend Deployment Guide - Real Data Integration

## 🚀 Railway Deployment (Recommended)

### Step 1: Prepare Backend for Deployment

1. **Create Railway Account**
   - Go to https://railway.app/
   - Sign up with GitHub
   - Connect your repository

2. **Add Railway Configuration**
   ```bash
   # We'll create these files for you
   ```

### Step 2: Environment Setup

Your backend will need these environment variables:
```bash
# Database
DATABASE_URL=postgresql://...  # Railway provides this

# API Configuration  
API_CORS_ORIGINS=https://dommarjavel.vercel.app,http://localhost:3000
PORT=8000

# Data Sources (for your update scripts)
ALLSVENSKAN_API_KEY=your_key_here  # If needed
RATE_LIMIT_DELAY=0.5  # Seconds between requests
```

### Step 3: Database Migration

We'll help you:
1. Set up PostgreSQL on Railway
2. Migrate your JSON data to PostgreSQL
3. Update your FastAPI app to use the database
4. Keep your existing data update scripts working

### Step 4: Deployment Process

1. **Connect Repository**: Railway auto-detects Python
2. **Configure Build**: Automatic with requirements.txt
3. **Set Environment Variables**: Through Railway dashboard
4. **Deploy**: Automatic on git push

### Step 5: Update Frontend

Once backend is deployed:
1. Update `NEXT_PUBLIC_API_URL` in Vercel
2. Remove mock API routes
3. Use real backend endpoints

## 🔄 Alternative: Render Deployment

If you prefer Render:
1. Similar process but different platform
2. Free tier available
3. Good PostgreSQL integration

## 📊 Expected Timeline

- **Setup & Deploy**: 30-60 minutes
- **Database Migration**: 30 minutes  
- **Frontend Integration**: 15 minutes
- **Testing & Verification**: 30 minutes

**Total: ~2-3 hours to go live with real data!**

## 🎯 Next Steps

1. Choose deployment platform (Railway recommended)
2. Set up account and connect repository
3. Configure environment variables
4. Deploy and test
5. Migrate data from JSON to PostgreSQL
6. Update frontend to use real backend

Ready to start? 🚀