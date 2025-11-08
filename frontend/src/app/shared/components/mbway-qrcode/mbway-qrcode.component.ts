import { Component, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-mbway-qrcode',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="mbway-container">
      <div class="mbway-header">
        <div class="mbway-logo">
          <svg viewBox="0 0 100 40" class="logo-svg">
            <text x="5" y="30" font-size="24" font-weight="bold" fill="#00a0e3">MB WAY</text>
          </svg>
        </div>
        <h3>{{ 'payment.mbway.title' | translate }}</h3>
      </div>

      <div class="qrcode-section">
        <div class="qrcode-wrapper">
          @if (qrCodeDataUrl()) {
            <img [src]="qrCodeDataUrl()" alt="MB Way QR Code" class="qrcode-image" />
          } @else {
            <div class="qrcode-loading">
              <div class="spinner"></div>
              <p>{{ 'payment.mbway.generating' | translate }}</p>
            </div>
          }
        </div>

        <div class="payment-info">
          @if (reference()) {
            <div class="info-item">
              <span class="label">{{ 'payment.mbway.reference' | translate }}</span>
              <span class="value">{{ reference() }}</span>
            </div>
          }
          @if (amount()) {
            <div class="info-item amount">
              <span class="label">{{ 'payment.mbway.amount' | translate }}</span>
              <span class="value">{{ amount() | number:'1.2-2' }}€</span>
            </div>
          }
          @if (phoneNumber()) {
            <div class="info-item">
              <span class="label">{{ 'payment.mbway.phone' | translate }}</span>
              <span class="value">{{ phoneNumber() }}</span>
            </div>
          }
          @if (expiresAt()) {
            <div class="info-item expires">
              <span class="label">{{ 'payment.mbway.expires' | translate }}</span>
              <span class="value">{{ formatExpiration(expiresAt()!) }}</span>
            </div>
          }
        </div>
      </div>

      <div class="instructions">
        <h4>{{ 'payment.mbway.howToPay' | translate }}</h4>
        <ol>
          <li>{{ 'payment.mbway.step1' | translate }}</li>
          <li>{{ 'payment.mbway.step2' | translate }}</li>
          <li>{{ 'payment.mbway.step3' | translate }}</li>
          <li>{{ 'payment.mbway.step4' | translate }}</li>
        </ol>
      </div>

      @if (status()) {
        <div class="status-indicator" [class]="'status-' + status()">
          @switch (status()) {
            @case ('pending') {
              <span class="status-icon">⏳</span>
              <span>{{ 'payment.mbway.statusPending' | translate }}</span>
            }
            @case ('paid') {
              <span class="status-icon">✅</span>
              <span>{{ 'payment.mbway.statusPaid' | translate }}</span>
            }
            @case ('expired') {
              <span class="status-icon">⏰</span>
              <span>{{ 'payment.mbway.statusExpired' | translate }}</span>
            }
            @case ('cancelled') {
              <span class="status-icon">❌</span>
              <span>{{ 'payment.mbway.statusCancelled' | translate }}</span>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .mbway-container {
      max-width: 500px;
      margin: 0 auto;
    }

    .mbway-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }

    .mbway-logo {
      margin-bottom: var(--spacing-md);
    }

    .logo-svg {
      width: 120px;
      height: 48px;
    }

    h3 {
      color: var(--color-text-primary);
      font-size: var(--font-size-h2);
      margin: 0;
    }

    .qrcode-section {
      background: var(--color-background);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-xl);
    }

    .qrcode-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      margin-bottom: var(--spacing-xl);
    }

    .qrcode-image {
      max-width: 300px;
      width: 100%;
      height: auto;
      border: 4px solid #00a0e3;
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
    }

    .qrcode-loading {
      text-align: center;
    }

    .qrcode-loading p {
      margin-top: var(--spacing-md);
      color: var(--color-text-secondary);
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-background-secondary);
      border-radius: var(--radius-md);
    }

    .info-item.amount {
      background: rgba(0, 160, 227, 0.1);
    }

    .info-item.amount .value {
      color: #00a0e3;
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-h3);
    }

    .info-item.expires {
      background: rgba(255, 193, 7, 0.1);
    }

    .label {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      font-size: var(--font-size-small);
    }

    .value {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .instructions {
      background: var(--color-background-secondary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .instructions h4 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--color-primary);
      font-size: var(--font-size-h3);
    }

    .instructions ol {
      margin: 0;
      padding-left: var(--spacing-xl);
    }

    .instructions li {
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-semibold);
      margin-top: var(--spacing-lg);
    }

    .status-icon {
      font-size: 24px;
    }

    .status-pending {
      background: rgba(255, 193, 7, 0.1);
      color: #ff9800;
    }

    .status-paid {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .status-expired {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .status-cancelled {
      background: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }
  `]
})
export class MbwayQrcodeComponent {
  private translate = inject(TranslateService);

  qrCodeDataUrl = input<string>();
  reference = input<string>();
  amount = input<number>();
  phoneNumber = input<string>();
  expiresAt = input<Date>();
  status = input<'pending' | 'paid' | 'expired' | 'cancelled'>('pending');

  formatExpiration(date: Date): string {
    const now = new Date();
    const expiryDate = new Date(date);
    const diff = expiryDate.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes <= 0) {
      return this.translate.instant('payment.mbway.expired');
    }

    const minuteWord = minutes === 1 ?
      this.translate.instant('payment.mbway.minute') :
      this.translate.instant('payment.mbway.minutes');
    return `${minutes} ${minuteWord}`;
  }
}
