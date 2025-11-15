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
    const supportedMethods = this.gatewayFactory.getSupportedMethodsForCountry(
      country as "PT" | "BR",
    );
    if (!supportedMethods.includes(paymentMethod as any)) {
      throw new BadRequestException(
        `Payment method ${paymentMethod} not supported for ${country}`,
      );
    }

    // Check if ONG has Stripe Connect account (for Portugal only)
    let ong: Ong | null = null;
    let useStripeConnect = false;

    if (country === "PT") {
      ong = await this.ongRepository.findOne({
        where: { id: donationData.ongId },
      });

      if (ong && ong.stripeAccountId && ong.stripeChargesEnabled) {
        useStripeConnect = true;
        this.logger.log(
          `Using Stripe Connect for ONG ${ong.ongName} (${ong.stripeAccountId})`,
        );
      } else if (ong && ong.stripeAccountId && !ong.stripeChargesEnabled) {
        this.logger.warn(
          `ONG ${ong.ongName} has Stripe account but charges not enabled yet`,
        );
      }
    }

    // Create donation record
    const donation = this.donationRepository.create({
      ...donationData,
      country,
      currency,
      paymentMethod,
      phoneNumber,
      paymentStatus: "pending",
    });

    const savedDonation = await this.donationRepository.save(donation);

    // Process payment
    try {
      let paymentResponse: any;
      let gatewayName: string;

      if (useStripeConnect && ong) {
        // Use Stripe Connect for direct payment to ONG
        this.logger.log(
          `Creating connected payment for donation ${savedDonation.id}`,
        );

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

      // Store payment method-specific data
      if (paymentMethod === "pix") {
        savedDonation.pixQrCode = paymentResponse.pixQrCode;
        savedDonation.pixPaymentString = paymentResponse.pixPaymentString;
      } else if (paymentMethod === "boleto") {
        savedDonation.boletoUrl = paymentResponse.boletoUrl;
        savedDonation.boletoBarcode = paymentResponse.boletoBarcode;
      } else if (paymentMethod === "multibanco") {
        savedDonation.multibancoEntity = paymentResponse.multibancoEntity;
        savedDonation.multibancoReference = paymentResponse.multibancoReference;
      }

      if (paymentResponse.expiresAt) {
        savedDonation.expiresAt = paymentResponse.expiresAt;
      }

      await this.donationRepository.save(savedDonation);

      return {
        message: "Donation created successfully",
        donation: {
          id: savedDonation.id,
          amount: savedDonation.amount,
          currency: savedDonation.currency,
          country: savedDonation.country,
          paymentMethod: savedDonation.paymentMethod,
          paymentStatus: savedDonation.paymentStatus,
        },
        payment: this.buildPaymentResponse(savedDonation, paymentResponse),
      };
    } catch (error) {
      this.logger.error(
        `Payment creation failed for donation ${savedDonation.id}:`,
        error,
      );
      // Mark donation as failed
      savedDonation.paymentStatus = "failed";
      await this.donationRepository.save(savedDonation);
      throw error;
    }
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
    return this.gatewayFactory.getSupportedMethodsForCountry(country);
  }
}
