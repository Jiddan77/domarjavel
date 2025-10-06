# Frontend Update for Real Backend

## 🔄 Switch from Mock Data to Real Backend

### Step 1: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**:
   - Select your `dommarjavel` project
   - Go to **Settings** → **Environment Variables**

2. **Add/Update**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

3. **Redeploy**:
   - Go to **Deployments** tab
   - Click **"Redeploy"** on latest deployment

### Step 2: Remove Mock API Routes (Optional)

Since you now have a real backend, you can remove the mock API routes:

```bash
# Remove these files (optional - they won't interfere)
rm -rf Frontend/app/api/
```

### Step 3: Test Integration

Visit https://dommarjavel.vercel.app/ and verify:

✅ **Seasons filter** shows real data (2020-2025)
✅ **Referees filter** shows real Swedish referees  
✅ **Teams filter** shows real Swedish teams
✅ **Statistics** show real match data
✅ **Match table** shows real match results
✅ **No console errors**

### Expected Behavior:

- **Much more data**: 1,440 real matches instead of 3 mock matches
- **Real referees**: 46 actual Swedish referees
- **Real teams**: 16 Allsvenskan teams
- **Real statistics**: Accurate yellow/red cards, penalties
- **Better filtering**: More meaningful filter combinations

## 🎉 Success!

Your app now runs on:
- **Frontend**: Vercel (https://dommarjavel.vercel.app/)
- **Backend**: Railway (https://your-backend-url.railway.app/)
- **Database**: PostgreSQL on Railway
- **Data**: 1,440 real Swedish football matches

You've successfully deployed a full-stack application with real data! 🇸🇪⚽