import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, OngStatus } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';

describe('AdminService', () => {
  let service: AdminService;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockPetRepository = {
    count: jest.fn(),
  };

  const mockDonationRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
        { provide: getRepositoryToken(Donation), useValue: mockDonationRepository },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      mockUserRepository.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await service.getAllUsers();

      expect(result).toHaveLength(2);
    });
  });

  describe('approveOng', () => {
    it('should approve ONG', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'ong-1',
        ongStatus: OngStatus.PENDING,
      });
      mockUserRepository.save.mockResolvedValue({ id: 'ong-1', ongStatus: OngStatus.APPROVED });

      const result = await service.approveOng('ong-1');

      expect(result.ongStatus).toBe(OngStatus.APPROVED);
    });
  });

  describe('getPlatformStatistics', () => {
    it('should return platform statistics', async () => {
      mockUserRepository.count.mockResolvedValue(10);
      mockPetRepository.count.mockResolvedValue(50);
      mockDonationRepository.find.mockResolvedValue([{ amount: 100 }]);

      const result = await service.getPlatformStatistics();

      expect(result.totalUsers).toBe(10);
      expect(result.totalPets).toBe(50);
    });
  });
});
