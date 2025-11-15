import { Component, OnInit, OnDestroy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PaymentPollingService } from '../../../core/services/payment-polling.service';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-boleto-payment',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  templateUrl: './boleto-payment.component.html',
  styleUrls: ['./boleto-payment.component.scss']
})
export class BoletoPaymentComponent implements OnInit, OnDestroy {
  // Inputs
  donationId = input.required<string>();
  boletoUrl = input.required<string>();
  boletoBarcode = input.required<string>();
  amount = input.required<number>();
  expiresAt = input<string>();

  // Outputs
  paymentCompleted = output<void>();
  paymentExpired = output<void>();
  paymentFailed = output<void>();

  // Services
  private pollingService = inject(PaymentPollingService);
  private destroy$ = new Subject<void>();

  // State
  paymentStatus = signal<string>('pending');
  copied = signal(false);
  timeRemaining = signal<string>('');

  ngOnInit(): void {
    this.startPolling();
    if (this.expiresAt()) {
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(): void {
    this.pollingService
      .pollBoletoPayment(this.donationId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.paymentStatus.set(response.paymentStatus);

          if (response.paymentStatus === 'succeeded') {
            this.paymentCompleted.emit();
          } else if (response.paymentStatus === 'expired') {
            this.paymentExpired.emit();
          } else if (response.paymentStatus === 'failed') {
            this.paymentFailed.emit();
          }
        },
        error: (error) => {
          console.error('Polling error:', error);
        }
      });
  }

  private startCountdown(): void {
    const updateCountdown = () => {
      const expires = new Date(this.expiresAt()!);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        this.timeRemaining.set('Expirado');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      this.timeRemaining.set(`${days}d ${hours}h`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    this.destroy$.subscribe(() => clearInterval(interval));
  }

  copyBarcode(): void {
    const text = this.boletoBarcode();
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  downloadBoleto(): void {
    window.open(this.boletoUrl(), '_blank');
  }

  printBoleto(): void {
    const printWindow = window.open(this.boletoUrl(), '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}
