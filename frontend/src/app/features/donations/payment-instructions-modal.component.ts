import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Clipboard } from '@angular/cdk/clipboard';

import { PaymentInstructions } from '../../core/types';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-payment-instructions-modal',
  standalone: true,
  templateUrl: './payment-instructions-modal.component.html',
  styleUrls: ['./payment-instructions-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'payment-instructions-modal',
    'role': 'dialog',
    'aria-modal': 'true',
    '(click)': 'onBackdropClick($event)',
    '(keydown.escape)': 'close()'
  },
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class PaymentInstructionsModalComponent {
  private clipboard = inject(Clipboard);
  private toastService = inject(ToastService);

  // Inputs
  instructions = input.required<PaymentInstructions>();

  // Outputs
  closed = output<void>();

  // State
  copiedField = signal<string>('');

  /**
   * Close modal
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Handle backdrop click (close on click outside)
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('payment-instructions-modal')) {
      this.close();
    }
  }

  /**
   * Copy text to clipboard
   */
  copyToClipboard(text: string, fieldName: string): void {
    const success = this.clipboard.copy(text);

    if (success) {
      this.copiedField.set(fieldName);
      this.toastService.success(`${fieldName} copiado!`);

      // Reset after 3 seconds
      setTimeout(() => {
        this.copiedField.set('');
      }, 3000);
    } else {
      this.toastService.error('Erro ao copiar. Por favor, copie manualmente.');
    }
  }

  /**
   * Check if a field was copied
   */
  isCopied(fieldName: string): boolean {
    return this.copiedField() === fieldName;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string): string {
    const locale = currency === 'EUR' ? 'pt-PT' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Determine payment method type
   */
  getPaymentMethodType(): 'mbway' | 'multibanco' | 'pix' | 'bank_transfer' | null {
    const inst = this.instructions();

    if (inst.mbwayPhone) return 'mbway';
    if (inst.pixKey) return 'pix';
    if (inst.bankName && inst.bankAccountNumber) return 'bank_transfer';
    if (inst.iban) return 'multibanco';

    return null;
  }
}
