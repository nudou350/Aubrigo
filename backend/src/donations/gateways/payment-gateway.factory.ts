import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import {
  IPaymentGateway,
  PaymentMethodType,
} from "./payment-gateway.interface";

@Injectable()
export class PaymentGatewayFactory {
  private readonly logger = new Logger(PaymentGatewayFactory.name);
  private gateways: Map<string, IPaymentGateway> = new Map();

  /**
   * Register a payment gateway
   */
  registerGateway(gateway: IPaymentGateway): void {
    const name = gateway.getName();
    this.gateways.set(name, gateway);
    this.logger.log(
      `Registered payment gateway: ${name} with methods: ${gateway.getSupportedMethods().join(", ")}`,
    );
  }

  /**
   * Select the appropriate gateway based on country and payment method
   */
  selectGateway(
    country: "PT" | "BR",
    paymentMethod: PaymentMethodType,
  ): IPaymentGateway {
    // Portugal: Use Stripe for MBWay, Multibanco, and Cards
    if (country === "PT") {
      const stripeGateway = this.gateways.get("stripe");
      if (!stripeGateway) {
        throw new BadRequestException("Stripe gateway not available");
      }

      if (!stripeGateway.getSupportedMethods().includes(paymentMethod)) {
        throw new BadRequestException(
          `Payment method ${paymentMethod} not supported for Portugal`,
        );
      }

      return stripeGateway;
    }

    // Brazil: Route based on payment method
    if (country === "BR") {
      // PIX: Use Manual PIX gateway (ONG's PIX key)
      if (paymentMethod === "pix") {
        const manualPixGateway = this.gateways.get("manual-pix");
        if (!manualPixGateway) {
          throw new BadRequestException(
            "Manual PIX gateway not configured. Please contact support.",
          );
        }
        this.logger.log("Using Manual PIX gateway for Brazil");
        return manualPixGateway;
      }

      // Cards: Prefer Stripe if available
      if (paymentMethod === "card") {
        const stripeGateway = this.gateways.get("stripe");
        if (
          stripeGateway &&
          stripeGateway.getSupportedMethods().includes("card")
        ) {
          this.logger.log("Using Stripe for card payment in Brazil");
          return stripeGateway;
        }
      }

      // Boleto or cards (if Stripe not available): Use Brazilian gateway
      const brazilGateway = this.gateways.get("brazil");
      if (!brazilGateway) {
        throw new BadRequestException(
          "Brazilian payment gateway not available",
        );
      }

      if (!brazilGateway.getSupportedMethods().includes(paymentMethod)) {
        throw new BadRequestException(
          `Payment method ${paymentMethod} not supported for Brazil`,
        );
      }

      return brazilGateway;
    }

    throw new BadRequestException(`Country ${country} not supported`);
  }

  /**
   * Get gateway by name
   */
  getGatewayByName(name: string): IPaymentGateway | undefined {
    return this.gateways.get(name);
  }

  /**
   * Get all available gateways
   */
  getAllGateways(): IPaymentGateway[] {
    return Array.from(this.gateways.values());
  }

  /**
   * Get supported payment methods for a country
   */
  getSupportedMethodsForCountry(country: "PT" | "BR"): PaymentMethodType[] {
    const methods: PaymentMethodType[] = [];

    if (country === "PT") {
      const stripeGateway = this.gateways.get("stripe");
      if (stripeGateway) {
        methods.push(...stripeGateway.getSupportedMethods());
      }
    } else if (country === "BR") {
      // Manual PIX gateway (ONG's PIX key)
      const manualPixGateway = this.gateways.get("manual-pix");
      if (manualPixGateway) {
        methods.push(...manualPixGateway.getSupportedMethods());
      }

      // Brazilian payment gateway (Boleto, etc.)
      const brazilGateway = this.gateways.get("brazil");
      if (brazilGateway) {
        // Add boleto and card from brazil gateway (excluding PIX since we use manual-pix)
        const brazilMethods = brazilGateway
          .getSupportedMethods()
          .filter((m) => m !== "pix");
        methods.push(...brazilMethods);
      }

      // Add Stripe card support if available
      const stripeGateway = this.gateways.get("stripe");
      if (stripeGateway && !methods.includes("card")) {
        methods.push("card");
      }
    }

    return [...new Set(methods)]; // Remove duplicates
  }
}
