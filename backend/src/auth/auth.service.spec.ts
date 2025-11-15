import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { User, UserRole, OngStatus } from "../users/entities/user.entity";
import { PasswordResetToken } from "./entities/password-reset-token.entity";
import { EmailService } from "../email/email.service";
import { CountryService } from "../country/country.service";
import { RegisterDto } from "./dto/register.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { RegisterOngDto } from "./dto/register-ong.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Ong } from "../ongs/entities/ong.entity";
import { StripeConnectService } from "../stripe-connect/stripe-connect.service";
describe("AuthService", () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let resetTokenRepository: Repository<PasswordResetToken>;
  let jwtService: JwtService;
  let emailService: EmailService;
  let configService: ConfigService;
  const mockUser: Partial<User> = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    passwordHash: "$2b$10$abcdefghijklmnopqrstuv", // Mock hashed password
    role: UserRole.ONG,
    ongName: "Test ONG",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockOngRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockResetTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
  };
  const mockEmailService = {
    sendWelcomeEmailToOng: jest.fn(),
    sendOngRegistrationNotificationToAdmin: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn(),
  };
  const mockCountryService = {
    detectCountryFromRequest: jest.fn().mockResolvedValue("PT"),
  };
  const mockStripeConnectService = {
    createConnectedAccount: jest.fn(),
    createAccountLink: jest.fn(),
    retrieveAccount: jest.fn(),
    updateAccount: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockResetTokenRepository,
        },
        {
          provide: getRepositoryToken(Ong),
          useValue: mockOngRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CountryService,
          useValue: mockCountryService,
        },
        {
          provide: StripeConnectService,
          useValue: mockStripeConnectService,
        },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    resetTokenRepository = module.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    // Reset all mocks before each test
    jest.clearAllMocks();
  });
  it("should be defined", () => {
    expect(service).toBeDefined();
  });
  // ==================== REGISTRATION TESTS ====================
  describe("register (ONG)", () => {
    const registerDto: RegisterDto = {
      email: "newong@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
      ongName: "New ONG",
    };
    it("should create user with valid data", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      const result = await service.register(registerDto);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty("message", "Registration successful");
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken", "mock-jwt-token");
    });
    it("should reject duplicate email", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        "Email already registered",
      );
    });
    it("should reject mismatched passwords", async () => {
      const invalidDto = {
        ...registerDto,
        confirmPassword: "DifferentPassword123",
      };
      await expect(service.register(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(invalidDto)).rejects.toThrow(
        "Passwords do not match",
      );
    });
    it("should hash password correctly", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((user) => user);
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      const bcryptHashSpy = jest.spyOn(bcrypt, "hash");
      await service.register(registerDto);
      expect(bcryptHashSpy).toHaveBeenCalledWith(registerDto.password, 10);
    });
    it("should not return password in response", async () => {
      const savedUser = {
        ...mockUser,
        passwordHash: "hashed-password",
        email: registerDto.email,
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      const result = await service.register(registerDto);
      expect(result.user).not.toHaveProperty("passwordHash");
    });
  });
  describe("registerUser", () => {
    const registerUserDto: RegisterUserDto = {
      email: "user@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
      firstName: "John",
      lastName: "Doe",
      phone: "+351912345678",
      location: "Lisbon",
    };
    it("should create regular user with valid data", async () => {
      const savedUser = {
        ...mockUser,
        email: registerUserDto.email,
        role: UserRole.USER,
        firstName: registerUserDto.firstName,
        lastName: registerUserDto.lastName,
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      const result = await service.registerUser(registerUserDto);
      expect(result.user.role).toBe(UserRole.USER);
      expect(result.message).toBe("User registration successful");
      expect(result.accessToken).toBe("mock-jwt-token");
    });
    it("should reject duplicate email for user registration", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      await expect(service.registerUser(registerUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  describe("registerOng", () => {
    const registerOngDto: RegisterOngDto = {
      email: "ong@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
      ongName: "Animal Shelter",
      phone: "+351912345678",
      hasWhatsapp: true,
      instagramHandle: "@animalshelter",
      city: "Porto",
      location: "Porto, Portugal",
    };
    it("should create ONG user with PENDING status", async () => {
      const savedOng = {
        ...mockUser,
        email: registerOngDto.email,
        role: UserRole.ONG,
        ongName: registerOngDto.ongName,
        ongStatus: OngStatus.PENDING,
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedOng);
      mockUserRepository.save.mockResolvedValue(savedOng);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      mockEmailService.sendWelcomeEmailToOng.mockResolvedValue(true);
      mockEmailService.sendOngRegistrationNotificationToAdmin.mockResolvedValue(
        true,
      );
      const result = await service.registerOng(registerOngDto);
      expect(result.user.ongStatus).toBe(OngStatus.PENDING);
      expect(mockEmailService.sendWelcomeEmailToOng).toHaveBeenCalledWith(
        registerOngDto.email,
        registerOngDto.ongName,
      );
      expect(
        mockEmailService.sendOngRegistrationNotificationToAdmin,
      ).toHaveBeenCalled();
    });
    it("should use city as fallback for location", async () => {
      const dtoWithoutLocation = { ...registerOngDto, location: undefined };
      const savedOng = {
        ...mockUser,
        email: registerOngDto.email,
        location: registerOngDto.city,
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedOng);
      mockUserRepository.save.mockResolvedValue(savedOng);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      mockEmailService.sendWelcomeEmailToOng.mockResolvedValue(true);
      mockEmailService.sendOngRegistrationNotificationToAdmin.mockResolvedValue(
        true,
      );
      await service.registerOng(dtoWithoutLocation);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          location: registerOngDto.city,
        }),
      );
    });
  });
  // ==================== LOGIN TESTS ====================
  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "SecurePass123",
    };
    it("should login successfully with correct credentials", async () => {
      const user = {
        ...mockUser,
        passwordHash: await bcrypt.hash(loginDto.password, 10),
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      const result = await service.login(loginDto);
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken", "mock-jwt-token");
      expect(result.user).not.toHaveProperty("passwordHash");
    });
    it("should reject non-existent email", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "Invalid credentials",
      );
    });
    it("should reject incorrect password", async () => {
      const user = {
        ...mockUser,
        passwordHash: await bcrypt.hash("WrongPassword123", 10),
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "Invalid credentials",
      );
    });
    it("should generate valid JWT token", async () => {
      const user = {
        ...mockUser,
        passwordHash: await bcrypt.hash(loginDto.password, 10),
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      await service.login(loginDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });
    it("should include userId and email in JWT payload", async () => {
      const user = {
        ...mockUser,
        passwordHash: await bcrypt.hash(loginDto.password, 10),
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");
      await service.login(loginDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.id,
          email: user.email,
        }),
      );
    });
  });
  // ==================== PASSWORD RESET TESTS ====================
  describe("forgotPassword", () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: "test@example.com",
    };
    it("should send reset email when user exists", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockResetTokenRepository.create.mockImplementation((token) => token);
      mockResetTokenRepository.save.mockImplementation((token) =>
        Promise.resolve(token),
      );
      mockConfigService.get.mockReturnValue("http://localhost:4200");
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
      const result = await service.forgotPassword(forgotPasswordDto);
      expect(mockResetTokenRepository.save).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toBe(
        "If this email exists, a password reset link will be sent.",
      );
    });
    it("should not reveal if email does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.forgotPassword(forgotPasswordDto);
      expect(result.message).toBe(
        "If this email exists, a password reset link will be sent.",
      );
      expect(mockResetTokenRepository.save).not.toHaveBeenCalled();
    });
    it("should generate unique and secure token", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockResetTokenRepository.create.mockImplementation((token) => token);
      mockResetTokenRepository.save.mockImplementation((token) =>
        Promise.resolve(token),
      );
      mockConfigService.get.mockReturnValue("http://localhost:4200");
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
      await service.forgotPassword(forgotPasswordDto);
      const createCall = mockResetTokenRepository.create.mock.calls[0][0];
      expect(createCall.token).toBeDefined();
      expect(createCall.token.length).toBeGreaterThan(32);
    });
    it("should set token expiration to 1 hour", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockResetTokenRepository.create.mockImplementation((token) => token);
      mockResetTokenRepository.save.mockImplementation((token) =>
        Promise.resolve(token),
      );
      mockConfigService.get.mockReturnValue("http://localhost:4200");
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
      const beforeCall = new Date();
      await service.forgotPassword(forgotPasswordDto);
      const afterCall = new Date();
      const createCall = mockResetTokenRepository.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt;
      const expectedMin = new Date(beforeCall.getTime() + 59 * 60 * 1000);
      const expectedMax = new Date(afterCall.getTime() + 61 * 60 * 1000);
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });
  describe("resetPassword", () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: "valid-reset-token",
      newPassword: "NewSecurePass123",
      confirmPassword: "NewSecurePass123",
    };
    it("should reset password with valid token", async () => {
      const resetToken = {
        id: "1",
        token: resetPasswordDto.token,
        userId: mockUser.id,
        used: false,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        user: mockUser as User,
      };
      mockResetTokenRepository.findOne.mockResolvedValue(resetToken);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockResetTokenRepository.save.mockResolvedValue({
        ...resetToken,
        used: true,
      });
      const result = await service.resetPassword(resetPasswordDto);
      expect(result.message).toContain("Password reset successful");
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockResetTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
    });
    it("should reject expired token", async () => {
      const expiredToken = {
        id: "1",
        token: resetPasswordDto.token,
        userId: mockUser.id,
        used: false,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        user: mockUser as User,
      };
      mockResetTokenRepository.findOne.mockResolvedValue(null);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        "Invalid or expired reset token",
      );
    });
    it("should reject already used token", async () => {
      mockResetTokenRepository.findOne.mockResolvedValue(null);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
    it("should reject mismatched new passwords", async () => {
      const invalidDto = {
        ...resetPasswordDto,
        confirmPassword: "DifferentPassword123",
      };
      await expect(service.resetPassword(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(invalidDto)).rejects.toThrow(
        "Passwords do not match",
      );
    });
    it("should hash new password", async () => {
      const resetToken = {
        id: "1",
        token: resetPasswordDto.token,
        userId: mockUser.id,
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
        user: { ...mockUser } as User,
      };
      mockResetTokenRepository.findOne.mockResolvedValue(resetToken);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockResetTokenRepository.save.mockResolvedValue({
        ...resetToken,
        used: true,
      });
      const bcryptHashSpy = jest.spyOn(bcrypt, "hash");
      await service.resetPassword(resetPasswordDto);
      expect(bcryptHashSpy).toHaveBeenCalledWith(
        resetPasswordDto.newPassword,
        10,
      );
    });
  });
  // ==================== USER VALIDATION TESTS ====================
  describe("validateUser", () => {
    it("should validate and return user by ID", async () => {
      const user = { ...mockUser, passwordHash: "hashed-password" };
      mockUserRepository.findOne.mockResolvedValue(user);
      const result = await service.validateUser(mockUser.id as string);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result).not.toHaveProperty("passwordHash");
    });
    it("should throw UnauthorizedException for invalid user ID", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.validateUser("invalid-id")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
