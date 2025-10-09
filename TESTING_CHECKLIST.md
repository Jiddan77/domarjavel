# Dommarjävel - Comprehensive Testing Checklist

## 🚀 Pre-Testing Setup

### Start the Application
```bash
# Terminal 1 - Backend
cd Backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd Frontend
npm run dev
```

### Verify Environment
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] API health check: http://localhost:8000/health
- [ ] Frontend loads without errors

---

## 🏠 Homepage Testing

### Initial Load
- [x] Page loads without errors
- [x] Header displays "Dommarjävel" title
- [x] All components render (no loading spinners stuck)
- [x] No console errors in browser dev tools

### Header Components
- [x] Team preference button shows "Choose Team"
- [x] Rankings button navigates to /ranking
Admin panel for me to see who woted what? 
- [x] Filters button toggles filter panel
- [x] Responsive design works on mobile/tablet

### Advanced Filters Panel
- [x] Click "Filters" button to show/hide panel
- [x] Season dropdown populates with 2020-2025
- [x] Referee dropdown loads (may take a moment)Still need to remove referes that are corrupt
- [x] Team dropdown loads (may take a moment)
- [x] Home/Away buttons work (All/Hemma/Borta)
- [x] "Clear all filters" resets everything
- [x] Filter indicator dot appears when filters active(We should redsign the filter view)

### Statistics Dashboard
- [x] Overall Statistics panel shows data(add more)
- [x] Facts Panel displays insights(add more)
- [x] Advanced Statistics Panel has 3 tabs
- [x] Leaderboard shows top referees(add by voting?)
- [x] All loading states work properly

### Match Results Section
- [x] Match table displays data
- [x] Pagination works (if >50 matches)
- [ ] "Show Upcoming" toggle works(No we are only shoing 0-0 games and some games ended 0-0 and that is not how we shoudld determaite if it is uppcomig)
- [ ] Match count displays correctly(No since above error)

---

## 🔍 Filtering System Testing

### Single Filters
- [x] Select one season → results update
- [x] Select one referee → results update  
- [x] Select one team → results update
- [x] Select Home/Away → results update

### Combined Filters
- [x] Season + Team combination
- [x] Referee + Season combination
- [x] Team + Home/Away combination
- [x] All filters combined

### Dynamic Content (Context-Sensitive)
- [x] Select exactly 1 team → "Top Referees for Team" appears
- [x] Select exactly 1 team → "Enhanced Team Stats" appears
- [ ] Select exactly 1 referee → "Historical Trends" appears (NO)
- [ ] Multiple selections → context components disappear(Not there from start)

### Filter Persistence
- [x] Apply filters → navigate to rankings → return → filters preserved
- [x] Page refresh maintains filter state (if implemented) 

---

## 🏆 Rankings Page Testing

### Navigation
- [x] Click "Rankings" button from homepage
- [x] Page loads at /ranking
- [x] Back arrow returns to homepage
- [x] URL changes correctly

### Ranking Categories
- [x] "Audience Rating" tab (default)
- [x] "Card Activity" tab
- [x] "Penalty Frequency" tab  
- [x] "Neutrality" tab
- [x] Data updates when switching tabs
We need to show how we calculate bias rating
### Sorting Options
- [x] "Highest First" button
- [x] "Lowest First" button
- [x] Rankings reorder correctly

### Referee Cards
- [x] All referees display with ranking numbers
- [x] Gold/Silver/Bronze styling for top 3
- [x] Performance metrics show correctly
- [x] Voting buttons work (see voting section)

---

## 👍 Voting System Testing

### Vote Submission
- [x] Click thumbs up → vote registers
- [x] Click thumbs down → vote registers
- [x] Buttons disable after voting
- [ ] "Thanks for feedback" message appears
(Not showing)
- [x] Vote counts update immediately

### Vote Persistence
- [x] Refresh page → vote status maintained
- [x] Navigate away and back → vote status maintained
- [x] Multiple referees → individual vote states

### Team-Specific Voting
- [x] Set team preference first
- [ ] Vote on referee → team-specific stats update(No cant bee seen)
- [ ] Team approval percentage displays
- [ ] Overall vs team-specific ratings differ

---

## 👥 Team Preference Testing

### Team Selection
- [x] Click heart icon → dropdown opens
- [x] "No preference" option works
- [x] Select team → button updates with team name
- [x] Heart icon fills when team selected
- [x] Click outside → dropdown closes

### Persistence
- [x] Refresh page → team preference maintained
- [x] Navigate between pages → preference maintained
- [x] Clear browser storage → preference resets

### Personalization Effects
- [ ] Team-specific referee ratings appear
- [x] Enhanced team stats show when team filtered
- [ ] Voting displays team-specific percentages

---

## 📊 Interactive Components Testing

### Match Details Modal
- [x] Click any match → modal opens
- [x] Match details display correctly
- [x] Card breakdown shows home/away split
- [x] Win/loss status correct
- [x] Close button works
- [x] Click outside modal → closes
- [x] Scroll works for long match lists

### Historical Trends (Referee Selected)
- [ ] Select exactly 1 referee(Not showing)
- [ ] Historical Trends component appears
- [ ] Switch between Cards/Penalties/Win Rate
- [ ] Bar charts animate correctly
- [ ] Summary stats calculate correctly

### Advanced Statistics Tabs
- [x] "Home/Away Bias" tab
- [x] "Team Performance" tab  
- [x] "Match Outcomes" tab
- [x] Data loads for each tab
- [x] Team dropdown in Team Performance tab

---

## 📈 Telemetry Testing

### Event Tracking
- [ ] Open browser dev tools → Application → Local Storage
- [ ] Navigate pages → events logged
- [ ] Change filters → filter_change events
- [ ] Vote on referees → vote events
- [ ] Click team preference → team_select events

### Telemetry Summary Component
- [ ] Shows total events count
- [ ] Shows recent events (24h)
- [ ] Shows hourly events
- [ ] "Show Details" reveals event list
- [ ] "Clear Data" removes all telemetry
- [ ] Session info displays correctly

---

## 🔧 Error Handling Testing

### Network Issues
- [ ] Disconnect internet → error messages appear
- [ ] Reconnect → data loads properly
- [ ] Slow network → loading spinners show

### Invalid Data
- [ ] Empty API responses → graceful handling
- [ ] Malformed data → error boundaries catch
- [ ] Missing referee/team data → fallbacks work

### Edge Cases
- [ ] No matches found → appropriate message
- [ ] Single match result → pagination hidden
- [ ] No referees with minimum matches → empty state

---

## 📱 Responsive Design Testing

### Mobile (320px - 768px)
- [ ] Header collapses appropriately
- [ ] Filter panel stacks vertically
- [ ] Match table scrolls horizontally
- [ ] Buttons remain clickable
- [ ] Text remains readable

### Tablet (768px - 1024px)
- [ ] Layout adapts to medium screens
- [ ] Statistics cards reflow properly
- [ ] Navigation remains accessible

### Desktop (1024px+)
- [ ] Full layout displays correctly
- [ ] All components have proper spacing
- [ ] No horizontal scrolling needed

---

## 🎯 Performance Testing

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Filter changes < 1 second
- [ ] Navigation between pages < 1 second
- [ ] Large result sets load reasonably

### Memory Usage
- [ ] No memory leaks during extended use
- [ ] Telemetry data doesn't grow excessively
- [ ] Image/component cleanup works

---

## 🔍 API Endpoint Testing

### Direct API Testing (use browser or Postman)
- [ ] GET /api/seasons → returns season list
- [ ] GET /api/referees → returns referee list
- [ ] GET /api/teams → returns team list
- [ ] GET /api/matches → returns match data
- [ ] GET /api/stats → returns statistics
- [ ] GET /api/advanced-stats → returns advanced analytics
- [ ] GET /api/leaderboard → returns referee rankings
- [ ] POST /api/referee-vote → accepts vote data
- [ ] GET /api/referee-votes → returns vote data

### API Error Handling
- [ ] Invalid parameters → proper error responses
- [ ] Rate limiting → 429 responses (if implemented)
- [ ] CORS headers → allow frontend requests

---

## 🐛 Known Issues to Check

### Code Issues Found
- [ ] Duplicate Card imports in page.tsx (lines 32-35)
- [ ] TypeScript error in TelemetrySummary.tsx (count type)
- [ ] Card.tsx vs card.tsx casing issue in imports
- [ ] Unused 'index' variable in HistoricalTrends.tsx

### Potential Runtime Issues
- [ ] Environment variables set correctly
- [ ] API_URL configuration matches backend
- [ ] CORS settings allow frontend domain
- [ ] Database connection works (or JSON fallback)

---

## ✅ Success Criteria

### Functionality
- [ ] All major features work without errors
- [ ] Data displays correctly and updates
- [ ] User interactions provide feedback
- [ ] Navigation flows smoothly

### User Experience
- [ ] Intuitive interface
- [ ] Responsive design works
- [ ] Loading states provide feedback
- [ ] Error messages are helpful

### Performance
- [ ] Reasonable load times
- [ ] Smooth interactions
- [ ] No browser console errors
- [ ] Memory usage stable

---

## ✅ Issues Fixed

1. ✅ **Fixed duplicate Card imports** in page.tsx
2. ✅ **Resolved TypeScript errors** in TelemetrySummary.tsx
3. ✅ **Fixed unused variables** in HistoricalTrends.tsx
4. ✅ **Fixed "Show Upcoming" logic** - now uses date-based detection
5. ✅ **Added pagination options** - 25, 50, 100, 200 per page
6. ✅ **Fixed Historical Trends** - now shows when 1 referee selected
7. ✅ **Added vote persistence** - votes saved to localStorage
8. ✅ **Created Admin Panel** - /admin for vote management
9. ✅ **Added corrupt referee filtering** - removes invalid referee names
10. ✅ **Added admin endpoints** - clear votes functionality

## 🚨 Remaining Issues to Test

1. **Verify API connectivity** between frontend/backend
2. **Test with real data** to ensure parsing works correctly
3. **Test admin panel authentication** (password: dommarjavel2024)
4. **Verify team-specific voting displays** correctly

---

## 📝 Testing Notes

Record any issues found:
- Browser: 
- Issue: 
- Steps to reproduce:
- Expected vs actual behavior:
- Severity: Critical/High/Medium/Low
