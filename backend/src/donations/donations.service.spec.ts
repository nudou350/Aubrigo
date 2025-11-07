import { Test, TestingModule } from '@nestjs/testing';
import { DonationsService } from './donations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { MBWayService } from './services/mbway.service';
import { NotFoundException } from '@nestjs/common';

describe('DonationsService', () => {
  let service: DonationsService;

  const mockDonationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockMBWayService = {
    createPaymentRequest: jest.fn(),
    checkPaymentStatus: jest.fn(),
    confirmPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: getRepositoryToken(Donation), useValue: mockDonationRepository },
        { provide: MBWayService, useValue: mockMBWayService },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDonation', () => {
    it('should create MB Way donation successfully', async () => {
      const createdDonation = {
        id: 'don-1',
        amount: 50,
        paymentStatus: 'pending',
        paymentMethod: 'mbway',
        ongId: 'ong-1',
      };

      mockDonationRepository.create.mockReturnValue(createdDonation);
      mockDonationRepository.save
        .mockResolvedValueOnce(createdDonation)
        .mockResolvedValueOnce({ ...createdDonation, stripePaymentId: 'txn-123' });

      mockMBWayService.createPaymentRequest.mockResolvedValue({
        transactionId: 'txn-123',
        reference: 'ref-123',
        qrCodeDataUrl: 'data:image/png;base64,...',
        phoneNumber: '+351912345678',
        expiresAt: new Date(),
      });

      const result = await service.createDonation({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@test.com',
        amount: 50,
        donationType: 'one_time',
        paymentMethod: 'mbway',
        phoneNumber: '+351912345678',
      });

      expect(result).toBeDefined();
      expect(result.mbway).toBeDefined();
      expect(result.mbway.transactionId).toBe('txn-123');
    });

    it('should handle Stripe payment method', async () => {
      mockDonationRepository.create.mockReturnValue({
        id: 'don-1',
        amount: 100,
        paymentStatus: 'pending',
      });
      mockDonationRepository.save.mockResolvedValue({
        id: 'don-1',
        amount: 100,
      });

      const result = await service.createDonation({
        ongId: 'ong-1',
        donorName: 'Jane Doe',
        donorEmail: 'jane@test.com',
        amount: 100,
        donationType: 'monthly',
        paymentMethod: 'stripe',
      });

      expect(result).toBeDefined();
      expect(result.message).toContain('Stripe');
    });
  });

  describe('getDonationsByOng', () => {
    it('should return ONG donations with statistics', async () => {
      mockDonationRepository.find.mockResolvedValue([
        { id: '1', amount: 50, donationType: 'one_time', paymentStatus: 'completed' },
        { id: '2', amount: 100, donationType: 'monthly', paymentStatus: 'completed' },
      ]);

      const result = await service.getDonationsByOng('ong-1');

      expect(result.donations).toHaveLength(2);
      expect(result.statistics.totalAmount).toBe(150);
      expect(result.statistics.totalDonations).toBe(2);
      expect(result.statistics.monthlyRecurring).toBe(100);
    });
  });

  describe('checkPaymentStatus', () => {
    it('should check MB Way payment status', async () => {
      mockDonationRepository.findOne.mockResolvedValue({
        id: 'don-1',
        paymentMethod: 'mbway',
        stripePaymentId: 'txn-123',
        paymentStatus: 'pending',
      });
      mockMBWayService.checkPaymentStatus.mockResolvedValue({
        status: 'paid',
      });
      mockDonationRepository.save.mockResolvedValue({
        id: 'don-1',
        paymentStatus: 'completed',
      });

      const result = await service.checkPaymentStatus('don-1');

      expect(result.paymentStatus).toBe('completed');
      expect(result.mbwayStatus).toBe('paid');
    });

    it('should throw NotFoundException if donation not found', async () => {
      mockDonationRepository.findOne.mockResolvedValue(null);

      await expect(service.checkPaymentStatus('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmMBWayPayment', () => {
    it('should confirm MB Way payment', async () => {
      mockMBWayService.confirmPayment.mockResolvedValue(true);
      mockDonationRepository.findOne.mockResolvedValue({
        id: 'don-1',
        stripePaymentId: 'txn-123',
        paymentStatus: 'pending',
      });
      mockDonationRepository.save.mockResolvedValue({
        id: 'don-1',
        paymentStatus: 'completed',
      });

      const result = await service.confirmMBWayPayment('txn-123');

      expect(result.success).toBe(true);
      expect(result.donationId).toBe('don-1');
    });
  });
});
