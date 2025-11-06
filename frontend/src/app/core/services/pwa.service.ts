import { Injectable, signal } from '@angular/core';

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
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Enable debug mode to always show install button (for development)
  private readonly DEBUG_MODE = true;

  // Signal to track if the app is installable
  public isInstallable = signal(false);

  // Signal to track if the app is already installed
  public isInstalled = signal(false);

  constructor() {
    this.initPwaPrompt();
    this.checkIfInstalled();

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
}
