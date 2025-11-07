import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, OngStatus } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterOngDto } from './dto/register-ong.dto';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    registerUser: jest.fn(),
    registerOng: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation pipes like in real app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== REGISTRATION ENDPOINT TESTS ====================

  describe('POST /auth/register', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      ongName: 'Test ONG',
    };

    it('should return 201 and token on successful registration', async () => {
      const mockResponse = {
        message: 'Registration successful',
        user: {
          id: '123',
          email: validRegisterDto.email,
          ongName: validRegisterDto.ongName,
          role: UserRole.ONG,
        },
        accessToken: 'mock-jwt-token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 409 when email already exists', async () => {
      mockAuthService.register.mockRejectedValue({
        statusCode: 409,
        message: 'Email already registered',
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(409);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidDto = {
        ...validRegisterDto,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const invalidDto = {
        ...validRegisterDto,
        password: 'Short1',
        confirmPassword: 'Short1',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 400 for password without uppercase letter', async () => {
      const invalidDto = {
        ...validRegisterDto,
        password: 'securepass123',
        confirmPassword: 'securepass123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password and other fields
        })
        .expect(400);
    });
  });

  describe('POST /auth/register/user', () => {
    const validUserDto: RegisterUserDto = {
      email: 'user@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+351912345678',
      location: 'Lisbon',
    };

    it('should return 201 on successful user registration', async () => {
      const mockResponse = {
        message: 'User registration successful',
        user: {
          id: '123',
          email: validUserDto.email,
          firstName: validUserDto.firstName,
          lastName: validUserDto.lastName,
          role: UserRole.USER,
        },
        accessToken: 'mock-jwt-token',
      };

      mockAuthService.registerUser.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/register/user')
        .send(validUserDto)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.USER);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 409 for duplicate email', async () => {
      mockAuthService.registerUser.mockRejectedValue({
        statusCode: 409,
        message: 'Email already registered',
      });

      await request(app.getHttpServer())
        .post('/auth/register/user')
        .send(validUserDto)
        .expect(409);
    });
  });

  describe('POST /auth/register/ong', () => {
    const validOngDto: RegisterOngDto = {
      email: 'ong@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      ongName: 'Animal Shelter',
      phone: '+351912345678',
      hasWhatsapp: true,
      instagramHandle: '@animalshelter',
      city: 'Porto',
      location: 'Porto, Portugal',
    };

    it('should return 201 on successful ONG registration', async () => {
      const mockResponse = {
        message: 'ONG registration successful.',
        user: {
          id: '123',
          email: validOngDto.email,
          ongName: validOngDto.ongName,
          role: UserRole.ONG,
          ongStatus: OngStatus.PENDING,
        },
        accessToken: 'mock-jwt-token',
      };

      mockAuthService.registerOng.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/register/ong')
        .send(validOngDto)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.ONG);
      expect(response.body.user.ongStatus).toBe(OngStatus.PENDING);
    });

    it('should return 400 for missing ongName', async () => {
      const invalidDto = { ...validOngDto };
      delete invalidDto.ongName;

      await request(app.getHttpServer())
        .post('/auth/register/ong')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.registerOng).not.toHaveBeenCalled();
    });
  });

  // ==================== LOGIN ENDPOINT TESTS ====================

  describe('POST /auth/login', () => {
    const validLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123',
    };

    it('should return 200 and token on successful login', async () => {
      const mockResponse = {
        user: {
          id: '123',
          email: validLoginDto.email,
          role: UserRole.ONG,
          ongName: 'Test ONG',
        },
        accessToken: 'mock-jwt-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validLoginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue({
        statusCode: 401,
        message: 'Invalid credentials',
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validLoginDto)
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: 'SecurePass123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  // ==================== FORGOT PASSWORD ENDPOINT TESTS ====================

  describe('POST /auth/forgot-password', () => {
    const validForgotDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should return 200 on forgot password request', async () => {
      const mockResponse = {
        message: 'If this email exists, a password reset link will be sent.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(validForgotDto)
        .expect(200);

      expect(response.body.message).toBe(
        'If this email exists, a password reset link will be sent.',
      );
    });

    it('should return 200 even for non-existent email (security)', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'If this email exists, a password reset link will be sent.',
      });

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });

  // ==================== RESET PASSWORD ENDPOINT TESTS ====================

  describe('POST /auth/reset-password', () => {
    const validResetDto: ResetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewSecurePass123',
      confirmPassword: 'NewSecurePass123',
    };

    it('should return 200 on successful password reset', async () => {
      const mockResponse = {
        message: 'Password reset successful. You can now login with your new password.',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(validResetDto)
        .expect(200);

      expect(response.body.message).toContain('Password reset successful');
    });

    it('should return 400 for invalid token', async () => {
      mockAuthService.resetPassword.mockRejectedValue({
        statusCode: 400,
        message: 'Invalid or expired reset token',
      });

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(validResetDto)
        .expect(400);
    });

    it('should return 400 for expired token', async () => {
      mockAuthService.resetPassword.mockRejectedValue({
        statusCode: 400,
        message: 'Invalid or expired reset token',
      });

      const expiredDto = {
        ...validResetDto,
        token: 'expired-token',
      };

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(expiredDto)
        .expect(400);
    });

    it('should return 400 for weak new password', async () => {
      const weakPasswordDto = {
        ...validResetDto,
        newPassword: 'weak',
        confirmPassword: 'weak',
      };

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(weakPasswordDto)
        .expect(400);

      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });

    it('should return 400 for missing token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          newPassword: 'NewSecurePass123',
          confirmPassword: 'NewSecurePass123',
        })
        .expect(400);
    });
  });

  // ==================== ADDITIONAL SECURITY TESTS ====================

  describe('Security & Edge Cases', () => {
    it('should reject requests with extra fields when forbidNonWhitelisted is enabled', async () => {
      const dtoWithExtraFields = {
        email: 'test@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        ongName: 'Test ONG',
        maliciousField: 'should-be-rejected',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(dtoWithExtraFields)
        .expect(400);
    });

    it('should handle concurrent login requests', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      mockAuthService.login.mockResolvedValue({
        user: { id: '123', email: loginDto.email },
        accessToken: 'mock-token',
      });

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should validate Content-Type header', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'text/plain')
        .send('not-json')
        .expect(400);
    });
  });
});
