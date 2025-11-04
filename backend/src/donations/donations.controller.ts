import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a donation (MB Way, Stripe, or Multibanco)' })
  @ApiResponse({
    status: 201,
    description: 'Donation created successfully. Returns payment details including QR code for MB Way.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createDonation(@Body() createDonationDto: CreateDonationDto) {
    return this.donationsService.createDonation(createDonationDto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Check donation payment status' })
  @ApiResponse({ status: 200, description: 'Returns payment status' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async checkPaymentStatus(@Param('id') id: string) {
    return this.donationsService.checkPaymentStatus(id);
  }

  @Post('mbway/confirm/:transactionId')
  @ApiOperation({
    summary: 'Confirm MB Way payment (webhook endpoint)',
    description: 'This endpoint would be called by MB Way webhook in production',
  })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  async confirmMBWayPayment(@Param('transactionId') transactionId: string) {
    return this.donationsService.confirmMBWayPayment(transactionId);
  }

  @Get('ong/:ongId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donations for an ONG (authenticated)' })
  @ApiResponse({ status: 200, description: 'Returns donation history and statistics' })
  async getDonationsByOng(@Param('ongId') ongId: string) {
    return this.donationsService.getDonationsByOng(ongId);
  }
}
