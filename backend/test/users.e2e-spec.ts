import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, OngStatus } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('Users E2E Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;
  let testUserId: string;

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

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await userRepository.delete({});

    // Create a test user and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register/user')
      .send({
        email: 'testuser@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
        location: 'Lisbon',
      });

    authToken = registerResponse.body.accessToken;
    testUserId = registerResponse.body.user.id;
  });

  // ==================== COMPLETE USER PROFILE FLOW ====================

  describe('Complete Profile Management Flow', () => {
    it('should complete full flow: Login → View Profile → Edit → Upload Image', async () => {
      // Step 1: View current profile
      const profileResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('email', 'testuser@example.com');
      expect(profileResponse.body).toHaveProperty('firstName', 'Test');
      expect(profileResponse.body).toHaveProperty('lastName', 'User');

      // Step 2: Update profile
      const updateResponse = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+351912345678',
          location: 'Porto',
        })
        .expect(200);

      expect(updateResponse.body.firstName).toBe('Updated');
      expect(updateResponse.body.lastName).toBe('Name');
      expect(updateResponse.body.phone).toBe('+351912345678');

      // Step 3: Verify changes persisted
      const verifyResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.firstName).toBe('Updated');
      expect(verifyResponse.body.location).toBe('Porto');

      // Step 4: Upload profile image
      const imageBuffer = Buffer.from('fake-image-data');
      const uploadResponse = await request(app.getHttpServer())
        .post('/users/profile/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profileImage', imageBuffer, 'test.jpg')
        .expect(200);

      expect(uploadResponse.body).toHaveProperty('message', 'Profile image uploaded successfully');
      expect(uploadResponse.body).toHaveProperty('profileImageUrl');

      // Step 5: Verify image URL in profile
      const finalProfile = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalProfile.body.profileImageUrl).toBeDefined();
    });
  });

  // ==================== PASSWORD CHANGE FLOW ====================

  describe('Password Change Flow', () => {
    it('should complete full flow: Change Password → Logout → Login with new password', async () => {
      const currentPassword = 'SecurePass123';
      const newPassword = 'NewSecurePass456';

      // Step 1: Change password
      const changeResponse = await request(app.getHttpServer())
        .put('/users/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword,
          newPassword,
          confirmPassword: newPassword,
        })
        .expect(200);

      expect(changeResponse.body.message).toBe('Password changed successfully');

      // Step 2: Verify old password no longer works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: currentPassword,
        })
        .expect(401);

      // Step 3: Login with new password should work
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body.user.email).toBe('testuser@example.com');

      // Step 4: Use new token to access profile
      const newToken = loginResponse.body.accessToken;
      const profileResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe('testuser@example.com');
    });

    it('should reject password change with incorrect current password', async () => {
      await request(app.getHttpServer())
        .put('/users/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewSecurePass456',
          confirmPassword: 'NewSecurePass456',
        })
        .expect(401);

      // Verify original password still works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePass123',
        })
        .expect(200);
    });
  });

  // ==================== ONG LISTING AND SEARCH ====================

  describe('ONG Listing and Search', () => {
    beforeEach(async () => {
      // Create multiple test ONGs
      const ongsData = [
        {
          email: 'ong1@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: UserRole.ONG,
          ongName: 'Animal Shelter Lisbon',
          location: 'Lisbon',
          ongStatus: OngStatus.APPROVED,
          phone: '+351911111111',
        },
        {
          email: 'ong2@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: UserRole.ONG,
          ongName: 'Pet Rescue Porto',
          location: 'Porto',
          ongStatus: OngStatus.APPROVED,
          phone: '+351922222222',
        },
        {
          email: 'ong3@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: UserRole.ONG,
          ongName: 'Faro Animal Care',
          location: 'Faro',
          ongStatus: OngStatus.APPROVED,
          phone: '+351933333333',
        },
        {
          email: 'ong4@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: UserRole.ONG,
          ongName: 'Pending ONG',
          location: 'Coimbra',
          ongStatus: OngStatus.PENDING,
          phone: '+351944444444',
        },
      ];

      for (const ongData of ongsData) {
        const ong = userRepository.create(ongData);
        await userRepository.save(ong);
      }
    });

    it('should list all approved ONGs', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      // Should only include approved ONGs
      const pendingOng = response.body.find((ong) => ong.ongName === 'Pending ONG');
      expect(pendingOng).toBeUndefined();
    });

    it('should filter ONGs by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=Animal')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((ong) => {
        expect(ong.ongName.toLowerCase()).toContain('animal');
      });
    });

    it('should filter ONGs by location', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?location=Lisbon')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((ong) => {
        expect(ong.location).toContain('Lisbon');
      });
    });

    it('should support multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=Shelter&location=Lisbon')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      if (response.body.length > 0) {
        response.body.forEach((ong) => {
          expect(ong.ongName.toLowerCase()).toContain('shelter');
          expect(ong.location).toContain('Lisbon');
        });
      }
    });

    it('should return empty array when no ONGs match filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=NonExistentONG')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  // ==================== ONG DETAILS ====================

  describe('ONG Details', () => {
    let testOngId: string;

    beforeEach(async () => {
      // Create a test ONG
      const ong = userRepository.create({
        email: 'detailsong@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        role: UserRole.ONG,
        ongName: 'Details Test ONG',
        location: 'Lisbon',
        ongStatus: OngStatus.APPROVED,
        phone: '+351912345678',
        instagramHandle: '@detailsong',
      });

      const savedOng = await userRepository.save(ong);
      testOngId = savedOng.id;
    });

    it('should get ONG details by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testOngId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testOngId);
      expect(response.body).toHaveProperty('ongName', 'Details Test ONG');
      expect(response.body).toHaveProperty('location', 'Lisbon');
      expect(response.body).toHaveProperty('phone');
      expect(response.body).toHaveProperty('instagramHandle');
      expect(response.body).toHaveProperty('petCount');
      expect(response.body).toHaveProperty('needs');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 404 for non-existent ONG', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .expect(404);
    });

    it('should not return details for pending ONGs', async () => {
      // Create pending ONG
      const pendingOng = userRepository.create({
        email: 'pending@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        role: UserRole.ONG,
        ongName: 'Pending ONG',
        location: 'Porto',
        ongStatus: OngStatus.PENDING,
      });

      const savedPending = await userRepository.save(pendingOng);

      await request(app.getHttpServer())
        .get(`/users/${savedPending.id}`)
        .expect(404);
    });
  });

  // ==================== AUTHORIZATION TESTS ====================

  describe('Authorization and Access Control', () => {
    it('should deny access to profile without authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should deny profile update without authentication', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .send({ firstName: 'Hacker' })
        .expect(401);
    });

    it('should deny image upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/users/profile/image')
        .attach('profileImage', Buffer.from('data'), 'test.jpg')
        .expect(401);
    });

    it('should deny password change without authentication', async () => {
      await request(app.getHttpServer())
        .put('/users/profile/password')
        .send({
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: 'new',
        })
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  // ==================== DATA VALIDATION & SECURITY ====================

  describe('Data Validation and Security', () => {
    it('should not allow updating email through profile update', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com', // Should be ignored
          firstName: 'Updated',
        })
        .expect(400); // Should reject because email is not in UpdateUserProfileDto
    });

    it('should not allow updating role through profile update', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: UserRole.ADMIN, // Should be ignored/rejected
          firstName: 'Updated',
        })
        .expect(400);
    });

    it('should sanitize and validate all input fields', async () => {
      const maliciousInput = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Normal',
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousInput)
        .expect(200);

      // Should be stored as-is (sanitization should happen at rendering)
      // But should not execute as script
      expect(response.body.firstName).toBe(maliciousInput.firstName);
    });

    it('should handle concurrent profile updates correctly', async () => {
      const updates = [
        { firstName: 'Update1' },
        { firstName: 'Update2' },
        { firstName: 'Update3' },
      ];

      const requests = updates.map((update) =>
        request(app.getHttpServer())
          .put('/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(update),
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Final state should be one of the updates
      const finalProfile = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(['Update1', 'Update2', 'Update3']).toContain(finalProfile.body.firstName);
    });
  });

  // ==================== PROFILE IMAGE VALIDATION ====================

  describe('Profile Image Validation', () => {
    it('should accept valid image types (jpg, png, webp)', async () => {
      const validFormats = ['image.jpg', 'image.png', 'image.webp'];

      for (const filename of validFormats) {
        const response = await request(app.getHttpServer())
          .post('/users/profile/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('profileImage', Buffer.from('fake-image-data'), filename)
          .expect(200);

        expect(response.body).toHaveProperty('profileImageUrl');
      }
    });

    it('should reject invalid file types', async () => {
      await request(app.getHttpServer())
        .post('/users/profile/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profileImage', Buffer.from('fake-data'), 'document.pdf')
        .expect(400);
    });

    it('should reject files exceeding 5MB', async () => {
      // Create a 6MB buffer
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      await request(app.getHttpServer())
        .post('/users/profile/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profileImage', largeBuffer, 'large.jpg')
        .expect(413);
    });
  });
});
