import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../users/entities/user.entity";
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
 * Manual PIX Gateway
 * Returns the ONG's PIX key for manual payment by donor
 * Does NOT process payment automatically - ONG receives payment directly via PIX
 */
@Injectable()
export class ManualPixGateway implements IPaymentGateway {
  private readonly logger = new Logger(ManualPixGateway.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.logger.log("Manual PIX gateway initialized");
  }

  getName(): string {
    return "manual-pix";
  }

  getSupportedMethods(): PaymentMethodType[] {
    return ["pix"];
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 1. Get ONG/User from database
      const ong = await this.userRepository.findOne({
        where: { id: request.metadata?.ongId },
      });

      if (!ong) {
        throw new NotFoundException(
          `ONG not found with ID: ${request.metadata?.ongId}`,
        );
      }

      // 2. Validate ONG has PIX key configured
      if (!ong.pixKey || ong.pixKey.trim() === "") {
        throw new BadRequestException(
          "Esta ONG ainda não configurou uma chave PIX. " +
            "Por favor, entre em contato com a organização ou escolha outro método de pagamento.",
        );
      }

      // 3. Detect PIX key type
      const pixKeyType = this.detectPixKeyType(ong.pixKey);

      // 4. Build instructions
      const instructions = this.buildInstructions(
        ong.pixKey,
        pixKeyType,
        request.amount,
      );

      this.logger.log(
        `Manual PIX payment created for ONG ${ong.ongName} ` +
          `(${request.donorEmail}), amount: R$ ${request.amount}, PIX type: ${pixKeyType}`,
      );

      // 5. Return PIX key and instructions (no actual payment processing)
      return {
        success: true,
        paymentIntentId: `manual-pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "pending_confirmation",
        pixKey: ong.pixKey,
        pixKeyType,
        instructions,
      };
    } catch (error) {
      this.logger.error("Error creating manual PIX payment", error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      return {
        success: false,
        paymentIntentId: "",
        status: "failed",
        error: error.message || "Erro ao processar pagamento PIX manual",
      };
    }
  }

  async getPaymentStatus(
    paymentIntentId: string,
  ): Promise<PaymentStatusResponse> {
    // Manual PIX payments cannot be automatically verified
    // Status must be manually updated by ONG or admin
    this.logger.log(
      `Manual PIX status check for ${paymentIntentId} - manual confirmation required`,
    );

    return {
      paymentIntentId,
      status: "pending_confirmation",
      amount: 0,
      currency: "BRL",
      paymentMethod: "pix",
    };
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    // Manual PIX payments cannot be automatically refunded
    // Refunds must be processed manually by the ONG
    this.logger.warn(
      `Refund requested for manual PIX payment ${request.paymentIntentId} - manual processing required`,
    );

    return {
      success: false,
      refundId: "",
      amount: 0,
      status: "failed",
      error:
        "Reembolsos de pagamentos PIX manuais devem ser processados diretamente pela ONG",
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Manual PIX does not support webhooks
    this.logger.warn(
      "Webhook verification called on manual PIX gateway - not supported",
    );
    return false;
  }

  async handleWebhook(payload: any): Promise<{
    event: string;
    paymentIntentId: string;
    status: PaymentStatus;
    metadata?: Record<string, any>;
  }> {
    // Manual PIX does not support webhooks
    throw new BadRequestException(
      "Manual PIX gateway does not support webhooks",
    );
  }

  /**
   * Detect the type of PIX key
   * @param pixKey The PIX key to analyze
   * @returns The type of PIX key
   */
  private detectPixKeyType(pixKey: string): string {
    const cleaned = pixKey.replace(/\D/g, ""); // Remove non-digits

    // CPF: 11 digits
    if (cleaned.length === 11 && /^\d{11}$/.test(cleaned)) {
      return "CPF";
    }

    // CNPJ: 14 digits
    if (cleaned.length === 14 && /^\d{14}$/.test(cleaned)) {
      return "CNPJ";
    }

    // Email: contains @
    if (pixKey.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
      return "Email";
    }

    // Phone: starts with +55 (Brazil country code)
    if (pixKey.startsWith("+55") || pixKey.startsWith("55")) {
      return "Phone";
    }

    // Random key: UUID format (8-4-4-4-12)
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        pixKey,
      )
    ) {
      return "Random";
    }

    // Default to random if can't determine
    return "Random";
  }

  /**
   * Build payment instructions for the donor
   * @param pixKey The ONG's PIX key
   * @param pixKeyType The type of PIX key
   * @param amount The donation amount
   * @returns Formatted instructions
   */
  private buildInstructions(
    pixKey: string,
    pixKeyType: string,
    amount: number,
  ): string {
    const formattedAmount = amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return (
      `Instruções para pagamento via PIX:\n\n` +
      `1. Abra o aplicativo do seu banco\n` +
      `2. Acesse a opção PIX\n` +
      `3. Escolha "Pix Copia e Cola" ou "Transferência PIX"\n` +
      `4. Copie a chave PIX: ${pixKey}\n` +
      `5. Cole a chave no seu aplicativo bancário\n` +
      `6. Confirme o valor: ${formattedAmount}\n` +
      `7. Complete o pagamento\n\n` +
      `Tipo de chave: ${pixKeyType}\n` +
      `Valor: ${formattedAmount}\n\n` +
      `IMPORTANTE: Após realizar o pagamento, a ONG será notificada automaticamente pelo banco. ` +
      `Seu comprovante de doação será enviado por e-mail assim que a ONG confirmar o recebimento.`
    );
  }
}
