# Analytics Integration Examples

Este guia mostra como integrar o Analytics Service nos componentes existentes.

## Setup Inicial

### 1. Importar e Injetar

```typescript
import { AnalyticsService, EventType } from '@core/services/analytics.service';

@Component({...})
export class YourComponent {
  private analytics = inject(AnalyticsService);
}
```

---

## Exemplos por Feature

### Pet Detail (Visualização de Pet)

```typescript
// pet-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { AnalyticsService, EventType } from '@core/services/analytics.service';

@Component({...})
export class PetDetailComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  pet: Pet;

  async ngOnInit() {
    // Track pet view
    await this.analytics.track(EventType.PET_VIEW, {
      petId: this.pet.id,
      ongId: this.pet.ongId,
      metadata: {
        petName: this.pet.name,
        species: this.pet.species,
        age: this.pet.age,
        location: this.pet.location,
        source: 'detail_page'
      }
    });
  }
}
```

### Favorites (Favoritar/Desfavoritar)

```typescript
// favorites.service.ts or component
async addFavorite(petId: string, ongId: string) {
  // Add to database
  await this.http.post('/api/favorites', { petId }).toPromise();

  // Track analytics
  await this.analytics.track(EventType.PET_FAVORITE, {
    petId,
    ongId,
    metadata: {
      action: 'add',
      timestamp: Date.now()
    }
  });
}

async removeFavorite(petId: string, ongId: string) {
  // Remove from database
  await this.http.delete(`/api/favorites/${petId}`).toPromise();

  // Track analytics
  await this.analytics.track(EventType.PET_UNFAVORITE, {
    petId,
    ongId,
    metadata: {
      action: 'remove',
      timestamp: Date.now()
    }
  });
}
```

### Share (Compartilhamento)

```typescript
// share-button.component.ts
async handleShare(platform: string) {
  const success = await this.shareService.shareVia(platform, this.shareData);

  if (success) {
    // Track share event
    await this.analytics.track(EventType.PET_SHARE, {
      petId: this.shareData.petId,
      ongId: this.shareData.ongId,
      metadata: {
        platform,
        url: this.shareData.url,
        timestamp: Date.now()
      }
    });
  }
}
```

### Appointments (Agendamentos)

```typescript
// appointment-form.component.ts
async createAppointment(data: CreateAppointmentDto) {
  try {
    const appointment = await this.http.post('/api/appointments', data).toPromise();

    // Track appointment creation
    await this.analytics.track(EventType.APPOINTMENT_CREATE, {
      petId: data.petId,
      ongId: data.ongId,
      metadata: {
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        source: 'web_form'
      }
    });

    return appointment;
  } catch (error) {
    console.error('Failed to create appointment:', error);
  }
}

async cancelAppointment(appointmentId: string, petId: string, ongId: string) {
  await this.http.delete(`/api/appointments/${appointmentId}`).toPromise();

  // Track cancellation
  await this.analytics.track(EventType.APPOINTMENT_CANCEL, {
    petId,
    ongId,
    metadata: {
      appointmentId,
      reason: 'user_cancelled'
    }
  });
}
```

### Search (Busca)

```typescript
// home.component.ts
async onSearch(query: string) {
  const results = await this.searchService.search(query);

  // Track search
  await this.analytics.trackSearch(query, results.length);

  this.searchResults = results;
}
```

### Filters (Filtros)

```typescript
// filter.component.ts
async applyFilters(filters: any) {
  // Apply filters
  this.activeFilters = filters;

  // Track filter usage
  await this.analytics.trackFilter(filters);

  // Update results
  this.updateResults();
}
```

### Donations (Doações)

```typescript
// donation.component.ts
async startDonation(amount: number, ongId: string) {
  // Track donation start
  await this.analytics.track(EventType.DONATION_START, {
    ongId,
    metadata: {
      amount,
      currency: 'EUR',
      method: 'stripe'
    }
  });

  // Redirect to payment
  this.router.navigate(['/donate/checkout']);
}

async completeDonation(donationId: string, amount: number, ongId: string) {
  // Track donation completion
  await this.analytics.track(EventType.DONATION_COMPLETE, {
    ongId,
    metadata: {
      donationId,
      amount,
      currency: 'EUR',
      success: true
    }
  });
}
```

### Page Views (Navegação)

```typescript
// app.component.ts or router guard
@Component({...})
export class AppComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  ngOnInit() {
    // Track page views on route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.analytics.trackPageView(event.url);
      }
    });
  }
}
```

### PWA Events (Instalação/Service Worker)

```typescript
// pwa.service.ts
constructor() {
  // Track PWA installation
  window.addEventListener('appinstalled', () => {
    this.analytics.track(EventType.PWA_INSTALL, {
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
    });
  });

  // Track service worker updates
  this.swUpdate.versionUpdates.subscribe((event) => {
    if (event.type === 'VERSION_READY') {
      this.analytics.track(EventType.SERVICE_WORKER_UPDATE, {
        metadata: {
          currentVersion: event.currentVersion,
          latestVersion: event.latestVersion
        }
      });
    }
  });

  // Track offline mode
  window.addEventListener('offline', () => {
    this.analytics.track(EventType.OFFLINE_MODE, {
      metadata: {
        status: 'offline',
        timestamp: Date.now()
      }
    });
  });
}
```

### User Authentication (Login/Register)

```typescript
// auth.service.ts
async register(email: string, password: string) {
  const user = await this.http.post('/api/auth/register', { email, password }).toPromise();

  // Track registration
  await this.analytics.track(EventType.USER_REGISTER, {
    metadata: {
      userEmail: email,
      timestamp: Date.now()
    }
  });

  return user;
}

async login(email: string, password: string) {
  const user = await this.http.post('/api/auth/login', { email, password }).toPromise();

  // Track login
  await this.analytics.track(EventType.USER_LOGIN, {
    ongId: user.id,
    metadata: {
      userEmail: email,
      timestamp: Date.now()
    }
  });

  return user;
}

async logout() {
  const currentUser = this.getCurrentUser();

  // Track logout
  await this.analytics.track(EventType.USER_LOGOUT, {
    ongId: currentUser.id,
    metadata: {
      timestamp: Date.now()
    }
  });

  // Clear session
  this.clearSession();
}
```

---

## Custom Events

Para eventos personalizados que não existem nos enums:

```typescript
// Extend EventType enum first
export enum EventType {
  // ... existing events
  CUSTOM_EVENT = 'custom_event'
}

// Then track
await this.analytics.track(EventType.CUSTOM_EVENT, {
  metadata: {
    customData: 'your data here'
  }
});
```

---

## Error Handling

```typescript
async trackEvent() {
  try {
    await this.analytics.track(EventType.PET_VIEW, {...});
  } catch (error) {
    // Analytics should never break the app
    console.warn('Analytics error:', error);
  }
}
```

---

## Best Practices

1. **Track, Don't Block**
   - Use `async/await` but don't block UI
   - Analytics should be fire-and-forget

2. **Meaningful Metadata**
   - Include context that helps understand user behavior
   - Don't include sensitive data (passwords, credit cards)

3. **Consistent Naming**
   - Use the predefined EventType enum
   - Keep metadata keys consistent

4. **Test Offline**
   - Verify events are queued when offline
   - Check sync when coming back online

5. **Privacy First**
   - Don't track personal data unnecessarily
   - Respect user privacy settings
   - Comply with GDPR

---

## Debugging

### Check Local Events

```typescript
const stats = await this.analytics.getLocalStats();
console.log('Total events:', stats.totalEvents);
console.log('Pending events:', stats.pendingEvents);
console.log('Events by type:', stats.eventsByType);
```

### Force Sync

```typescript
await this.analytics.syncEvents();
```

### View IndexedDB

Open Chrome DevTools → Application → IndexedDB → aubrigo_analytics → events

---

## Integration Checklist

- [ ] Pet detail page (VIEW)
- [ ] Favorites (ADD/REMOVE)
- [ ] Share (SHARE)
- [ ] Appointments (CREATE/CANCEL)
- [ ] Search (SEARCH)
- [ ] Filters (FILTER_APPLY)
- [ ] Donations (START/COMPLETE)
- [ ] Page views (PAGE_VIEW)
- [ ] PWA install (PWA_INSTALL)
- [ ] Auth (REGISTER/LOGIN/LOGOUT)
- [ ] Service Worker updates (SERVICE_WORKER_UPDATE)
- [ ] Offline mode (OFFLINE_MODE)
