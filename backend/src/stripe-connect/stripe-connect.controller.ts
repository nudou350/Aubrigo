import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { StripeConnectService } from "./stripe-connect.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoleGuard } from "../auth/guards/role.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";

@Controller("stripe-connect")
export class StripeConnectController {
  private readonly logger = new Logger(StripeConnectController.name);

  constructor(private stripeConnectService: StripeConnectService) {}

  /**
   * Get connected account status
   * GET /api/stripe-connect/status/:accountId
   */
  @Get("status/:accountId")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  async getAccountStatus(@Param("accountId") accountId: string) {
    return this.stripeConnectService.getAccountStatus(accountId);
  }

  /**
   * Create account link for additional onboarding
   * POST /api/stripe-connect/account-link
   */
  @Post("account-link")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  async createAccountLink(@Body("accountId") accountId: string) {
    const link = await this.stripeConnectService.createAccountLink(accountId);
    return { url: link.url };
  }

  /**
   * Get Express Dashboard login link
   * GET /api/stripe-connect/dashboard/:accountId
   */
  @Get("dashboard/:accountId")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  async getDashboardLink(@Param("accountId") accountId: string) {
    return this.stripeConnectService.getExpressDashboardLink(accountId);
  }

  /**
   * Handle Stripe Connect webhook events
   * POST /api/stripe-connect/webhook
   *
   * Handles events related to connected accounts:
   * - account.updated: Connected account details changed
   * - capability.updated: Payment capabilities changed
   * - charge.succeeded: Payment completed on connected account
   * - charge.failed: Payment failed on connected account
   * - payout.paid: ONG received payout
   * - payout.failed: Payout to ONG failed
   */
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any, @Req() req: any) {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      this.logger.warn("Webhook received without signature");
      throw new BadRequestException("Missing Stripe signature");
    }

    // Verify webhook signature
    const isValid = this.stripeConnectService.verifyWebhookSignature(
      payload,
      signature,
    );

    if (!isValid) {
      this.logger.error("Invalid webhook signature");
      throw new BadRequestException("Invalid webhook signature");
    }

    // Handle the webhook event
    try {
      const result = await this.stripeConnectService.handleWebhook(payload);
      this.logger.log(`Webhook processed: ${payload.type}`);
      return result;
    } catch (error) {
      this.logger.error(`Webhook handling failed: ${error.message}`, error);
      throw new BadRequestException(
        `Webhook processing failed: ${error.message}`,
      );
    }
  }
}
