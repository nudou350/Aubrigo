import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

import { DonationsService, Ong } from '../../core/services/donations.service';
import { ToastService } from '../../core/services/toast.service';
import { PaymentConfig, CreateDonationDto, PaymentInstructions } from '../../core/types';
import { PaymentInstructionsModalComponent } from './payment-instructions-modal.component';

@Component({
  selector: 'app-donation-page',
  standalone: true,
  templateUrl: './donation-page.component.html',
  styleUrls: ['./donation-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'donation-page'
  },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatIconModule,
    PaymentInstructionsModalComponent
  ]
})
export class DonationPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private donationsService = inject(DonationsService);
  private toastService = inject(ToastService);

  // State signals
  ongs = signal<Ong[]>([]);
  selectedOng = signal<Ong | null>(null);
  paymentConfig = signal<PaymentConfig | null>(null);
  paymentInstructions = signal<PaymentInstructions | null>(null);
  showInstructionsModal = signal(false);
  loading = signal(false);
  loadingOngs = signal(true);
  loadingPaymentMethods = signal(false);

  // Form
  donationForm!: FormGroup;

  // Computed values
  availablePaymentMethods = computed(() => {
    const config = this.paymentConfig();
    if (!config) return [];

    const methods: { value: string; label: string; icon: string; description: string }[] = [];

    if (config.availablePaymentMethods.mbway?.enabled) {
      methods.push({
        value: 'mbway',
        label: 'MB WAY',
        icon: 'phone_iphone',
        description: 'Pagamento via MB WAY'
      });
    }

    if (config.availablePaymentMethods.multibanco?.enabled) {
      methods.push({
        value: 'multibanco',
        label: 'Multibanco',
        icon: 'account_balance',
        description: 'Transferência bancária'
      });
    }

    if (config.availablePaymentMethods.pix?.enabled) {
      methods.push({
        value: 'pix',
        label: 'PIX',
        icon: 'qr_code',
        description: 'Pagamento via PIX'
      });
    }

    if (config.availablePaymentMethods.bank_transfer?.enabled) {
      methods.push({
        value: 'bank_transfer',
        label: 'Transferência Bancária',
        icon: 'account_balance',
        description: 'TED/DOC'
      });
    }

    return methods;
  });

  hasPaymentMethods = computed(() => {
    const config = this.paymentConfig();
    return config?.paymentMethodsConfigured ?? false;
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadOngs();
  }

  private initializeForm(): void {
    this.donationForm = this.fb.group({
      ongId: ['', Validators.required],
      donorName: ['', [Validators.required, Validators.minLength(3)]],
      donorEmail: ['', [Validators.required, Validators.email]],
      amount: [10, [Validators.required, Validators.min(1)]],
      donationType: ['one_time', Validators.required],
      paymentMethod: ['', Validators.required]
    });

    // Watch ONG selection
    this.donationForm.get('ongId')?.valueChanges.subscribe((ongId) => {
      if (ongId) {
        this.onOngSelected(ongId);
      } else {
        this.selectedOng.set(null);
        this.paymentConfig.set(null);
        this.donationForm.get('paymentMethod')?.reset();
      }
    });
  }

  private loadOngs(): void {
    this.loadingOngs.set(true);

    this.donationsService.getAllOngs().subscribe({
      next: (ongs) => {
        this.ongs.set(ongs);
        this.loadingOngs.set(false);
      },
      error: (error) => {
        console.error('Error loading ONGs:', error);
        this.toastService.error('Erro ao carregar ONGs');
        this.loadingOngs.set(false);
      }
    });
  }

  private onOngSelected(ongId: string): void {
    const ong = this.ongs().find(o => o.id === ongId);
    if (!ong) return;

    this.selectedOng.set(ong);
    this.loadPaymentConfig(ongId);
  }

  private loadPaymentConfig(ongId: string): void {
    this.loadingPaymentMethods.set(true);
    this.donationForm.get('paymentMethod')?.reset();

    this.donationsService.getOngPaymentConfig(ongId).subscribe({
      next: (config) => {
        this.paymentConfig.set(config);
        this.loadingPaymentMethods.set(false);

        if (!config.paymentMethodsConfigured) {
          this.toastService.warning('Esta ONG ainda não configurou métodos de pagamento');
        }
      },
      error: (error) => {
        console.error('Error loading payment config:', error);
        this.toastService.error('Erro ao carregar métodos de pagamento');
        this.loadingPaymentMethods.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.donationForm.invalid) {
      this.donationForm.markAllAsTouched();
      this.toastService.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!this.hasPaymentMethods()) {
      this.toastService.error('Esta ONG não possui métodos de pagamento configurados');
      return;
    }

    this.loading.set(true);

    const donationData: CreateDonationDto = {
      ongId: this.donationForm.value.ongId,
      donorName: this.donationForm.value.donorName,
      donorEmail: this.donationForm.value.donorEmail,
      amount: this.donationForm.value.amount,
      donationType: this.donationForm.value.donationType,
      paymentMethod: this.donationForm.value.paymentMethod
    };

    this.donationsService.createSimplifiedDonation(donationData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.paymentInstructions.set(response.paymentInstructions);
        this.showInstructionsModal.set(true);
        this.toastService.success('Doação criada com sucesso! Verifique as instruções de pagamento.');
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error creating donation:', error);
        this.toastService.error(error.error?.message || 'Erro ao criar doação. Tente novamente.');
      }
    });
  }

  onModalClosed(): void {
    this.showInstructionsModal.set(false);
    this.donationForm.reset({
      donationType: 'one_time',
      amount: 10
    });
    this.selectedOng.set(null);
    this.paymentConfig.set(null);
    this.paymentInstructions.set(null);
  }

  getOngName(ongId: string): string {
    return this.ongs().find(o => o.id === ongId)?.ongName || '';
  }

  formatCurrency(amount: number): string {
    const ong = this.selectedOng();
    const country = ong?.countryCode || 'PT';
    const currency = country === 'BR' ? 'BRL' : 'EUR';
    const locale = country === 'BR' ? 'pt-BR' : 'pt-PT';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}
