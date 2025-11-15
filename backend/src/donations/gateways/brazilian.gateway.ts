import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  RefundRequest,
  RefundResponse,
  PaymentMethodType,
  PaymentStatus,
} from "./payment-gateway.interface";

/**
 * Brazilian Payment Gateway
 * Supports EBANX, PagSeguro, or Stripe PIX (configurable)
 *
 * Configuration via env vars:
 * - BRAZIL_GATEWAY_PROVIDER: 'ebanx' | 'pagseguro' | 'stripe'
 * - BRAZIL_GATEWAY_API_KEY: API key for the selected provider
 * - BRAZIL_GATEWAY_API_URL: Base URL for the provider API
 */
@Injectable()
export class BrazilianGateway implements IPaymentGateway {
  private readonly logger = new Logger(BrazilianGateway.name);
  private readonly provider: string;
  private readonly apiClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>(
      "BRAZIL_GATEWAY_PROVIDER",
      "ebanx",
    );
    const apiKey = this.configService.get<string>("BRAZIL_GATEWAY_API_KEY");
    const apiUrl = this.configService.get<string>("BRAZIL_GATEWAY_API_URL");

    if (!apiKey || !apiUrl) {
      this.logger.warn(
        `Brazilian gateway (${this.provider}) not fully configured`,
      );
    }

    this.apiClient = axios.create({
      baseURL: apiUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000,
    });

    this.logger.log(
      `Brazilian gateway initialized with provider: ${this.provider}`,
    );
  }

  getName(): string {
    return "brazil";
  }

  getSupportedMethods(): PaymentMethodType[] {
    return ["pix", "boleto", "card"];
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      switch (request.paymentMethod) {
        case "pix":
          return await this.createPixPayment(request);
        case "boleto":
          return await this.createBoletoPayment(request);
        case "card":
          return await this.createCardPayment(request);
        default:
          throw new BadRequestException(
            `Payment method ${request.paymentMethod} not supported by Brazilian gateway`,
          );
      }
    } catch (error) {
      this.logger.error("Error creating Brazilian payment", error);
      throw error;
    }
  }

  private async createPixPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      const amountInCents = Math.round(request.amount * 100);

      // EBANX PIX implementation example
      if (this.provider === "ebanx") {
        const response = await this.apiClient.post("/ws/direct", {
          integration_key: this.configService.get("BRAZIL_GATEWAY_API_KEY"),
          operation: "request",
          mode: "full",
          payment: {
            amount_total: request.amount,
            currency_code: "BRL",
            order_number: request.donationId,
            merchant_payment_code: request.donationId,
            name: request.donorName,
            email: request.donorEmail,
            payment_type_code: "pix",
          },
        });

        const paymentData = response.data.payment;

        this.logger.log(
          `PIX payment created: ${paymentData.hash} for ${request.donorEmail}`,
        );

        return {
          success: true,
          paymentIntentId: paymentData.hash,
          status: "pending",
          pixQrCode: paymentData.pix_qr_code,
          pixQrCodeUrl: paymentData.pix_qr_code_url,
          pixPaymentString: paymentData.pix_emv,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
      }

      // PagSeguro PIX implementation
      if (this.provider === "pagseguro") {
        const response = await this.apiClient.post("/charges", {
          reference_id: request.donationId,
          customer: {
            name: request.donorName,
            email: request.donorEmail,
          },
          items: [
            {
              reference_id: request.donationId,
              name: "Doação Aubrigo",
              quantity: 1,
              unit_amount: amountInCents,
            },
          ],
          qr_codes: [
            {
              amount: {
                value: amountInCents,
              },
              expiration_date: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
          ],
        });

        const qrCode = response.data.qr_codes[0];

        this.logger.log(
          `PIX payment created: ${response.data.id} for ${request.donorEmail}`,
        );

        return {
          success: true,
          paymentIntentId: response.data.id,
          status: "pending",
          pixQrCode: qrCode.text,
          pixQrCodeUrl: qrCode.links?.[0]?.href,
          pixPaymentString: qrCode.text,
          expiresAt: new Date(qrCode.expiration_date),
        };
      }

      throw new BadRequestException(
        `PIX not configured for provider: ${this.provider}`,
      );
    } catch (error) {
      this.logger.error("PIX payment creation failed", error);
      return {
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private async createBoletoPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      const amountInCents = Math.round(request.amount * 100);

      // EBANX Boleto implementation
      if (this.provider === "ebanx") {
        const response = await this.apiClient.post("/ws/direct", {
          integration_key: this.configService.get("BRAZIL_GATEWAY_API_KEY"),
          operation: "request",
          mode: "full",
          payment: {
            amount_total: request.amount,
            currency_code: "BRL",
            order_number: request.donationId,
            merchant_payment_code: request.donationId,
            name: request.donorName,
            email: request.donorEmail,
            payment_type_code: "boleto",
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0], // 3 days
          },
        });

        const paymentData = response.data.payment;

        this.logger.log(
          `Boleto payment created: ${paymentData.hash} for ${request.donorEmail}`,
        );

        return {
          success: true,
          paymentIntentId: paymentData.hash,
          status: "pending",
          boletoUrl: paymentData.boleto_url,
          boletoBarcode: paymentData.boleto_barcode,
          expiresAt: new Date(paymentData.due_date),
        };
      }

      // PagSeguro Boleto implementation
      if (this.provider === "pagseguro") {
        const response = await this.apiClient.post("/charges", {
          reference_id: request.donationId,
          customer: {
            name: request.donorName,
            email: request.donorEmail,
          },
          items: [
            {
              reference_id: request.donationId,
              name: "Doação Aubrigo",
              quantity: 1,
              unit_amount: amountInCents,
            },
          ],
          payment_method: {
            type: "BOLETO",
            boleto: {
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            },
          },
        });

        this.logger.log(
          `Boleto payment created: ${response.data.id} for ${request.donorEmail}`,
        );

        return {
          success: true,
          paymentIntentId: response.data.id,
          status: "pending",
          boletoUrl: response.data.payment_method.boleto.formatted_barcode_url,
          boletoBarcode: response.data.payment_method.boleto.barcode,
          expiresAt: new Date(response.data.payment_method.boleto.due_date),
        };
      }

      throw new BadRequestException(
        `Boleto not configured for provider: ${this.provider}`,
      );
    } catch (error) {
      this.logger.error("Boleto payment creation failed", error);
      return {
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private async createCardPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    // Card payments through Brazilian gateway
    // Implementation would be similar to PIX/Boleto but for cards
    throw new BadRequestException(
      "Card payments through Brazilian gateway not yet implemented. Use Stripe for cards.",
    );
  }

  async getPaymentStatus(
    paymentIntentId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      if (this.provider === "ebanx") {
        const response = await this.apiClient.get(`/ws/query`, {
          params: {
            integration_key: this.configService.get("BRAZIL_GATEWAY_API_KEY"),
            hash: paymentIntentId,
          },
        });

        const payment = response.data.payment;

        return {
          paymentIntentId: payment.hash,
          status: this.mapProviderStatus(payment.status),
          amount: parseFloat(payment.amount_total),
          currency: payment.currency_code,
          paymentMethod: payment.payment_type_code,
        };
      }

      if (this.provider === "pagseguro") {
        const response = await this.apiClient.get(
          `/charges/${paymentIntentId}`,
        );

        return {
          paymentIntentId: response.data.id,
          status: this.mapProviderStatus(response.data.status),
          amount: response.data.amount.value / 100,
          currency: "BRL",
          paymentMethod:
            response.data.payment_method?.type?.toLowerCase() || "unknown",
        };
      }

      throw new BadRequestException("Payment status check not configured");
    } catch (error) {
      this.logger.error("Error retrieving payment status", error);
      throw new BadRequestException("Payment not found");
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (this.provider === "ebanx") {
        const response = await this.apiClient.post("/ws/refund", {
          integration_key: this.configService.get("BRAZIL_GATEWAY_API_KEY"),
          hash: request.paymentIntentId,
          amount: request.amount,
        });

        this.logger.log(`Refund created for ${request.paymentIntentId}`);

        return {
          success: response.data.status === "SUCCESS",
          refundId: response.data.refund.id,
          amount: parseFloat(response.data.refund.amount),
          status: response.data.refund.status,
        };
      }

      throw new BadRequestException("Refund not configured for this provider");
    } catch (error) {
      this.logger.error("Refund creation failed", error);
      return {
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        error: error.response?.data?.message || error.message,
      };
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implement webhook signature verification based on provider
    // Each provider has different signature mechanisms
    this.logger.warn("Webhook signature verification not yet implemented");
    return true; // TODO: Implement proper verification
  }

  async handleWebhook(payload: any): Promise<{
    event: string;
    paymentIntentId: string;
    status: PaymentStatus;
    metadata?: Record<string, any>;
  }> {
    // Handle webhooks from EBANX or PagSeguro
    if (this.provider === "ebanx") {
      return {
        event: payload.notification_type,
        paymentIntentId: payload.hash,
        status: this.mapProviderStatus(payload.status),
        metadata: {
          orderNumber: payload.merchant_payment_code,
        },
      };
    }

    if (this.provider === "pagseguro") {
      return {
        event: payload.type,
        paymentIntentId: payload.data.id,
        status: this.mapProviderStatus(payload.data.status),
        metadata: {
          referenceId: payload.data.reference_id,
        },
      };
    }

    throw new BadRequestException("Webhook handling not configured");
  }

  private mapProviderStatus(providerStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      // EBANX statuses
      PE: "pending",
      OP: "processing",
      CO: "succeeded",
      CA: "canceled",

      // PagSeguro statuses
      WAITING: "pending",
      IN_ANALYSIS: "processing",
      PAID: "succeeded",
      DECLINED: "failed",
      CANCELED: "canceled",

      // Common statuses
      pending: "pending",
      processing: "processing",
      paid: "succeeded",
      completed: "succeeded",
      failed: "failed",
      canceled: "canceled",
      expired: "expired",
    };

    return statusMap[providerStatus] || "failed";
  }
}
