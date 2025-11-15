import { Component, OnInit, OnDestroy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { Subject, takeUntil } from 'rxjs';
import { PaymentPollingService } from '../../../core/services/payment-polling.service';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-pix-qr-payment',
  standalone: true,
  imports: [CommonModule, QRCodeModule, CurrencyFormatPipe],
  templateUrl: './pix-qr-payment.component.html',
  styleUrls: ['./pix-qr-payment.component.scss']
})
export class PixQrPaymentComponent implements OnInit, OnDestroy {
  // Inputs
  donationId = input.required<string>();
  pixQrCode = input<string>();
  pixPaymentString = input.required<string>();
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
      .pollPixPayment(this.donationId())
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

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.timeRemaining.set(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    this.destroy$.subscribe(() => clearInterval(interval));
  }

  copyToClipboard(): void {
    const text = this.pixPaymentString();
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  downloadQRCode(): void {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'pix-qrcode.png';
      link.href = url;
      link.click();
    }
  }
}
