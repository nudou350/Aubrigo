import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ManualPixGateway } from "./manual-pix.gateway";
import { User } from "../../users/entities/user.entity";

describe("ManualPixGateway", () => {
  let gateway: ManualPixGateway;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockOng: Partial<User> = {
    id: "ong-123",
    email: "ong@example.com.br",
    ongName: "Abrigo Animal Brasil",
    pixKey: "contato@abrigo.com.br",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualPixGateway,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ManualPixGateway>(ManualPixGateway);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Gateway Info", () => {
    it("should return correct gateway name", () => {
      expect(gateway.getName()).toBe("manual-pix");
    });

    it("should return supported payment methods", () => {
      expect(gateway.getSupportedMethods()).toEqual(["pix"]);
    });
  });

  describe("createPayment", () => {
    const paymentRequest = {
      amount: 100,
      currency: "BRL" as const,
      paymentMethod: "pix" as const,
      donationId: "donation_123",
      donorEmail: "donor@example.com",
      donorName: "João Silva",
      country: "BR" as const,
      metadata: {
        ongId: "ong-123",
      },
    };

    it("should create PIX payment with email key successfully", async () => {
      userRepository.findOne.mockResolvedValue(mockOng as User);

      const result = await gateway.createPayment(paymentRequest);

      expect(result).toMatchObject({
        success: true,
        status: "pending_confirmation",
        pixKey: "contato@abrigo.com.br",
        pixKeyType: "Email",
      });

      expect(result.paymentIntentId).toMatch(/^manual-pix-/);
      expect(result.instructions).toContain("contato@abrigo.com.br");
      // Check for the formatted amount (toLocaleString adds non-breaking space)
      expect(result.instructions).toMatch(/R\$\s*100,00/);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: "ong-123" },
      });
    });

    it("should detect CPF key type correctly", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: "12345678901",
      } as User);

      const result = await gateway.createPayment(paymentRequest);

      expect(result.pixKeyType).toBe("CPF");
      expect(result.pixKey).toBe("12345678901");
    });

    it("should detect CNPJ key type correctly", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: "12345678000190",
      } as User);

      const result = await gateway.createPayment(paymentRequest);

      expect(result.pixKeyType).toBe("CNPJ");
      expect(result.pixKey).toBe("12345678000190");
    });

    it("should detect Phone key type correctly", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: "+5511987654321",
      } as User);

      const result = await gateway.createPayment(paymentRequest);

      expect(result.pixKeyType).toBe("Phone");
      expect(result.pixKey).toBe("+5511987654321");
    });

    it("should detect Random key type for UUID keys", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        // Use a UUID that doesn't start with "55" to avoid phone detection
        pixKey: "a50e8400-e29b-41d4-a716-446655440000",
      } as User);

      const result = await gateway.createPayment(paymentRequest);

      expect(result.pixKeyType).toBe("Random");
      expect(result.pixKey).toBe("a50e8400-e29b-41d4-a716-446655440000");
    });

    it("should throw NotFoundException if ONG not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(gateway.createPayment(paymentRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(gateway.createPayment(paymentRequest)).rejects.toThrow(
        "ONG not found",
      );
    });

    it("should throw BadRequestException if PIX key not configured", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: null,
      } as User);

      await expect(gateway.createPayment(paymentRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(gateway.createPayment(paymentRequest)).rejects.toThrow(
        "Esta ONG ainda não configurou uma chave PIX",
      );
    });

    it("should generate proper payment instructions", async () => {
      userRepository.findOne.mockResolvedValue(mockOng as User);

      const result = await gateway.createPayment({
        ...paymentRequest,
        amount: 250.5,
      });

      expect(result.instructions).toContain(
        "1. Abra o aplicativo do seu banco",
      );
      expect(result.instructions).toContain("2. Acesse a opção PIX");
      expect(result.instructions).toContain('"Pix Copia e Cola"');
      expect(result.instructions).toContain("contato@abrigo.com.br");
      expect(result.instructions).toMatch(/R\$\s*250,50/);
      expect(result.instructions).toContain("7. Complete o pagamento");
    });

    it("should include payment confirmation information in instructions", async () => {
      userRepository.findOne.mockResolvedValue(mockOng as User);

      const result = await gateway.createPayment(paymentRequest);

      expect(result.instructions).toContain("IMPORTANTE:");
      expect(result.instructions).toContain("a ONG será notificada automaticamente");
      expect(result.instructions).toContain("comprovante de doação será enviado por e-mail");
    });
  });

  describe("getPaymentStatus", () => {
    it("should return pending_confirmation status for all payments", async () => {
      const result = await gateway.getPaymentStatus("manual-pix-123");

      expect(result).toMatchObject({
        paymentIntentId: "manual-pix-123",
        status: "pending_confirmation",
        currency: "BRL",
        paymentMethod: "pix",
      });
    });

    it("should work with any payment intent ID", async () => {
      const testIds = [
        "manual-pix-abc123",
        "manual-pix-xyz789",
        "manual-pix-test",
      ];

      for (const id of testIds) {
        const result = await gateway.getPaymentStatus(id);
        expect(result.paymentIntentId).toBe(id);
        expect(result.status).toBe("pending_confirmation");
      }
    });
  });

  describe("refundPayment", () => {
    it("should return error response for refund requests", async () => {
      const refundRequest = {
        paymentIntentId: "manual-pix-123",
        amount: 100,
        reason: "requested_by_customer" as const,
      };

      const result = await gateway.refundPayment(refundRequest);

      expect(result).toEqual({
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        error: "Reembolsos de pagamentos PIX manuais devem ser processados diretamente pela ONG",
      });
    });

    it("should indicate manual processing required", async () => {
      const refundRequest = {
        paymentIntentId: "manual-pix-456",
        reason: "duplicate" as const,
      };

      const result = await gateway.refundPayment(refundRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("devem ser processados diretamente pela ONG");
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should always return false (webhooks not supported)", () => {
      const result = gateway.verifyWebhookSignature({}, "signature");
      expect(result).toBe(false);
    });
  });

  describe("handleWebhook", () => {
    it("should throw error for webhook handling", async () => {
      await expect(gateway.handleWebhook({})).rejects.toThrow(
        BadRequestException,
      );
      await expect(gateway.handleWebhook({})).rejects.toThrow(
        "Manual PIX gateway does not support webhooks",
      );
    });
  });

  describe("PIX Key Detection Edge Cases", () => {
    it("should handle empty string PIX key", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: "",
      } as User);

      await expect(
        gateway.createPayment({
          amount: 100,
          currency: "BRL" as const,
          paymentMethod: "pix" as const,
          donationId: "donation_123",
          donorEmail: "donor@example.com",
          donorName: "Test",
          country: "BR" as const,
          metadata: { ongId: "ong-123" },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should handle whitespace-only PIX key", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: "   ",
      } as User);

      // Whitespace-only key should be treated as invalid
      await expect(
        gateway.createPayment({
          amount: 100,
          currency: "BRL" as const,
          paymentMethod: "pix" as const,
          donationId: "donation_123",
          donorEmail: "donor@example.com",
          donorName: "Test",
          country: "BR" as const,
          metadata: { ongId: "ong-123" },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should handle special characters in email PIX key", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockOng,
        pixKey: "test+donations@example.com.br",
      } as User);

      const result = await gateway.createPayment({
        amount: 100,
        currency: "BRL" as const,
        paymentMethod: "pix" as const,
        donationId: "donation_123",
        donorEmail: "donor@example.com",
        donorName: "Test",
        country: "BR" as const,
        metadata: { ongId: "ong-123" },
      });

      expect(result.pixKeyType).toBe("Email");
      expect(result.pixKey).toBe("test+donations@example.com.br");
    });
  });

  describe("Amount Formatting", () => {
    it("should format integer amounts correctly", async () => {
      userRepository.findOne.mockResolvedValue(mockOng as User);

      const result = await gateway.createPayment({
        amount: 100,
        currency: "BRL" as const,
        paymentMethod: "pix" as const,
        donationId: "donation_123",
        donorEmail: "donor@example.com",
        donorName: "Test",
        country: "BR" as const,
        metadata: { ongId: "ong-123" },
      });

      expect(result.instructions).toMatch(/R\$\s*100,00/);
    });

    it("should format decimal amounts correctly", async () => {
      userRepository.findOne.mockResolvedValue(mockOng as User);

      const result = await gateway.createPayment({
        amount: 99.99,
        currency: "BRL" as const,
        paymentMethod: "pix" as const,
        donationId: "donation_123",
        donorEmail: "donor@example.com",
        donorName: "Test",
        country: "BR" as const,
        metadata: { ongId: "ong-123" },
      });

      expect(result.instructions).toMatch(/R\$\s*99,99/);
    });

    it("should handle large amounts", async () => {
      userRepository.findOne.mockResolvedValue(mockOng as User);

      const result = await gateway.createPayment({
        amount: 10000.5,
        currency: "BRL" as const,
        paymentMethod: "pix" as const,
        donationId: "donation_123",
        donorEmail: "donor@example.com",
        donorName: "Test",
        country: "BR" as const,
        metadata: { ongId: "ong-123" },
      });

      expect(result.instructions).toMatch(/R\$\s*10\.000,50/);
    });
  });
});
