import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { DonationsService, MBWayPaymentResponse, Ong } from '../../core/services/donations.service';
import { MbwayQrcodeComponent } from '../../shared/components/mbway-qrcode/mbway-qrcode.component';
import { PixPaymentComponent } from '../../shared/components/pix-payment/pix-payment.component';
import { CountryService } from '../../core/services/country.service';
import { AnalyticsService, EventType } from '../../core/services/analytics.service';

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MbwayQrcodeComponent, PixPaymentComponent],
  template: `
    <div class="screen">
      <div class="container">
        <div class="donation-header">
          <h1>Fazer uma Doação</h1>
          <p class="subtitle">Ajude-nos a cuidar dos animais 🐾</p>
        </div>

        <div class="donation-form">
          <!-- ONG Selection -->
          <div class="form-group">
            <label class="form-label" for="ongId">Selecione a ONG</label>
            @if (ongs().length > 0) {
              <select
                id="ongId"
                [(ngModel)]="selectedOngId"
                (ngModelChange)="onOngSelect()"
                class="form-input"
              >
                <option value="">Escolha uma ONG...</option>
                @for (ong of ongs(); track ong.id) {
                  <option [value]="ong.id">{{ ong.ongName }}</option>
                }
              </select>
            } @else {
              <div class="no-ongs-message">
                <p>⚠️ Não há ONGs disponíveis no seu país neste momento.</p>
                <p>As doações são processadas localmente para garantir segurança e conformidade com regulamentações locais.</p>
              </div>
            }
          </div>

          <!-- Donation Instructions -->
          @if (selectedOng()) {
            <div class="donation-instructions">
              <div class="ong-info-card">
                <h3>{{ selectedOng()!.ongName }}</h3>

                <!-- Brazil: Show PIX -->
                @if (isBrazil()) {
                  @if (selectedOng()!.pixKey) {
                    <app-pix-payment
                      [pixKey]="selectedOng()!.pixKey"
                    />
                  } @else {
                    <div class="no-phone-message">
                      <p>Esta ONG ainda não configurou uma chave PIX para doações.</p>
                      <p>Por favor, entre em contato diretamente com a ONG para outras formas de doação.</p>
                    </div>
                  }
                } @else {
                  <!-- Portugal: Show MBWay -->
                  @if (selectedOng()!.phone) {
                    <div class="phone-info">
                      <span class="icon">📱</span>
                      <div>
                        <p class="phone-label">Número MB Way para doações:</p>
                        <p class="phone-number">{{ selectedOng()!.phone }}</p>
                      </div>
                    </div>
                    <div class="instructions-text">
                      <p>Para fazer uma doação:</p>
                      <ol>
                        <li>Abra o app MB Way no seu telemóvel</li>
                        <li>Selecione "Transferir" ou "Enviar Dinheiro"</li>
                        <li>Insira o número acima</li>
                        <li>Digite o valor que deseja doar</li>
                        <li>Confirme a transação</li>
                      </ol>
                    </div>
                  } @else {
                    <div class="no-phone-message">
                      <p>Esta ONG ainda não configurou um número para doações MB Way.</p>
                      <p>Por favor, entre em contato diretamente com a ONG para outras formas de doação.</p>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>

        <!-- HIDDEN: Keep code for future implementation -->
        <div style="display: none;">
          <form [formGroup]="donationForm" (ngSubmit)="onSubmit()">
            <div class="form-section">
              <label class="form-label">Método de Pagamento</label>
              <div class="payment-methods">
                <button type="button" class="payment-method-btn" [class.active]="donationForm.get('paymentMethod')?.value === 'mbway'" (click)="selectPaymentMethod('mbway')">
                  <span class="payment-icon">📱</span>
                  <span>MB Way</span>
                </button>
                <button type="button" class="payment-method-btn" [class.active]="donationForm.get('paymentMethod')?.value === 'stripe'" (click)="selectPaymentMethod('stripe')">
                  <span class="payment-icon">💳</span>
                  <span>Cartão</span>
                </button>
                <button type="button" class="payment-method-btn" [class.active]="donationForm.get('paymentMethod')?.value === 'multibanco'" (click)="selectPaymentMethod('multibanco')">
                  <span class="payment-icon">🏦</span>
                  <span>Multibanco</span>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="amount">Valor da Contribuição (€)</label>
              <input id="amount" type="number" formControlName="amount" class="form-input" placeholder="50.00" min="0.05" step="0.01" />
            </div>
            <app-mbway-qrcode
              [qrCodeDataUrl]="mbwayResponse()?.mbway?.qrCode"
              [reference]="mbwayResponse()?.mbway?.reference"
              [amount]="mbwayResponse()?.donation?.amount"
              [phoneNumber]="mbwayResponse()?.mbway?.phoneNumber"
              [expiresAt]="getExpirationDate()"
              [status]="paymentStatus()"
            />
          </form>
        </div>
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

    .action-buttons .btn-primary {
      padding: var(--spacing-md);
      font-size: var(--font-size-base);
    }

    .donation-instructions {
      margin-top: var(--spacing-xl);
    }

    .ong-info-card {
      background: var(--color-background);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-card);
    }

    .ong-info-card h3 {
      color: var(--color-primary);
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-h2);
    }

    .phone-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      background: rgba(76, 168, 160, 0.1);
      padding: var(--spacing-lg);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
      border: 2px solid var(--color-primary);
    }

    .phone-info .icon {
      font-size: 32px;
    }

    .phone-label {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .phone-number {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
      margin: 0;
      letter-spacing: 1px;
    }

    .instructions-text {
      background: var(--color-background-secondary);
      padding: var(--spacing-lg);
      border-radius: var(--radius-md);
    }

    .instructions-text p {
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--spacing-md);
      color: var(--color-text-primary);
    }

    .instructions-text ol {
      margin: 0;
      padding-left: var(--spacing-xl);
    }

    .instructions-text li {
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .no-phone-message {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid #ffc107;
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
      text-align: center;
    }

    .no-phone-message p {
      margin: var(--spacing-sm) 0;
      color: #f57c00;
    }

    .no-ongs-message {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid #ffc107;
      border-radius: var(--radius-md);
      padding: var(--spacing-xl);
      text-align: center;
      margin-top: var(--spacing-md);
    }

    .no-ongs-message p {
      margin: var(--spacing-md) 0;
      color: #f57c00;
      line-height: 1.6;
    }

    .no-ongs-message p:first-child {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-base);
    }

    @media (max-width: 480px) {
      .payment-methods {
        grid-template-columns: 1fr;
      }

      .phone-info {
        flex-direction: column;
        text-align: center;
      }

      .phone-number {
        font-size: var(--font-size-h3);
      }
    }
  `]
})
export class DonationComponent implements OnInit {
  private donationsService = inject(DonationsService);
  private countryService = inject(CountryService);
  private analytics = inject(AnalyticsService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showMBWayQR = signal(false);
  mbwayResponse = signal<MBWayPaymentResponse | null>(null);
  paymentStatus = signal<'pending' | 'paid' | 'expired' | 'cancelled'>('pending');
  ongs = signal<Ong[]>([]);
  selectedOngId: string = '';
  selectedOng = signal<Ong | null>(null);

  // Helper method to check if current country is Brazil
  isBrazil(): boolean {
    return this.countryService.getCountry() === 'BR';
  }

  // Helper method to convert expiration date
  getExpirationDate(): Date | undefined {
    const expiresAt = this.mbwayResponse()?.mbway?.expiresAt;
    return expiresAt ? new Date(expiresAt) : undefined;
  }

  donationForm = new FormGroup({
    ongId: new FormControl('', [Validators.required]),
    donorName: new FormControl(''),
    donorEmail: new FormControl(''),
    amount: new FormControl(50, [Validators.required, Validators.min(0.05)]),
    donationType: new FormControl<'one_time' | 'monthly'>('one_time', [Validators.required]),
    paymentMethod: new FormControl<'mbway' | 'stripe' | 'multibanco' | 'pix'>('mbway', [Validators.required]),
    phoneNumber: new FormControl(''),
    cardHolderName: new FormControl(''),
  });

  ngOnInit() {
    this.loadOngs();
    // Set initial validators based on payment method
    this.selectPaymentMethod('mbway');
  }

  loadOngs() {
    const filters: any = {};

    // IMPORTANT: Add country filter to show only ONGs from user's country
    filters.countryCode = this.countryService.getCountry();


    this.donationsService.getAllOngs(filters).subscribe({
      next: (ongs) => {
        this.ongs.set(ongs);
      },
      error: (error) => {
        this.errorMessage.set('Erro ao carregar lista de ONGs');
      },
    });
  }

  onOngSelect() {
    const ong = this.ongs().find(o => o.id === this.selectedOngId);
    this.selectedOng.set(ong || null);
  }

  selectPaymentMethod(method: 'mbway' | 'stripe' | 'multibanco' | 'pix') {
    this.donationForm.patchValue({ paymentMethod: method });

    // Update validators based on payment method
    const phoneControl = this.donationForm.get('phoneNumber');
    const cardControl = this.donationForm.get('cardHolderName');
    const nameControl = this.donationForm.get('donorName');
    const emailControl = this.donationForm.get('donorEmail');

    if (method === 'mbway' || method === 'pix') {
      // MBWay/PIX: only phone is required, name and email are optional
      phoneControl?.setValidators([Validators.required]);
      cardControl?.clearValidators();
      nameControl?.clearValidators();
      emailControl?.clearValidators();
    } else if (method === 'stripe') {
      // Stripe: card, name, and email required
      cardControl?.setValidators([Validators.required]);
      nameControl?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.clearValidators();
    } else {
      // Multibanco: name and email required
      phoneControl?.clearValidators();
      cardControl?.clearValidators();
      nameControl?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
    }

    phoneControl?.updateValueAndValidity();
    cardControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.donationForm.invalid) {
      this.donationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.donationForm.value;

    // For MBWay, set default values for optional fields if not provided
    const donationData = {
      ...formValue,
      donorName: formValue.donorName || 'Doador Anônimo',
      donorEmail: formValue.donorEmail || 'anonimo@petsos.pt',
    };

    this.donationsService.createDonation(donationData as any).subscribe({
      next: (response) => {
        this.mbwayResponse.set(response);
        this.showMBWayQR.set(true);
        this.loading.set(false);

        // Track donation start
        this.analytics.track(EventType.DONATION_START, {
          ongId: formValue.ongId || undefined,
          metadata: {
            amount: formValue.amount,
            donationType: formValue.donationType,
            paymentMethod: formValue.paymentMethod
          }
        });
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
          const formValue = this.donationForm.value;

          // Track donation complete
          this.analytics.track(EventType.DONATION_COMPLETE, {
            ongId: formValue.ongId || undefined,
            metadata: {
              amount: this.mbwayResponse()?.donation?.amount,
              paymentMethod: this.mbwayResponse()?.donation?.paymentMethod,
              donationId: this.mbwayResponse()?.donation?.id
            }
          });

          // Payment successful - show success message or redirect
          alert('Pagamento confirmado! Obrigado pela sua doação! 🎉');
        }
      },
      error: (error) => {
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
