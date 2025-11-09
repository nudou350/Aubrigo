import { Injectable, inject } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { HttpClient } from "@angular/common/http";

/**
 * Push Notification Types
 */
export enum PushNotificationType {
  NEW_PET_IN_AREA = "NEW_PET_IN_AREA",
  APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
  FAVORITE_PET_UPDATED = "FAVORITE_PET_UPDATED",
  DONATION_CAMPAIGN = "DONATION_CAMPAIGN",
}

/**
 * Push Notification Payload
 */
export interface PushNotificationPayload {
  type: PushNotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Push Notification Service
 *
 * Handles push notification subscriptions and management.
 * Requires VAPID keys configured in the backend.
 *
 * VAPID Keys Setup:
 * 1. Generate keys: npx web-push generate-vapid-keys
 * 2. Add public key to environment.ts
 * 3. Add private key to backend .env
 */
@Injectable({
  providedIn: "root",
})
export class PushNotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  // IMPORTANT: Replace with your actual VAPID public key
  // Generate with: npx web-push generate-vapid-keys
  private readonly VAPID_PUBLIC_KEY = "REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY";

  private readonly API_URL = "/api/push-notifications";

  constructor() {
    this.initPushNotifications();
  }

  /**
   * Initialize push notifications
   */
  private initPushNotifications(): void {
    // Check if push notifications are supported
    if (!this.swPush.isEnabled) {
      console.warn(
        "⚠️ Push notifications are not enabled (Service Worker not active or not supported)"
      );
      return;
    }


    // Check if already subscribed
    this.swPush.subscription.subscribe((subscription) => {
      if (subscription) {
      } else {
      }
    });

    // Listen for push notification messages
    this.swPush.messages.subscribe((message: any) => {
      this.handleNotification(message);
    });

    // Listen for notification clicks
    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      this.handleNotificationClick(action, notification);
    });
  }

  /**
   * Request permission and subscribe to push notifications
   */
  async subscribe(userEmail?: string): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      return false;
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.swPush.subscription.toPromise();
      if (existingSubscription) {
        return true;
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        return false;
      }


      // Subscribe to push notifications
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      });


      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription, userEmail);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      return false;
    }

    try {
      const subscription = await this.swPush.subscription.toPromise();

      if (!subscription) {
        return true;
      }

      // Unsubscribe
      await this.swPush.unsubscribe();

      // Notify backend
      await this.removeSubscriptionFromBackend(subscription);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      return false;
    }

    const subscription = await this.swPush.subscription.toPromise();
    return !!subscription;
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swPush.isEnabled) {
      return null;
    }

    return await this.swPush.subscription.toPromise();
  }

  /**
   * Check notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return this.swPush.isEnabled && "Notification" in window;
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(
    subscription: PushSubscription,
    userEmail?: string
  ): Promise<void> {
    try {
      const payload = {
        subscription: subscription.toJSON(),
        userEmail,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      await this.http.post(`${this.API_URL}/subscribe`, payload).toPromise();
    } catch (error) {
      // Don't throw - subscription is still valid locally
    }
  }

  /**
   * Remove subscription from backend
   */
  private async removeSubscriptionFromBackend(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const endpoint = subscription.endpoint;
      await this.http
        .delete(`${this.API_URL}/unsubscribe`, {
          body: { endpoint },
        })
        .toPromise();
    } catch (error) {
    }
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(message: any): void {
    // Custom handling based on notification type
    const { type, data } = message;

    switch (type) {
      case PushNotificationType.NEW_PET_IN_AREA:
        break;

      case PushNotificationType.APPOINTMENT_CONFIRMED:
        break;

      case PushNotificationType.APPOINTMENT_REMINDER:
        break;

      case PushNotificationType.FAVORITE_PET_UPDATED:
        break;

      case PushNotificationType.DONATION_CAMPAIGN:
        break;

      default:
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(action: string, notification: any): void {

    // Navigate to appropriate page based on action
    switch (action) {
      case "view_pet":
        window.location.href = `/pets/${notification.data?.petId}`;
        break;

      case "view_appointment":
        window.location.href = `/appointments/${notification.data?.appointmentId}`;
        break;

      case "donate":
        window.location.href = `/donate/${notification.data?.ongId}`;
        break;

      default:
        // Default action: open the app
        window.location.href = "/";
    }
  }

  /**
   * Test notification (for development)
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    // This would normally come from the backend
    // For testing, we can show a local notification
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification("Aubrigo - Teste", {
      body: "Esta é uma notificação de teste!",
      icon: "/assets/icons/icon/apple-icon-180.png",
      badge: "/assets/icons/icon-72x72.png",
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          action: "explore",
          title: "Ver Pets",
          icon: "/assets/icons/checkmark.png",
        },
        {
          action: "close",
          title: "Fechar",
          icon: "/assets/icons/close.png",
        },
      ],
    });

  }
}
