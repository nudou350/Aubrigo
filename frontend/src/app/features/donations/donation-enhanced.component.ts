import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { DonationsService, DonationRequest, DonationResponse, Ong } from '../../core/services/donations.service';
import { CountryService, PaymentMethod } from '../../core/services/country.service';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService, EventType } from '../../core/services/analytics.service';

// Components
import { PixQrPaymentComponent } from '../../shared/components/pix-qr-payment/pix-qr-payment.component';
import { BoletoPaymentComponent } from '../../shared/components/boleto-payment/boleto-payment.component';
import { MultibancoPaymentComponent } from '../../shared/components/multibanco-payment/multibanco-payment.component';
import { MBWayEnhancedComponent } from '../../shared/components/mbway-enhanced/mbway-enhanced.component';

// Pipes
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-donation-enhanced',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PixQrPaymentComponent,
    BoletoPaymentComponent,
    MultibancoPaymentComponent,
    MBWayEnhancedComponent,
    CurrencyFormatPipe
  ],
  templateUrl: './donation-enhanced.component.html',
  styleUrls: ['./donation-enhanced.component.scss']
})
export class DonationEnhancedComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private donationsService = inject(DonationsService);
  private countryService = inject(CountryService);
  private toastService = inject(ToastService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  // State
  donationForm!: FormGroup;
  currentStep = signal<'form' | 'payment'>('form');
  selectedPaymentMethod = signal<string>('');
  paymentResponse = signal<DonationResponse | null>(null);
  isLoading = signal(false);
  ongs = signal<Ong[]>([]);
  pixKeyCopied = signal(false);

  // Dynamic data based on country
  country = signal<string>('PT');
  currency = signal<{ code: string; symbol: string; locale: string }>({ code: 'EUR', symbol: '€', locale: 'pt-PT' });
  availablePaymentMethods = signal<PaymentMethod[]>([]);

  ngOnInit(): void {
    // Get country from CountryService
    this.country.set(this.countryService.getCountry());
    this.currency.set(this.countryService.getCurrency(this.country()));
    this.availablePaymentMethods.set(this.countryService.getPaymentMethods(this.country()));

    // Load ONGs for the current country
    this.loadOngs();

    // Initialize form
    this.donationForm = this.fb.group({
      ongId: ['', Validators.required],
      donorName: ['', Validators.required],
      donorEmail: ['', [Validators.required, Validators.email]],
      amount: [10, [Validators.required, Validators.min(0.5)]],
      donationType: ['one_time', Validators.required],
      country: [this.country(), Validators.required],
      currency: [this.currency().code, Validators.required],
      paymentMethod: ['', Validators.required],
      phoneNumber: [''] // For MBWay only
    });

    // Watch payment method changes
    this.donationForm.get('paymentMethod')?.valueChanges.subscribe((method) => {
      this.selectedPaymentMethod.set(method);

      // Make phone number required for MBWay
      if (method === 'mbway') {
        this.donationForm.get('phoneNumber')?.setValidators([
          Validators.required,
          Validators.pattern(/^\+351\d{9}$/)
        ]);
      } else {
        this.donationForm.get('phoneNumber')?.clearValidators();
      }
      this.donationForm.get('phoneNumber')?.updateValueAndValidity();
    });
  }

  loadOngs(): void {
    const filters = {
      countryCode: this.countryService.getCountry()
    };

    this.donationsService.getAllOngs(filters).subscribe({
      next: (ongs) => {
        this.ongs.set(ongs);
      },
      error: (error) => {
        console.error('Error loading ONGs:', error);
        this.toastService.error('Erro ao carregar ONGs');
      }
    });
  }

  onSubmit(): void {
    if (this.donationForm.invalid) {
      this.donationForm.markAllAsTouched();
      this.toastService.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.isLoading.set(true);

    const donationData: DonationRequest = this.donationForm.value;

    // Track donation start
    this.analytics.track(EventType.DONATION_START, {
      ongId: donationData.ongId,
      metadata: {
        amount: donationData.amount,
        currency: donationData.currency,
        paymentMethod: donationData.paymentMethod
      }
    });

    this.donationsService.createDonation(donationData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.paymentResponse.set(response);
        this.currentStep.set('payment');
        this.toastService.success('Pagamento iniciado');
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Donation error:', error);
        this.toastService.error(error.error?.message || 'Erro ao processar doação. Tente novamente.');
      }
    });
  }

  onPaymentCompleted(): void {
    // Track donation complete
    this.analytics.track(EventType.DONATION_COMPLETE, {
      ongId: this.donationForm.get('ongId')?.value,
      metadata: {
        amount: this.paymentResponse()?.donation.amount,
        currency: this.paymentResponse()?.donation.currency,
        paymentMethod: this.paymentResponse()?.donation.paymentMethod,
        donationId: this.paymentResponse()?.donation.id
      }
    });

    this.toastService.success('Pagamento confirmado! Obrigado pela sua doação.');
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 3000);
  }

  onPaymentFailed(): void {
    this.toastService.error('Pagamento falhou. Por favor, tente novamente.');
    this.currentStep.set('form');
    this.paymentResponse.set(null);
  }

  onPaymentExpired(): void {
    this.toastService.warning('Pagamento expirou. Por favor, tente novamente.');
    this.currentStep.set('form');
    this.paymentResponse.set(null);
  }

  goBack(): void {
    this.currentStep.set('form');
    this.paymentResponse.set(null);
  }

  getSelectedOng(): Ong | null {
    const ongId = this.donationForm.get('ongId')?.value;
    if (!ongId || ongId === '') {
      return null;
    }
    return this.ongs().find(o => o.id === ongId) || null;
  }

  copyPixKey(): void {
    const pixKey = this.paymentResponse()?.payment?.pixKey;
    if (!pixKey) return;

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pixKey).then(() => {
        this.pixKeyCopied.set(true);
        this.toastService.success('Chave PIX copiada!');

        // Reset after 3 seconds
        setTimeout(() => {
          this.pixKeyCopied.set(false);
        }, 3000);
      }).catch(() => {
        // Fallback for older browsers
        this.fallbackCopyPixKey(pixKey);
      });
    } else {
      this.fallbackCopyPixKey(pixKey);
    }
  }

  private fallbackCopyPixKey(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      this.pixKeyCopied.set(true);
      this.toastService.success('Chave PIX copiada!');
      setTimeout(() => {
        this.pixKeyCopied.set(false);
      }, 3000);
    } catch {
      this.toastService.error('Erro ao copiar chave PIX');
    }

    document.body.removeChild(textarea);
  }

  formatCurrency(amount: number, currency: string): string {
    if (!amount || !currency) return '';

    const locale = currency === 'EUR' ? 'pt-PT' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  resetForm(): void {
    this.paymentResponse.set(null);
    this.donationForm.reset({
      country: this.donationForm.get('country')?.value,
      currency: this.donationForm.get('currency')?.value,
    });
    this.currentStep.set('form');
  }
}
