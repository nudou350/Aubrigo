import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Notification Settings Component
 *
 * Allows users to enable/disable push notifications and manage preferences.
 * Can be used as a modal or embedded in settings page.
 */
@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notification-settings">
      <div class="settings-header">
        <div class="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div class="header-text">
          <h3>Notificações</h3>
          <p>Receba atualizações sobre pets e agendamentos</p>
        </div>
      </div>

      <!-- Notification Support Status -->
      @if (!pushService.isSupported()) {
        <div class="alert alert-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Notificações não são suportadas neste navegador</span>
        </div>
      } @else {
        <!-- Permission Status -->
        @if (permissionStatus() === 'denied') {
          <div class="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <div>
              <strong>Notificações bloqueadas</strong>
              <p>Para receber notificações, ative-as nas configurações do navegador</p>
            </div>
          </div>
        }

        <!-- Subscription Status -->
        <div class="subscription-status">
          <div class="status-row">
            <span class="status-label">Status:</span>
            <span class="status-badge" [class.active]="isSubscribed()">
              {{ isSubscribed() ? 'Ativado' : 'Desativado' }}
            </span>
          </div>

          <button
            class="btn-toggle"
            [class.subscribed]="isSubscribed()"
            [disabled]="isLoading() || permissionStatus() === 'denied'"
            (click)="toggleNotifications()">
            @if (isLoading()) {
              <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Processando...
            } @else if (isSubscribed()) {
              Desativar Notificações
            } @else {
              Ativar Notificações
            }
          </button>
        </div>

        <!-- Notification Preferences -->
        @if (isSubscribed()) {
          <div class="preferences" [@slideDown]>
            <h4>Preferências de Notificação</h4>

            <label class="preference-item">
              <input type="checkbox" [(ngModel)]="preferences.newPets" (change)="savePreferences()">
              <div class="preference-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div>
                  <strong>Novos pets na sua região</strong>
                  <p>Receba alertas quando novos pets forem cadastrados perto de você</p>
                </div>
              </div>
            </label>

            <label class="preference-item">
              <input type="checkbox" [(ngModel)]="preferences.appointments" (change)="savePreferences()">
              <div class="preference-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <strong>Confirmações de agendamento</strong>
                  <p>Receba confirmações e lembretes de visitas agendadas</p>
                </div>
              </div>
            </label>

            <label class="preference-item">
              <input type="checkbox" [(ngModel)]="preferences.favorites" (change)="savePreferences()">
              <div class="preference-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div>
                  <strong>Atualizações de favoritos</strong>
                  <p>Receba notificações quando pets favoritos forem atualizados</p>
                </div>
              </div>
            </label>

            <label class="preference-item">
              <input type="checkbox" [(ngModel)]="preferences.donations" (change)="savePreferences()">
              <div class="preference-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Campanhas de doação</strong>
                  <p>Receba informações sobre campanhas e necessidades de ONGs</p>
                </div>
              </div>
            </label>

            <!-- Test Notification Button -->
            <button class="btn-test" (click)="sendTestNotification()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Enviar Notificação de Teste
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .notification-settings {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .settings-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .header-text h3 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .header-text p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .alert svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-warning {
      background: #FFF3CD;
      color: #856404;
      border: 1px solid #FFEAA7;
    }

    .alert-error {
      background: #F8D7DA;
      color: #721C24;
      border: 1px solid #F5C6CB;
    }

    .alert-error strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .alert-error p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
    }

    /* Subscription Status */
    .subscription-status {
      margin-bottom: 24px;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .status-label {
      font-size: 14px;
      font-weight: 600;
      color: #666;
    }

    .status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      background: #E0E0E0;
      color: #666;
    }

    .status-badge.active {
      background: #D4EDDA;
      color: #27AE60;
    }

    .btn-toggle {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
    }

    .btn-toggle:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(92, 181, 176, 0.3);
    }

    .btn-toggle:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-toggle.subscribed {
      background: #E0E0E0;
      color: #666;
    }

    .btn-toggle.subscribed:hover:not(:disabled) {
      background: #D0D0D0;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Preferences */
    .preferences {
      border-top: 1px solid #E0E0E0;
      padding-top: 24px;
    }

    .preferences h4 {
      font-size: 16px;
      font-weight: 700;
      color: #2C2C2C;
      margin: 0 0 20px 0;
    }

    .preference-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: #F9F9F9;
    }

    .preference-item:hover {
      background: #F0F0F0;
    }

    .preference-item input[type="checkbox"] {
      margin-top: 4px;
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #5CB5B0;
    }

    .preference-content {
      flex: 1;
      display: flex;
      gap: 12px;
    }

    .preference-content svg {
      flex-shrink: 0;
      color: #5CB5B0;
      margin-top: 2px;
    }

    .preference-content strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 4px;
    }

    .preference-content p {
      margin: 0;
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }

    /* Test Button */
    .btn-test {
      width: 100%;
      padding: 12px 20px;
      border: 2px dashed #5CB5B0;
      border-radius: 12px;
      background: transparent;
      color: #5CB5B0;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }

    .btn-test:hover {
      background: rgba(92, 181, 176, 0.1);
      border-style: solid;
    }

    @media (max-width: 480px) {
      .notification-settings {
        padding: 20px 16px;
      }

      .header-text h3 {
        font-size: 18px;
      }

      .preference-content strong {
        font-size: 13px;
      }

      .preference-content p {
        font-size: 12px;
      }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '*', opacity: 1 })),
      ]),
    ]),
  ],
})
export class NotificationSettingsComponent implements OnInit {
  public pushService = inject(PushNotificationService);

  isSubscribed = signal(false);
  isLoading = signal(false);
  permissionStatus = signal<NotificationPermission>('default');

  preferences = {
    newPets: true,
    appointments: true,
    favorites: true,
    donations: false
  };

  async ngOnInit(): Promise<void> {
    await this.checkSubscriptionStatus();
    this.loadPreferences();
    this.permissionStatus.set(this.pushService.getPermissionStatus());
  }

  private async checkSubscriptionStatus(): Promise<void> {
    const subscribed = await this.pushService.isSubscribed();
    this.isSubscribed.set(subscribed);
  }

  async toggleNotifications(): Promise<void> {
    this.isLoading.set(true);

    try {
      if (this.isSubscribed()) {
        // Unsubscribe
        const success = await this.pushService.unsubscribe();
        if (success) {
          this.isSubscribed.set(false);
          console.log('✅ Unsubscribed from notifications');
        }
      } else {
        // Subscribe
        const success = await this.pushService.subscribe();
        if (success) {
          this.isSubscribed.set(true);
          this.permissionStatus.set(this.pushService.getPermissionStatus());
          console.log('✅ Subscribed to notifications');
        }
      }
    } catch (error) {
      console.error('❌ Failed to toggle notifications:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  savePreferences(): void {
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    console.log('✅ Notification preferences saved:', this.preferences);
  }

  private loadPreferences(): void {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        this.preferences = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }

  async sendTestNotification(): Promise<void> {
    await this.pushService.sendTestNotification();
  }
}
