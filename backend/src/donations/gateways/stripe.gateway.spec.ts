import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { StripeGateway } from "./stripe.gateway";
import Stripe from "stripe";

describe("StripeGateway", () => {
  let gateway: StripeGateway;
  let stripeMock: any;

  const mockPaymentIntent = {
    id: "pi_test123",
    object: "payment_intent",
    amount: 5000,
    currency: "eur",
    status: "succeeded",
    client_secret: "pi_test123_secret_test",
    metadata: {
      donationId: "donation_123",
      donorEmail: "donor@example.com",
    },
  } as unknown as Stripe.PaymentIntent;

  beforeEach(async () => {
    stripeMock = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeGateway,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "STRIPE_SECRET_KEY") return "sk_test_123";
              if (key === "STRIPE_WEBHOOK_SECRET") return "whsec_test123";
              return null;
            }),
          },
        },
      ],
    }).compile();

    gateway = module.get<StripeGateway>(StripeGateway);
    (gateway as any).stripe = stripeMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Gateway Info", () => {
    it("should return correct gateway name", () => {
      expect(gateway.getName()).toBe("stripe");
    });

    it("should return supported payment methods", () => {
      expect(gateway.getSupportedMethods()).toEqual([
        "mbway",
        "multibanco",
        "card",
      ]);
    });
  });

  describe("MB WAY Payments", () => {
    const mbwayRequest = {
      amount: 50,
      currency: "EUR" as const,
      paymentMethod: "mbway" as const,
      donationId: "donation_123",
      donorEmail: "donor@example.com",
      donorName: "John Doe",
      country: "PT" as const,
      phoneNumber: "+351912345678",
      metadata: {},
    };

    it("should create MB WAY payment successfully", async () => {
      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await gateway.createPayment(mbwayRequest);

      expect(result).toEqual({
        success: true,
        paymentIntentId: "pi_test123",
        clientSecret: "pi_test123_secret_test",
        status: "succeeded",
        requiresAction: false,
      });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["card"], // MB WAY fallback
        confirm: false,
        metadata: expect.objectContaining({
          donationId: "donation_123",
          donorEmail: "donor@example.com",
          phoneNumber: "+351912345678",
          paymentMethod: "mbway",
        }),
      });
    });

    it("should require phone number for MB WAY", async () => {
      await expect(
        gateway.createPayment({
          ...mbwayRequest,
          phoneNumber: undefined,
        }),
      ).rejects.toThrow("Phone number is required for MB WAY payment");
    });

    it("should validate Portuguese phone number format", async () => {
      await expect(
        gateway.createPayment({
          ...mbwayRequest,
          phoneNumber: "123456789", // Invalid format
        }),
      ).rejects.toThrow("Invalid Portuguese phone number format");
    });

    it("should handle MB WAY payment errors gracefully", async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(
        new Error("Card declined"),
      );

      const result = await gateway.createPayment(mbwayRequest);

      expect(result).toEqual({
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: "Card declined",
      });
    });
  });

  describe("Multibanco Payments", () => {
    const multibancoRequest = {
      amount: 100,
      currency: "EUR" as const,
      paymentMethod: "multibanco" as const,
      donationId: "donation_456",
      donorEmail: "donor2@example.com",
      donorName: "Jane Smith",
      country: "PT" as const,
      metadata: {},
    };

    it("should create Multibanco payment successfully", async () => {
      const confirmedIntent = {
        ...mockPaymentIntent,
        status: "requires_action",
        next_action: {
          type: "multibanco_display_details",
          multibanco_display_details: {
            entity: "12345",
            reference: "123456789",
            expires_at: 1234567890,
          },
        },
      } as any;

      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      stripeMock.paymentIntents.confirm.mockResolvedValue(confirmedIntent);

      const result = await gateway.createPayment(multibancoRequest);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe("pi_test123");
      expect(result.multibancoEntity).toBe("12345");
      expect(result.multibancoReference).toBe("123456789");
      expect(result.expiresAt).toBeInstanceOf(Date);

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: "eur",
        payment_method_types: ["multibanco"],
        metadata: expect.objectContaining({
          donationId: "donation_456",
        }),
      });

      expect(stripeMock.paymentIntents.confirm).toHaveBeenCalledWith(
        "pi_test123",
      );
    });

    it("should handle Multibanco payment errors", async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(
        new Error("Payment failed"),
      );

      const result = await gateway.createPayment(multibancoRequest);

      expect(result).toEqual({
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: "Payment failed",
      });
    });
  });

  describe("Card Payments", () => {
    const cardRequest = {
      amount: 75,
      currency: "EUR" as const,
      paymentMethod: "card" as const,
      donationId: "donation_789",
      donorEmail: "donor3@example.com",
      donorName: "Bob Johnson",
      country: "PT" as const,
      metadata: {},
    };

    it("should create card payment successfully", async () => {
      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await gateway.createPayment(cardRequest);

      expect(result).toEqual({
        success: true,
        paymentIntentId: "pi_test123",
        clientSecret: "pi_test123_secret_test",
        status: "succeeded",
      });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 7500,
        currency: "eur",
        payment_method_types: ["card"],
        metadata: expect.objectContaining({
          donationId: "donation_789",
          donorEmail: "donor3@example.com",
          country: "PT",
        }),
      });
    });

    it("should handle card payment errors", async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(
        new Error("Insufficient funds"),
      );

      const result = await gateway.createPayment(cardRequest);

      expect(result).toEqual({
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: "Insufficient funds",
      });
    });
  });

  describe("Payment Status", () => {
    it("should retrieve payment status successfully", async () => {
      stripeMock.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        payment_method_types: ["card"],
      } as any);

      const result = await gateway.getPaymentStatus("pi_test123");

      expect(result).toEqual({
        paymentIntentId: "pi_test123",
        status: "succeeded",
        amount: 50,
        currency: "EUR",
        paymentMethod: "card",
      });

      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith(
        "pi_test123",
      );
    });

    it("should throw error if payment not found", async () => {
      stripeMock.paymentIntents.retrieve.mockRejectedValue(
        new Error("Payment intent not found"),
      );

      await expect(gateway.getPaymentStatus("invalid_id")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("Refunds", () => {
    const refundRequest = {
      paymentIntentId: "pi_test123",
      amount: 50,
      reason: "requested_by_customer" as const,
    };

    it("should process refund successfully", async () => {
      const mockRefund = {
        id: "re_test123",
        amount: 5000,
        status: "succeeded",
      } as unknown as Stripe.Refund;

      stripeMock.refunds.create.mockResolvedValue(mockRefund);

      const result = await gateway.refundPayment(refundRequest);

      expect(result).toEqual({
        success: true,
        refundId: "re_test123",
        amount: 50,
        status: "succeeded",
      });

      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: "pi_test123",
        amount: 5000,
        reason: "requested_by_customer",
      });
    });

    it("should handle partial refunds", async () => {
      const mockRefund = {
        id: "re_test456",
        amount: 2500,
        status: "succeeded",
      } as unknown as Stripe.Refund;

      stripeMock.refunds.create.mockResolvedValue(mockRefund);

      const result = await gateway.refundPayment({
        ...refundRequest,
        amount: 25,
      });

      expect(result.amount).toBe(25);
      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: "pi_test123",
        amount: 2500,
        reason: "requested_by_customer",
      });
    });

    it("should handle full refunds without amount", async () => {
      const mockRefund = {
        id: "re_test789",
        amount: 5000,
        status: "succeeded",
      } as unknown as Stripe.Refund;

      stripeMock.refunds.create.mockResolvedValue(mockRefund);

      await gateway.refundPayment({
        paymentIntentId: "pi_test123",
        reason: "duplicate" as const,
      });

      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: "pi_test123",
        amount: undefined,
        reason: "duplicate",
      });
    });

    it("should handle refund errors", async () => {
      stripeMock.refunds.create.mockRejectedValue(
        new Error("Refund already processed"),
      );

      const result = await gateway.refundPayment(refundRequest);

      expect(result).toEqual({
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        error: "Refund already processed",
      });
    });
  });

  describe("Webhook Handling", () => {
    const mockWebhookPayload = {
      type: "payment_intent.succeeded",
      data: {
        object: mockPaymentIntent,
      },
    };

    it("should verify webhook signature successfully", () => {
      stripeMock.webhooks.constructEvent.mockReturnValue(
        mockWebhookPayload as any,
      );

      const result = gateway.verifyWebhookSignature(
        mockWebhookPayload,
        "valid_signature",
      );

      expect(result).toBe(true);
      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalled();
    });

    it("should reject invalid webhook signature", () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const result = gateway.verifyWebhookSignature(
        mockWebhookPayload,
        "invalid_signature",
      );

      expect(result).toBe(false);
    });

    it("should return false if webhook secret not configured", () => {
      const gatewayNoSecret = new StripeGateway({
        get: jest.fn(() => null),
      } as any);

      const result = gatewayNoSecret.verifyWebhookSignature(
        mockWebhookPayload,
        "signature",
      );

      expect(result).toBe(false);
    });

    it("should handle webhook payload correctly", async () => {
      const result = await gateway.handleWebhook(mockWebhookPayload);

      expect(result).toEqual({
        event: "payment_intent.succeeded",
        paymentIntentId: "pi_test123",
        status: "succeeded",
        metadata: expect.objectContaining({
          donationId: "donation_123",
        }),
      });
    });
  });

  describe("Status Mapping", () => {
    it("should map Stripe statuses correctly", async () => {
      const testCases = [
        { stripeStatus: "requires_payment_method", expected: "pending" },
        { stripeStatus: "requires_confirmation", expected: "pending" },
        { stripeStatus: "requires_action", expected: "requires_action" },
        { stripeStatus: "processing", expected: "processing" },
        { stripeStatus: "requires_capture", expected: "processing" },
        { stripeStatus: "canceled", expected: "canceled" },
        { stripeStatus: "succeeded", expected: "succeeded" },
        { stripeStatus: "unknown_status", expected: "failed" },
      ];

      for (const testCase of testCases) {
        stripeMock.paymentIntents.retrieve.mockResolvedValue({
          ...mockPaymentIntent,
          status: testCase.stripeStatus as any,
        } as any);

        const result = await gateway.getPaymentStatus("pi_test");
        expect(result.status).toBe(testCase.expected);
      }
    });
  });

  describe("Unsupported Payment Method", () => {
    it("should reject unsupported payment method", async () => {
      const invalidRequest = {
        amount: 50,
        currency: "EUR" as const,
        paymentMethod: "paypal" as any,
        donationId: "donation_999",
        donorEmail: "donor@example.com",
        donorName: "Test User",
        country: "PT" as const,
        metadata: {},
      };

      await expect(gateway.createPayment(invalidRequest)).rejects.toThrow(
        "Payment method paypal not supported by Stripe gateway",
      );
    });
  });
});
