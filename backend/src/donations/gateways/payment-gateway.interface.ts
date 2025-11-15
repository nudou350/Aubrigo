export interface PaymentRequest {
  amount: number;
  currency: "EUR" | "BRL";
  country: "PT" | "BR";
  paymentMethod: PaymentMethodType;
  donationId: string;
  donorEmail: string;
  donorName: string;
  phoneNumber?: string; // For MBWay
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentIntentId: string;
  clientSecret?: string;
  status: PaymentStatus;

  // MBWay specific
  requiresAction?: boolean;

  // PIX specific (via payment gateways like EBANX)
  pixQrCode?: string;
  pixQrCodeUrl?: string;
  pixPaymentString?: string;

  // Manual PIX specific (ONG's PIX key)
  pixKey?: string;
  pixKeyType?: string; // 'CPF', 'CNPJ', 'Email', 'Phone', 'Random'
  instructions?: string;

  // Multibanco specific
  multibancoEntity?: string;
  multibancoReference?: string;

  // Boleto specific
  boletoUrl?: string;
  boletoBarcode?: string;

  expiresAt?: Date;
  error?: string;
}

export interface PaymentStatusResponse {
  paymentIntentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: string;
  error?: string;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Optional partial refund
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  error?: string;
}

export type PaymentMethodType =
  | "mbway"
  | "multibanco"
  | "card"
  | "pix"
  | "boleto";

export type PaymentStatus =
  | "pending"
  | "pending_confirmation"
  | "processing"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "canceled"
  | "expired";

export interface IPaymentGateway {
  /**
   * Initialize a payment
   */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Check payment status
   */
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResponse>;

  /**
   * Process refund
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: any, signature: string): boolean;

  /**
   * Handle webhook events
   */
  handleWebhook(payload: any): Promise<{
    event: string;
    paymentIntentId: string;
    status: PaymentStatus;
    metadata?: Record<string, any>;
  }>;

  /**
   * Get supported payment methods for this gateway
   */
  getSupportedMethods(): PaymentMethodType[];

  /**
   * Get gateway name
   */
  getName(): string;
}
