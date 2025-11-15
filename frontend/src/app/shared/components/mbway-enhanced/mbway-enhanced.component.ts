import { Component, OnInit, OnDestroy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PaymentPollingService } from '../../../core/services/payment-polling.service';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-mbway-enhanced',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  template: `
    <div class="mbway-container">
      <div class="header">
        <div class="logo">
          <span class="icon">📱</span>
          <h2>MB WAY</h2>
        </div>
        <div class="amount">
          <span class="label">Valor:</span>
          <span class="value">{{ amount() | currencyFormat: 'EUR' }}</span>
        </div>
      </div>

      <div class="status-badge" [ngClass]="paymentStatus()">
        @switch (paymentStatus()) {
          @case ('pending') {
            <span class="icon">⏳</span>
            <span>Aguardando confirmação...</span>
          }
          @case ('processing') {
            <span class="icon">🔄</span>
            <span>Processando...</span>
          }
          @case ('succeeded') {
            <span class="icon">✅</span>
            <span>Pagamento confirmado!</span>
          }
          @case ('failed') {
            <span class="icon">❌</span>
            <span>Pagamento recusado</span>
          }
        }
      </div>

      @if (paymentStatus() === 'pending' || paymentStatus() === 'processing') {
        <div class="notification-card">
          <div class="phone-display">
            <div class="phone-icon">📲</div>
            <div class="phone-info">
              <span class="label">Telemóvel:</span>
              <span class="number">{{ phoneNumber() }}</span>
            </div>
          </div>

          <div class="notification-animation">
            <div class="pulse-ring"></div>
            <div class="notification-icon">🔔</div>
          </div>

          <p class="waiting-text">
            Confirme o pagamento na aplicação MB WAY do seu telemóvel
          </p>
        </div>

        <div class="instructions">
          <h4>Passos para confirmar</h4>
          <ol>
            <li>Abra a aplicação <strong>MB WAY</strong> no seu telemóvel</li>
            <li>Verá uma notificação push de pagamento</li>
            <li>Confirme o valor de <strong>{{ amount() | currencyFormat: 'EUR' }}</strong></li>
            <li>Autorize o pagamento com o seu PIN</li>
            <li>Aguarde a confirmação automática</li>
          </ol>
        </div>

        <div class="info-box">
          <p><strong>Importante:</strong> Não feche esta página. A confirmação é automática.</p>
        </div>
      }

      @if (paymentStatus() === 'succeeded') {
        <div class="success-message">
          <div class="icon">🎉</div>
          <h3>Pagamento confirmado!</h3>
          <p>Obrigado pela sua doação.</p>
        </div>
      }

      @if (paymentStatus() === 'failed') {
        <div class="error-message">
          <div class="icon">😔</div>
          <h3>Pagamento não autorizado</h3>
          <p>Por favor, tente novamente ou escolha outro método de pagamento.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .mbway-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;

      .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 16px;

        .icon {
          font-size: 40px;
        }

        h2 {
          margin: 0;
          color: #E20613;
          font-size: 28px;
        }
      }

      .amount {
        background: linear-gradient(135deg, #E20613 0%, #B00510 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 24px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(226, 6, 19, 0.3);
      }
    }

    .status-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 24px;
      margin-bottom: 24px;
      font-weight: 500;

      &.pending, &.processing {
        background: rgba(255, 193, 7, 0.1);
        color: #F57C00;
        border: 2px solid #FFC107;
      }

      &.succeeded {
        background: rgba(76, 175, 80, 0.1);
        color: #2E7D32;
        border: 2px solid #4CAF50;
      }

      &.failed {
        background: rgba(244, 67, 54, 0.1);
        color: #C62828;
        border: 2px solid #F44336;
      }
    }

    .notification-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 16px rgba(226, 6, 19, 0.15);
      margin-bottom: 24px;
      text-align: center;
      border: 2px solid #E20613;

      .phone-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        background: #FFF3F4;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 24px;

        .phone-icon {
          font-size: 32px;
        }

        .phone-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          .label {
            font-size: 12px;
            color: #666;
          }

          .number {
            font-size: 20px;
            font-weight: 700;
            color: #E20613;
            font-family: 'Courier New', monospace;
          }
        }
      }

      .notification-animation {
        position: relative;
        display: inline-block;
        margin: 24px 0;

        .pulse-ring {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 3px solid #E20613;
          border-radius: 50%;
          animation: pulse 2s infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .notification-icon {
          font-size: 48px;
          position: relative;
          z-index: 1;
          animation: shake 2s infinite;
        }
      }

      .waiting-text {
        margin: 16px 0 0 0;
        color: #333;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.5;
      }
    }

    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
      }
    }

    @keyframes shake {
      0%, 100% { transform: rotate(0deg); }
      10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
      20%, 40%, 60%, 80% { transform: rotate(10deg); }
    }

    .instructions {
      background: #F5F5F5;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;

      h4 {
        margin: 0 0 16px 0;
        color: #E20613;
        font-size: 18px;
      }

      ol {
        margin: 0;
        padding-left: 20px;
        color: #666;
        line-height: 1.8;

        li {
          margin-bottom: 8px;

          strong {
            color: #E20613;
          }
        }
      }
    }

    .info-box {
      background: rgba(226, 6, 19, 0.1);
      border: 1px solid #E20613;
      border-radius: 8px;
      padding: 12px;
      text-align: center;

      p {
        margin: 0;
        color: #E20613;
        font-size: 14px;

        strong {
          font-weight: 600;
        }
      }
    }

    .success-message, .error-message {
      text-align: center;
      padding: 32px;
      background: white;
      border-radius: 12px;

      .icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 24px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    .success-message {
      border: 2px solid #4CAF50;

      h3 {
        color: #2E7D32;
      }
    }

    .error-message {
      border: 2px solid #F44336;

      h3 {
        color: #C62828;
      }
    }
  `]
})
export class MBWayEnhancedComponent implements OnInit, OnDestroy {
  donationId = input.required<string>();
  phoneNumber = input.required<string>();
  amount = input.required<number>();

  paymentCompleted = output<void>();
  paymentFailed = output<void>();

  private pollingService = inject(PaymentPollingService);
  private destroy$ = new Subject<void>();

  paymentStatus = signal<string>('pending');

  ngOnInit(): void {
    this.pollingService
      .pollMBWayPayment(this.donationId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.paymentStatus.set(response.paymentStatus);
          if (response.paymentStatus === 'succeeded') {
            this.paymentCompleted.emit();
          } else if (response.paymentStatus === 'failed') {
            this.paymentFailed.emit();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
