# Analytics System - Guia Completo

Sistema de analytics interno, offline-first e focado em privacidade para o Aubrigo.

---

## 📊 Visão Geral

O sistema de analytics do Aubrigo foi projetado para:

- ✅ **Offline-First** - Funciona sem conexão
- ✅ **Privacy-Focused** - Dados ficam no nosso servidor
- ✅ **GDPR Compliant** - Sem cookies de terceiros
- ✅ **Real-time** - Estatísticas atualizadas
- ✅ **Lightweight** - Não impacta performance

---

## 🏗️ Arquitetura

### Frontend

```
User Action → AnalyticsService → IndexedDB (offline)
                    ↓
              Sync to Backend (when online)
```

### Backend

```
Frontend Events → NestJS Controller → PostgreSQL
                       ↓
                  Analytics Service → Stats Aggregation
```

### Database Schema

```sql
analytics_events
├── id (UUID)
├── event_type (VARCHAR) - 'pet_view', 'pet_favorite', etc
├── event_category (VARCHAR) - 'engagement', 'conversion', etc
├── pet_id (UUID) - Optional reference
├── ong_id (UUID) - Optional reference
├── user_session_id (VARCHAR) - Session tracking
├── metadata (JSONB) - Flexible event data
├── is_offline_event (BOOLEAN)
├── client_timestamp (TIMESTAMP)
└── created_at (TIMESTAMP)
```

---

## 🚀 Quick Start

### 1. Backend Setup

#### Run Migration

```bash
cd backend
psql -U postgres -d aubrigo < src/database/migrations/create-analytics-events-table.sql
```

#### Import Module

```typescript
// app.module.ts
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // ... other modules
    AnalyticsModule,
  ],
})
export class AppModule {}
```

### 2. Frontend Usage

#### Track Events

```typescript
import { AnalyticsService, EventType } from '@core/services/analytics.service';

@Component({...})
export class PetDetailComponent {
  private analytics = inject(AnalyticsService);

  async ngOnInit() {
    // Track pet view
    await this.analytics.track(EventType.PET_VIEW, {
      petId: this.pet.id,
      ongId: this.pet.ongId,
      metadata: {
        petName: this.pet.name,
        species: this.pet.species
      }
    });
  }
}
```

### 3. View Analytics Dashboard

```typescript
// Route to dashboard
{
  path: 'admin/analytics',
  loadComponent: () => import('./features/admin/analytics-dashboard/analytics-dashboard.component')
}
```

---

## 📈 Event Types

### Engagement

```typescript
EventType.PET_VIEW          // User views pet detail
EventType.PET_FAVORITE      // User favorites a pet
EventType.PET_UNFAVORITE    // User removes favorite
EventType.PET_SHARE         // User shares a pet
```

### Conversion

```typescript
EventType.APPOINTMENT_CREATE    // User books visit
EventType.APPOINTMENT_CANCEL    // User cancels visit
EventType.DONATION_START        // User starts donation
EventType.DONATION_COMPLETE     // User completes donation
```

### Navigation

```typescript
EventType.SEARCH          // User searches
EventType.FILTER_APPLY    // User applies filters
EventType.PAGE_VIEW       // User views page
```

### Technical

```typescript
EventType.PWA_INSTALL              // User installs PWA
EventType.PWA_UNINSTALL            // User uninstalls PWA
EventType.OFFLINE_MODE             // User goes offline
EventType.SERVICE_WORKER_UPDATE    // SW updates
```

### User

```typescript
EventType.USER_REGISTER    // User registers
EventType.USER_LOGIN       // User logs in
EventType.USER_LOGOUT      // User logs out
```

---

## 🔧 API Reference

### AnalyticsService (Frontend)

#### `track(type, data)`

Track a single event.

```typescript
await analytics.track(EventType.PET_VIEW, {
  petId: '123',
  ongId: '456',
  metadata: { custom: 'data' }
});
```

#### `trackPageView(path, title?)`

Track a page view.

```typescript
await analytics.trackPageView('/pets/123', 'Pet Detail');
```

#### `trackSearch(query, results)`

Track a search event.

```typescript
await analytics.trackSearch('golden retriever', 5);
```

#### `trackFilter(filters)`

Track filter usage.

```typescript
await analytics.trackFilter({
  species: 'dog',
  size: 'medium',
  location: 'Lisboa'
});
```

#### `syncEvents()`

Manually sync pending events.

```typescript
await analytics.syncEvents();
```

#### `getLocalStats()`

Get local statistics.

```typescript
const stats = await analytics.getLocalStats();
// Returns: { totalEvents, pendingEvents, eventsByType }
```

---

## 📡 Backend API Endpoints

### POST `/api/analytics/track`

Track events (batch).

**Request:**
```json
{
  "events": [
    {
      "id": "event_123",
      "type": "pet_view",
      "category": "engagement",
      "petId": "pet_456",
      "ongId": "ong_789",
      "sessionId": "session_abc",
      "timestamp": 1699876543210,
      "offline": false,
      "sent": false,
      "metadata": {
        "petName": "Max",
        "species": "Dog"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Events tracked successfully",
  "count": 1
}
```

### GET `/api/analytics/stats?ongId=xxx&days=30`

Get statistics for an ONG.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "petViews": 1250,
      "favorites": 85,
      "appointments": 23,
      "shares": 45
    },
    "viewsByDay": [
      { "date": "2024-01-01", "count": 50 },
      { "date": "2024-01-02", "count": 62 }
    ],
    "topPets": [
      {
        "petId": "pet_123",
        "petName": "Max",
        "petSpecies": "Dog",
        "views": 120
      }
    ],
    "eventBreakdown": [
      { "eventType": "pet_view", "count": 1250 },
      { "eventType": "pet_favorite", "count": 85 }
    ]
  }
}
```

### GET `/api/analytics/top-pets?ongId=xxx&limit=10`

Get top pets by views.

### GET `/api/analytics/views-by-day?ongId=xxx&days=30`

Get views by day.

### GET `/api/analytics/total`

Get total events count (admin only).

---

## 💾 Offline Behavior

### How It Works

1. **Online**
   - Events are saved to IndexedDB
   - Immediately sent to backend
   - Marked as sent

2. **Offline**
   - Events are saved to IndexedDB
   - Marked as not sent
   - Queued for later sync

3. **Back Online**
   - Auto-sync triggered
   - Pending events sent in batches (50 per batch)
   - Successfully sent events marked as sent

### Auto-Sync Triggers

- **Network Change**: When device comes back online
- **Periodic**: Every 5 minutes (if online)
- **Page Unload**: Before user leaves (using sendBeacon)

### Manual Sync

```typescript
await analytics.syncEvents();
```

---

## 📊 Dashboard Features

### Summary Cards

- Total Pet Views
- Total Favorites
- Total Appointments
- Total Shares

### Views Chart

Bar chart showing views per day for selected period.

### Top Pets

List of most viewed pets with:
- Pet name
- Species
- View count

### Event Breakdown

Distribution of events by type with progress bars.

### Period Selection

- Last 7 days
- Last 30 days
- Last 90 days

---

## 🔒 Privacy & Security

### Data We Track

✅ **Allowed:**
- Event types (views, clicks, etc)
- Pet/ONG references
- Session IDs (anonymous)
- Timestamps
- User actions

❌ **Never Tracked:**
- Passwords
- Credit card numbers
- Personal messages
- Sensitive user data

### GDPR Compliance

- No third-party cookies
- Data stays in our database
- Users can request data deletion
- Transparent about tracking

### IP Address

- Stored for analytics only
- Not used for tracking individuals
- Automatically anonymized after 90 days

---

## 🧹 Data Retention

### Automatic Cleanup

- **Sent Events**: Deleted after 30 days from IndexedDB
- **Server Events**: Kept indefinitely (can be configured)

### Manual Cleanup

```typescript
// Backend cleanup job (run monthly)
await analyticsService.deleteOldEvents(90); // Delete events older than 90 days
```

---

## 🧪 Testing

### Test Events Locally

```typescript
// Open DevTools Console
const analytics = inject(AnalyticsService);

// Track test event
await analytics.track(EventType.PET_VIEW, {
  petId: 'test_pet',
  ongId: 'test_ong'
});

// Check local stats
const stats = await analytics.getLocalStats();
console.log(stats);
```

### View IndexedDB

1. Open Chrome DevTools
2. Go to Application tab
3. Expand IndexedDB
4. Click `aubrigo_analytics` → `events`

### Test Offline Mode

1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Perform actions (view pet, favorite, etc)
4. Check IndexedDB for queued events
5. Go back online
6. Verify events sync automatically

---

## 📚 Examples

See `ANALYTICS_INTEGRATION_EXAMPLES.md` for detailed integration examples.

---

## 🐛 Troubleshooting

### Events Not Syncing

1. Check network status
   ```typescript
   console.log(navigator.onLine);
   ```

2. Check pending events
   ```typescript
   const stats = await analytics.getLocalStats();
   console.log('Pending:', stats.pendingEvents);
   ```

3. Force sync
   ```typescript
   await analytics.syncEvents();
   ```

### IndexedDB Errors

If IndexedDB fails, events will be lost. Check:
- Browser supports IndexedDB
- Private/Incognito mode (some browsers disable it)
- Storage quota not exceeded

### Backend Not Receiving Events

1. Check network requests in DevTools
2. Verify backend is running
3. Check CORS configuration
4. Verify endpoint URL is correct

---

## 🎯 Best Practices

1. **Don't Block UI**
   - Use async/await but don't wait for sync
   - Analytics should be fire-and-forget

2. **Include Context**
   - Add relevant metadata
   - Makes data actionable

3. **Test Offline**
   - Always test with offline mode
   - Verify sync when back online

4. **Monitor Storage**
   - Don't let IndexedDB grow too large
   - Regular cleanup is important

5. **Respect Privacy**
   - Only track what's necessary
   - Follow GDPR guidelines

---

## 📈 Future Enhancements

- [ ] Real-time dashboard updates (WebSockets)
- [ ] Custom date range selection
- [ ] Export reports (PDF, CSV)
- [ ] Funnel analysis (view → favorite → appointment)
- [ ] A/B testing support
- [ ] Heatmaps
- [ ] User segmentation
- [ ] Retention analysis

---

## 📞 Support

For questions or issues:
- Check documentation first
- Look at integration examples
- Test in DevTools
- Check server logs

---

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Maintained By:** Aubrigo Dev Team
