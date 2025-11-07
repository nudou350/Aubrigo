import { Test, TestingModule } from '@nestjs/testing';
import { DonationsService } from './donations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation, PaymentStatus, DonationType } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { NotFoundException } from '@nestjs/common';

describe('DonationsService', () => {
  let service: DonationsService;

  const mockDonationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockEmailService = {
    sendDonationReceipt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: getRepositoryToken(Donation), useValue: mockDonationRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create donation successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'ong-1' });
      mockDonationRepository.create.mockReturnValue({});
      mockDonationRepository.save.mockResolvedValue({
        id: 'don-1',
        amount: 50,
        paymentStatus: PaymentStatus.PENDING,
      });

      const result = await service.create({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@test.com',
        amount: 50,
        donationType: DonationType.ONE_TIME,
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(50);
    });

    it('should throw NotFoundException if ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          ongId: 'invalid',
          donorName: 'John',
          donorEmail: 'john@test.com',
          amount: 50,
          donationType: DonationType.ONE_TIME,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOng', () => {
    it('should return ONG donations', async () => {
      mockDonationRepository.find.mockResolvedValue([
        { id: '1', amount: 50 },
        { id: '2', amount: 100 },
      ]);

      const result = await service.findByOng('ong-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('getStatistics', () => {
    it('should calculate donation statistics', async () => {
      mockDonationRepository.find.mockResolvedValue([
        { amount: 50, paymentStatus: PaymentStatus.COMPLETED },
        { amount: 100, paymentStatus: PaymentStatus.COMPLETED },
      ]);

      const result = await service.getStatistics('ong-1');

      expect(result.totalAmount).toBe(150);
      expect(result.donationCount).toBe(2);
    });
  });
});
