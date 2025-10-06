# Vercel Debugging Guide

## 🔍 How to Debug Your Vercel Deployment

### Step 1: Check Vercel Build Logs
1. Go to your Vercel dashboard
2. Click on your project
3. Go to the "Functions" or "Deployments" tab
4. Look for the latest deployment
5. Click "View Function Logs" or "Build Logs"

### Step 2: Check Browser Console
1. Open https://dommarjavel.vercel.app/
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for any error messages
5. Go to Network tab and check for failed requests

### Step 3: Test Individual API Endpoints
Try these URLs directly in your browser:

```
https://dommarjavel.vercel.app/api/seasons
https://dommarjavel.vercel.app/api/referees
https://dommarjavel.vercel.app/api/teams
https://dommarjavel.vercel.app/api/matches
https://dommarjavel.vercel.app/api/stats
https://dommarjavel.vercel.app/api/leaderboard
```

### Step 4: Common Issues & Solutions

#### Issue 1: API Routes Still 404
**Solution**: Check if Vercel Root Directory is set to "Frontend"
1. Vercel Dashboard → Project Settings → General
2. Root Directory should be: `Frontend`
3. Save and redeploy

#### Issue 2: Build Still Failing
**Solution**: Check if all files were committed
```bash
git status
git add .
git commit -m "fix: ensure all API routes are dynamic"
git push origin main
```

#### Issue 3: Environment Variables
**Solution**: Add environment variables in Vercel
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL` = `https://dommarjavel.vercel.app`

#### Issue 4: Function Timeout
**Solution**: API routes might be timing out
- Check Vercel function logs for timeout errors
- Simplify API responses if needed

### Step 5: Quick Fix - Simplified API Routes

If the issue persists, try this simplified version:

```typescript
// Simplified /api/seasons/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json([
    { season: 2025, matches: 240 },
    { season: 2024, matches: 240 }
  ]);
}
```

### Step 6: Alternative - Static Data Approach

If API routes keep failing, we can switch to static data:

1. Move data to `public/data/` folder
2. Fetch from frontend using `fetch('/data/seasons.json')`
3. No server-side API needed

## 🚨 Emergency Fix

If nothing works, here's a quick emergency fix:

```bash
# Create static data files
mkdir -p Frontend/public/data

# Create simple JSON files
echo '[{"season":2025,"matches":240}]' > Frontend/public/data/seasons.json
echo '[{"name":"MOHAMMED AL-HAKIM","matches":20}]' > Frontend/public/data/referees.json

# Update frontend to use static files instead of API
```

## 📞 What to Tell Me

Please share:
1. **Vercel build logs** (copy/paste the error messages)
2. **Browser console errors** (screenshot or copy/paste)
3. **Which API endpoints return 404** when tested directly
4. **Current Vercel project settings** (Root Directory, etc.)

This will help me provide a targeted fix! 🎯