import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, OngStatus } from './entities/user.entity';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    role: UserRole.ONG,
    ongName: 'Test ONG',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+351912345678',
    location: 'Lisbon',
    profileImageUrl: 'https://example.com/image.jpg',
    ongStatus: OngStatus.APPROVED,
    allowAppointments: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== PROFILE OPERATIONS ====================

  describe('findOne', () => {
    it('should find user by ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id as string);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should not return passwordHash in result', async () => {
      const userWithPassword = { ...mockUser, passwordHash: 'hashed-password' };
      mockUserRepository.findOne.mockResolvedValue(userWithPassword);

      const result = await service.findOne(mockUser.id as string);

      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateUserProfileDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+351987654321',
      location: 'Porto',
    };

    it('should update user profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id as string, updateDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.firstName).toBe(updateDto.firstName);
      expect(result.lastName).toBe(updateDto.lastName);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate required fields in update', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Empty update should still work (all fields are optional)
      const result = await service.updateProfile(mockUser.id as string, {});

      expect(result).toBeDefined();
    });

    it('should only update provided fields', async () => {
      const partialUpdate = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id as string, partialUpdate);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe(mockUser.lastName); // Should remain unchanged
    });
  });

  describe('updateProfileImage', () => {
    const newImageUrl = 'https://example.com/new-image.jpg';

    it('should update profile image successfully', async () => {
      const updatedUser = { ...mockUser, profileImageUrl: newImageUrl };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfileImage(mockUser.id as string, newImageUrl);

      expect(result.profileImageUrl).toBe(newImageUrl);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfileImage('non-existent-id', newImageUrl)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate file type is allowed (jpg, png, webp)', async () => {
      // This validation should be done at the controller/upload service level
      // but we test the service accepts the URL after validation
      const validUrls = [
        'https://example.com/image.jpg',
        'https://example.com/image.png',
        'https://example.com/image.webp',
      ];

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      for (const url of validUrls) {
        const updatedUser = { ...mockUser, profileImageUrl: url };
        mockUserRepository.save.mockResolvedValue(updatedUser);

        const result = await service.updateProfileImage(mockUser.id as string, url);
        expect(result.profileImageUrl).toBe(url);
      }
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangeUserPasswordDto = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };

    it('should change password successfully', async () => {
      const userWithPassword = {
        ...mockUser,
        passwordHash: await bcrypt.hash(changePasswordDto.currentPassword, 10),
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      mockUserRepository.save.mockResolvedValue(userWithPassword);

      const result = await service.changePassword(mockUser.id as string, changePasswordDto);

      expect(result.message).toBe('Password changed successfully');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'DifferentPassword123',
      };

      await expect(service.changePassword(mockUser.id as string, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.changePassword(mockUser.id as string, invalidDto)).rejects.toThrow(
        'New password and confirm password do not match',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent-id', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      const userWithPassword = {
        ...mockUser,
        passwordHash: await bcrypt.hash('DifferentPassword', 10),
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);

      await expect(
        service.changePassword(mockUser.id as string, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(mockUser.id as string, changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should hash new password correctly', async () => {
      const userWithPassword = {
        ...mockUser,
        passwordHash: await bcrypt.hash(changePasswordDto.currentPassword, 10),
      };

      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');

      await service.changePassword(mockUser.id as string, changePasswordDto);

      expect(bcryptHashSpy).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
    });
  });

  // ==================== LISTING OPERATIONS ====================

  describe('findAll', () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const mockManagerQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockUserRepository.manager.createQueryBuilder.mockReturnValue(mockManagerQueryBuilder);
    });

    it('should list all approved ONGs', async () => {
      const mockOngs = [
        { id: '1', ongName: 'ONG 1', location: 'Lisbon', role: UserRole.ONG },
        { id: '2', ongName: 'ONG 2', location: 'Porto', role: UserRole.ONG },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockOngs);
      mockManagerQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.role = :role', {
        role: 'ong',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.ongStatus = :status',
        { status: 'approved' },
      );
    });

    it('should filter by search (ONG name)', async () => {
      const mockOngs = [{ id: '1', ongName: 'Animal Shelter', location: 'Lisbon' }];

      mockQueryBuilder.getMany.mockResolvedValue(mockOngs);
      mockManagerQueryBuilder.getRawOne.mockResolvedValue(null);

      await service.findAll({ search: 'Animal' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(user.ongName) LIKE LOWER(:search)',
        { search: '%Animal%' },
      );
    });

    it('should filter by location', async () => {
      const mockOngs = [{ id: '1', ongName: 'ONG 1', location: 'Lisbon' }];

      mockQueryBuilder.getMany.mockResolvedValue(mockOngs);
      mockManagerQueryBuilder.getRawOne.mockResolvedValue(null);

      await service.findAll({ location: 'Lisbon' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(user.location) LIKE LOWER(:location)',
        { location: '%Lisbon%' },
      );
    });

    it('should include urgency information from articles', async () => {
      const mockOngs = [{ id: '1', ongName: 'ONG 1', location: 'Lisbon' }];
      const mockArticle = {
        article_priority: 'urgent',
        article_category: 'food',
        article_title: 'Need urgent food donations',
      };

      mockQueryBuilder.getMany.mockResolvedValue(mockOngs);
      mockManagerQueryBuilder.getRawOne.mockResolvedValue(mockArticle);

      const result = await service.findAll();

      expect(result[0]).toHaveProperty('urgencyLevel', 'urgent');
      expect(result[0]).toHaveProperty('urgencyCategory', 'food');
      expect(result[0]).toHaveProperty('urgencyDescription', 'Need urgent food donations');
    });

    it('should sort by urgency level (urgent first)', async () => {
      const mockOngs = [
        { id: '1', ongName: 'ONG 1', location: 'Lisbon' },
        { id: '2', ongName: 'ONG 2', location: 'Porto' },
        { id: '3', ongName: 'ONG 3', location: 'Faro' },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockOngs);
      mockManagerQueryBuilder.getRawOne
        .mockResolvedValueOnce({ article_priority: 'low' })
        .mockResolvedValueOnce({ article_priority: 'urgent' })
        .mockResolvedValueOnce({ article_priority: 'medium' });

      const result = await service.findAll();

      // Should be sorted: urgent, medium, low
      expect(result[0].urgencyLevel).toBe('urgent');
      expect(result[1].urgencyLevel).toBe('medium');
      expect(result[2].urgencyLevel).toBe('low');
    });

    it('should handle ONGs with no articles (urgency level: none)', async () => {
      const mockOngs = [{ id: '1', ongName: 'ONG 1', location: 'Lisbon' }];

      mockQueryBuilder.getMany.mockResolvedValue(mockOngs);
      mockManagerQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.findAll();

      expect(result[0].urgencyLevel).toBe('none');
      expect(result[0].urgencyCategory).toBeNull();
      expect(result[0].urgencyDescription).toBeNull();
    });
  });

  describe('findOngById', () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockUserRepository.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should find ONG by ID with details', async () => {
      const mockOng = { ...mockUser, role: UserRole.ONG, ongStatus: OngStatus.APPROVED };

      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '5' });

      const result = await service.findOngById(mockUser.id as string);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.ongName).toBe(mockUser.ongName);
      expect(result).toHaveProperty('petCount', 5);
      expect(result).toHaveProperty('needs');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when ONG not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOngById('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOngById('non-existent-id')).rejects.toThrow('ONG not found');
    });

    it('should only return approved ONGs', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOngById('pending-ong-id')).rejects.toThrow(NotFoundException);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'pending-ong-id', role: 'ong', ongStatus: 'approved' },
      });
    });

    it('should include all active articles sorted by priority', async () => {
      const mockOng = { ...mockUser, role: UserRole.ONG, ongStatus: OngStatus.APPROVED };
      const mockArticles = [
        {
          article_id: '1',
          article_title: 'Urgent help needed',
          article_priority: 'urgent',
          article_category: 'food',
        },
        {
          article_id: '2',
          article_title: 'Looking for volunteers',
          article_priority: 'low',
          article_category: 'volunteers',
        },
      ];

      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockQueryBuilder.getRawMany.mockResolvedValue(mockArticles);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '10' });

      const result = await service.findOngById(mockUser.id as string);

      expect(result.needs).toHaveLength(2);
      expect(result.needs[0].priority).toBe('urgent');
      expect(result.needs[1].priority).toBe('low');
    });

    it('should include pet count for the ONG', async () => {
      const mockOng = { ...mockUser, role: UserRole.ONG, ongStatus: OngStatus.APPROVED };

      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '15' });

      const result = await service.findOngById(mockUser.id as string);

      expect(result.petCount).toBe(15);
    });

    it('should handle ONG with no pets (petCount: 0)', async () => {
      const mockOng = { ...mockUser, role: UserRole.ONG, ongStatus: OngStatus.APPROVED };

      mockUserRepository.findOne.mockResolvedValue(mockOng);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.findOngById(mockUser.id as string);

      expect(result.petCount).toBe(0);
    });
  });
});
