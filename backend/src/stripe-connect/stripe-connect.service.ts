import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

export interface CreateExpressAccountDto {
  email: string;
  ongName: string;
  taxId: string; // NIPC for Portugal, CNPJ for Brazil
  country: "PT" | "BR";
  iban?: string; // For Portugal (SEPA)
  routingNumber?: string; // For Brazil
  accountNumber?: string; // For Brazil
  accountType?: "checking" | "savings"; // For Brazil
  representativeName?: string;
  representativeEmail?: string;
}

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!apiKey) {
      this.logger.warn("Stripe API key not configured");
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16",
    });

    this.logger.log("Stripe Connect service initialized with 0% platform fee");
  }

  /**
   * Create Express Account for ONG (automatically during registration)
   * Reference: https://stripe.com/docs/connect/express-accounts
   */
  async createExpressAccount(dto: CreateExpressAccountDto): Promise<{
    accountId: string;
    onboardingUrl?: string;
    requiresOnboarding: boolean;
  }> {
    if (!this.stripe) {
      throw new BadRequestException("Stripe not configured");
    }

    try {
      this.logger.log(
        `Creating Express Account for ${dto.ongName} in ${dto.country}`,
      );

      // Step 1: Create Express Account
      const account = await this.stripe.accounts.create({
        type: "express",
        country: dto.country,
        email: dto.email,
        business_type: "non_profit",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: dto.ongName,
          product_description: "Animal shelter accepting donations",
          support_email: dto.email,
        },
        metadata: {
          platform: "aubrigo",
          ongName: dto.ongName,
          createdAt: new Date().toISOString(),
        },
      });

      this.logger.log(`Express Account created: ${account.id}`);

      // Step 2: Update with tax ID
      if (dto.taxId) {
        await this.stripe.accounts.update(account.id, {
          company: {
            tax_id: dto.taxId,
            name: dto.ongName,
          },
        });
        this.logger.log(`Tax ID added to account ${account.id}`);
      }

      // Step 3: Add bank account if provided
      let bankAccountAdded = false;
      if (dto.country === "PT" && dto.iban) {
        bankAccountAdded = await this.addPortugueseBankAccount(account.id, {
          iban: dto.iban,
          accountHolderName: dto.ongName,
        });
      } else if (
        dto.country === "BR" &&
        dto.accountNumber &&
        dto.routingNumber
      ) {
        bankAccountAdded = await this.addBrazilianBankAccount(account.id, {
          routingNumber: dto.routingNumber,
          accountNumber: dto.accountNumber,
          accountHolderName: dto.ongName,
          accountType: dto.accountType || "checking",
        });
      }

      // Step 4: Check if additional onboarding is needed
      const accountDetails = await this.stripe.accounts.retrieve(account.id);
      const requiresOnboarding =
        !accountDetails.charges_enabled ||
        accountDetails.requirements?.currently_due?.length > 0;

      let onboardingUrl: string | undefined;
      if (requiresOnboarding) {
        const accountLink = await this.createAccountLink(account.id);
        onboardingUrl = accountLink.url;
        this.logger.log(`Onboarding required for ${account.id}`);
      } else {
        this.logger.log(`Account ${account.id} ready to accept payments`);
      }

      return {
        accountId: account.id,
        onboardingUrl,
        requiresOnboarding,
      };
    } catch (error) {
      this.logger.error("Failed to create Express Account:", error.message);
      throw new BadRequestException(
        `Failed to create payment account: ${error.message}`,
      );
    }
  }

  /**
   * Add Portuguese bank account (IBAN/SEPA)
   * Reference: https://stripe.com/docs/connect/bank-account-configuration
   */
  private async addPortugueseBankAccount(
    accountId: string,
    details: {
      iban: string;
      accountHolderName: string;
    },
  ): Promise<boolean> {
    try {
      await this.stripe.accounts.createExternalAccount(accountId, {
        external_account: {
          object: "bank_account",
          country: "PT",
          currency: "eur",
          account_holder_name: details.accountHolderName,
          account_holder_type: "company",
          account_number: details.iban,
        },
      });

      this.logger.log(`Portuguese bank account added to ${accountId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to add Portuguese bank account: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Add Brazilian bank account
   * Reference: https://stripe.com/docs/connect/payouts-brazil
   */
  private async addBrazilianBankAccount(
    accountId: string,
    details: {
      routingNumber: string;
      accountNumber: string;
      accountHolderName: string;
      accountType: "checking" | "savings";
    },
  ): Promise<boolean> {
    try {
      await this.stripe.accounts.createExternalAccount(accountId, {
        external_account: {
          object: "bank_account",
          country: "BR",
          currency: "brl",
          account_holder_name: details.accountHolderName,
          account_holder_type: "company",
          routing_number: details.routingNumber,
          account_number: details.accountNumber,
        },
      });

      this.logger.log(`Brazilian bank account added to ${accountId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to add Brazilian bank account: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Create Account Link for onboarding
   * Reference: https://stripe.com/docs/api/account_links
   */
  async createAccountLink(accountId: string): Promise<Stripe.AccountLink> {
    try {
      const frontendUrl =
        this.configService.get("FRONTEND_URL") || "http://localhost:4200";

      return await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${frontendUrl}/ong/onboarding/refresh`,
        return_url: `${frontendUrl}/ong/dashboard?stripe_setup=complete`,
        type: "account_onboarding",
      });
    } catch (error) {
      this.logger.error("Failed to create account link:", error);
      throw new BadRequestException("Failed to create onboarding link");
    }
  }

  /**
   * Get Express Account status
   */
  async getAccountStatus(accountId: string): Promise<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: string[];
  }> {
    if (!this.stripe) {
      throw new BadRequestException("Stripe not configured");
    }

    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements?.currently_due || [],
      };
    } catch (error) {
      this.logger.error("Failed to get account status:", error);
      throw new BadRequestException("Failed to retrieve account status");
    }
  }

  /**
   * Create payment on connected account (money goes 100% to ONG)
   * Reference: https://stripe.com/docs/connect/charges
   */
  async createConnectedPayment(params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    donationId: string;
    donorEmail: string;
    paymentMethod: string;
    phoneNumber?: string;
  }): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new BadRequestException("Stripe not configured");
    }

    const {
      amount,
      currency,
      connectedAccountId,
      donationId,
      donorEmail,
      paymentMethod,
      phoneNumber,
    } = params;

    const amountInCents = Math.round(amount * 100);

    try {
      // Create PaymentIntent on connected account
      // Using "on behalf of" pattern - money goes 100% directly to connected account (0% platform fee)
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          payment_method_types: [
            paymentMethod === "card" ? "card" : paymentMethod,
          ],
          metadata: {
            donationId,
            donorEmail,
            platformFee: "0",
            phoneNumber: phoneNumber || "",
          },
        },
        {
          stripeAccount: connectedAccountId, // Process on ONG's connected account
        },
      );

      this.logger.log(
        `Connected payment created: ${paymentIntent.id} on account ${connectedAccountId}, ` +
          `amount: ${amount}, platform fee: 0% (100% to ONG)`,
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error("Connected payment failed:", error);
      throw new BadRequestException(
        `Payment creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Get Express Account login link (for ONG to access dashboard)
   * Reference: https://stripe.com/docs/api/account/create_login_link
   */
  async getExpressDashboardLink(accountId: string): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new BadRequestException("Stripe not configured");
    }

    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);
      return { url: loginLink.url };
    } catch (error) {
      this.logger.error("Failed to create dashboard link:", error);
      throw new BadRequestException("Failed to create dashboard link");
    }
  }

  /**
   * Delete/deactivate Express Account
   */
  async deleteAccount(accountId: string): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException("Stripe not configured");
    }

    try {
      await this.stripe.accounts.del(accountId);
      this.logger.log(`Account deleted: ${accountId}`);
    } catch (error) {
      this.logger.error(`Failed to delete account ${accountId}:`, error);
      throw new BadRequestException("Failed to delete account");
    }
  }

  /**
   * Verify Stripe Connect webhook signature
   * Reference: https://stripe.com/docs/webhooks/signatures
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>(
        "STRIPE_CONNECT_WEBHOOK_SECRET",
      );

      if (!webhookSecret) {
        this.logger.error("Stripe Connect webhook secret not configured");
        return false;
      }

      // Stripe requires raw body for signature verification
      // In main.ts, ensure you have: app.useBodyParser('json', { verify: (req, res, buf) => { req.rawBody = buf } })
      this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;
    } catch (error) {
      this.logger.error(
        "Webhook signature verification failed:",
        error.message,
      );
      return false;
    }
  }

  /**
   * Handle Stripe Connect webhook events
   * Reference: https://stripe.com/docs/connect/webhooks
   */
  async handleWebhook(payload: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    const event = payload.type;
    const data = payload.data.object;

    this.logger.log(`Processing webhook event: ${event}`);

    try {
      switch (event) {
        case "account.updated":
          return await this.handleAccountUpdated(data);

        case "capability.updated":
          return await this.handleCapabilityUpdated(data);

        case "account.application.authorized":
          return await this.handleAccountAuthorized(data);

        case "account.application.deauthorized":
          return await this.handleAccountDeauthorized(data);

        case "charge.succeeded":
          return await this.handleChargeSucceeded(data);

        case "charge.failed":
          return await this.handleChargeFailed(data);

        case "payout.paid":
          return await this.handlePayoutPaid(data);

        case "payout.failed":
          return await this.handlePayoutFailed(data);

        default:
          this.logger.log(`Unhandled webhook event: ${event}`);
          return {
            event,
            processed: false,
            message: `Event type ${event} not handled`,
          };
      }
    } catch (error) {
      this.logger.error(`Error handling webhook ${event}:`, error.message);
      throw new BadRequestException(
        `Webhook handling failed: ${error.message}`,
      );
    }
  }

  /**
   * Handle account.updated event
   * Triggered when connected account details change
   */
  private async handleAccountUpdated(account: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.log(
      `Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`,
    );

    // TODO: Update ONG entity with new account status
    // const ong = await this.ongRepository.findOne({ where: { stripeAccountId: account.id } });
    // ong.stripeAccountConnected = account.charges_enabled;
    // await this.ongRepository.save(ong);

    return {
      event: "account.updated",
      processed: true,
      message: `Account ${account.id} updated successfully`,
    };
  }

  /**
   * Handle capability.updated event
   * Triggered when payment capabilities change (e.g., card_payments enabled)
   */
  private async handleCapabilityUpdated(capability: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.log(
      `Capability updated: ${capability.account} - ${capability.id}: ${capability.status}`,
    );

    return {
      event: "capability.updated",
      processed: true,
      message: `Capability ${capability.id} updated to ${capability.status}`,
    };
  }

  /**
   * Handle account.application.authorized event
   * Triggered when ONG authorizes the platform
   */
  private async handleAccountAuthorized(authorization: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.log(`Account authorized: ${authorization.account}`);

    return {
      event: "account.application.authorized",
      processed: true,
      message: `Account ${authorization.account} authorized`,
    };
  }

  /**
   * Handle account.application.deauthorized event
   * Triggered when ONG disconnects from the platform
   */
  private async handleAccountDeauthorized(deauthorization: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.warn(`Account deauthorized: ${deauthorization.account}`);

    // TODO: Mark ONG as disconnected in database
    // const ong = await this.ongRepository.findOne({ where: { stripeAccountId: deauthorization.account } });
    // ong.stripeAccountConnected = false;
    // await this.ongRepository.save(ong);

    return {
      event: "account.application.deauthorized",
      processed: true,
      message: `Account ${deauthorization.account} deauthorized`,
    };
  }

  /**
   * Handle charge.succeeded event
   * Triggered when a payment succeeds on a connected account
   */
  private async handleChargeSucceeded(charge: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.log(
      `Charge succeeded: ${charge.id} - Amount: ${charge.amount / 100} ${charge.currency.toUpperCase()}`,
    );

    // TODO: Update donation status in database
    // const donationId = charge.metadata?.donationId;
    // if (donationId) {
    //   const donation = await this.donationRepository.findOne({ where: { id: donationId } });
    //   donation.paymentStatus = 'completed';
    //   await this.donationRepository.save(donation);
    // }

    return {
      event: "charge.succeeded",
      processed: true,
      message: `Charge ${charge.id} succeeded`,
    };
  }

  /**
   * Handle charge.failed event
   * Triggered when a payment fails on a connected account
   */
  private async handleChargeFailed(charge: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.error(
      `Charge failed: ${charge.id} - Reason: ${charge.failure_message}`,
    );

    // TODO: Update donation status and notify user
    // const donationId = charge.metadata?.donationId;
    // if (donationId) {
    //   const donation = await this.donationRepository.findOne({ where: { id: donationId } });
    //   donation.paymentStatus = 'failed';
    //   await this.donationRepository.save(donation);
    //   // Send failure email to donor
    // }

    return {
      event: "charge.failed",
      processed: true,
      message: `Charge ${charge.id} failed: ${charge.failure_message}`,
    };
  }

  /**
   * Handle payout.paid event
   * Triggered when ONG receives a payout
   */
  private async handlePayoutPaid(payout: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.log(
      `Payout paid: ${payout.id} - Amount: ${payout.amount / 100} ${payout.currency.toUpperCase()} to account ${payout.destination}`,
    );

    // TODO: Record payout in database for ONG's financial records

    return {
      event: "payout.paid",
      processed: true,
      message: `Payout ${payout.id} paid successfully`,
    };
  }

  /**
   * Handle payout.failed event
   * Triggered when payout to ONG fails
   */
  private async handlePayoutFailed(payout: any): Promise<{
    event: string;
    processed: boolean;
    message: string;
  }> {
    this.logger.error(
      `Payout failed: ${payout.id} - Reason: ${payout.failure_message}`,
    );

    // TODO: Notify ONG about failed payout
    // Send email to ONG about payout failure and required action

    return {
      event: "payout.failed",
      processed: true,
      message: `Payout ${payout.id} failed: ${payout.failure_message}`,
    };
  }
}
