import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import {
  StripeConnectService,
  CreateExpressAccountDto,
} from "./stripe-connect.service";
import Stripe from "stripe";

describe("StripeConnectService", () => {
  let service: StripeConnectService;
  let configService: ConfigService;
  let stripeMock: any;

  // Mock Stripe SDK using type assertions for partial objects
  const mockStripeAccount = {
    id: "acct_test123",
    object: "account",
    business_type: "non_profit",
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    requirements: {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
      disabled_reason: null,
      current_deadline: null,
      errors: [],
      alternatives: [],
    },
    type: "express",
    country: "PT",
  } as unknown as Stripe.Account;

  const mockAccountLink = {
    object: "account_link",
    created: Date.now(),
    expires_at: Date.now() + 3600,
    url: "https://connect.stripe.com/setup/test",
  } as unknown as Stripe.AccountLink;

  const mockLoginLink = {
    object: "login_link",
    created: Date.now(),
    url: "https://connect.stripe.com/express/dashboard",
  } as unknown as Stripe.LoginLink;

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
      platformFee: "0",
    },
  } as unknown as Stripe.PaymentIntent;

  beforeEach(async () => {
    // Create mock Stripe instance with properly typed jest mocked functions
    stripeMock = {
      accounts: {
        create: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
        createExternalAccount: jest.fn(),
        createLoginLink: jest.fn(),
        del: jest.fn(),
      },
      accountLinks: {
        create: jest.fn(),
      },
      paymentIntents: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeConnectService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "STRIPE_SECRET_KEY") return "sk_test_123";
              if (key === "STRIPE_CONNECT_WEBHOOK_SECRET")
                return "whsec_test123";
              if (key === "FRONTEND_URL") return "http://localhost:4200";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StripeConnectService>(StripeConnectService);
    configService = module.get<ConfigService>(ConfigService);

    // Inject mock Stripe instance
    (service as any).stripe = stripeMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Service Initialization", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });

    it("should initialize Stripe with API key from config", () => {
      expect(configService.get).toHaveBeenCalledWith("STRIPE_SECRET_KEY");
    });

    it("should handle missing API key gracefully", () => {
      const configServiceNoKey = {
        get: jest.fn(() => null),
      };

      expect(() => {
        new StripeConnectService(configServiceNoKey as any);
      }).not.toThrow();
    });
  });

  describe("createExpressAccount", () => {
    const createAccountDto: CreateExpressAccountDto = {
      email: "ong@example.com",
      ongName: "Test Animal Shelter",
      taxId: "123456789",
      country: "PT",
      iban: "PT50000000000000000000000",
    };

    it("should create Express Account successfully for Portugal", async () => {
      stripeMock.accounts.create.mockResolvedValue(mockStripeAccount);
      stripeMock.accounts.update.mockResolvedValue(mockStripeAccount);
      stripeMock.accounts.retrieve.mockResolvedValue({
        ...mockStripeAccount,
        charges_enabled: true,
        requirements: { currently_due: [] },
      } as Stripe.Account);
      stripeMock.accounts.createExternalAccount.mockResolvedValue({} as any);

      const result = await service.createExpressAccount(createAccountDto);

      expect(result).toEqual({
        accountId: "acct_test123",
        onboardingUrl: undefined,
        requiresOnboarding: false,
      });

      expect(stripeMock.accounts.create).toHaveBeenCalledWith({
        type: "express",
        country: "PT",
        email: "ong@example.com",
        business_type: "non_profit",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: "Test Animal Shelter",
          product_description: "Animal shelter accepting donations",
          support_email: "ong@example.com",
        },
        metadata: expect.objectContaining({
          platform: "aubrigo",
          ongName: "Test Animal Shelter",
        }),
      });

      expect(stripeMock.accounts.update).toHaveBeenCalledWith("acct_test123", {
        company: {
          tax_id: "123456789",
          name: "Test Animal Shelter",
        },
      });

      expect(stripeMock.accounts.createExternalAccount).toHaveBeenCalledWith(
        "acct_test123",
        {
          external_account: {
            object: "bank_account",
            country: "PT",
            currency: "eur",
            account_holder_name: "Test Animal Shelter",
            account_holder_type: "company",
            account_number: "PT50000000000000000000000",
          },
        },
      );
    });

    it("should create Express Account for Brazil with routing/account number", async () => {
      const brazilDto: CreateExpressAccountDto = {
        email: "ong@example.com.br",
        ongName: "Abrigo Animal Brasil",
        taxId: "12345678000190",
        country: "BR",
        routingNumber: "001",
        accountNumber: "12345678",
        accountType: "checking",
      };

      stripeMock.accounts.create.mockResolvedValue({
        ...mockStripeAccount,
        country: "BR",
      } as Stripe.Account);
      stripeMock.accounts.update.mockResolvedValue(mockStripeAccount);
      stripeMock.accounts.retrieve.mockResolvedValue({
        ...mockStripeAccount,
        charges_enabled: true,
        requirements: { currently_due: [] },
      } as Stripe.Account);
      stripeMock.accounts.createExternalAccount.mockResolvedValue({} as any);

      const result = await service.createExpressAccount(brazilDto);

      expect(result.accountId).toBe("acct_test123");
      expect(stripeMock.accounts.createExternalAccount).toHaveBeenCalledWith(
        "acct_test123",
        {
          external_account: {
            object: "bank_account",
            country: "BR",
            currency: "brl",
            account_holder_name: "Abrigo Animal Brasil",
            account_holder_type: "company",
            routing_number: "001",
            account_number: "12345678",
          },
        },
      );
    });

    it("should return onboarding URL when account requires onboarding", async () => {
      stripeMock.accounts.create.mockResolvedValue(mockStripeAccount);
      stripeMock.accounts.update.mockResolvedValue(mockStripeAccount);
      stripeMock.accounts.retrieve.mockResolvedValue({
        ...mockStripeAccount,
        charges_enabled: false,
        requirements: {
          currently_due: ["external_account", "tos_acceptance"],
        },
      } as any);
      stripeMock.accountLinks.create.mockResolvedValue(mockAccountLink);
      stripeMock.accounts.createExternalAccount.mockResolvedValue({} as any);

      const result = await service.createExpressAccount(createAccountDto);

      expect(result).toEqual({
        accountId: "acct_test123",
        onboardingUrl: "https://connect.stripe.com/setup/test",
        requiresOnboarding: true,
      });

      expect(stripeMock.accountLinks.create).toHaveBeenCalled();
    });

    it("should throw error if Stripe is not configured", async () => {
      (service as any).stripe = null;

      await expect(
        service.createExpressAccount(createAccountDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should handle Stripe API errors gracefully", async () => {
      stripeMock.accounts.create.mockRejectedValue(
        new Error("Stripe API error: Invalid country"),
      );

      await expect(
        service.createExpressAccount(createAccountDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("createAccountLink", () => {
    it("should create account link successfully", async () => {
      stripeMock.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await service.createAccountLink("acct_test123");

      expect(result).toEqual(mockAccountLink);
      expect(stripeMock.accountLinks.create).toHaveBeenCalledWith({
        account: "acct_test123",
        refresh_url: "http://localhost:4200/ong/onboarding/refresh",
        return_url: "http://localhost:4200/ong/dashboard?stripe_setup=complete",
        type: "account_onboarding",
      });
    });

    it("should handle errors when creating account link", async () => {
      stripeMock.accountLinks.create.mockRejectedValue(
        new Error("Invalid account"),
      );

      await expect(
        service.createAccountLink("invalid_account"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getAccountStatus", () => {
    it("should return account status successfully", async () => {
      stripeMock.accounts.retrieve.mockResolvedValue({
        ...mockStripeAccount,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: ["external_account"],
        },
      } as any);

      const result = await service.getAccountStatus("acct_test123");

      expect(result).toEqual({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirements: ["external_account"],
      });
    });

    it("should throw error if account not found", async () => {
      stripeMock.accounts.retrieve.mockRejectedValue(
        new Error("No such account"),
      );

      await expect(service.getAccountStatus("invalid_account")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("createConnectedPayment", () => {
    const paymentParams = {
      amount: 50,
      currency: "EUR",
      connectedAccountId: "acct_test123",
      donationId: "donation_123",
      donorEmail: "donor@example.com",
      paymentMethod: "card",
    };

    it("should create payment with 0% platform fee", async () => {
      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createConnectedPayment(paymentParams);

      expect(result).toEqual(mockPaymentIntent);
      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
        {
          amount: 5000, // 50 EUR in cents
          currency: "eur",
          payment_method_types: ["card"],
          metadata: {
            donationId: "donation_123",
            donorEmail: "donor@example.com",
            platformFee: "0",
            phoneNumber: "",
          },
        },
        {
          stripeAccount: "acct_test123",
        },
      );

      // Verify no application_fee_amount was set
      expect(stripeMock.paymentIntents.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          application_fee_amount: expect.anything(),
        }),
        expect.anything(),
      );
    });

    it("should include phone number in metadata when provided", async () => {
      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createConnectedPayment({
        ...paymentParams,
        phoneNumber: "+351912345678",
      });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            phoneNumber: "+351912345678",
          }),
        }),
        expect.anything(),
      );
    });

    it("should handle payment creation errors", async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(
        new Error("Payment failed"),
      );

      await expect(
        service.createConnectedPayment(paymentParams),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getExpressDashboardLink", () => {
    it("should create dashboard login link successfully", async () => {
      stripeMock.accounts.createLoginLink.mockResolvedValue(mockLoginLink);

      const result = await service.getExpressDashboardLink("acct_test123");

      expect(result).toEqual({
        url: "https://connect.stripe.com/express/dashboard",
      });
      expect(stripeMock.accounts.createLoginLink).toHaveBeenCalledWith(
        "acct_test123",
      );
    });

    it("should handle errors when creating dashboard link", async () => {
      stripeMock.accounts.createLoginLink.mockRejectedValue(
        new Error("Invalid account"),
      );

      await expect(
        service.getExpressDashboardLink("invalid_account"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteAccount", () => {
    it("should delete account successfully", async () => {
      stripeMock.accounts.del.mockResolvedValue({
        id: "acct_test123",
        deleted: true,
      } as any);

      await service.deleteAccount("acct_test123");

      expect(stripeMock.accounts.del).toHaveBeenCalledWith("acct_test123");
    });

    it("should handle deletion errors", async () => {
      stripeMock.accounts.del.mockRejectedValue(new Error("Cannot delete"));

      await expect(service.deleteAccount("acct_test123")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("Webhook Handling", () => {
    const mockWebhookPayload = {
      type: "account.updated",
      data: {
        object: {
          id: "acct_test123",
          charges_enabled: true,
          payouts_enabled: true,
        },
      },
    };

    describe("verifyWebhookSignature", () => {
      it("should verify valid webhook signature", () => {
        stripeMock.webhooks.constructEvent.mockReturnValue({} as any);

        const result = service.verifyWebhookSignature(
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

        const result = service.verifyWebhookSignature(
          mockWebhookPayload,
          "invalid_signature",
        );

        expect(result).toBe(false);
      });

      it("should return false if webhook secret not configured", () => {
        const serviceNoSecret = new StripeConnectService({
          get: jest.fn(() => null),
        } as any);
        (serviceNoSecret as any).stripe = stripeMock;

        const result = serviceNoSecret.verifyWebhookSignature(
          mockWebhookPayload,
          "signature",
        );

        expect(result).toBe(false);
      });
    });

    describe("handleWebhook", () => {
      it("should handle account.updated event", async () => {
        const result = await service.handleWebhook(mockWebhookPayload);

        expect(result).toEqual({
          event: "account.updated",
          processed: true,
          message: "Account acct_test123 updated successfully",
        });
      });

      it("should handle capability.updated event", async () => {
        const payload = {
          type: "capability.updated",
          data: {
            object: {
              account: "acct_test123",
              id: "card_payments",
              status: "active",
            },
          },
        };

        const result = await service.handleWebhook(payload);

        expect(result).toEqual({
          event: "capability.updated",
          processed: true,
          message: "Capability card_payments updated to active",
        });
      });

      it("should handle charge.succeeded event", async () => {
        const payload = {
          type: "charge.succeeded",
          data: {
            object: {
              id: "ch_test123",
              amount: 5000,
              currency: "eur",
              metadata: { donationId: "donation_123" },
            },
          },
        };

        const result = await service.handleWebhook(payload);

        expect(result).toEqual({
          event: "charge.succeeded",
          processed: true,
          message: "Charge ch_test123 succeeded",
        });
      });

      it("should handle charge.failed event", async () => {
        const payload = {
          type: "charge.failed",
          data: {
            object: {
              id: "ch_test456",
              failure_message: "Card declined",
            },
          },
        };

        const result = await service.handleWebhook(payload);

        expect(result).toEqual({
          event: "charge.failed",
          processed: true,
          message: "Charge ch_test456 failed: Card declined",
        });
      });

      it("should handle payout.paid event", async () => {
        const payload = {
          type: "payout.paid",
          data: {
            object: {
              id: "po_test123",
              amount: 10000,
              currency: "eur",
              destination: "ba_test123",
            },
          },
        };

        const result = await service.handleWebhook(payload);

        expect(result).toEqual({
          event: "payout.paid",
          processed: true,
          message: "Payout po_test123 paid successfully",
        });
      });

      it("should handle payout.failed event", async () => {
        const payload = {
          type: "payout.failed",
          data: {
            object: {
              id: "po_test456",
              failure_message: "Insufficient funds",
            },
          },
        };

        const result = await service.handleWebhook(payload);

        expect(result).toEqual({
          event: "payout.failed",
          processed: true,
          message: "Payout po_test456 failed: Insufficient funds",
        });
      });

      it("should handle unknown event types", async () => {
        const payload = {
          type: "unknown.event",
          data: { object: {} },
        };

        const result = await service.handleWebhook(payload);

        expect(result).toEqual({
          event: "unknown.event",
          processed: false,
          message: "Event type unknown.event not handled",
        });
      });
    });
  });
});
