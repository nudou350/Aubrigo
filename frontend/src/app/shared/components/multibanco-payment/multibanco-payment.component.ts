import { Component, OnInit, OnDestroy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PaymentPollingService } from '../../../core/services/payment-polling.service';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-multibanco-payment',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  template: `
    <div class="multibanco-container">
      <div class="header">
        <div class="logo">
          <span class="icon">🏧</span>
          <h2>Multibanco</h2>
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
            <span>Aguardando pagamento</span>
          }
          @case ('succeeded') {
            <span class="icon">✅</span>
            <span>Pagamento confirmado!</span>
          }
        }
      </div>

      @if (paymentStatus() === 'pending' || paymentStatus() === 'processing') {
        <div class="reference-card">
          <div class="reference-item">
            <span class="label">Entidade:</span>
            <span class="value entity">{{ entity() }}</span>
          </div>
          <div class="reference-item">
            <span class="label">Referência:</span>
            <span class="value reference">{{ reference() }}</span>
          </div>
          <div class="reference-item">
            <span class="label">Montante:</span>
            <span class="value">{{ amount() | currencyFormat: 'EUR' }}</span>
          </div>
        </div>

        <div class="instructions">
          <h4>Como pagar</h4>
          <ol>
            <li>Aceda ao multibanco ou homebanking</li>
            <li>Escolha <strong>"Pagamentos"</strong> ou <strong>"Serviços"</strong></li>
            <li>Entidade: <strong>{{ entity() }}</strong></li>
            <li>Referência: <strong>{{ reference() }}</strong></li>
            <li>Montante: <strong>{{ amount() | currencyFormat: 'EUR' }}</strong></li>
            <li>Confirme o pagamento</li>
          </ol>
        </div>

        <div class="info-box">
          <p>O pagamento será confirmado automaticamente.</p>
        </div>
      }

      @if (paymentStatus() === 'succeeded') {
        <div class="success-message">
          <div class="icon">🎉</div>
          <h3>Pagamento confirmado!</h3>
          <p>Obrigado pela sua doação.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .multibanco-container {
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
          color: #0051A5;
          font-size: 28px;
        }
      }

      .amount {
        background: linear-gradient(135deg, #0051A5 0%, #003D7A 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 24px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 81, 165, 0.3);
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

      &.pending {
        background: rgba(255, 193, 7, 0.1);
        color: #F57C00;
        border: 2px solid #FFC107;
      }

      &.succeeded {
        background: rgba(76, 175, 80, 0.1);
        color: #2E7D32;
        border: 2px solid #4CAF50;
      }
    }

    .reference-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0, 81, 165, 0.15);
      margin-bottom: 24px;
      border: 2px solid #0051A5;

      .reference-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: #F5F9FF;
        border-radius: 8px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .value {
          font-size: 20px;
          font-weight: 700;
          color: #0051A5;
          letter-spacing: 2px;

          &.entity, &.reference {
            font-family: 'Courier New', monospace;
          }
        }
      }
    }

    .instructions {
      background: #F5F5F5;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;

      h4 {
        margin: 0 0 16px 0;
        color: #0051A5;
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
            color: #0051A5;
            font-weight: 600;
          }
        }
      }
    }

    .info-box {
      background: rgba(0, 81, 165, 0.1);
      border: 1px solid #0051A5;
      border-radius: 8px;
      padding: 12px;
      text-align: center;

      p {
        margin: 0;
        color: #0051A5;
        font-weight: 500;
        font-size: 14px;
      }
    }

    .success-message {
      text-align: center;
      padding: 32px;
      background: white;
      border-radius: 12px;
      border: 2px solid #4CAF50;

      .icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 12px 0;
        color: #2E7D32;
        font-size: 24px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    @media (max-width: 480px) {
      .reference-item {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
    }
  `]
})
export class MultibancoPaymentComponent implements OnInit, OnDestroy {
  entity = input.required<string>();
  reference = input.required<string>();
  amount = input.required<number>();
  donationId = input.required<string>();

  paymentCompleted = output<void>();

  private pollingService = inject(PaymentPollingService);
  private destroy$ = new Subject<void>();

  paymentStatus = signal<string>('pending');

  ngOnInit(): void {
    this.pollingService
      .pollMultibancoPayment(this.donationId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.paymentStatus.set(response.paymentStatus);
          if (response.paymentStatus === 'succeeded') {
            this.paymentCompleted.emit();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
