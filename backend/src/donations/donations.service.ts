import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { MBWayService } from './services/mbway.service';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    private mbwayService: MBWayService,
  ) {}

  async createDonation(createDonationDto: CreateDonationDto) {
    const { paymentMethod, ...donationData } = createDonationDto;

    // Create donation record
    const donation = this.donationRepository.create({
      ...donationData,
      paymentMethod,
      paymentStatus: 'pending',
    });

    const savedDonation = await this.donationRepository.save(donation);

    // Handle different payment methods
    if (paymentMethod === 'mbway') {
      return this.handleMBWayPayment(savedDonation, createDonationDto);
    } else if (paymentMethod === 'stripe') {
      return this.handleStripePayment(savedDonation, createDonationDto);
    } else if (paymentMethod === 'multibanco') {
      return this.handleMultibancoPayment(savedDonation, createDonationDto);
    }

    throw new BadRequestException('Invalid payment method');
  }

  private async handleMBWayPayment(donation: Donation, dto: CreateDonationDto) {
    if (!dto.phoneNumber) {
      throw new BadRequestException('Phone number is required for MB Way payment');
    }

    // Create MB Way payment request
    const mbwayPayment = await this.mbwayService.createPaymentRequest({
      amount: donation.amount,
      phoneNumber: dto.phoneNumber,
      reference: donation.id,
      description: `Donation to ${donation.ongId} - Pet SOS`,
    });

    // Update donation with MB Way transaction ID
    donation.stripePaymentId = mbwayPayment.transactionId; // Reusing this field for transaction ID
    await this.donationRepository.save(donation);

    return {
      message: 'MB Way payment request created',
      donation: {
        id: donation.id,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
        paymentStatus: donation.paymentStatus,
      },
      mbway: {
        transactionId: mbwayPayment.transactionId,
        reference: mbwayPayment.reference,
        qrCode: mbwayPayment.qrCodeDataUrl,
        phoneNumber: mbwayPayment.phoneNumber,
        expiresAt: mbwayPayment.expiresAt,
        instructions: [
          '1. Abra a aplicação MB Way no seu telemóvel',
          '2. Escaneie o código QR apresentado',
          '3. Confirme o pagamento na aplicação',
          '4. Aguarde a confirmação',
        ],
      },
    };
  }

  private async handleStripePayment(donation: Donation, dto: CreateDonationDto) {
    // TODO: Implement Stripe payment
    // This would integrate with Stripe API
    return {
      message: 'Stripe payment - To be implemented',
      donation: {
        id: donation.id,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
      },
    };
  }

  private async handleMultibancoPayment(donation: Donation, dto: CreateDonationDto) {
    // TODO: Implement Multibanco payment
    // This would generate Multibanco reference
    return {
      message: 'Multibanco payment - To be implemented',
      donation: {
        id: donation.id,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
      },
    };
  }

  async checkPaymentStatus(donationId: string) {
    const donation = await this.donationRepository.findOne({
      where: { id: donationId },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (donation.paymentMethod === 'mbway' && donation.stripePaymentId) {
      const mbwayStatus = await this.mbwayService.checkPaymentStatus(
        donation.stripePaymentId,
      );

      if (mbwayStatus && mbwayStatus.status === 'paid') {
        // Update donation status
        donation.paymentStatus = 'completed';
        await this.donationRepository.save(donation);
      }

      return {
        donationId: donation.id,
        paymentStatus: donation.paymentStatus,
        mbwayStatus: mbwayStatus?.status || 'unknown',
      };
    }

    return {
      donationId: donation.id,
      paymentStatus: donation.paymentStatus,
    };
  }

  async confirmMBWayPayment(transactionId: string) {
    // This would be called by webhook in production
    const confirmed = await this.mbwayService.confirmPayment(transactionId);

    if (confirmed) {
      // Find and update donation
      const donation = await this.donationRepository.findOne({
        where: { stripePaymentId: transactionId },
      });

      if (donation) {
        donation.paymentStatus = 'completed';
        await this.donationRepository.save(donation);
        return { success: true, donationId: donation.id };
      }
    }

    return { success: false };
  }

  async getDonationsByOng(ongId: string) {
    const donations = await this.donationRepository.find({
      where: { ongId, paymentStatus: 'completed' },
      order: { createdAt: 'DESC' },
    });

    const totalAmount = donations.reduce(
      (sum, donation) => sum + Number(donation.amount),
      0,
    );

    const monthlyRecurring = donations
      .filter((d) => d.donationType === 'monthly')
      .reduce((sum, donation) => sum + Number(donation.amount), 0);

    return {
      donations,
      statistics: {
        totalAmount,
        totalDonations: donations.length,
        monthlyRecurring,
      },
    };
  }
}
