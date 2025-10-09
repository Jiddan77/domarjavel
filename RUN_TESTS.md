# 🧪 Dommarjävel Testing Guide

## Quick Start Testing

### 1. Fix Code Issues (Already Done)
The following critical issues have been fixed:
- ✅ Removed duplicate Card imports in page.tsx
- ✅ Fixed TypeScript error in TelemetrySummary.tsx  
- ✅ Removed unused variable in HistoricalTrends.tsx

### 2. Start the Application

**Terminal 1 - Backend:**
```bash
cd Backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

### 3. Verify Setup

**Test Backend API:**
```bash
python test_api.py
```

**Test Frontend Build:**
```bash
cd Frontend
node test_build.js
```

**Manual Verification:**
- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## 🎯 Systematic Testing Approach

### Phase 1: Basic Functionality (5 minutes)

1. **Load Homepage**
   - Open http://localhost:3000
   - Verify no console errors (F12 → Console)
   - Check all components render

2. **Test Navigation**
   - Click "Rankings" → verify /ranking loads
   - Click back arrow → return to homepage
   - Verify URL changes correctly

3. **Test Basic Filtering**
   - Click "Filters" button → panel opens
   - Select a season → results update
   - Select "Clear all filters" → resets

### Phase 2: Core Features (10 minutes)

4. **Team Preference**
   - Click heart icon → dropdown opens
   - Select a team → button updates
   - Refresh page → preference persists

5. **Referee Voting**
   - Go to Rankings page
   - Click thumbs up on a referee
   - Verify vote registers and buttons disable
   - Check vote count increases

6. **Advanced Filtering**
   - Return to homepage
   - Apply multiple filters (season + team)
   - Verify results update correctly
   - Check context-sensitive components appear

### Phase 3: Interactive Components (10 minutes)

7. **Match Details**
   - Click on any match in the table
   - Verify modal opens with details
   - Check card/penalty breakdown
   - Close modal

8. **Historical Trends**
   - Filter by exactly 1 referee
   - Verify Historical Trends component appears
   - Switch between Cards/Penalties/Win Rate
   - Check data updates

9. **Advanced Statistics**
   - Check Advanced Statistics panel
   - Click through all 3 tabs
   - Verify data loads for each

### Phase 4: Edge Cases (5 minutes)

10. **Error Handling**
    - Disconnect internet
    - Verify error messages appear
    - Reconnect and verify recovery

11. **Responsive Design**
    - Resize browser window
    - Test mobile view (F12 → Device toolbar)
    - Verify components adapt

12. **Performance**
    - Check telemetry component
    - Verify events are tracked
    - Test "Clear Data" functionality

---

## 🔍 Detailed Testing Checklist

Use the comprehensive [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for thorough testing.

---

## 🐛 Common Issues & Solutions

### Backend Issues

**"Connection refused" errors:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, start it:
cd Backend
python -m uvicorn app.main:app --reload --port 8000
```

**CORS errors in browser:**
- Check browser console for CORS messages
- Verify NEXT_PUBLIC_API_URL in Frontend/.env.local
- Backend should allow http://localhost:3000

**Database errors:**
- Backend will fallback to JSON data if database fails
- Check Backend/data/data.json exists
- Look for "json_fallback" in /health endpoint

### Frontend Issues

**Build errors:**
```bash
cd Frontend
npm run build
# Fix any TypeScript/ESLint errors shown
```

**API connection issues:**
- Check Frontend/.env.local has correct API_URL
- Verify network tab in browser dev tools
- Test API endpoints directly: http://localhost:8000/api/seasons

**Component not rendering:**
- Check browser console for JavaScript errors
- Verify all imports are correct
- Check for missing dependencies

### Data Issues

**No matches/referees showing:**
- Verify Backend/data/data.json has content
- Check API responses in network tab
- Look for parsing errors in console

**Filters not working:**
- Check if API endpoints return filtered data
- Verify query parameters in network requests
- Test with simple filters first

---

## 📊 Success Metrics

### Must Work (Critical)
- [ ] Homepage loads without errors
- [ ] Basic filtering works
- [ ] Navigation between pages
- [ ] API endpoints respond
- [ ] Match data displays

### Should Work (Important)  
- [ ] Team preference persistence
- [ ] Referee voting system
- [ ] Advanced statistics
- [ ] Responsive design
- [ ] Error handling

### Nice to Have (Enhancement)
- [ ] Telemetry tracking
- [ ] Historical trends
- [ ] Match details modal
- [ ] Performance optimization
- [ ] Smooth animations

---

## 🚀 Quick Test Commands

**Full test suite:**
```bash
# Test backend
python test_api.py

# Test frontend
cd Frontend && node test_build.js

# Start both services
# Terminal 1:
cd Backend && python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: 
cd Frontend && npm run dev
```

**Individual component tests:**
```bash
# Test specific API endpoint
curl http://localhost:8000/api/seasons

# Check frontend build
cd Frontend && npm run build

# Type checking only
cd Frontend && npx tsc --noEmit
```

---

## 📝 Report Issues

When testing, document any issues found:

**Format:**
```
Issue: [Brief description]
Page: [Homepage/Rankings/etc]
Steps: [How to reproduce]
Expected: [What should happen]
Actual: [What actually happens]
Browser: [Chrome/Firefox/Safari]
Severity: [Critical/High/Medium/Low]
```

**Example:**
```
Issue: Voting buttons don't disable after clicking
Page: Rankings
Steps: 1. Go to rankings 2. Click thumbs up 3. Try clicking again
Expected: Button should be disabled after first click
Actual: Can click multiple times
Browser: Chrome 120
Severity: Medium
```

This systematic approach will help you thoroughly test all functionality and identify any issues that need fixing.