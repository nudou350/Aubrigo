import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole, OngStatus } from './entities/user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let uploadService: UploadService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: UserRole.ONG,
    ongName: 'Test ONG',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+351912345678',
    location: 'Lisbon',
    profileImageUrl: 'https://example.com/image.jpg',
    ongStatus: OngStatus.APPROVED,
    allowAppointments: true,
  };

  const mockUsersService = {
    findOne: jest.fn(),
    updateProfile: jest.fn(),
    updateProfileImage: jest.fn(),
    changePassword: jest.fn(),
    findAll: jest.fn(),
    findOngById: jest.fn(),
  };

  const mockUploadService = {
    uploadImage: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
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
    usersService = moduleFixture.get<UsersService>(UsersService);
    uploadService = moduleFixture.get<UploadService>(UploadService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== GET /users (List ONGs) ====================

  describe('GET /users', () => {
    it('should return list of all ONGs', async () => {
      const mockOngs = [
        { id: '1', ongName: 'ONG 1', location: 'Lisbon', urgencyLevel: 'none' },
        { id: '2', ongName: 'ONG 2', location: 'Porto', urgencyLevel: 'urgent' },
      ];

      mockUsersService.findAll.mockResolvedValue(mockOngs);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('ongName');
      expect(mockUsersService.findAll).toHaveBeenCalledWith({});
    });

    it('should filter ONGs by search query', async () => {
      const mockOngs = [{ id: '1', ongName: 'Animal Shelter', location: 'Lisbon' }];

      mockUsersService.findAll.mockResolvedValue(mockOngs);

      await request(app.getHttpServer())
        .get('/users?search=Animal')
        .expect(200);

      expect(mockUsersService.findAll).toHaveBeenCalledWith({ search: 'Animal' });
    });

    it('should filter ONGs by location', async () => {
      const mockOngs = [{ id: '1', ongName: 'ONG 1', location: 'Porto' }];

      mockUsersService.findAll.mockResolvedValue(mockOngs);

      await request(app.getHttpServer())
        .get('/users?location=Porto')
        .expect(200);

      expect(mockUsersService.findAll).toHaveBeenCalledWith({ location: 'Porto' });
    });

    it('should support multiple filters', async () => {
      const mockOngs = [];

      mockUsersService.findAll.mockResolvedValue(mockOngs);

      await request(app.getHttpServer())
        .get('/users?search=Shelter&location=Lisbon')
        .expect(200);

      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        search: 'Shelter',
        location: 'Lisbon',
      });
    });
  });

  // ==================== GET /users/:id (Get ONG by ID) ====================

  describe('GET /users/:id', () => {
    it('should return ONG details by ID', async () => {
      const mockOngDetails = {
        ...mockUser,
        petCount: 10,
        needs: [
          { id: '1', title: 'Need food', priority: 'urgent' },
        ],
      };

      mockUsersService.findOngById.mockResolvedValue(mockOngDetails);

      const response = await request(app.getHttpServer())
        .get('/users/123')
        .expect(200);

      expect(response.body).toHaveProperty('ongName');
      expect(response.body).toHaveProperty('petCount', 10);
      expect(response.body).toHaveProperty('needs');
      expect(mockUsersService.findOngById).toHaveBeenCalledWith('123');
    });

    it('should return 404 when ONG not found', async () => {
      mockUsersService.findOngById.mockRejectedValue({
        statusCode: 404,
        message: 'ONG not found',
      });

      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .expect(404);
    });
  });

  // ==================== GET /users/profile (Authenticated) ====================

  describe('GET /users/profile', () => {
    it('should return authenticated user profile', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      // Mock the request with user context
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue({
        statusCode: 404,
        message: 'User not found',
      });

      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(404);
    });
  });

  // ==================== PUT /users/profile (Update Profile) ====================

  describe('PUT /users/profile', () => {
    const updateDto: UpdateUserProfileDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+351987654321',
      location: 'Porto',
    };

    it('should update user profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body.firstName).toBe(updateDto.firstName);
      expect(response.body.lastName).toBe(updateDto.lastName);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .put('/users/profile')
        .send(updateDto)
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        firstName: 'A', // Too short (min 2)
      };

      await request(app.getHttpServer())
        .put('/users/profile')
        .send(invalidDto)
        .expect(400);

      expect(mockUsersService.updateProfile).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.updateProfile.mockRejectedValue({
        statusCode: 404,
        message: 'User not found',
      });

      await request(app.getHttpServer())
        .put('/users/profile')
        .send(updateDto)
        .expect(404);
    });

    it('should allow partial updates', async () => {
      const partialUpdate = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.firstName).toBe('Jane');
    });
  });

  // ==================== POST /users/profile/image (Upload Image) ====================

  describe('POST /users/profile/image', () => {
    it('should upload profile image successfully', async () => {
      const imageUrl = 'https://example.com/new-image.jpg';
      const updatedUser = { ...mockUser, profileImageUrl: imageUrl };

      mockUploadService.uploadImage.mockResolvedValue(imageUrl);
      mockUsersService.updateProfileImage.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .post('/users/profile/image')
        .attach('profileImage', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile image uploaded successfully');
      expect(response.body).toHaveProperty('profileImageUrl', imageUrl);
    });

    it('should return 400 when no file provided', async () => {
      await request(app.getHttpServer())
        .post('/users/profile/image')
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .post('/users/profile/image')
        .attach('profileImage', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(401);
    });

    it('should return 400 for invalid file type', async () => {
      mockUploadService.uploadImage.mockRejectedValue({
        statusCode: 400,
        message: 'Invalid file type',
      });

      await request(app.getHttpServer())
        .post('/users/profile/image')
        .attach('profileImage', Buffer.from('fake-data'), 'test.txt')
        .expect(400);
    });

    it('should return 413 for file too large (>5MB)', async () => {
      mockUploadService.uploadImage.mockRejectedValue({
        statusCode: 413,
        message: 'File too large',
      });

      // Simulating large file
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      await request(app.getHttpServer())
        .post('/users/profile/image')
        .attach('profileImage', largeBuffer, 'large.jpg')
        .expect(413);
    });
  });

  // ==================== PUT /users/profile/password (Change Password) ====================

  describe('PUT /users/profile/password', () => {
    const changePasswordDto: ChangeUserPasswordDto = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };

    it('should change password successfully', async () => {
      mockUsersService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const response = await request(app.getHttpServer())
        .put('/users/profile/password')
        .send(changePasswordDto)
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .put('/users/profile/password')
        .send(changePasswordDto)
        .expect(401);
    });

    it('should return 400 for mismatched passwords', async () => {
      mockUsersService.changePassword.mockRejectedValue({
        statusCode: 400,
        message: 'New password and confirm password do not match',
      });

      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'DifferentPassword123',
      };

      await request(app.getHttpServer())
        .put('/users/profile/password')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 for incorrect current password', async () => {
      mockUsersService.changePassword.mockRejectedValue({
        statusCode: 401,
        message: 'Current password is incorrect',
      });

      await request(app.getHttpServer())
        .put('/users/profile/password')
        .send(changePasswordDto)
        .expect(401);
    });

    it('should return 400 for weak new password', async () => {
      const weakPasswordDto = {
        currentPassword: 'OldPassword123',
        newPassword: 'weak',
        confirmPassword: 'weak',
      };

      await request(app.getHttpServer())
        .put('/users/profile/password')
        .send(weakPasswordDto)
        .expect(400);

      expect(mockUsersService.changePassword).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .put('/users/profile/password')
        .send({
          currentPassword: 'OldPassword123',
          // Missing newPassword and confirmPassword
        })
        .expect(400);
    });
  });

  // ==================== SECURITY & EDGE CASES ====================

  describe('Security & Edge Cases', () => {
    it('should not expose sensitive data in responses', async () => {
      const userWithPassword = { ...mockUser, passwordHash: 'hashed-password' };
      mockUsersService.findOne.mockResolvedValue(userWithPassword);

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .expect(200);

      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject extra fields in update requests', async () => {
      const dtoWithExtraFields = {
        firstName: 'Jane',
        maliciousField: 'should-be-rejected',
        role: 'admin', // Should not be allowed to change role
      };

      await request(app.getHttpServer())
        .put('/users/profile')
        .send(dtoWithExtraFields)
        .expect(400);
    });

    it('should handle concurrent profile update requests', async () => {
      const updateDto = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .put('/users/profile')
            .send(updateDto),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should validate Content-Type for file uploads', async () => {
      await request(app.getHttpServer())
        .post('/users/profile/image')
        .set('Content-Type', 'application/json')
        .send({ fake: 'data' })
        .expect(400);
    });
  });
});
