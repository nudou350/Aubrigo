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
    }

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

    });

    // Listen for the app installed event
    window.addEventListener('appinstalled', () => {
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
    }

    // Also check navigator.standalone for iOS Safari
    if ((navigator as any).standalone) {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
    }
  }

  /**
   * Show the install prompt to the user
   * @returns Promise that resolves to true if user accepted, false if dismissed
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      if (this.DEBUG_MODE) {
      } else {
      }
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await this.deferredPrompt.userChoice;


      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.isInstallable.set(false);

      return choiceResult.outcome === 'accepted';
    } catch (error) {
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
   * Check if Service Worker updates are enabled
   */
  get isSwUpdateEnabled(): boolean {
    return this.swUpdate.isEnabled;
  }

  /**
   * Initialize Service Worker update detection
   */
  private initServiceWorkerUpdate() {
    if (!this.swUpdate.isEnabled) {
      return;
    }


    // Subscribe to version updates
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(event => {

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
      this.checkForUpdate();
    });
  }

  /**
   * Manually check for updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      if (updateFound) {
      } else {
      }
      return updateFound;
    } catch (error) {
      return false;
    }
  }

  /**
   * Apply the available update and reload the app
   */
  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();

      // Reload the page to show the new version
      document.location.reload();
    } catch (error) {
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
    }

    return null;
  }
}
