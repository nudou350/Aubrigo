# PWA Caching Implementation - Test Guide

## How to Test the Caching System

### Test 1: Verify Instant Navigation (Cache Hit)

1. **Start the dev server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Open browser DevTools:**
   - Press F12 → Network tab
   - Check "Disable cache" is OFF

3. **Navigate to home page:**
   - First load: You'll see loading indicator + API calls in Network tab
   - **Record the number of requests** (e.g., 3 requests: pets, cities, ongs)

4. **Navigate away and back:**
   - Click on a pet → Click back button
   - **Expected Result:**
     - ✅ NO loading indicator
     - ✅ Data appears instantly
     - ✅ Network tab shows 0 new requests (cached)
   - **If you see stale data refreshing:**
     - Small delay, then new data appears silently (background refresh)

5. **Check console for cache stats:**
   ```javascript
   // In browser console
   // Find CacheService instance and call:
   angular.getComponent(document.querySelector('app-home')).cacheService.getStats()
   ```

### Test 2: Verify Background Refresh (Stale-While-Revalidate)

1. **Open home page and note the timestamp**

2. **Wait 2.5 minutes** (50% of 5-minute TTL)

3. **Navigate to pets detail and back to home**

4. **Expected Result:**
   - ✅ Cached data appears INSTANTLY
   - ✅ After ~500ms, Network tab shows background API call
   - ✅ Page updates silently with fresh data (no loading flicker)

### Test 3: Verify Cache Expiration

1. **Open home page**

2. **Wait 5+ minutes** (full TTL expiration)

3. **Navigate away and back**

4. **Expected Result:**
   - ✅ Loading indicator appears (cache expired)
   - ✅ Fresh API call in Network tab
   - ✅ New data cached for next 5 minutes

### Test 4: Verify Pull-to-Refresh (iOS/Android)

#### On Mobile Device or Chrome DevTools Mobile Mode:

1. **Enable mobile emulation:**
   - F12 → Toggle device toolbar (Ctrl+Shift+M)
   - Select iPhone or Android device

2. **Open home page**

3. **Scroll to the very top** (scrollTop must be 0)

4. **Pull down with mouse/finger:**
   - Drag from top of screen downward
   - **Expected Result:**
     - ✅ Refresh indicator appears and follows your gesture
     - ✅ At 80px, indicator locks and spins
     - ✅ Release → Loading indicator appears
     - ✅ Network tab shows fresh API calls
     - ✅ Page updates with new data

5. **Check cache was cleared:**
   ```javascript
   // Cache size should reset to 0 during refresh
   cacheService.getStats().size
   ```

### Test 5: Verify Cache Invalidation on Mutations

**Scenario:** ONG creates a new pet

1. **Login as ONG account**

2. **Open home page → Note the pet count**

3. **Create a new pet:**
   - Navigate to "Add Pet"
   - Fill form and submit

4. **Expected Result:**
   - ✅ After creation, redirected to home
   - ✅ Loading indicator appears (cache was invalidated)
   - ✅ New pet appears in the list
   - ✅ Network tab shows fresh API call

### Test 6: iOS Safari Specific Testing

**On actual iOS device (iPhone/iPad):**

1. **Add Aubrigo to home screen:**
   - Safari → Share → Add to Home Screen

2. **Open as PWA (from home screen icon)**

3. **Test pull-to-refresh:**
   - Scroll to top
   - Pull down gesture
   - **Expected Result:** Custom refresh indicator (NOT native Safari bounce)

4. **Test offline mode:**
   - Enable Airplane mode
   - Open app
   - **Expected Result:** Cached data still displays

## Expected Performance Metrics

### Before Optimization:
- First navigation: 500-2000ms
- Subsequent navigations: 500-2000ms (same, refetches every time)
- API calls per session: ~20-50
- Loading indicators: Every navigation

### After Optimization:
- First navigation: 500-2000ms (unchanged)
- Subsequent navigations: <50ms (instant from cache)
- API calls per session: ~5-10 (80% reduction)
- Loading indicators: First load only

## Troubleshooting

### Issue: Data never updates

**Cause:** TTL too long or background refresh not working

**Solution:**
```typescript
// In cache.service.ts, reduce TTL
pets: { ttl: 2 * 60 * 1000, staleWhileRevalidate: true }, // 2 minutes
```

### Issue: Pull-to-refresh doesn't work on iOS

**Check:**
1. Is scroll position at top? (scrollTop = 0)
2. Is element scrollable? (must have overflow)
3. Is touch event supported? (should work on all iOS Safari)

**Debug:**
```typescript
// Add console.log in pull-to-refresh.directive.ts
private onTouchStart(event: TouchEvent): void {
  console.log('Touch start detected', event);
  // ...
}
```

### Issue: Loading indicator still appears on navigation

**Check:**
```typescript
// In home.component.ts loadPets()
const hasCachedData = this.pets().length > 0;
console.log('Has cached data:', hasCachedData); // Should be true after first load
```

### Issue: Cache grows too large (memory concern)

**Solution:**
```typescript
// Add cache size limits in cache.service.ts
private cache = new Map<string, CacheEntry<any>>();
private maxCacheSize = 100; // Maximum 100 entries

set<T>(key: string, data: T, config: string | CacheConfig): void {
  if (this.cache.size >= this.maxCacheSize) {
    // Remove oldest entry (LRU eviction)
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
  }
  // ... rest of set logic
}
```

## Cache Monitoring (Development Only)

Add this to see cache activity in real-time:

```typescript
// In app.component.ts (development only)
export class AppComponent implements OnInit {
  private cacheService = inject(CacheService);

  ngOnInit() {
    if (!environment.production) {
      setInterval(() => {
        console.log('Cache Stats:', this.cacheService.getStats());
        console.log('Cache Keys:', this.cacheService.getKeys());
      }, 10000); // Log every 10 seconds
    }
  }
}
```

## Success Criteria

✅ **Navigation feels instant** - No loading indicators on back/forward
✅ **Data stays fresh** - Updates appear within 5 minutes
✅ **Pull-to-refresh works** - Manual refresh on mobile
✅ **Offline support** - Cached data available without network
✅ **Low API usage** - 60-80% fewer requests
✅ **Smooth UX** - No flickering or jarring transitions

## Next Steps

After verifying all tests pass:

1. Monitor production metrics (API request count)
2. Gather user feedback on perceived performance
3. Adjust TTL values based on usage patterns
4. Consider implementing cache warming on app startup
5. Add cache debugging panel (development only)
