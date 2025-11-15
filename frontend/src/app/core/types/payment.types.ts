/**
 * Payment Response Types - Discriminated Unions for Type Safety
 *
 * These types ensure compile-time safety for payment responses across different
 * payment methods and statuses. Each response type is mutually exclusive.
 */

// Base payment information shared across all responses
export interface BasePaymentInfo {
  paymentIntentId: string;
  expiresAt?: string;
  instructions?: string | string[];
}

// Stripe Card Payment Response
export interface StripeCardPaymentResponse {
  success: true;
  paymentMethod: 'card' | 'mbway';
  payment: BasePaymentInfo & {
    status: 'succeeded' | 'processing' | 'requires_action';
    clientSecret: string;
    requiresAction?: boolean;
  };
}

// PIX Payment Response (Brazil - Manual with QR Code)
export interface PixPaymentResponse {
  success: true;
  paymentMethod: 'pix';
  payment: BasePaymentInfo & {
    status: 'pending_confirmation';
    pixKey: string;
    pixKeyType: string;
    pixQrCode?: string;
    pixPaymentString?: string;
  };
}

// Boleto Payment Response (Brazil)
export interface BoletoPaymentResponse {
  success: true;
  paymentMethod: 'boleto';
  payment: BasePaymentInfo & {
    status: 'pending_confirmation';
    boletoUrl: string;
    boletoBarcode: string;
  };
}

// Multibanco Payment Response (Portugal)
export interface MultibancoPaymentResponse {
  success: true;
  paymentMethod: 'multibanco';
  payment: BasePaymentInfo & {
    status: 'pending_confirmation';
    entity: string;
    reference: string;
  };
}

// Payment Error Response
export interface PaymentErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Discriminated Union of all possible payment responses
export type PaymentResponse =
  | StripeCardPaymentResponse
  | PixPaymentResponse
  | BoletoPaymentResponse
  | MultibancoPaymentResponse
  | PaymentErrorResponse;

// Type guards for runtime type checking
export function isSuccessfulPayment(
  response: PaymentResponse
): response is Exclude<PaymentResponse, PaymentErrorResponse> {
  return response.success === true;
}

export function isPaymentError(
  response: PaymentResponse
): response is PaymentErrorResponse {
  return response.success === false;
}

export function isStripeCardPayment(
  response: PaymentResponse
): response is StripeCardPaymentResponse {
  return isSuccessfulPayment(response) &&
         (response.paymentMethod === 'card' || response.paymentMethod === 'mbway');
}

export function isPixPayment(
  response: PaymentResponse
): response is PixPaymentResponse {
  return isSuccessfulPayment(response) && response.paymentMethod === 'pix';
}

export function isBoletoPayment(
  response: PaymentResponse
): response is BoletoPaymentResponse {
  return isSuccessfulPayment(response) && response.paymentMethod === 'boleto';
}

export function isMultibancoPayment(
  response: PaymentResponse
): response is MultibancoPaymentResponse {
  return isSuccessfulPayment(response) && response.paymentMethod === 'multibanco';
}

// Payment Status Types
export type PaymentStatus =
  | 'pending'
  | 'pending_confirmation' // Manual donation awaiting ONG confirmation
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'expired'
  | 'requires_action';

// Payment Method Types
export type PaymentMethod = 'mbway' | 'multibanco' | 'card' | 'pix' | 'boleto' | 'bank_transfer';

// Country Types
export type SupportedCountry = 'PT' | 'BR';

// Currency Types
export type SupportedCurrency = 'EUR' | 'BRL';

// Donation Type
export type DonationType = 'one_time' | 'monthly';
