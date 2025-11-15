import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { DonationsService } from "./donations.service";
import { CreateDonationDto } from "./dto/create-donation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Donations")
@Controller("donations")
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 donations per hour per IP
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a donation (Manual payment with instructions)",
    description:
      "Create a donation and receive manual payment instructions. Rate limited to 5 per hour per IP.",
  })
  @ApiResponse({
    status: 201,
    description:
      "Donation created successfully. Returns payment instructions for completing the donation.",
  })
  @ApiResponse({ status: 400, description: "Bad request or invalid payment method" })
  @ApiResponse({ status: 429, description: "Too many requests - rate limit exceeded" })
  async createDonation(@Body() createDonationDto: CreateDonationDto) {
    return this.donationsService.createDonation(createDonationDto);
  }
  @Get(":id/status")
  @ApiOperation({ summary: "Check donation payment status" })
  @ApiResponse({ status: 200, description: "Returns payment status" })
  @ApiResponse({ status: 404, description: "Donation not found" })
  async checkPaymentStatus(@Param("id") id: string) {
    return this.donationsService.checkPaymentStatus(id);
  }

  @Get("ong/:ongId/pending")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get pending donations for an ONG (awaiting manual confirmation)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns list of pending donations",
  })
  async getPendingDonations(@Param("ongId") ongId: string) {
    return this.donationsService.getPendingDonations(ongId);
  }

  @Patch(":id/confirm")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Confirm a donation as received (ONG admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "Donation confirmed successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Donation not found or access denied",
  })
  async confirmDonation(@Param("id") id: string, @Req() req: any) {
    // Get ONG ID from authenticated user
    const ongId = req.user.ongId || req.user.id;
    return this.donationsService.confirmDonation(id, ongId);
  }

  @Post("webhook/:gateway")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Payment gateway webhook endpoint",
    description:
      "Receives payment status updates from payment gateways (Stripe, EBANX, PagSeguro)",
  })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  async handleWebhook(
    @Param("gateway") gateway: string,
    @Body() payload: any,
    @Req() req: any,
  ) {
    // Get signature from headers (different for each gateway)
    const signature =
      req.headers["stripe-signature"] || // Stripe
      req.headers["x-ebanx-signature"] || // EBANX
      req.headers["x-pagseguro-signature"] || // PagSeguro
      "";

    return this.donationsService.handleWebhook(gateway, payload, signature);
  }
  @Get("ong/:ongId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get donations for an ONG (authenticated)" })
  @ApiResponse({
    status: 200,
    description: "Returns donation history and statistics",
  })
  async getDonationsByOng(@Param("ongId") ongId: string) {
    return this.donationsService.getDonationsByOng(ongId);
  }
}
