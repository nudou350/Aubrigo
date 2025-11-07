import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { OngsController } from './ongs.controller';
import { OngsService } from './ongs.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRole, OngStatus } from '../users/entities/user.entity';
import { UpdateOngDto } from './dto/update-ong.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('OngsController (Integration)', () => {
  let app: INestApplication;
  let ongsService: OngsService;
  let uploadService: UploadService;

  const mockOng = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'ong@example.com',
    role: UserRole.ONG,
    ongName: 'Test Animal Shelter',
    phone: '+351912345678',
    location: 'Lisbon',
    instagramHandle: '@testshelter',
    profileImageUrl: 'https://example.com/image.jpg',
    ongStatus: OngStatus.APPROVED,
    allowAppointments: true,
  };

  const mockOngsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getMyOng: jest.fn(),
    getOngStats: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateMyProfile: jest.fn(),
    updateProfileImage: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockUploadService = {
    uploadImage: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRoleGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OngsController],
      providers: [
        {
          provide: OngsService,
          useValue: mockOngsService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    ongsService = moduleFixture.get<OngsService>(OngsService);
    uploadService = moduleFixture.get<UploadService>(UploadService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== GET /ongs ====================

  describe('GET /ongs', () => {
    it('should return list of all ONGs', async () => {
      const mockOngs = [
        { id: '1', ongName: 'ONG 1', location: 'Lisbon' },
        { id: '2', ongName: 'ONG 2', location: 'Porto' },
      ];

      mockOngsService.findAll.mockResolvedValue(mockOngs);

      const response = await request(app.getHttpServer()).get('/ongs').expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockOngsService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no ONGs exist', async () => {
      mockOngsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/ongs').expect(200);

      expect(response.body).toEqual([]);
    });
  });

  // ==================== GET /ongs/:id ====================

  describe('GET /ongs/:id', () => {
    it('should return ONG details by ID', async () => {
      mockOngsService.findOne.mockResolvedValue(mockOng);

      const response = await request(app.getHttpServer())
        .get(`/ongs/${mockOng.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('ongName');
      expect(mockOngsService.findOne).toHaveBeenCalledWith(mockOng.id);
    });

    it('should return 404 when ONG not found', async () => {
      mockOngsService.findOne.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found',
      });

      await request(app.getHttpServer()).get('/ongs/non-existent-id').expect(404);
    });
  });

  // ==================== GET /ongs/my-ong ====================

  describe('GET /ongs/my-ong', () => {
    it('should return current user ONG details', async () => {
      mockOngsService.getMyOng.mockResolvedValue(mockOng);

      const response = await request(app.getHttpServer()).get('/ongs/my-ong').expect(200);

      expect(response.body).toHaveProperty('ongName');
      expect(response.body.id).toBe(mockOng.id);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer()).get('/ongs/my-ong').expect(401);
    });

    it('should return 403 for non-ONG users', async () => {
      mockRoleGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer()).get('/ongs/my-ong').expect(403);
    });

    it('should return 404 when user has no ONG', async () => {
      mockOngsService.getMyOng.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found for this user',
      });

      await request(app.getHttpServer()).get('/ongs/my-ong').expect(404);
    });
  });

  // ==================== GET /ongs/my-ong/stats ====================

  describe('GET /ongs/my-ong/stats', () => {
    it('should return ONG statistics', async () => {
      const mockStats = {
        totalPets: 15,
        availablePets: 10,
        adoptedPets: 3,
        totalAppointments: 20,
        pendingAppointments: 5,
        totalDonations: 1500,
        monthlyDonations: 500,
        donationCount: 25,
      };

      mockOngsService.getMyOng.mockResolvedValue(mockOng);
      mockOngsService.getOngStats.mockResolvedValue(mockStats);

      const response = await request(app.getHttpServer())
        .get('/ongs/my-ong/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalPets', 15);
      expect(response.body).toHaveProperty('totalDonations', 1500);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer()).get('/ongs/my-ong/stats').expect(401);
    });
  });

  // ==================== GET /ongs/:id/stats ====================

  describe('GET /ongs/:id/stats', () => {
    it('should return statistics for specified ONG', async () => {
      const mockStats = {
        totalPets: 10,
        availablePets: 8,
        adoptedPets: 2,
        totalAppointments: 15,
        pendingAppointments: 3,
        totalDonations: 1000,
        monthlyDonations: 300,
        donationCount: 20,
      };

      mockOngsService.getOngStats.mockResolvedValue(mockStats);

      const response = await request(app.getHttpServer())
        .get(`/ongs/${mockOng.id}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPets');
      expect(mockOngsService.getOngStats).toHaveBeenCalledWith(mockOng.id, undefined);
    });

    it('should return 403 when user lacks permission', async () => {
      mockOngsService.getOngStats.mockRejectedValue({
        statusCode: 403,
        message: 'You do not have permission to view these statistics',
      });

      await request(app.getHttpServer())
        .get(`/ongs/${mockOng.id}/stats`)
        .expect(403);
    });

    it('should return 404 when ONG not found', async () => {
      mockOngsService.getOngStats.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found',
      });

      await request(app.getHttpServer())
        .get('/ongs/non-existent-id/stats')
        .expect(404);
    });
  });

  // ==================== PUT /ongs/:id ====================

  describe('PUT /ongs/:id', () => {
    const updateDto: UpdateOngDto = {
      ongName: 'Updated Shelter',
      phone: '+351987654321',
      location: 'Porto',
    };

    it('should update ONG successfully', async () => {
      const updatedOng = { ...mockOng, ...updateDto };
      mockOngsService.update.mockResolvedValue(updatedOng);

      const response = await request(app.getHttpServer())
        .put(`/ongs/${mockOng.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.ongName).toBe(updateDto.ongName);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .put(`/ongs/${mockOng.id}`)
        .send(updateDto)
        .expect(401);
    });

    it('should return 403 when user lacks permission', async () => {
      mockOngsService.update.mockRejectedValue({
        statusCode: 403,
        message: 'You do not have permission to update this ONG',
      });

      await request(app.getHttpServer())
        .put(`/ongs/${mockOng.id}`)
        .send(updateDto)
        .expect(403);
    });

    it('should return 404 when ONG not found', async () => {
      mockOngsService.update.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found',
      });

      await request(app.getHttpServer())
        .put('/ongs/non-existent-id')
        .send(updateDto)
        .expect(404);
    });
  });

  // ==================== DELETE /ongs/:id ====================

  describe('DELETE /ongs/:id', () => {
    it('should delete ONG successfully', async () => {
      mockOngsService.remove.mockResolvedValue({ message: 'ONG deleted successfully' });

      const response = await request(app.getHttpServer())
        .delete(`/ongs/${mockOng.id}`)
        .expect(200);

      expect(response.body.message).toBe('ONG deleted successfully');
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer()).delete(`/ongs/${mockOng.id}`).expect(401);
    });

    it('should return 403 when user lacks permission', async () => {
      mockOngsService.remove.mockRejectedValue({
        statusCode: 403,
        message: 'You do not have permission to delete this ONG',
      });

      await request(app.getHttpServer()).delete(`/ongs/${mockOng.id}`).expect(403);
    });

    it('should return 404 when ONG not found', async () => {
      mockOngsService.remove.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found',
      });

      await request(app.getHttpServer()).delete('/ongs/non-existent-id').expect(404);
    });
  });

  // ==================== PUT /ongs/my-ong/profile ====================

  describe('PUT /ongs/my-ong/profile', () => {
    const updateProfileDto: UpdateProfileDto = {
      ongName: 'Updated Name',
      phone: '+351987654321',
      location: 'Porto',
    };

    it('should update profile successfully', async () => {
      const updatedOng = { ...mockOng, ...updateProfileDto };
      mockOngsService.updateMyProfile.mockResolvedValue(updatedOng);

      const response = await request(app.getHttpServer())
        .put('/ongs/my-ong/profile')
        .send(updateProfileDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.ong.ongName).toBe(updateProfileDto.ongName);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .put('/ongs/my-ong/profile')
        .send(updateProfileDto)
        .expect(401);
    });

    it('should return 404 when ONG not found', async () => {
      mockOngsService.updateMyProfile.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found',
      });

      await request(app.getHttpServer())
        .put('/ongs/my-ong/profile')
        .send(updateProfileDto)
        .expect(404);
    });
  });

  // ==================== POST /ongs/my-ong/profile-image ====================

  describe('POST /ongs/my-ong/profile-image', () => {
    it('should upload profile image successfully', async () => {
      const imageUrl = 'https://example.com/new-image.jpg';
      const updatedOng = { ...mockOng, profileImageUrl: imageUrl };

      mockUploadService.uploadImage.mockResolvedValue(imageUrl);
      mockOngsService.updateProfileImage.mockResolvedValue(updatedOng);

      const response = await request(app.getHttpServer())
        .post('/ongs/my-ong/profile-image')
        .attach('profileImage', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile image uploaded successfully');
      expect(response.body).toHaveProperty('profileImageUrl', imageUrl);
    });

    it('should return 400 when no file provided', async () => {
      await request(app.getHttpServer()).post('/ongs/my-ong/profile-image').expect(400);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .post('/ongs/my-ong/profile-image')
        .attach('profileImage', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(401);
    });

    it('should return 400 for invalid file type', async () => {
      mockUploadService.uploadImage.mockRejectedValue({
        statusCode: 400,
        message: 'Invalid file type',
      });

      await request(app.getHttpServer())
        .post('/ongs/my-ong/profile-image')
        .attach('profileImage', Buffer.from('fake-data'), 'test.txt')
        .expect(400);
    });
  });

  // ==================== PUT /ongs/my-ong/change-password ====================

  describe('PUT /ongs/my-ong/change-password', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };

    it('should change password successfully', async () => {
      mockOngsService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const response = await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
        .send(changePasswordDto)
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
        .send(changePasswordDto)
        .expect(401);
    });

    it('should return 400 for mismatched passwords', async () => {
      mockOngsService.changePassword.mockRejectedValue({
        statusCode: 400,
        message: 'New password and confirm password do not match',
      });

      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'DifferentPassword',
      };

      await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 for incorrect current password', async () => {
      mockOngsService.changePassword.mockRejectedValue({
        statusCode: 401,
        message: 'Current password is incorrect',
      });

      await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
        .send(changePasswordDto)
        .expect(401);
    });

    it('should return 404 when user not found', async () => {
      mockOngsService.changePassword.mockRejectedValue({
        statusCode: 404,
        message: 'User not found',
      });

      await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
        .send(changePasswordDto)
        .expect(404);
    });
  });

  // ==================== SECURITY & EDGE CASES ====================

  describe('Security & Edge Cases', () => {
    it('should not expose sensitive data in responses', async () => {
      const ongWithPassword = { ...mockOng, passwordHash: 'hashed-password' };
      mockOngsService.findOne.mockResolvedValue(ongWithPassword);

      const response = await request(app.getHttpServer())
        .get(`/ongs/${mockOng.id}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should handle concurrent update requests', async () => {
      const updateDto = { ongName: 'Updated' };
      const updatedOng = { ...mockOng, ongName: 'Updated' };

      mockOngsService.update.mockResolvedValue(updatedOng);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).put(`/ongs/${mockOng.id}`).send(updateDto),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should validate Content-Type for file uploads', async () => {
      await request(app.getHttpServer())
        .post('/ongs/my-ong/profile-image')
        .set('Content-Type', 'application/json')
        .send({ fake: 'data' })
        .expect(400);
    });
  });
});
