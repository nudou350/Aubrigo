import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NetworkStatusService } from './network-status.service';

/**
 * Analytics Event Types
 */
export enum EventType {
  // Engagement
  PET_VIEW = 'pet_view',
  PET_FAVORITE = 'pet_favorite',
  PET_UNFAVORITE = 'pet_unfavorite',
  PET_SHARE = 'pet_share',

  // Conversion
  APPOINTMENT_CREATE = 'appointment_create',
  APPOINTMENT_CANCEL = 'appointment_cancel',
  DONATION_START = 'donation_start',
  DONATION_COMPLETE = 'donation_complete',

  // Navigation
  SEARCH = 'search',
  FILTER_APPLY = 'filter_apply',
  PAGE_VIEW = 'page_view',

  // Technical/PWA
  PWA_INSTALL = 'pwa_install',
  PWA_UNINSTALL = 'pwa_uninstall',
  OFFLINE_MODE = 'offline_mode',
  SERVICE_WORKER_UPDATE = 'service_worker_update',

  // User
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout'
}

/**
 * Analytics Event Category
 */
export enum EventCategory {
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  NAVIGATION = 'navigation',
  TECHNICAL = 'technical',
  USER = 'user'
}

/**
 * Analytics Event Interface
 */
export interface AnalyticsEvent {
  id: string;
  type: EventType;
  category: EventCategory;
  petId?: string;
  ongId?: string;
  metadata?: Record<string, any>;
  sessionId: string;
  timestamp: number;
  offline: boolean;
  sent: boolean;
}

/**
 * Analytics Service
 *
 * Offline-first analytics system that tracks user events locally
 * and syncs to the backend when online.
 *
 * Features:
 * - Works offline (stores in IndexedDB)
 * - Auto-sync when online
 * - Batching for performance
 * - Privacy-focused (our own backend)
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private networkStatus = inject(NetworkStatusService);

  private readonly DB_NAME = 'aubrigo_analytics';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'events';
  private readonly API_URL = '/api/analytics';

  private db: IDBDatabase | null = null;
  private sessionId: string;
  private syncInProgress = false;
  private dbInitializing = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initDatabase();
    this.setupAutoSync();

  }

  /**
   * Initialize IndexedDB
   */
  private async initDatabase(): Promise<void> {
    if (this.dbInitializing) {
      return;
    }

    this.dbInitializing = true;

    try {
      return new Promise((resolve) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = () => {
          this.dbInitializing = false;
          // Don't reject - allow app to work without analytics
          resolve();
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.dbInitializing = false;

          // Handle unexpected close
          this.db.onclose = () => {
            this.db = null;
          };

          resolve();
        };

        request.onupgradeneeded = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
              const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
              objectStore.createIndex('sent', 'sent', { unique: false });
              objectStore.createIndex('timestamp', 'timestamp', { unique: false });
              objectStore.createIndex('type', 'type', { unique: false });
              objectStore.createIndex('sessionId', 'sessionId', { unique: false });
            }
          } catch (error) {
            resolve();
          }
        };
      });
    } catch (error) {
      this.dbInitializing = false;
      // Don't throw - allow app to work without analytics
    }
  }

  /**
   * Ensure database is ready
   */
  private async ensureDatabase(): Promise<boolean> {
    if (this.db && !this.dbInitializing) {
      return true;
    }

    if (this.dbInitializing) {
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.ensureDatabase();
    }

    try {
      await this.initDatabase();
      return this.db !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Track an event
   */
  async track(
    type: EventType,
    data?: {
      petId?: string;
      ongId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: this.generateId(),
        type,
        category: this.getCategoryForEvent(type),
        petId: data?.petId,
        ongId: data?.ongId,
        metadata: data?.metadata || {},
        sessionId: this.sessionId,
        timestamp: Date.now(),
        offline: !this.networkStatus.isOnline(),
        sent: false
      };

      // Always save locally first
      await this.saveEvent(event);


      // Try to sync if online
      if (this.networkStatus.isOnline() && !this.syncInProgress) {
        this.syncEvents().catch(err => {
        });
      }
    } catch (error) {
      // Fail silently to not break the app
    }
  }

  /**
   * Track page view
   */
  async trackPageView(path: string, title?: string): Promise<void> {
    await this.track(EventType.PAGE_VIEW, {
      metadata: {
        path,
        title: title || document.title,
        referrer: document.referrer
      }
    });
  }

  /**
   * Track search
   */
  async trackSearch(query: string, results: number): Promise<void> {
    await this.track(EventType.SEARCH, {
      metadata: {
        query,
        results
      }
    });
  }

  /**
   * Track filter usage
   */
  async trackFilter(filters: Record<string, any>): Promise<void> {
    await this.track(EventType.FILTER_APPLY, {
      metadata: { filters }
    });
  }

  /**
   * Save event to IndexedDB
   */
  private async saveEvent(event: AnalyticsEvent): Promise<void> {
    const isReady = await this.ensureDatabase();
    if (!isReady) {
      return;
    }

    // Ensure 'sent' property is always defined as boolean
    const validatedEvent = {
      ...event,
      sent: event.sent === true ? true : false
    };

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.add(validatedEvent);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          // Don't reject to prevent app crashes - just log and resolve
          resolve();
        };

        transaction.onerror = () => {
          resolve();
        };
      } catch (error) {
        // Fail silently to not break the app
        resolve();
      }
    });
  }

  /**
   * Get pending events (not sent)
   */
  private async getPendingEvents(): Promise<AnalyticsEvent[]> {
    const isReady = await this.ensureDatabase();
    if (!isReady) return [];

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          // Filter events manually to avoid IDBKeyRange.only() issues with boolean values
          const allEvents = request.result || [];
          const pendingEvents = allEvents.filter(event => event.sent === false);
          resolve(pendingEvents);
        };

        request.onerror = () => {
          // Don't reject, just return empty array to prevent app crashes
          resolve([]);
        };

        transaction.onerror = () => {
          resolve([]);
        };
      } catch (error) {
        // Return empty array on any error
        resolve([]);
      }
    });
  }

  /**
   * Mark event as sent
   */
  private async markAsSent(eventId: string): Promise<void> {
    const isReady = await this.ensureDatabase();
    if (!isReady) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const getRequest = store.get(eventId);

        getRequest.onsuccess = () => {
          const event = getRequest.result;
          if (event) {
            // Ensure 'sent' is explicitly set to boolean true
            event.sent = true;
            const updateRequest = store.put(event);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => {
              resolve(); // Don't reject to prevent app crashes
            };
          } else {
            resolve();
          }
        };

        getRequest.onerror = () => {
          resolve(); // Don't reject to prevent app crashes
        };

        transaction.onerror = () => {
          resolve();
        };
      } catch (error) {
        resolve(); // Fail silently
      }
    });
  }

  /**
   * Delete event
   */
  private async deleteEvent(eventId: string): Promise<void> {
    const isReady = await this.ensureDatabase();
    if (!isReady) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(eventId);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          resolve();
        };

        transaction.onerror = () => {
          resolve();
        };
      } catch (error) {
        resolve();
      }
    });
  }

  /**
   * Sync pending events to backend
   */
  async syncEvents(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    if (!this.networkStatus.isOnline()) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingEvents = await this.getPendingEvents();

      if (pendingEvents.length === 0) {
        return;
      }


      // Send in batches of 50
      const batches = this.chunkArray(pendingEvents, 50);

      for (const batch of batches) {
        try {
          await this.http.post(`${this.API_URL}/track`, { events: batch }).toPromise();

          // Mark as sent
          for (const event of batch) {
            try {
              await this.markAsSent(event.id);
            } catch (error) {
              // Continue with next event
            }
          }

        } catch (error) {
          // Don't break - continue with next batch
        }
      }

      // Clean up old sent events (older than 30 days)
      try {
        await this.cleanupOldEvents();
      } catch (error) {
        // Non-critical, continue
      }

    } catch (error) {
      // Fail silently to not break the app
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Clean up old sent events
   */
  private async cleanupOldEvents(): Promise<void> {
    const isReady = await this.ensureDatabase();
    if (!isReady) return;

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(thirtyDaysAgo);
        const request = index.openCursor(range);

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const eventData = cursor.value;
            if (eventData.sent) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            if (deletedCount > 0) {
            }
            resolve();
          }
        };

        request.onerror = () => {
          resolve();
        };

        transaction.onerror = () => {
          resolve();
        };
      } catch (error) {
        resolve();
      }
    });
  }

  /**
   * Setup auto-sync
   */
  private setupAutoSync(): void {
    // Sync when coming back online
    window.addEventListener('online', () => {
      this.syncEvents();
    });

    // Sync every 5 minutes if online
    setInterval(() => {
      if (this.networkStatus.isOnline() && !this.syncInProgress) {
        this.syncEvents();
      }
    }, 5 * 60 * 1000);

    // Sync when page is about to unload
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable fire-and-forget
      this.syncWithBeacon();
    });
  }

  /**
   * Sync using sendBeacon (for page unload)
   */
  private async syncWithBeacon(): Promise<void> {
    if (!navigator.sendBeacon) return;

    const isReady = await this.ensureDatabase();
    if (!isReady) return;

    try {
      const pendingEvents = await this.getPendingEvents();
      if (pendingEvents.length === 0) return;

      const blob = new Blob([JSON.stringify({ events: pendingEvents })], {
        type: 'application/json'
      });

      navigator.sendBeacon(`${this.API_URL}/track`, blob);
    } catch (error) {
      // Fail silently - page is unloading anyway
    }
  }

  /**
   * Get analytics statistics (local)
   */
  async getLocalStats(): Promise<{
    totalEvents: number;
    pendingEvents: number;
    eventsByType: Record<string, number>;
  }> {
    const isReady = await this.ensureDatabase();
    if (!isReady) {
      return { totalEvents: 0, pendingEvents: 0, eventsByType: {} };
    }

    try {
      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
          const store = transaction.objectStore(this.STORE_NAME);
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            try {
              const events = getAllRequest.result || [];
              const pending = events.filter(e => e.sent === false);

              const eventsByType: Record<string, number> = {};
              events.forEach(event => {
                if (event.type) {
                  eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
                }
              });

              resolve({
                totalEvents: events.length,
                pendingEvents: pending.length,
                eventsByType
              });
            } catch (error) {
              resolve({ totalEvents: 0, pendingEvents: 0, eventsByType: {} });
            }
          };

          getAllRequest.onerror = () => {
            resolve({ totalEvents: 0, pendingEvents: 0, eventsByType: {} });
          };

          transaction.onerror = () => {
            resolve({ totalEvents: 0, pendingEvents: 0, eventsByType: {} });
          };
        } catch (error) {
          resolve({ totalEvents: 0, pendingEvents: 0, eventsByType: {} });
        }
      });
    } catch (error) {
      return { totalEvents: 0, pendingEvents: 0, eventsByType: {} };
    }
  }

  /**
   * Get category for event type
   */
  private getCategoryForEvent(type: EventType): EventCategory {
    const categoryMap: Record<EventType, EventCategory> = {
      [EventType.PET_VIEW]: EventCategory.ENGAGEMENT,
      [EventType.PET_FAVORITE]: EventCategory.ENGAGEMENT,
      [EventType.PET_UNFAVORITE]: EventCategory.ENGAGEMENT,
      [EventType.PET_SHARE]: EventCategory.ENGAGEMENT,

      [EventType.APPOINTMENT_CREATE]: EventCategory.CONVERSION,
      [EventType.APPOINTMENT_CANCEL]: EventCategory.CONVERSION,
      [EventType.DONATION_START]: EventCategory.CONVERSION,
      [EventType.DONATION_COMPLETE]: EventCategory.CONVERSION,

      [EventType.SEARCH]: EventCategory.NAVIGATION,
      [EventType.FILTER_APPLY]: EventCategory.NAVIGATION,
      [EventType.PAGE_VIEW]: EventCategory.NAVIGATION,

      [EventType.PWA_INSTALL]: EventCategory.TECHNICAL,
      [EventType.PWA_UNINSTALL]: EventCategory.TECHNICAL,
      [EventType.OFFLINE_MODE]: EventCategory.TECHNICAL,
      [EventType.SERVICE_WORKER_UPDATE]: EventCategory.TECHNICAL,

      [EventType.USER_REGISTER]: EventCategory.USER,
      [EventType.USER_LOGIN]: EventCategory.USER,
      [EventType.USER_LOGOUT]: EventCategory.USER
    };

    return categoryMap[type] || EventCategory.ENGAGEMENT;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
