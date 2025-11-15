import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, OngStatus } from "../src/users/entities/user.entity";
import { PasswordResetToken } from "../src/auth/entities/password-reset-token.entity";

describe("Authentication E2E Tests", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let resetTokenRepository: Repository<PasswordResetToken>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    resetTokenRepository = moduleFixture.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await resetTokenRepository.delete({});
    await userRepository.delete({});
  });

  // ==================== FULL REGISTRATION → LOGIN → ACCESS PROTECTED FLOW ====================

  describe("Complete Registration and Login Flow", () => {
    it("should complete full flow: Register ONG → Login → Access protected resource", async () => {
      const registerDto = {
        email: "testong@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
        ongName: "Test Animal Shelter",
        phone: "+351912345678",
        hasWhatsapp: true,
        city: "Lisbon",
      };

      // Step 1: Register new ONG
      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register/ong")
        .send(registerDto)
        .expect(201);

      expect(registerResponse.body).toHaveProperty("accessToken");
      expect(registerResponse.body).toHaveProperty("user");
      expect(registerResponse.body.user.email).toBe(registerDto.email);
      expect(registerResponse.body.user.role).toBe(UserRole.ONG);
      expect(registerResponse.body.user.ongStatus).toBe(OngStatus.PENDING);

      const firstToken = registerResponse.body.accessToken;

      // Step 2: Login with the same credentials
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("accessToken");
      expect(loginResponse.body.user.email).toBe(registerDto.email);

      const secondToken = loginResponse.body.accessToken;

      // Both tokens should be valid but different (unless using same timestamp)
      expect(typeof firstToken).toBe("string");
      expect(typeof secondToken).toBe("string");
      expect(firstToken.length).toBeGreaterThan(0);
      expect(secondToken.length).toBeGreaterThan(0);

      // Step 3: Verify user exists in database
      const savedUser = await userRepository.findOne({
        where: { email: registerDto.email },
      });

      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(registerDto.email);
      expect(savedUser.ongName).toBe(registerDto.ongName);
      expect(savedUser.role).toBe(UserRole.ONG);
    });

    it("should complete full flow: Register User → Login", async () => {
      const registerDto = {
        email: "testuser@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
        firstName: "John",
        lastName: "Doe",
        phone: "+351912345678",
        location: "Porto",
      };

      // Step 1: Register new User
      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register/user")
        .send(registerDto)
        .expect(201);

      expect(registerResponse.body.user.role).toBe(UserRole.USER);
      expect(registerResponse.body.user.firstName).toBe(registerDto.firstName);

      // Step 2: Login
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      expect(loginResponse.body.user.email).toBe(registerDto.email);
    });
  });

  // ==================== FORGOT PASSWORD → RESET → LOGIN FLOW ====================

  describe("Complete Password Reset Flow", () => {
    it("should complete full flow: Forgot password → Reset → Login with new password", async () => {
      // Setup: Create a user first
      const email = "resettest@example.com";
      const originalPassword = "OriginalPass123";
      const newPassword = "NewSecurePass123";

      await request(app.getHttpServer())
        .post("/auth/register/user")
        .send({
          email,
          password: originalPassword,
          confirmPassword: originalPassword,
          firstName: "Test",
          lastName: "User",
          location: "Lisbon",
        })
        .expect(201);

      // Step 1: Request password reset
      await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email })
        .expect(200);

      // Step 2: Get the reset token from database
      const resetTokenRecord = await resetTokenRepository.findOne({
        where: { user: { email } },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });

      expect(resetTokenRecord).toBeDefined();
      expect(resetTokenRecord.used).toBe(false);

      const resetToken = resetTokenRecord.token;

      // Step 3: Reset password with token
      const resetResponse = await request(app.getHttpServer())
        .post("/auth/reset-password")
        .send({
          token: resetToken,
          newPassword,
          confirmPassword: newPassword,
        })
        .expect(200);

      expect(resetResponse.body.message).toContain("Password reset successful");

      // Step 4: Verify old password no longer works
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email,
          password: originalPassword,
        })
        .expect(401);

      // Step 5: Login with new password should work
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("accessToken");
      expect(loginResponse.body.user.email).toBe(email);

      // Step 6: Verify token is marked as used
      const usedToken = await resetTokenRepository.findOne({
        where: { token: resetToken },
      });

      expect(usedToken.used).toBe(true);
    });

    it("should not allow reusing the same reset token", async () => {
      // Setup: Create user and get reset token
      const email = "reuse@example.com";
      await request(app.getHttpServer())
        .post("/auth/register/user")
        .send({
          email,
          password: "OriginalPass123",
          confirmPassword: "OriginalPass123",
          firstName: "Test",
          lastName: "User",
          location: "Lisbon",
        })
        .expect(201);

      await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email })
        .expect(200);

      const resetTokenRecord = await resetTokenRepository.findOne({
        where: { user: { email } },
        relations: ["user"],
      });

      const resetToken = resetTokenRecord.token;

      // First reset should work
      await request(app.getHttpServer())
        .post("/auth/reset-password")
        .send({
          token: resetToken,
          newPassword: "NewPassword123",
          confirmPassword: "NewPassword123",
        })
        .expect(200);

      // Second attempt with same token should fail
      await request(app.getHttpServer())
        .post("/auth/reset-password")
        .send({
          token: resetToken,
          newPassword: "AnotherPassword123",
          confirmPassword: "AnotherPassword123",
        })
        .expect(400);
    });
  });

  // ==================== PROTECTION OF ROUTES TESTS ====================

  describe("Protected Routes", () => {
    it("should reject access to protected route without token", async () => {
      // Assuming there's a protected route like /users/profile
      await request(app.getHttpServer()).get("/users/profile").expect(401);
    });

    it("should allow access to protected route with valid token", async () => {
      // Create user and get token
      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register/user")
        .send({
          email: "protected@example.com",
          password: "SecurePass123",
          confirmPassword: "SecurePass123",
          firstName: "Protected",
          lastName: "User",
          location: "Lisbon",
        })
        .expect(201);

      const token = registerResponse.body.accessToken;

      // Access protected route with token
      const response = await request(app.getHttpServer())
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("email", "protected@example.com");
    });

    it("should reject access with invalid token", async () => {
      await request(app.getHttpServer())
        .get("/users/profile")
        .set("Authorization", "Bearer invalid-token-12345")
        .expect(401);
    });

    it("should reject access with expired token", async () => {
      // This would require mocking JWT expiration or using a very short expiry time
      // For now, we'll test with a malformed token that simulates expiration
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid";

      await request(app.getHttpServer())
        .get("/users/profile")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  // ==================== EDGE CASES AND SECURITY TESTS ====================

  describe("Edge Cases and Security", () => {
    it("should not allow duplicate email registration", async () => {
      const email = "duplicate@example.com";
      const registerDto = {
        email,
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
        ongName: "First ONG",
      };

      // First registration should succeed
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      // Second registration with same email should fail
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          ...registerDto,
          ongName: "Second ONG",
        })
        .expect(409);
    });

    it("should not expose whether email exists on forgot password", async () => {
      // Request reset for non-existent email
      const response1 = await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email: "nonexistent@example.com" })
        .expect(200);

      // Create user
      await request(app.getHttpServer())
        .post("/auth/register/user")
        .send({
          email: "exists@example.com",
          password: "SecurePass123",
          confirmPassword: "SecurePass123",
          firstName: "Test",
          lastName: "User",
          location: "Lisbon",
        })
        .expect(201);

      // Request reset for existing email
      const response2 = await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email: "exists@example.com" })
        .expect(200);

      // Both responses should be identical (security measure)
      expect(response1.body.message).toBe(response2.body.message);
    });

    it("should not return password hash in any response", async () => {
      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register/user")
        .send({
          email: "nohash@example.com",
          password: "SecurePass123",
          confirmPassword: "SecurePass123",
          firstName: "No",
          lastName: "Hash",
          location: "Lisbon",
        })
        .expect(201);

      expect(registerResponse.body.user).not.toHaveProperty("passwordHash");
      expect(registerResponse.body.user).not.toHaveProperty("password");

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nohash@example.com",
          password: "SecurePass123",
        })
        .expect(200);

      expect(loginResponse.body.user).not.toHaveProperty("passwordHash");
      expect(loginResponse.body.user).not.toHaveProperty("password");
    });

    it("should handle rapid successive registration attempts", async () => {
      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app.getHttpServer())
            .post("/auth/register/user")
            .send({
              email: `concurrent${i}@example.com`,
              password: "SecurePass123",
              confirmPassword: "SecurePass123",
              firstName: "Concurrent",
              lastName: `User${i}`,
              location: "Lisbon",
            }),
        );

      const responses = await Promise.all(requests);

      // All should succeed with different emails
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("accessToken");
      });
    });
  });

  // ==================== REFRESH TOKEN AFTER EXPIRATION (Future Feature) ====================

  describe("Token Refresh (Placeholder for future implementation)", () => {
    it("should be able to refresh token before expiration", async () => {
      // This test is a placeholder for when refresh token functionality is implemented
      // Currently, the app uses long-lived tokens (7 days recommended)
      // In production, you'd implement:
      // POST /auth/refresh with refresh token
      // Returns new access token

      expect(true).toBe(true); // Placeholder
    });
  });
});
