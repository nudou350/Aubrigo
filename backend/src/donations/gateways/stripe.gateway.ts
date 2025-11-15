import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
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

@Injectable()
export class StripeGateway implements IPaymentGateway {
  private readonly logger = new Logger(StripeGateway.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    if (!apiKey) {
      this.logger.warn("Stripe API key not configured");
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: "2023-10-16",
      });
      this.logger.log("Stripe gateway initialized");
    }
  }

  getName(): string {
    return "stripe";
  }

  getSupportedMethods(): PaymentMethodType[] {
    // Note: MB WAY is not supported by Stripe API
    // Use IFTHENPAY or EUPAGO gateway for MB WAY payments
    return ["multibanco", "card"];
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const amountInCents = Math.round(request.amount * 100);

      switch (request.paymentMethod) {
        case "mbway":
          throw new BadRequestException(
            "MB WAY is not supported by Stripe. Please use IFTHENPAY or EUPAGO gateway for MB WAY payments.",
          );
        case "multibanco":
          return await this.createMultibancoPayment(request, amountInCents);
        case "card":
          return await this.createCardPayment(request, amountInCents);
        default:
          throw new BadRequestException(
            `Payment method ${request.paymentMethod} not supported by Stripe gateway`,
          );
      }
    } catch (error) {
      this.logger.error("Error creating payment", error);
      throw error;
    }
  }

  private async createMBWayPayment(
    request: PaymentRequest,
    amountInCents: number,
  ): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      throw new BadRequestException(
        "Phone number is required for MB WAY payment",
      );
    }

    // Validate Portuguese phone number format
    const phoneRegex = /^\+351\d{9}$/;
    if (!phoneRegex.test(request.phoneNumber)) {
      throw new BadRequestException(
        "Invalid Portuguese phone number format. Use +351XXXXXXXXX",
      );
    }

    try {
      // Create Payment Intent with MB WAY
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        payment_method_types: ["card"], // Using card as fallback - MB WAY requires newer Stripe API
        confirm: false,
        metadata: {
          donationId: request.donationId,
          donorEmail: request.donorEmail,
          donorName: request.donorName,
          country: request.country,
          phoneNumber: request.phoneNumber,
          paymentMethod: "mbway",
        },
      });

      this.logger.log(
        `MB WAY payment created: ${paymentIntent.id} for ${request.donorEmail}`,
      );

      return {
        success: paymentIntent.status === "succeeded",
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this.mapStripeStatus(paymentIntent.status),
        requiresAction: paymentIntent.status === "requires_action",
      };
    } catch (error) {
      this.logger.error("MB WAY payment creation failed", error);
      return {
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  private async createMultibancoPayment(
    request: PaymentRequest,
    amountInCents: number,
  ): Promise<PaymentResponse> {
    try {
      // Create Payment Intent with Multibanco
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        payment_method_types: ["multibanco"],
        metadata: {
          donationId: request.donationId,
          donorEmail: request.donorEmail,
          donorName: request.donorName,
          country: request.country,
        },
      });

      // Confirm the payment intent to generate Multibanco reference
      const confirmedIntent = await this.stripe.paymentIntents.confirm(
        paymentIntent.id,
      );

      // Extract Multibanco reference from next_action
      // Note: multibanco_display_details requires newer Stripe API version
      const multibancoData = (confirmedIntent.next_action as any)
        ?.multibanco_display_details;

      this.logger.log(
        `Multibanco payment created: ${paymentIntent.id} for ${request.donorEmail}`,
      );

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this.mapStripeStatus(paymentIntent.status),
        multibancoEntity: multibancoData?.entity,
        multibancoReference: multibancoData?.reference,
        expiresAt: multibancoData?.expires_at
          ? new Date(multibancoData.expires_at * 1000)
          : undefined,
      };
    } catch (error) {
      this.logger.error("Multibanco payment creation failed", error);
      return {
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  private async createCardPayment(
    request: PaymentRequest,
    amountInCents: number,
  ): Promise<PaymentResponse> {
    try {
      // Create Payment Intent for card payment
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        payment_method_types: ["card"],
        metadata: {
          donationId: request.donationId,
          donorEmail: request.donorEmail,
          donorName: request.donorName,
          country: request.country,
        },
      });

      this.logger.log(
        `Card payment created: ${paymentIntent.id} for ${request.donorEmail}`,
      );

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this.mapStripeStatus(paymentIntent.status),
      };
    } catch (error) {
      this.logger.error("Card payment creation failed", error);
      return {
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getPaymentStatus(
    paymentIntentId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        paymentIntentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: paymentIntent.payment_method_types?.[0] || "unknown",
      };
    } catch (error) {
      this.logger.error("Error retrieving payment status", error);
      throw new BadRequestException("Payment not found");
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: request.paymentIntentId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason as Stripe.RefundCreateParams.Reason,
      });

      this.logger.log(
        `Refund created: ${refund.id} for ${request.paymentIntentId}`,
      );

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      this.logger.error("Refund creation failed", error);
      return {
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        error: error.message,
      };
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>(
        "STRIPE_WEBHOOK_SECRET",
      );
      if (!webhookSecret) {
        this.logger.error("Stripe webhook secret not configured");
        return false;
      }

      this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;
    } catch (error) {
      this.logger.error("Webhook signature verification failed", error);
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<{
    event: string;
    paymentIntentId: string;
    status: PaymentStatus;
    metadata?: Record<string, any>;
  }> {
    const event = payload.type;
    const paymentIntent = payload.data.object as Stripe.PaymentIntent;

    this.logger.log(
      `Webhook received: ${event} for payment ${paymentIntent.id}`,
    );

    return {
      event,
      paymentIntentId: paymentIntent.id,
      status: this.mapStripeStatus(paymentIntent.status),
      metadata: paymentIntent.metadata,
    };
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: "pending",
      requires_confirmation: "pending",
      requires_action: "requires_action",
      processing: "processing",
      requires_capture: "processing",
      canceled: "canceled",
      succeeded: "succeeded",
    };

    return statusMap[stripeStatus] || "failed";
  }
}
