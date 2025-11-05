import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DonationsService, MBWayPaymentResponse } from '../../core/services/donations.service';
import { MbwayQrcodeComponent } from '../../shared/components/mbway-qrcode/mbway-qrcode.component';

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MbwayQrcodeComponent],
  template: `
    <div class="screen">
      <div class="container">
        <div class="donation-header">
          <h1>Fazer uma Doação</h1>
          <p class="subtitle">Ajude-nos a cuidar dos animais 🐾</p>
        </div>

        @if (!showMBWayQR()) {
          <form [formGroup]="donationForm" (ngSubmit)="onSubmit()" class="donation-form">
            <!-- Donation Type Toggle - HIDDEN -->
            <!-- <div class="form-section">
              <label class="form-label">Tipo de Doação</label>
              <div class="toggle-group">
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="donationForm.get('donationType')?.value === 'one_time'"
                  (click)="donationForm.patchValue({ donationType: 'one_time' })"
                >
                  ÚNICA
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="donationForm.get('donationType')?.value === 'monthly'"
                  (click)="donationForm.patchValue({ donationType: 'monthly' })"
                >
                  MENSAL
                </button>
              </div>
            </div> -->

            <!-- Payment Method Selection -->
            <div class="form-section">
              <label class="form-label">Método de Pagamento</label>
              <div class="payment-methods">
                <button
                  type="button"
                  class="payment-method-btn"
                  [class.active]="donationForm.get('paymentMethod')?.value === 'mbway'"
                  (click)="selectPaymentMethod('mbway')"
                >
                  <span class="payment-icon">📱</span>
                  <span>MB Way</span>
                </button>
                <button
                  type="button"
                  class="payment-method-btn"
                  [class.active]="donationForm.get('paymentMethod')?.value === 'stripe'"
                  (click)="selectPaymentMethod('stripe')"
                >
                  <span class="payment-icon">💳</span>
                  <span>Cartão</span>
                </button>
                <button
                  type="button"
                  class="payment-method-btn"
                  [class.active]="donationForm.get('paymentMethod')?.value === 'multibanco'"
                  (click)="selectPaymentMethod('multibanco')"
                >
                  <span class="payment-icon">🏦</span>
                  <span>Multibanco</span>
                </button>
              </div>
            </div>

            <!-- Amount -->
            <div class="form-group">
              <label class="form-label" for="amount">Valor da Contribuição (€)</label>
              <input
                id="amount"
                type="number"
                formControlName="amount"
                class="form-input"
                placeholder="50.00"
                min="5"
                step="0.01"
              />
              @if (donationForm.get('amount')?.invalid && donationForm.get('amount')?.touched) {
                <span class="form-error">Valor mínimo: 5€</span>
              }
            </div>

            <!-- Donor Information -->
            <div class="form-section-title">Informações Pessoais</div>

            <div class="form-group">
              <label class="form-label" for="donorName">Nome Completo</label>
              <input
                id="donorName"
                type="text"
                formControlName="donorName"
                class="form-input"
                placeholder="Seu nome"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="donorEmail">Email</label>
              <input
                id="donorEmail"
                type="email"
                formControlName="donorEmail"
                class="form-input"
                placeholder="seu@email.com"
              />
            </div>

            <!-- MB Way Phone Number -->
            @if (donationForm.get('paymentMethod')?.value === 'mbway') {
              <div class="form-group">
                <label class="form-label" for="phoneNumber">Número de Telemóvel</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  formControlName="phoneNumber"
                  class="form-input"
                  placeholder="912345678"
                />
                <small class="form-hint">Associado à sua conta MB Way</small>
              </div>
            }

            <!-- Stripe Card Info (placeholder) -->
            @if (donationForm.get('paymentMethod')?.value === 'stripe') {
              <div class="form-group">
                <label class="form-label" for="cardHolderName">Nome no Cartão</label>
                <input
                  id="cardHolderName"
                  type="text"
                  formControlName="cardHolderName"
                  class="form-input"
                  placeholder="NOME NO CARTÃO"
                />
              </div>
              <div class="info-message">
                <p>💡 Integração Stripe será implementada em breve</p>
              </div>
            }

            <!-- Multibanco Info (placeholder) -->
            @if (donationForm.get('paymentMethod')?.value === 'multibanco') {
              <div class="info-message">
                <p>💡 Integração Multibanco será implementada em breve</p>
              </div>
            }

            @if (errorMessage()) {
              <div class="error-message">{{ errorMessage() }}</div>
            }

            <button
              type="submit"
              class="btn-primary"
              [disabled]="donationForm.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                CONTINUAR
              }
            </button>
          </form>
        } @else {
          <!-- MB Way QR Code Display -->
          <app-mbway-qrcode
            [qrCodeDataUrl]="mbwayResponse()?.mbway?.qrCode"
            [reference]="mbwayResponse()?.mbway?.reference"
            [amount]="mbwayResponse()?.donation?.amount"
            [phoneNumber]="mbwayResponse()?.mbway?.phoneNumber"
            [expiresAt]="getExpirationDate()"
            [status]="paymentStatus()"
          />

          <div class="action-buttons">
            <button class="btn-primary" (click)="checkStatus()">
              Verificar Pagamento
            </button>
            <button class="btn-text" (click)="resetForm()">
              Nova Doação
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .donation-header {
      text-align: center;
      padding-top: 48px;
      margin-bottom: var(--spacing-xl);
    }

    h1 {
      color: var(--color-primary);
      margin-bottom: var(--spacing-sm);
    }

    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }

    .donation-form {
      max-width: 500px;
      margin: 0 auto;
    }

    .form-section {
      margin-bottom: var(--spacing-xl);
    }

    .form-section-title {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
      margin: var(--spacing-xl) 0 var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--color-primary-lighter);
    }

    .toggle-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
    }

    .toggle-btn {
      padding: var(--spacing-md);
      background: var(--color-background-secondary);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      transition: all 0.2s ease;
    }

    .toggle-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .payment-methods {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm);
    }

    .payment-method-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--color-background-secondary);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      transition: all 0.2s ease;
      font-size: var(--font-size-small);
    }

    .payment-method-btn.active {
      background: rgba(76, 168, 160, 0.1);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .payment-icon {
      font-size: 24px;
    }

    .form-hint {
      display: block;
      margin-top: var(--spacing-xs);
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
    }

    .info-message {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid #ffc107;
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin: var(--spacing-md) 0;
      text-align: center;
    }

    .info-message p {
      margin: 0;
      color: #f57c00;
      font-size: var(--font-size-small);
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      padding: 12px;
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
      text-align: center;
      font-size: var(--font-size-small);
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
    }

    @media (max-width: 480px) {
      .payment-methods {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DonationComponent {
  private donationsService = inject(DonationsService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showMBWayQR = signal(false);
  mbwayResponse = signal<MBWayPaymentResponse | null>(null);
  paymentStatus = signal<'pending' | 'paid' | 'expired' | 'cancelled'>('pending');

  // Helper method to convert expiration date
  getExpirationDate(): Date | undefined {
    const expiresAt = this.mbwayResponse()?.mbway?.expiresAt;
    return expiresAt ? new Date(expiresAt) : undefined;
  }

  donationForm = new FormGroup({
    ongId: new FormControl('default-ong-id'), // This should come from route or selection
    donorName: new FormControl('', [Validators.required]),
    donorEmail: new FormControl('', [Validators.required, Validators.email]),
    amount: new FormControl(50, [Validators.required, Validators.min(5)]),
    donationType: new FormControl<'one_time' | 'monthly'>('one_time', [Validators.required]),
    paymentMethod: new FormControl<'mbway' | 'stripe' | 'multibanco'>('mbway', [Validators.required]),
    phoneNumber: new FormControl(''),
    cardHolderName: new FormControl(''),
  });

  selectPaymentMethod(method: 'mbway' | 'stripe' | 'multibanco') {
    this.donationForm.patchValue({ paymentMethod: method });

    // Update validators based on payment method
    const phoneControl = this.donationForm.get('phoneNumber');
    const cardControl = this.donationForm.get('cardHolderName');

    if (method === 'mbway') {
      phoneControl?.setValidators([Validators.required]);
      cardControl?.clearValidators();
    } else if (method === 'stripe') {
      cardControl?.setValidators([Validators.required]);
      phoneControl?.clearValidators();
    } else {
      phoneControl?.clearValidators();
      cardControl?.clearValidators();
    }

    phoneControl?.updateValueAndValidity();
    cardControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.donationForm.invalid) {
      this.donationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.donationForm.value;

    this.donationsService.createDonation(formValue as any).subscribe({
      next: (response) => {
        this.mbwayResponse.set(response);
        this.showMBWayQR.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Erro ao processar doação');
        this.loading.set(false);
      },
    });
  }

  checkStatus(): void {
    const donationId = this.mbwayResponse()?.donation?.id;
    if (!donationId) return;

    this.donationsService.checkPaymentStatus(donationId).subscribe({
      next: (status) => {
        if (status.mbwayStatus) {
          this.paymentStatus.set(status.mbwayStatus);
        }
        if (status.paymentStatus === 'completed') {
          // Payment successful - show success message or redirect
          alert('Pagamento confirmado! Obrigado pela sua doação! 🎉');
        }
      },
      error: (error) => {
        console.error('Error checking payment status:', error);
      },
    });
  }

  resetForm(): void {
    this.showMBWayQR.set(false);
    this.mbwayResponse.set(null);
    this.paymentStatus.set('pending');
    this.donationForm.reset({
      donationType: 'one_time',
      paymentMethod: 'mbway',
      amount: 50,
    });
  }
}
