import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Donation } from "./entities/donation.entity";
import { CreateDonationDto } from "./dto/create-donation.dto";
import { PaymentGatewayFactory } from "./gateways/payment-gateway.factory";
import { StripeGateway } from "./gateways/stripe.gateway";
import { BrazilianGateway } from "./gateways/brazilian.gateway";
import { ManualPixGateway } from "./gateways/manual-pix.gateway";
import { Ong } from "../ongs/entities/ong.entity";
import { StripeConnectService } from "../stripe-connect/stripe-connect.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class DonationsService implements OnModuleInit {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @InjectRepository(Ong)
    private ongRepository: Repository<Ong>,
    private gatewayFactory: PaymentGatewayFactory,
    private stripeGateway: StripeGateway,
    private brazilianGateway: BrazilianGateway,
    private manualPixGateway: ManualPixGateway,
    private stripeConnectService: StripeConnectService,
    private emailService: EmailService,
  ) {}

  onModuleInit() {
    // Register payment gateways on module initialization
    this.gatewayFactory.registerGateway(this.stripeGateway);
    this.gatewayFactory.registerGateway(this.brazilianGateway);
    this.gatewayFactory.registerGateway(this.manualPixGateway);
  }

  async createDonation(createDonationDto: CreateDonationDto) {
    const { country, currency, paymentMethod, phoneNumber, ...donationData } =
      createDonationDto;

    // Validate country and currency match
    if (country === "PT" && currency !== "EUR") {
      throw new BadRequestException("Portugal must use EUR currency");
    }
    if (country === "BR" && currency !== "BRL") {
      throw new BadRequestException("Brazil must use BRL currency");
    }

    // Validate payment method is supported for country
    const supportedMethods: string[] = this.getSupportedMethodsForCountry(country as "PT" | "BR");
    if (!supportedMethods.includes(paymentMethod)) {
      throw new BadRequestException(
        `Payment method ${paymentMethod} not supported for ${country}`,
      );
    }

    // Get ONG details for payment instructions
    const ong = await this.ongRepository.findOne({
      where: { id: donationData.ongId },
      relations: ["user"],
    });

    if (!ong) {
      throw new NotFoundException("ONG not found");
    }

    // Create donation record with pending_confirmation status (manual flow)
    const donation = this.donationRepository.create({
      ...donationData,
      country,
      currency,
      paymentMethod,
      phoneNumber,
      paymentStatus: "pending_confirmation", // Manual confirmation required
      gatewayProvider: "manual", // Mark as manual payment
    });

    const savedDonation = await this.donationRepository.save(donation);

    this.logger.log(
      `Manual donation created: ${savedDonation.id} - ${savedDonation.amount} ${savedDonation.currency} via ${savedDonation.paymentMethod}`,
    );

    // Build manual payment instructions
    const paymentInstructions = this.buildManualPaymentInstructions(
      ong,
      savedDonation,
    );

    // Send emails asynchronously (don't wait for them)
    this.sendDonationEmails(savedDonation, ong, paymentInstructions).catch(
      (error) => {
        this.logger.error("Failed to send donation emails:", error);
      },
    );

    return {
      message: "Donation created successfully - Please complete payment manually",
      donation: {
        id: savedDonation.id,
        amount: savedDonation.amount,
        currency: savedDonation.currency,
        country: savedDonation.country,
        paymentMethod: savedDonation.paymentMethod,
        paymentStatus: savedDonation.paymentStatus,
      },
      payment: paymentInstructions,
    };

    /* COMMENTED OUT: GATEWAY INTEGRATION (FOR FUTURE AUTOMATION)
    try {
      let paymentResponse: any;
      let gatewayName: string;

      if (useStripeConnect && ong) {
        // Use Stripe Connect for direct payment to ONG
        const paymentIntent =
          await this.stripeConnectService.createConnectedPayment({
            amount: savedDonation.amount,
            currency: currency.toLowerCase(),
            connectedAccountId: ong.stripeAccountId,
            donationId: savedDonation.id,
            donorEmail: savedDonation.donorEmail,
            paymentMethod: paymentMethod,
            phoneNumber: phoneNumber,
          });

        gatewayName = "stripe";
        paymentResponse = {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status as any,
          requiresAction: paymentIntent.status === "requires_action",
        };
      } else {
        // Use regular gateway flow
        const gateway = this.gatewayFactory.selectGateway(
          country as "PT" | "BR",
          paymentMethod as any,
        );
        gatewayName = gateway.getName();

        paymentResponse = await gateway.createPayment({
          amount: savedDonation.amount,
          currency: currency as "EUR" | "BRL",
          country: country as "PT" | "BR",
          paymentMethod: paymentMethod as any,
          donationId: savedDonation.id,
          donorEmail: savedDonation.donorEmail,
          donorName: savedDonation.donorName,
          phoneNumber: phoneNumber,
          metadata: {
            ongId: savedDonation.ongId,
            donationType: savedDonation.donationType,
          },
        });
      }

      // Update donation with payment details
      savedDonation.gatewayProvider = gatewayName;
      savedDonation.paymentIntentId = paymentResponse.paymentIntentId;
      savedDonation.paymentStatus = paymentResponse.status;

      await this.donationRepository.save(savedDonation);

      return {
        message: "Donation created successfully",
        donation: { ... },
        payment: this.buildPaymentResponse(savedDonation, paymentResponse),
      };
    } catch (error) {
      this.logger.error(`Payment creation failed:`, error);
      savedDonation.paymentStatus = "failed";
      await this.donationRepository.save(savedDonation);
      throw error;
    }
    */
  }

  /**
   * Build manual payment instructions for donor
   */
  private buildManualPaymentInstructions(ong: Ong, donation: Donation) {
    const instructions: any = {
      ongName: ong.ongName,
      amount: donation.amount,
      currency: donation.currency,
      paymentMethod: donation.paymentMethod,
    };

    if (donation.country === "PT") {
      // Portugal payment methods
      if (donation.paymentMethod === "mbway") {
        instructions.mbwayPhone = ong.user?.phone || "+351 XXX XXX XXX";
        instructions.instructions = [
          "1. Abra a aplicação MB WAY no seu telemóvel",
          `2. Envie ${donation.currency} ${donation.amount} para o número:`,
          `   ${instructions.mbwayPhone}`,
          "3. Após efetuar o pagamento, aguarde a confirmação da ONG",
        ];
      } else if (donation.paymentMethod === "multibanco") {
        instructions.iban = ong.bankAccountIBAN || "PT50 XXXX XXXX XXXX XXXX XXXX X";
        instructions.instructions = [
          "1. Aceda ao multibanco ou homebanking",
          '2. Escolha "Transferência Bancária" ou "Pagamentos"',
          `3. IBAN: ${instructions.iban}`,
          `4. Montante: ${donation.currency} ${donation.amount}`,
          `5. Referência: Doação ${donation.id.substring(0, 8)}`,
          "6. Após efetuar o pagamento, aguarde a confirmação da ONG",
        ];
      } else if (donation.paymentMethod === "card") {
        instructions.iban = ong.bankAccountIBAN || "PT50 XXXX XXXX XXXX XXXX XXXX X";
        instructions.instructions = [
          "Pagamento por cartão não está disponível via manual.",
          "Por favor, use MB WAY ou Transferência Bancária.",
        ];
      }
    } else if (donation.country === "BR") {
      // Brazil payment methods
      if (donation.paymentMethod === "pix") {
        instructions.pixKey = ong.user?.pixKey || "pix@ong.com.br";
        instructions.pixKeyType = this.detectPixKeyType(instructions.pixKey);
        instructions.instructions = [
          "1. Abra o aplicativo do seu banco",
          "2. Escolha a opção PIX",
          "3. Selecione 'Enviar PIX'",
          `4. Chave PIX (${instructions.pixKeyType}): ${instructions.pixKey}`,
          `5. Valor: ${donation.currency} ${donation.amount}`,
          "6. Após efetuar o pagamento, aguarde a confirmação da ONG",
        ];
      } else if (donation.paymentMethod === "boleto") {
        instructions.instructions = [
          "Boleto bancário não está disponível via manual.",
          "Por favor, use PIX para doação instantânea.",
        ];
      } else if (donation.paymentMethod === "card") {
        instructions.instructions = [
          "Pagamento por cartão não está disponível via manual.",
          "Por favor, use PIX para doação instantânea.",
        ];
      }
    }

    return instructions;
  }

  /**
   * Detect PIX key type
   */
  private detectPixKeyType(pixKey: string): string {
    if (/^\d{11}$/.test(pixKey)) return "CPF";
    if (/^\d{14}$/.test(pixKey)) return "CNPJ";
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(pixKey)) return "Email";
    if (/^\+?\d{10,15}$/.test(pixKey)) return "Telefone";
    return "Chave Aleatória";
  }

  /**
   * Send donation notification emails to donor and ONG
   */
  private async sendDonationEmails(
    donation: Donation,
    ong: Ong,
    paymentInstructions: any,
  ): Promise<void> {
    try {
      // Extract account details for email
      let accountDetails = "";
      if (donation.paymentMethod === "mbway") {
        accountDetails = paymentInstructions.mbwayPhone || "";
      } else if (donation.paymentMethod === "multibanco") {
        accountDetails = paymentInstructions.iban || "";
      } else if (donation.paymentMethod === "pix") {
        accountDetails = `${paymentInstructions.pixKey} (${paymentInstructions.pixKeyType})`;
      }

      // Send instructions to donor
      await this.emailService.sendPaymentInstructionsEmail(
        donation.donorEmail,
        donation.donorName,
        ong.ongName,
        donation.amount,
        donation.currency,
        donation.paymentMethod,
        paymentInstructions.instructions || [],
        accountDetails,
      );

      this.logger.log(
        `Payment instructions sent to donor: ${donation.donorEmail}`,
      );

      // Send pending donation notification to ONG
      await this.emailService.sendDonationPendingToOng(
        ong.user?.email || "",
        ong.ongName,
        donation.donorName,
        donation.donorEmail,
        donation.amount,
        donation.currency,
        donation.paymentMethod,
        donation.id,
      );

      this.logger.log(`Pending donation notification sent to ONG: ${ong.ongName}`);
    } catch (error) {
      this.logger.error("Error sending donation emails:", error);
      throw error;
    }
  }

  /**
   * Get supported payment methods for a country
   */
  private getSupportedMethodsForCountry(country: "PT" | "BR"): string[] {
    if (country === "PT") {
      return ["mbway", "multibanco"];
    } else {
      return ["pix"];
    }
  }

  /**
   * Get pending donations for an ONG (manual confirmation required)
   */
  async getPendingDonations(ongId: string) {
    const pendingDonations = await this.donationRepository.find({
      where: {
        ongId,
        paymentStatus: "pending_confirmation",
      },
      order: { createdAt: "DESC" },
    });

    return {
      count: pendingDonations.length,
      donations: pendingDonations.map((donation) => ({
        id: donation.id,
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: donation.paymentMethod,
        donationType: donation.donationType,
        createdAt: donation.createdAt,
      })),
    };
  }

  /**
   * Confirm a donation as received (ONG admin action)
   */
  async confirmDonation(donationId: string, ongId: string) {
    const donation = await this.donationRepository.findOne({
      where: { id: donationId, ongId },
    });

    if (!donation) {
      throw new NotFoundException("Donation not found or access denied");
    }

    if (donation.paymentStatus !== "pending_confirmation") {
      throw new BadRequestException(
        `Donation is already ${donation.paymentStatus}`,
      );
    }

    // Mark as completed/succeeded
    donation.paymentStatus = "succeeded";
    donation.updatedAt = new Date();

    await this.donationRepository.save(donation);

    this.logger.log(
      `Donation ${donationId} confirmed by ONG ${ongId} - ${donation.amount} ${donation.currency}`,
    );

    return {
      message: "Donation confirmed successfully",
      donation: {
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        paymentStatus: donation.paymentStatus,
        updatedAt: donation.updatedAt,
      },
    };
  }

  private buildPaymentResponse(donation: Donation, paymentResponse: any) {
    const response: any = {
      paymentIntentId: paymentResponse.paymentIntentId,
      clientSecret: paymentResponse.clientSecret,
    };

    if (donation.paymentMethod === "mbway") {
      response.instructions = [
        "1. Abra a aplicação MB Way no seu telemóvel",
        "2. Confirme o pagamento push notification",
        "3. Aguarde a confirmação",
      ];
      response.requiresAction = paymentResponse.requiresAction;
    } else if (donation.paymentMethod === "pix") {
      // Manual PIX (ONG's PIX key)
      if (paymentResponse.pixKey) {
        response.pixKey = paymentResponse.pixKey;
        response.pixKeyType = paymentResponse.pixKeyType;
        response.instructions = paymentResponse.instructions;
      } else {
        // Gateway PIX (QR Code from EBANX/PagSeguro)
        response.pixQrCode = donation.pixQrCode;
        response.pixPaymentString = donation.pixPaymentString;
        response.expiresAt = donation.expiresAt;
        response.instructions = [
          "1. Abra o aplicativo do seu banco",
          "2. Escolha a opção PIX",
          "3. Escaneie o QR Code ou cole o código de pagamento",
          "4. Confirme o pagamento",
        ];
      }
    } else if (donation.paymentMethod === "boleto") {
      response.boletoUrl = donation.boletoUrl;
      response.boletoBarcode = donation.boletoBarcode;
      response.expiresAt = donation.expiresAt;
      response.instructions = [
        "1. Baixe o boleto clicando no link",
        "2. Pague em qualquer banco, lotérica ou app bancário",
        "3. Use o código de barras para pagamento",
      ];
    } else if (donation.paymentMethod === "multibanco") {
      response.entity = donation.multibancoEntity;
      response.reference = donation.multibancoReference;
      response.expiresAt = donation.expiresAt;
      response.instructions = [
        "1. Aceda ao multibanco ou homebanking",
        '2. Escolha "Pagamentos" ou "Serviços"',
        `3. Entidade: ${donation.multibancoEntity}`,
        `4. Referência: ${donation.multibancoReference}`,
        `5. Montante: €${donation.amount}`,
      ];
    } else if (donation.paymentMethod === "card") {
      response.instructions = [
        "1. Complete o pagamento com seus dados do cartão",
        "2. Autenticação 3D Secure pode ser necessária",
      ];
    }

    return response;
  }

  async checkPaymentStatus(donationId: string) {
    const donation = await this.donationRepository.findOne({
      where: { id: donationId },
    });

    if (!donation) {
      throw new NotFoundException("Donation not found");
    }

    // If already completed, return current status
    if (donation.paymentStatus === "succeeded") {
      return {
        donationId: donation.id,
        paymentStatus: donation.paymentStatus,
        message: "Payment already completed",
      };
    }

    // Check with gateway if we have a payment intent ID
    if (donation.paymentIntentId && donation.gatewayProvider) {
      try {
        const gateway = this.gatewayFactory.getGatewayByName(
          donation.gatewayProvider,
        );
        if (gateway) {
          const status = await gateway.getPaymentStatus(
            donation.paymentIntentId,
          );

          // Update donation status if it changed
          if (status.status !== donation.paymentStatus) {
            donation.paymentStatus = status.status;
            await this.donationRepository.save(donation);
          }

          return {
            donationId: donation.id,
            paymentStatus: status.status,
            paymentMethod: donation.paymentMethod,
            amount: donation.amount,
            currency: donation.currency,
          };
        }
      } catch (error) {
        this.logger.error("Error checking payment status:", error);
      }
    }

    return {
      donationId: donation.id,
      paymentStatus: donation.paymentStatus,
    };
  }

  async handleWebhook(
    gatewayName: string,
    payload: any,
    signature: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const gateway = this.gatewayFactory.getGatewayByName(gatewayName);
      if (!gateway) {
        throw new BadRequestException(`Gateway ${gatewayName} not found`);
      }

      // Verify webhook signature
      const isValid = gateway.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        throw new BadRequestException("Invalid webhook signature");
      }

      // Process webhook
      const webhookData = await gateway.handleWebhook(payload);

      // Find donation by payment intent ID
      const donation = await this.donationRepository.findOne({
        where: { paymentIntentId: webhookData.paymentIntentId },
      });

      if (donation) {
        donation.paymentStatus = webhookData.status;
        await this.donationRepository.save(donation);

        return {
          success: true,
          message: `Donation ${donation.id} updated to ${webhookData.status}`,
        };
      }

      return {
        success: true,
        message: "Webhook processed but donation not found",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getDonationsByOng(ongId: string) {
    const donations = await this.donationRepository.find({
      where: { ongId, paymentStatus: "succeeded" },
      order: { createdAt: "DESC" },
    });

    // Group by currency for proper totals
    const totals = donations.reduce(
      (acc, donation) => {
        if (!acc[donation.currency]) {
          acc[donation.currency] = {
            total: 0,
            monthly: 0,
            count: 0,
          };
        }

        const amount = Number(donation.amount);
        acc[donation.currency].total += amount;
        acc[donation.currency].count += 1;

        if (donation.donationType === "monthly") {
          acc[donation.currency].monthly += amount;
        }

        return acc;
      },
      {} as Record<string, { total: number; monthly: number; count: number }>,
    );

    return {
      donations,
      statistics: {
        totalDonations: donations.length,
        byCurrency: totals,
      },
    };
  }

  async getSupportedPaymentMethods(country: "PT" | "BR") {
    return this.getSupportedMethodsForCountry(country);
  }
}
