import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, concat, interval, first } from 'rxjs';

// Extend the Window interface to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Enable debug mode to always show install button (for development)
  private readonly DEBUG_MODE = true;

  // Signal to track if the app is installable
  public isInstallable = signal(false);

  // Signal to track if the app is already installed
  public isInstalled = signal(false);

  // Signal to track if an update is available
  public updateAvailable = signal(false);

  // Signal to track current PWA version
  public currentVersion = signal<string>('');

  constructor() {
    this.initPwaPrompt();
    this.checkIfInstalled();
    this.initServiceWorkerUpdate();

    // In debug mode or iOS, force installable to true for showing the button
    if (this.DEBUG_MODE && !this.isInstalled()) {
      this.isInstallable.set(true);
      console.log('🔧 DEBUG MODE: Install button forced to show');
    }

    console.log('🔧 PWA Service initialized');
    console.log('📱 Is PWA Supported:', this.isPwaSupported);
    console.log('🏠 Is Installed:', this.isInstalled());
    console.log('✅ Is Installable:', this.isInstallable());
  }

  private initPwaPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Store the event so it can be triggered later
      this.deferredPrompt = e;

      // Update installable status
      this.isInstallable.set(true);

      console.log('PWA: beforeinstallprompt event fired, app is installable');
    });

    // Listen for the app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed successfully');
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      this.deferredPrompt = null;
    });
  }

  private checkIfInstalled() {
    // Check if app is running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      console.log('PWA: App is running in standalone mode');
    }

    // Also check navigator.standalone for iOS Safari
    if ((navigator as any).standalone) {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      console.log('PWA: App is running in standalone mode (iOS)');
    }
  }

  /**
   * Show the install prompt to the user
   * @returns Promise that resolves to true if user accepted, false if dismissed
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      if (this.DEBUG_MODE) {
        console.warn('⚠️ PWA: Install prompt is not available (Service Worker not active)');
        console.log('💡 To test PWA installation:');
        console.log('   1. Build in production mode: ng build');
        console.log('   2. Serve the build: npx http-server dist/pet-sos-frontend/browser -p 4201');
        console.log('   3. Open https://localhost:4201 (or use ngrok for HTTPS)');
      } else {
        console.warn('PWA: Install prompt is not available');
      }
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await this.deferredPrompt.userChoice;

      console.log(`PWA: User ${choiceResult.outcome} the install prompt`);

      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.isInstallable.set(false);

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Check if the browser supports PWA installation
   */
  get isPwaSupported(): boolean {
    return 'BeforeInstallPromptEvent' in window ||
           'serviceWorker' in navigator;
  }

  /**
   * Check if the device is iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  /**
   * Initialize Service Worker update detection
   */
  private initServiceWorkerUpdate() {
    if (!this.swUpdate.isEnabled) {
      console.log('⚠️ PWA: Service Worker updates are not enabled (not running in production or HTTPS)');
      return;
    }

    console.log('✅ PWA: Service Worker update detection enabled');

    // Subscribe to version updates
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(event => {
        console.log('🔄 PWA: New version available!');
        console.log('   Current version:', event.currentVersion);
        console.log('   New version:', event.latestVersion);

        this.updateAvailable.set(true);
        this.currentVersion.set(
          (event.latestVersion.appData as any)?.version || 'unknown'
        );
      });

    // Check for updates periodically (every 6 hours)
    this.checkForUpdatesRegularly();

    // Check for updates immediately on startup (after app stabilizes)
    this.appRef.isStable
      .pipe(first(stable => stable))
      .subscribe(() => {
        console.log('🔍 PWA: Checking for updates on startup...');
        this.checkForUpdate();
      });
  }

  /**
   * Check for updates regularly (every 6 hours)
   */
  private checkForUpdatesRegularly() {
    const appIsStable$ = this.appRef.isStable.pipe(
      first(isStable => isStable)
    );

    // Check every 6 hours after app stabilizes
    const everySixHours$ = interval(6 * 60 * 60 * 1000);

    concat(appIsStable$, everySixHours$).subscribe(() => {
      console.log('🔍 PWA: Periodic update check...');
      this.checkForUpdate();
    });
  }

  /**
   * Manually check for updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      console.warn('⚠️ PWA: Service Worker is not enabled, cannot check for updates');
      return false;
    }

    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      if (updateFound) {
        console.log('✅ PWA: Update found and will be downloaded');
      } else {
        console.log('ℹ️ PWA: Already on the latest version');
      }
      return updateFound;
    } catch (error) {
      console.error('❌ PWA: Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Apply the available update and reload the app
   */
  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      console.warn('⚠️ PWA: Service Worker is not enabled, cannot apply update');
      return;
    }

    try {
      console.log('🔄 PWA: Activating new version...');
      await this.swUpdate.activateUpdate();
      console.log('✅ PWA: Update activated, reloading...');

      // Reload the page to show the new version
      document.location.reload();
    } catch (error) {
      console.error('❌ PWA: Error applying update:', error);
    }
  }

  /**
   * Get the current app version from service worker
   */
  async getCurrentVersion(): Promise<string | null> {
    if (!this.swUpdate.isEnabled) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        // The version is in the ngsw.json manifest
        return this.currentVersion() || null;
      }
    } catch (error) {
      console.error('❌ PWA: Error getting current version:', error);
    }

    return null;
  }
}
