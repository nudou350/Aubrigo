import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Network Status Component
 *
 * Displays a toast notification when the network status changes.
 * Shows a warning when offline and a success message when back online.
 */
@Component({
  selector: 'app-network-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Offline notification -->
    @if (networkService.justWentOffline()) {
      <div class="network-toast offline" [@slideDown]>
        <div class="toast-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
          <div class="toast-message">
            <strong>Você está offline</strong>
            <p>Algumas funcionalidades podem estar limitadas</p>
          </div>
        </div>
      </div>
    }

    <!-- Online notification -->
    @if (networkService.justWentOnline()) {
      <div class="network-toast online" [@slideDown]>
        <div class="toast-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <div class="toast-message">
            <strong>Você está online</strong>
            <p>Todas as funcionalidades disponíveis</p>
          </div>
        </div>
      </div>
    }

    <!-- Persistent offline indicator (small badge) -->
    @if (!networkService.isOnline()) {
      <div class="offline-badge" [@fadeIn]>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
        <span>Offline</span>
      </div>
    }
  `,
  styles: [`
    .network-toast {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      color: white;
      max-width: 400px;
      width: calc(100% - 32px);
    }

    .network-toast.offline {
      background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
    }

    .network-toast.online {
      background: linear-gradient(135deg, #27AE60 0%, #229954 100%);
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .toast-content svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toast-message strong {
      display: block;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .toast-message p {
      font-size: 13px;
      margin: 0;
      opacity: 0.95;
    }

    /* Persistent offline badge */
    .offline-badge {
      position: fixed;
      bottom: 88px; /* Above bottom nav */
      right: 16px;
      background: #E74C3C;
      color: white;
      padding: 8px 14px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
      z-index: 9998;
    }

    @media (min-width: 1024px) {
      .network-toast {
        top: 100px; /* Below top nav on desktop */
      }

      .offline-badge {
        bottom: 16px;
        right: 24px;
      }
    }

    @media (max-width: 480px) {
      .toast-message strong {
        font-size: 14px;
      }

      .toast-message p {
        font-size: 12px;
      }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translate(-50%, -100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translate(-50%, 0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translate(-50%, -100%)', opacity: 0 })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' })),
      ]),
    ]),
  ],
})
export class NetworkStatusComponent implements OnInit {
  public networkService = inject(NetworkStatusService);

  ngOnInit(): void {
  }
}
