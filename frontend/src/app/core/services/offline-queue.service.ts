import { Injectable, inject } from '@angular/core';
import { NetworkStatusService } from './network-status.service';

/**
 * Offline Action Types
 */
export enum OfflineActionType {
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  ADD_FAVORITE = 'ADD_FAVORITE',
  REMOVE_FAVORITE = 'REMOVE_FAVORITE',
  CREATE_DONATION = 'CREATE_DONATION'
}

/**
 * Offline Action Interface
 */
export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

/**
 * Offline Queue Service
 *
 * Manages a queue of actions that were performed while offline.
 * Automatically syncs when the network comes back online.
 *
 * Uses IndexedDB for persistent storage of queued actions.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private networkStatus = inject(NetworkStatusService);

  private readonly DB_NAME = 'aubrigo_offline_db';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'offline_queue';

  private db: IDBDatabase | null = null;
  private syncInProgress = false;

  constructor() {
    this.initDatabase();
    this.watchNetworkStatus();
    console.log('📦 Offline Queue Service initialized');
  }

  /**
   * Initialize IndexedDB
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📊 IndexedDB object store created');
        }
      };
    });
  }

  /**
   * Watch network status and sync when online
   */
  private watchNetworkStatus(): void {
    // Wait for db to be ready
    const checkAndSync = () => {
      if (this.db && this.networkStatus.isOnline() && !this.syncInProgress) {
        console.log('🔄 Network is back online, syncing offline actions...');
        this.syncOfflineActions();
      }
    };

    // Check every 2 seconds if we should sync
    setInterval(checkAndSync, 2000);
  }

  /**
   * Add an action to the offline queue
   */
  async addToQueue(type: OfflineActionType, payload: any): Promise<string> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    const action: OfflineAction = {
      id: this.generateId(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(action);

      request.onsuccess = () => {
        console.log('✅ Action added to offline queue:', type);
        resolve(action.id);
      };

      request.onerror = () => {
        console.error('❌ Failed to add action to queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending actions from the queue
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Failed to get pending actions:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update an action in the queue
   */
  async updateAction(action: OfflineAction): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(action);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to update action:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete an action from the queue
   */
  async deleteAction(actionId: string): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(actionId);

      request.onsuccess = () => {
        console.log('🗑️ Action deleted from queue:', actionId);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to delete action:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Sync all pending offline actions
   */
  async syncOfflineActions(): Promise<void> {
    if (this.syncInProgress) {
      console.log('⚠️ Sync already in progress, skipping...');
      return;
    }

    if (!this.networkStatus.isOnline()) {
      console.log('⚠️ Cannot sync: network is offline');
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingActions = await this.getPendingActions();

      if (pendingActions.length === 0) {
        console.log('ℹ️ No pending actions to sync');
        this.syncInProgress = false;
        return;
      }

      console.log(`🔄 Syncing ${pendingActions.length} offline actions...`);

      for (const action of pendingActions) {
        try {
          await this.processAction(action);
          await this.deleteAction(action.id);
          console.log('✅ Action synced successfully:', action.type);
        } catch (error) {
          console.error('❌ Failed to sync action:', action.type, error);

          // Update retry count and status
          action.retryCount++;
          action.status = 'failed';
          action.error = error instanceof Error ? error.message : 'Unknown error';

          // Delete if too many retries (max 3)
          if (action.retryCount >= 3) {
            console.warn('⚠️ Max retries reached, deleting action:', action.id);
            await this.deleteAction(action.id);
          } else {
            // Reset to pending for next retry
            action.status = 'pending';
            await this.updateAction(action);
          }
        }
      }

      console.log('✅ Offline sync completed');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single action (to be implemented by consuming services)
   */
  private async processAction(action: OfflineAction): Promise<void> {
    // This method should be overridden or handled by specific services
    // For now, we'll just log it
    console.log('📤 Processing action:', action.type, action.payload);

    // In a real implementation, this would call the appropriate API endpoint
    // based on the action type

    // Example:
    // switch (action.type) {
    //   case OfflineActionType.CREATE_APPOINTMENT:
    //     await this.appointmentService.createAppointment(action.payload);
    //     break;
    //   case OfflineActionType.ADD_FAVORITE:
    //     await this.favoriteService.addFavorite(action.payload);
    //     break;
    //   // ... other cases
    // }

    // For now, simulate success
    return Promise.resolve();
  }

  /**
   * Get the number of pending actions
   */
  async getPendingCount(): Promise<number> {
    const actions = await this.getPendingActions();
    return actions.length;
  }

  /**
   * Clear all completed actions
   */
  async clearCompleted(): Promise<void> {
    if (!this.db) {
      return;
    }

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('completed'));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }

  /**
   * Generate a unique ID for an action
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
