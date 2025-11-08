import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Update Notification Component
 *
 * Displays a banner notification when a new PWA version is available.
 * Users can click to update immediately or dismiss the notification.
 */
@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showNotification()) {
      <div class="update-notification" [@slideDown]>
        <div class="update-content">
          <div class="update-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="update-message">
            <strong>Nova versão disponível!</strong>
            <p>Atualize agora para obter as últimas melhorias.</p>
          </div>
          <div class="update-actions">
            <button class="btn-update" (click)="updateNow()">
              Atualizar
            </button>
            <button class="btn-dismiss" (click)="dismiss()">
              Depois
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .update-notification {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .update-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .update-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
    }

    .update-icon svg {
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .update-message {
      flex: 1;
      min-width: 0;
    }

    .update-message strong {
      display: block;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .update-message p {
      font-size: 14px;
      margin: 0;
      opacity: 0.95;
    }

    .update-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }

    .btn-update,
    .btn-dismiss {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-update {
      background: white;
      color: #5CB5B0;
    }

    .btn-update:hover {
      background: #f5f5f5;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .btn-update:active {
      transform: translateY(0);
    }

    .btn-dismiss {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .btn-dismiss:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.6);
    }

    @media (max-width: 768px) {
      .update-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
      }

      .update-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn-update,
      .btn-dismiss {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .update-message strong {
        font-size: 14px;
      }

      .update-message p {
        font-size: 13px;
      }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateY(-100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class UpdateNotificationComponent implements OnInit {
  private pwaService = inject(PwaService);

  // Control notification visibility
  showNotification = signal(false);

  ngOnInit(): void {
    // Subscribe to PWA update availability
    // Using effect to react to signal changes
    this.watchForUpdates();
  }

  private watchForUpdates(): void {
    // Only check for updates in production
    if (!this.pwaService.isSwUpdateEnabled) {
      return;
    }

    // Check immediately and then every 5 seconds (instead of 1 second)
    const checkUpdate = () => {
      if (this.pwaService.updateAvailable() && !this.showNotification()) {
        this.showNotification.set(true);
      }
    };

    checkUpdate();
    setInterval(checkUpdate, 5000);
  }

  /**
   * Update the app immediately
   */
  async updateNow(): Promise<void> {
    this.showNotification.set(false);

    // Apply the update (this will reload the page)
    await this.pwaService.applyUpdate();
  }

  /**
   * Dismiss the notification (will show again on next check)
   */
  dismiss(): void {
    this.showNotification.set(false);

    // Reset the PWA service flag so it can show again later
    // The update is still available, user just chose to wait
  }
}
