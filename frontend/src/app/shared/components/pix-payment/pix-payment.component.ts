import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pix-payment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="pix-container">
      <div class="pix-header">
        <div class="pix-logo">
          <svg viewBox="0 0 100 40" class="logo-svg">
            <text x="5" y="30" font-size="24" font-weight="bold" fill="#32BCAD">PIX</text>
          </svg>
        </div>
        <h3>{{ 'payment.pix.title' | translate }}</h3>
      </div>

      <div class="pix-info-section">
        @if (pixKey()) {
          <div class="pix-key-card">
            <div class="key-header">
              <span class="icon">📱</span>
              <div>
                <p class="key-label">{{ 'payment.pix.keyLabel' | translate }}</p>
                <p class="key-value">{{ pixKey() }}</p>
              </div>
            </div>

            @if (amount()) {
              <div class="amount-display">
                <span class="amount-label">{{ 'payment.pix.amount' | translate }}</span>
                <span class="amount-value">R$ {{ amount() | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="no-key-message">
            <p>{{ 'payment.pix.noKey' | translate }}</p>
            <p>{{ 'payment.pix.contactOng' | translate }}</p>
          </div>
        }
      </div>

      <div class="instructions">
        <h4>{{ 'payment.pix.howToDonate' | translate }}</h4>
        <ol>
          <li>{{ 'payment.pix.step1' | translate }}</li>
          <li>{{ 'payment.pix.step2' | translate }}</li>
          <li>{{ 'payment.pix.step3' | translate }}</li>
          <li>{{ 'payment.pix.step4' | translate }}</li>
          <li>{{ 'payment.pix.step5' | translate }}</li>
          <li>{{ 'payment.pix.step6' | translate }}</li>
        </ol>
      </div>

      <div class="info-box">
        <p><strong>{{ 'payment.pix.importantLabel' | translate }}</strong> {{ 'payment.pix.importantMessage' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .pix-container {
      max-width: 500px;
      margin: 0 auto;
    }

    .pix-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }

    .pix-logo {
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

    .pix-info-section {
      background: var(--color-background);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-xl);
    }

    .pix-key-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .key-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      background: rgba(50, 188, 173, 0.1);
      padding: var(--spacing-lg);
      border-radius: var(--radius-md);
      border: 2px solid #32BCAD;
    }

    .key-header .icon {
      font-size: 32px;
    }

    .key-label {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .key-value {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-bold);
      color: #32BCAD;
      margin: 0;
      letter-spacing: 1px;
    }

    .amount-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      background: rgba(50, 188, 173, 0.1);
      border-radius: var(--radius-md);
    }

    .amount-label {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
    }

    .amount-value {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-bold);
      color: #32BCAD;
    }

    .no-key-message {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid #ffc107;
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
      text-align: center;
    }

    .no-key-message p {
      margin: var(--spacing-sm) 0;
      color: #f57c00;
    }

    .instructions {
      background: var(--color-background-secondary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-lg);
    }

    .instructions h4 {
      margin: 0 0 var(--spacing-md) 0;
      color: #32BCAD;
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

    .info-box {
      background: rgba(50, 188, 173, 0.1);
      border: 1px solid #32BCAD;
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      text-align: center;
    }

    .info-box p {
      margin: 0;
      color: var(--color-text-primary);
      font-size: var(--font-size-small);
    }

    @media (max-width: 480px) {
      .key-header {
        flex-direction: column;
        text-align: center;
      }

      .key-value {
        font-size: var(--font-size-h3);
      }

      .amount-display {
        flex-direction: column;
        gap: var(--spacing-sm);
        text-align: center;
      }
    }
  `]
})
export class PixPaymentComponent {
  pixKey = input<string>();
  amount = input<number>();
}
