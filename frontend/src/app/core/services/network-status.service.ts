import { Injectable, signal } from '@angular/core';
import { fromEvent, merge } from 'rxjs';

/**
 * Network Status Service
 *
 * Monitors the network connection status and provides reactive signals
 * for components to respond to online/offline changes.
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  // Signal to track online status
  public isOnline = signal(navigator.onLine);

  // Signal to track if we recently went offline (for showing toast)
  public justWentOffline = signal(false);

  // Signal to track if we recently came back online
  public justWentOnline = signal(false);

  constructor() {
    this.initNetworkMonitoring();
    console.log('🌐 Network Status Service initialized');
    console.log('📶 Current status:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
  }

  private initNetworkMonitoring(): void {
    // Listen to online/offline events
    const online$ = fromEvent(window, 'online');
    const offline$ = fromEvent(window, 'offline');

    // Handle online event
    online$.subscribe(() => {
      console.log('✅ Network: ONLINE');
      this.isOnline.set(true);
      this.justWentOnline.set(true);

      // Reset the flag after 5 seconds
      setTimeout(() => {
        this.justWentOnline.set(false);
      }, 5000);
    });

    // Handle offline event
    offline$.subscribe(() => {
      console.log('❌ Network: OFFLINE');
      this.isOnline.set(false);
      this.justWentOffline.set(true);

      // Reset the flag after 5 seconds
      setTimeout(() => {
        this.justWentOffline.set(false);
      }, 5000);
    });
  }

  /**
   * Check if the app is currently online
   */
  checkOnline(): boolean {
    return this.isOnline();
  }

  /**
   * Check if the app is currently offline
   */
  checkOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Manually refresh the online status
   */
  refreshStatus(): void {
    this.isOnline.set(navigator.onLine);
    console.log('🔄 Network status refreshed:', this.isOnline() ? 'ONLINE' : 'OFFLINE');
  }
}
