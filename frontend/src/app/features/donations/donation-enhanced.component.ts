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

/**
 * Simplified Donation Page Component
 *
 * This component provides a streamlined donation experience where:
 * - Donors only need to provide basic info (name, email, amount)
 * - Payment methods are dynamically loaded based on ONG's configuration
 * - Payment instructions are shown immediately after donation creation
 * - Supports country-specific payment methods (PT: MB WAY/Multibanco, BR: PIX/Bank Transfer)
 */
@Component({
  selector: 'app-donation-enhanced',
  standalone: true,
  templateUrl: './donation-enhanced.component.html',
  styleUrls: ['./donation-enhanced.component.scss'],
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
export class DonationEnhancedComponent implements OnInit {
  private fb = inject(FormBuilder);
  private donationsService = inject(DonationsService);
  private toastService = inject(ToastService);

  // State signals
  selectedOng = signal<Ong | null>(null);
  availablePaymentMethods = signal<PaymentConfig | null>(null);
  selectedPaymentMethod = signal<string | null>(null);
  paymentInstructions = signal<PaymentInstructions | null>(null);
  showInstructionsModal = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  ongs = signal<Ong[]>([]);

  // Computed values
  hasAvailablePaymentMethods = computed(() => {
    const config = this.availablePaymentMethods();
    if (!config) return false;

    const methods = config.availablePaymentMethods;
    return (methods.mbway?.enabled || methods.multibanco?.enabled ||
            methods.pix?.enabled || methods.bank_transfer?.enabled) ?? false;
  });

  paymentMethodOptions = computed(() => {
    const config = this.availablePaymentMethods();
    if (!config) return [];

    const options: Array<{ value: string; label: string; icon: string }> = [];
    const methods = config.availablePaymentMethods;

    if (methods.mbway?.enabled) {
      options.push({ value: 'mbway', label: 'MB WAY', icon: '📱' });
    }
    if (methods.multibanco?.enabled) {
      options.push({ value: 'multibanco', label: 'Multibanco', icon: '🏦' });
    }
    if (methods.pix?.enabled) {
      options.push({ value: 'pix', label: 'PIX', icon: '💰' });
    }
    if (methods.bank_transfer?.enabled) {
      options.push({ value: 'bank_transfer', label: 'Transferência Bancária', icon: '🏦' });
    }

    return options;
  });

  // Form
  donationForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadOngs();
  }

  private initializeForm(): void {
    this.donationForm = this.fb.group({
      ongId: ['', Validators.required],
      donorName: ['', [Validators.required, Validators.minLength(2)]],
      donorEmail: ['', [Validators.required, Validators.email]],
      amount: [10, [Validators.required, Validators.min(0.5)]],
      donationType: ['one_time', Validators.required],
      paymentMethod: ['', Validators.required]
    });
  }

  private loadOngs(): void {
    this.loading.set(true);
    this.donationsService.getAllOngs().subscribe({
      next: (ongs) => {
        // Filter only ONGs with payment methods configured
        const configuredOngs = ongs.filter(ong => ong.paymentMethodsConfigured);
        this.ongs.set(configuredOngs);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading ONGs:', error);
        this.error.set('Erro ao carregar ONGs. Por favor, tente novamente.');
        this.toastService.error('Erro ao carregar ONGs');
        this.loading.set(false);
      }
    });
  }

  onOngSelected(ongId: string): void {
    if (!ongId) {
      this.selectedOng.set(null);
      this.availablePaymentMethods.set(null);
      this.donationForm.patchValue({ paymentMethod: '' });
      return;
    }

    const ong = this.ongs().find(o => o.id === ongId);
    this.selectedOng.set(ong || null);

    // Fetch payment configuration for selected ONG
    this.loading.set(true);
    this.donationsService.getOngPaymentConfig(ongId).subscribe({
      next: (config) => {
        this.availablePaymentMethods.set(config);
        this.loading.set(false);

        // Reset payment method selection
        this.donationForm.patchValue({ paymentMethod: '' });
        this.selectedPaymentMethod.set(null);
      },
      error: (error) => {
        console.error('Error loading payment config:', error);
        this.toastService.error('Erro ao carregar métodos de pagamento');
        this.loading.set(false);
      }
    });
  }

  onPaymentMethodSelected(method: string): void {
    this.selectedPaymentMethod.set(method);
  }

  submitDonation(): void {
    if (this.donationForm.invalid) {
      this.toastService.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const formValue = this.donationForm.value;
    const donationData: CreateDonationDto = {
      ongId: formValue.ongId,
      donorName: formValue.donorName,
      donorEmail: formValue.donorEmail,
      amount: formValue.amount,
      donationType: formValue.donationType,
      paymentMethod: formValue.paymentMethod
    };

    this.loading.set(true);
    this.error.set(null);

    this.donationsService.createSimplifiedDonation(donationData).subscribe({
      next: (response) => {
        this.paymentInstructions.set(response.paymentInstructions);
        this.showInstructionsModal.set(true);
        this.loading.set(false);

        // Reset form after successful submission
        this.donationForm.reset({
          ongId: formValue.ongId,
          donationType: 'one_time',
          amount: 10
        });
      },
      error: (error) => {
        console.error('Error creating donation:', error);
        const errorMessage = error.error?.message || 'Erro ao processar doação. Por favor, tente novamente.';
        this.error.set(errorMessage);
        this.toastService.error(errorMessage);
        this.loading.set(false);
      }
    });
  }

  closeInstructionsModal(): void {
    this.showInstructionsModal.set(false);
    this.paymentInstructions.set(null);
  }
}
