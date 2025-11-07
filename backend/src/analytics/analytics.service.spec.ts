import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../pets/entities/pet.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Donation } from '../donations/entities/donation.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPetRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockAppointmentRepository = {
    count: jest.fn(),
  };

  const mockDonationRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepository },
        { provide: getRepositoryToken(Donation), useValue: mockDonationRepository },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOngAnalytics', () => {
    it('should return ONG analytics', async () => {
      mockPetRepository.count.mockResolvedValue(10);
      mockAppointmentRepository.count.mockResolvedValue(20);
      mockDonationRepository.find.mockResolvedValue([{ amount: 100 }]);

      const result = await service.getOngAnalytics('ong-1');

      expect(result.totalPets).toBe(10);
      expect(result.totalAppointments).toBe(20);
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should return platform-wide analytics', async () => {
      mockPetRepository.count.mockResolvedValue(100);
      mockAppointmentRepository.count.mockResolvedValue(200);
      mockDonationRepository.find.mockResolvedValue([{ amount: 1000 }]);

      const result = await service.getPlatformAnalytics();

      expect(result.totalPets).toBe(100);
    });
  });
});
