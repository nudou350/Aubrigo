import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineQueueService } from '../../../core/services/offline-queue.service';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Offline Sync Badge Component
 *
 * Displays a badge when there are pending offline actions in the queue.
 * Shows sync progress and allows manual sync trigger.
 */
@Component({
  selector: 'app-offline-sync-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pendingCount() > 0) {
      <div class="sync-badge" [@fadeIn] [class.syncing]="isSyncing()">
        <div class="badge-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" [class.spinning]="isSyncing()">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="badge-text">
            {{ pendingCount() }} {{ pendingCount() === 1 ? 'ação' : 'ações' }} pendente{{ pendingCount() === 1 ? '' : 's' }}
          </span>
        </div>

        @if (networkService.isOnline() && !isSyncing()) {
          <button class="sync-btn" (click)="syncNow()">
            Sincronizar
          </button>
        }

        @if (!networkService.isOnline()) {
          <span class="status-text">Aguardando conexão...</span>
        }

        @if (isSyncing()) {
          <span class="status-text">Sincronizando...</span>
        }
      </div>
    }
  `,
  styles: [`
    .sync-badge {
      position: fixed;
      bottom: 100px; /* Above bottom nav */
      left: 16px;
      right: 16px;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(92, 181, 176, 0.3);
      z-index: 9997;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sync-badge.syncing {
      background: linear-gradient(135deg, #F5A623 0%, #E89A1E 100%);
    }

    .badge-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-content svg {
      flex-shrink: 0;
    }

    .badge-content svg.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .badge-text {
      font-size: 14px;
      font-weight: 600;
      flex: 1;
    }

    .sync-btn {
      background: white;
      color: #5CB5B0;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }

    .sync-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .sync-btn:active {
      transform: translateY(0);
    }

    .status-text {
      font-size: 12px;
      opacity: 0.9;
      text-align: center;
    }

    @media (min-width: 1024px) {
      .sync-badge {
        bottom: 24px;
        left: 24px;
        right: auto;
        max-width: 320px;
      }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' })),
      ]),
    ]),
  ],
})
export class OfflineSyncBadgeComponent implements OnInit {
  private queueService = inject(OfflineQueueService);
  public networkService = inject(NetworkStatusService);

  pendingCount = signal(0);
  isSyncing = signal(false);

  ngOnInit(): void {
    this.updatePendingCount();

    // Update count every 3 seconds
    setInterval(() => {
      this.updatePendingCount();
    }, 3000);
  }

  private async updatePendingCount(): Promise<void> {
    try {
      const count = await this.queueService.getPendingCount();
      this.pendingCount.set(count);
    } catch (error) {
    }
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing() || !this.networkService.isOnline()) {
      return;
    }

    this.isSyncing.set(true);

    try {
      await this.queueService.syncOfflineActions();
      await this.updatePendingCount();
    } catch (error) {
    } finally {
      this.isSyncing.set(false);
    }
  }
}
