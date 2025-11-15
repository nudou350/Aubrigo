import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';

import { OngService, OngProfile } from '../../../core/services/ong.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentConfigDto, OngPaymentConfigResponse } from '../../../core/types';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'payment-settings'
  },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule
  ]
})
export class PaymentSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ongService = inject(OngService);
  private toastService = inject(ToastService);

  // State
  loading = signal(false);
  saving = signal(false);
  ongProfile = signal<OngProfile | null>(null);
  paymentConfig = signal<OngPaymentConfigResponse | null>(null);

  // Forms (country-specific)
  portugalForm!: FormGroup;
  brazilForm!: FormGroup;

  // Computed
  country = computed(() => {
    const profile = this.ongProfile();
    return profile?.countryCode || 'PT';
  });

  isPortugal = computed(() => this.country() === 'PT');
  isBrazil = computed(() => this.country() === 'BR');

  hasConfiguredMethods = computed(() => {
    const config = this.paymentConfig();
    if (!config) return false;

    if (this.isPortugal()) {
      return !!(config.mbwayPhone || config.iban);
    } else {
      return !!(config.pixKey || (config.bankName && config.bankAccountNumber));
    }
  });

  ngOnInit(): void {
    this.initializeForms();
    this.loadOngProfile();
  }

  private initializeForms(): void {
    // Portugal form
    this.portugalForm = this.fb.group({
      mbwayPhone: ['', [Validators.pattern(/^\+351\d{9}$/)]],
      iban: ['', [Validators.pattern(/^PT\d{23}$/)]]
    });

    // Brazil form
    this.brazilForm = this.fb.group({
      pixKey: [''],
      pixKeyType: ['email'],
      bankName: [''],
      bankRoutingNumber: [''],
      bankAccountNumber: ['']
    });
  }

  private loadOngProfile(): void {
    this.loading.set(true);

    this.ongService.getOngProfile().subscribe({
      next: (profile) => {
        this.ongProfile.set(profile);
        this.loadPaymentConfig();
      },
      error: (error) => {
        console.error('Error loading ONG profile:', error);
        this.toastService.error('Erro ao carregar perfil');
        this.loading.set(false);
      }
    });
  }

  private loadPaymentConfig(): void {
    this.ongService.getPaymentConfig().subscribe({
      next: (config) => {
        this.paymentConfig.set(config);
        this.populateForms(config);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading payment config:', error);
        // Not an error if no config exists yet
        this.loading.set(false);
      }
    });
  }

  private populateForms(config: OngPaymentConfigResponse): void {
    if (config.country === 'PT') {
      this.portugalForm.patchValue({
        mbwayPhone: config.mbwayPhone || '',
        iban: config.iban || ''
      });
    } else {
      this.brazilForm.patchValue({
        pixKey: config.pixKey || '',
        pixKeyType: config.pixKeyType || 'email',
        bankName: config.bankName || '',
        bankRoutingNumber: config.bankRoutingNumber || '',
        bankAccountNumber: config.bankAccountNumber || ''
      });
    }
  }

  onSubmit(): void {
    const form = this.isPortugal() ? this.portugalForm : this.brazilForm;

    if (form.invalid) {
      form.markAllAsTouched();
      this.toastService.error('Por favor, corrija os erros no formulário');
      return;
    }

    // Check if at least one method is configured
    if (this.isPortugal()) {
      const hasMethod = !!(form.value.mbwayPhone || form.value.iban);
      if (!hasMethod) {
        this.toastService.warning('Configure pelo menos um método de pagamento');
        return;
      }
    } else {
      const hasMethod = !!(form.value.pixKey || (form.value.bankName && form.value.bankAccountNumber && form.value.bankRoutingNumber));
      if (!hasMethod) {
        this.toastService.warning('Configure pelo menos um método de pagamento');
        return;
      }
    }

    this.saving.set(true);

    const configData: PaymentConfigDto = form.value;

    this.ongService.updatePaymentConfig(configData).subscribe({
      next: (response) => {
        this.paymentConfig.set(response.config);
        this.saving.set(false);
        this.toastService.success('Configuração de pagamento salva com sucesso!');
      },
      error: (error) => {
        console.error('Error saving payment config:', error);
        this.toastService.error(error.error?.message || 'Erro ao salvar configuração');
        this.saving.set(false);
      }
    });
  }

  formatIban(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, '');

    // Remove spaces for validation but keep user-friendly format
    this.portugalForm.get('iban')?.setValue(value, { emitEvent: false });
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, '');

    // Ensure +351 prefix
    if (!value.startsWith('+351')) {
      if (value.startsWith('351')) {
        value = '+' + value;
      } else if (value.startsWith('9')) {
        value = '+351' + value;
      }
    }

    this.portugalForm.get('mbwayPhone')?.setValue(value, { emitEvent: false });
  }

  getErrorMessage(formControlName: string): string {
    const control = this.isPortugal()
      ? this.portugalForm.get(formControlName)
      : this.brazilForm.get(formControlName);

    if (!control) return '';

    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }

    if (control.hasError('pattern')) {
      if (formControlName === 'mbwayPhone') {
        return 'Formato inválido. Use: +351912345678';
      }
      if (formControlName === 'iban') {
        return 'Formato inválido. Use: PT50123456789012345678901';
      }
    }

    return '';
  }

  clearForm(): void {
    if (this.isPortugal()) {
      this.portugalForm.reset();
    } else {
      this.brazilForm.reset({ pixKeyType: 'email' });
    }
  }
}
