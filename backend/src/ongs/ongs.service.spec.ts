import { Test, TestingModule } from '@nestjs/testing';
import { OngsService } from './ongs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, OngStatus } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateOngDto } from './dto/update-ong.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
describe('OngsService', () => {
  let service: OngsService;
  let userRepository: Repository<User>;
  let petRepository: Repository<Pet>;
  let donationRepository: Repository<Donation>;
  let appointmentRepository: Repository<Appointment>;
  const mockOng: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'ong@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    role: UserRole.ONG,
    ongName: 'Test Animal Shelter',
    phone: '+351912345678',
    location: 'Lisbon',
    instagramHandle: '@testshelter',
    profileImageUrl: 'https://example.com/image.jpg',
    ongStatus: OngStatus.APPROVED,
    allowAppointments: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockPetRepository = {
    count: jest.fn(),
  };
  const mockDonationRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };
  const mockAppointmentRepository = {
    count: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OngsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: mockPetRepository,
        },
        {
          provide: getRepositoryToken(Donation),
          useValue: mockDonationRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepository,
        },
      ],
    }).compile();
    service = module.get<OngsService>(OngsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    petRepository = module.get<Repository<Pet>>(getRepositoryToken(Pet));
    donationRepository = module.get<Repository<Donation>>(getRepositoryToken(Donation));
    appointmentRepository = module.get<Repository<Appointment>>(
      getRepositoryToken(Appointment),
    );
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  // ==================== LISTING ONGS ====================
  describe('findAll', () => {
    it('should list all approved ONGs', async () => {
      const mockOngs = [
        { ...mockOng, id: '1', ongName: 'ONG 1' },
        { ...mockOng, id: '2', ongName: 'ONG 2' },
      ];
      mockUserRepository.find.mockResolvedValue(mockOngs);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { role: UserRole.ONG },
        select: ['id', 'email', 'ongName', 'phone', 'location', 'instagramHandle', 'createdAt'],
        order: { createdAt: 'DESC' },
      });
    });
    it('should return empty array when no ONGs exist', async () => {
      mockUserRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
    it('should order by creation date descending', async () => {
      mockUserRepository.find.mockResolvedValue([]);
      await service.findAll();
      expect(mockUserRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });
  // ==================== FIND ONG BY ID ====================
  describe('findOne', () => {
    it('should find ONG by ID with relations', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      const result = await service.findOne(mockOng.id as string);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockOng.id);
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOng.id, role: UserRole.ONG },
        relations: ['pets', 'donations'],
      });
    });
    it('should throw NotFoundException when ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'ONG with ID non-existent-id not found',
      );
    });
    it('should not return passwordHash', async () => {
      const ongWithPassword = { ...mockOng, passwordHash: 'hashed-password' };
      mockUserRepository.findOne.mockResolvedValue(ongWithPassword);
      const result = await service.findOne(mockOng.id as string);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
  // ==================== MY ONG ====================
  describe('getMyOng', () => {
    it('should get current user ONG details', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      const result = await service.getMyOng(mockOng.id as string);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockOng.id);
      expect(result).not.toHaveProperty('passwordHash');
    });
    it('should throw NotFoundException when user is not an ONG', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.getMyOng('regular-user-id')).rejects.toThrow(NotFoundException);
      await expect(service.getMyOng('regular-user-id')).rejects.toThrow(
        'ONG not found for this user',
      );
    });
  });
  describe('findByUserId', () => {
    it('should return user ONG in array format', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      const result = await service.findByUserId(mockOng.id as string);
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockOng.id);
    });
    it('should return empty array when user has no ONG', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.findByUserId('regular-user-id');
      expect(result).toEqual([]);
    });
  });
  // ==================== ONG STATISTICS ====================
  describe('getOngStats', () => {
    it('should return statistics for own ONG', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockPetRepository.count.mockResolvedValueOnce(15); // totalPets
      mockPetRepository.count.mockResolvedValueOnce(10); // availablePets
      mockPetRepository.count.mockResolvedValueOnce(3); // adoptedPets
      mockAppointmentRepository.count.mockResolvedValueOnce(20); // totalAppointments
      mockAppointmentRepository.count.mockResolvedValueOnce(5); // pendingAppointments
      const mockDonations = [
        { amount: 50, createdAt: new Date(), paymentStatus: 'completed' },
        { amount: 100, createdAt: new Date(), paymentStatus: 'completed' },
      ];
      mockDonationRepository.find.mockResolvedValue(mockDonations);
      const result = await service.getOngStats(mockOng.id as string, mockOng.id as string);
      expect(result).toEqual({
        totalPets: 15,
        availablePets: 10,
        adoptedPets: 3,
        totalAppointments: 20,
        pendingAppointments: 5,
        totalDonations: 150,
        monthlyDonations: 150,
        donationCount: 2,
      });
    });
    it('should allow admin to view any ONG statistics', async () => {
      const adminUser = { ...mockOng, id: 'admin-id', role: UserRole.ADMIN };
      mockUserRepository.findOne.mockResolvedValueOnce(mockOng);
      mockUserRepository.findOne.mockResolvedValueOnce(adminUser);
      mockPetRepository.count.mockResolvedValue(0);
      mockAppointmentRepository.count.mockResolvedValue(0);
      mockDonationRepository.find.mockResolvedValue([]);
      const result = await service.getOngStats(mockOng.id as string, 'admin-id');
      expect(result).toBeDefined();
    });
    it('should throw ForbiddenException when user is not owner or admin', async () => {
      const otherUser = { ...mockOng, id: 'other-id', role: UserRole.USER };
      mockUserRepository.findOne.mockResolvedValueOnce(mockOng);
      mockUserRepository.findOne.mockResolvedValueOnce(otherUser);
      await expect(service.getOngStats(mockOng.id as string, 'other-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('should throw NotFoundException when ONG does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.getOngStats('non-existent-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should calculate monthly donations correctly', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockPetRepository.count.mockResolvedValue(0);
      mockAppointmentRepository.count.mockResolvedValue(0);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const mockDonations = [
        { amount: 50, createdAt: now, paymentStatus: 'completed' },
        { amount: 100, createdAt: lastMonth, paymentStatus: 'completed' },
      ];
      mockDonationRepository.find.mockResolvedValue(mockDonations);
      const result = await service.getOngStats(mockOng.id as string, mockOng.id as string);
      expect(result.totalDonations).toBe(150);
      expect(result.monthlyDonations).toBe(50); // Only current month
    });
  });
  // ==================== UPDATE ONG ====================
  describe('update', () => {
    const updateDto: UpdateOngDto = {
      ongName: 'Updated Shelter Name',
      phone: '+351987654321',
      location: 'Porto',
    };
    it('should update own ONG successfully', async () => {
      const updatedOng = { ...mockOng, ...updateDto };
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockUserRepository.save.mockResolvedValue(updatedOng);
      const result = await service.update(
        mockOng.id as string,
        updateDto,
        mockOng.id as string,
      );
      expect(result.ongName).toBe(updateDto.ongName);
      expect(result).not.toHaveProperty('passwordHash');
    });
    it('should allow admin to update any ONG', async () => {
      const adminUser = { ...mockOng, id: 'admin-id', role: UserRole.ADMIN };
      const updatedOng = { ...mockOng, ...updateDto };
      mockUserRepository.findOne.mockResolvedValueOnce(mockOng);
      mockUserRepository.findOne.mockResolvedValueOnce(adminUser);
      mockUserRepository.save.mockResolvedValue(updatedOng);
      const result = await service.update(mockOng.id as string, updateDto, 'admin-id');
      expect(result).toBeDefined();
    });
    it('should throw ForbiddenException when user is not owner or admin', async () => {
      const otherUser = { ...mockOng, id: 'other-id', role: UserRole.USER };
      mockUserRepository.findOne.mockResolvedValueOnce(mockOng);
      mockUserRepository.findOne.mockResolvedValueOnce(otherUser);
      await expect(
        service.update(mockOng.id as string, updateDto, 'other-id'),
      ).rejects.toThrow(ForbiddenException);
    });
    it('should throw NotFoundException when ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.update('non-existent-id', updateDto, 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
  // ==================== DELETE ONG ====================
  describe('remove', () => {
    it('should delete own ONG successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockUserRepository.remove.mockResolvedValue(mockOng);
      const result = await service.remove(mockOng.id as string, mockOng.id as string);
      expect(result).toEqual({ message: 'ONG deleted successfully' });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockOng);
    });
    it('should allow admin to delete any ONG', async () => {
      const adminUser = { ...mockOng, id: 'admin-id', role: UserRole.ADMIN };
      mockUserRepository.findOne.mockResolvedValueOnce(mockOng);
      mockUserRepository.findOne.mockResolvedValueOnce(adminUser);
      mockUserRepository.remove.mockResolvedValue(mockOng);
      const result = await service.remove(mockOng.id as string, 'admin-id');
      expect(result.message).toBe('ONG deleted successfully');
    });
    it('should throw ForbiddenException when user is not owner or admin', async () => {
      const otherUser = { ...mockOng, id: 'other-id', role: UserRole.USER };
      mockUserRepository.findOne.mockResolvedValueOnce(mockOng);
      mockUserRepository.findOne.mockResolvedValueOnce(otherUser);
      await expect(service.remove(mockOng.id as string, 'other-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('should throw NotFoundException when ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('non-existent-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  // ==================== PROFILE MANAGEMENT ====================
  describe('updateMyProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      ongName: 'Updated Name',
      phone: '+351987654321',
      location: 'Porto',
      instagramHandle: '@updatedhandle',
    };
    it('should update profile successfully', async () => {
      const updatedOng = { ...mockOng, ...updateProfileDto };
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockUserRepository.save.mockResolvedValue(updatedOng);
      const result = await service.updateMyProfile(mockOng.id as string, updateProfileDto);
      expect(result.ongName).toBe(updateProfileDto.ongName);
      expect(result).not.toHaveProperty('passwordHash');
    });
    it('should throw NotFoundException when ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateMyProfile('non-existent-id', updateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('updateProfileImage', () => {
    const newImageUrl = 'https://example.com/new-image.jpg';
    it('should update profile image successfully', async () => {
      const updatedOng = { ...mockOng, profileImageUrl: newImageUrl };
      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockUserRepository.save.mockResolvedValue(updatedOng);
      const result = await service.updateProfileImage(mockOng.id as string, newImageUrl);
      expect(result.profileImageUrl).toBe(newImageUrl);
      expect(result).not.toHaveProperty('passwordHash');
    });
    it('should throw NotFoundException when ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfileImage('non-existent-id', newImageUrl),
      ).rejects.toThrow(NotFoundException);
    });
  });
  // ==================== PASSWORD CHANGE ====================
  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };
    it('should change password successfully', async () => {
      const ongWithPassword = {
        ...mockOng,
        passwordHash: await bcrypt.hash(changePasswordDto.currentPassword, 10),
      };
      mockUserRepository.findOne.mockResolvedValue(ongWithPassword);
      mockUserRepository.save.mockResolvedValue(ongWithPassword);
      const result = await service.changePassword(mockOng.id as string, changePasswordDto);
      expect(result.message).toBe('Password changed successfully');
    });
    it('should throw BadRequestException when passwords do not match', async () => {
      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'DifferentPassword123',
      };
      await expect(service.changePassword(mockOng.id as string, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw UnauthorizedException when current password is incorrect', async () => {
      const ongWithPassword = {
        ...mockOng,
        passwordHash: await bcrypt.hash('DifferentPassword', 10),
      };
      mockUserRepository.findOne.mockResolvedValue(ongWithPassword);
      await expect(
        service.changePassword(mockOng.id as string, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.changePassword('non-existent-id', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
    it('should hash new password correctly', async () => {
      const ongWithPassword = {
        ...mockOng,
        passwordHash: await bcrypt.hash(changePasswordDto.currentPassword, 10),
      };
      mockUserRepository.findOne.mockResolvedValue(ongWithPassword);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));
      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');
      await service.changePassword(mockOng.id as string, changePasswordDto);
      expect(bcryptHashSpy).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
    });
  });
});
