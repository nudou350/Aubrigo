/**
 * Donation System Types - Country-specific payment configuration
 *
 * These types support the simplified country-specific donation system
 * where ONGs configure manual payment methods based on their country.
 */

import { PaymentMethod, SupportedCountry, SupportedCurrency, DonationType } from './payment.types';

/**
 * Payment configuration from ONG
 * Indicates which payment methods are available for a specific ONG
 */
export interface PaymentConfig {
  ongId: string;
  ongName: string;
  country: SupportedCountry;
  availablePaymentMethods: {
    mbway?: { enabled: boolean };
    multibanco?: { enabled: boolean };
    pix?: { enabled: boolean };
    bank_transfer?: { enabled: boolean };
  };
  paymentMethodsConfigured: boolean;
}

/**
 * Payment instructions response
 * Contains all details needed to complete a manual payment
 */
export interface PaymentInstructions {
  ongName: string;
  amount: number;
  currency: SupportedCurrency;
  donationId: string;

  // Portugal - MB WAY
  mbwayPhone?: string;

  // Portugal - Multibanco / Bank Transfer
  iban?: string;

  // Brazil - PIX
  pixKey?: string;
  pixKeyType?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  pixQrCode?: string; // Base64 or URL to QR code image

  // Brazil - Bank Transfer
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string; // Agência

  // Common
  instructions: string[];
  expiresAt?: string;
}

/**
 * Create donation DTO
 * Minimal information required to create a donation
 */
export interface CreateDonationDto {
  ongId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  donationType: DonationType;
  paymentMethod: 'mbway' | 'multibanco' | 'pix' | 'bank_transfer';
}

/**
 * Donation response after creation
 * Includes donation record and payment instructions
 */
export interface DonationCreatedResponse {
  message: string;
  donation: {
    id: string;
    ongId: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    currency: SupportedCurrency;
    country: SupportedCountry;
    donationType: DonationType;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
  };
  paymentInstructions: PaymentInstructions;
}

/**
 * ONG Payment Configuration DTO
 * Data sent when ONG configures their payment methods
 */
export interface PaymentConfigDto {
  // Portugal
  mbwayPhone?: string; // Format: +351912345678
  iban?: string; // Format: PT50123456789012345678901

  // Brazil
  pixKey?: string;
  pixKeyType?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  bankName?: string;
  bankRoutingNumber?: string; // Agência
  bankAccountNumber?: string; // Conta
}

/**
 * ONG Payment Configuration Response
 * Full payment configuration for an ONG
 */
export interface OngPaymentConfigResponse {
  ongId: string;
  country: SupportedCountry;

  // Portugal
  mbwayPhone?: string;
  iban?: string;

  // Brazil
  pixKey?: string;
  pixKeyType?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  bankName?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;

  updatedAt: string;
}

/**
 * Validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Payment method availability
 * Used to determine which payment methods to show in the UI
 */
export interface PaymentMethodAvailability {
  method: PaymentMethod;
  available: boolean;
  label: string;
  icon: string; // Icon name or emoji
  description: string;
}
