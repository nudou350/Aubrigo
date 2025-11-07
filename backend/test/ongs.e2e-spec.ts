import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, OngStatus } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('ONGs E2E Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;
  let ongId: string;

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
    // Clean up database
    await userRepository.delete({});

    // Create ONG and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register/ong')
      .send({
        email: 'testong@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        ongName: 'Test Animal Shelter',
        phone: '+351912345678',
        city: 'Lisbon',
      });

    authToken = registerResponse.body.accessToken;
    ongId = registerResponse.body.user.id;
  });

  // ==================== ONG LISTING ====================

  describe('ONG Listing', () => {
    it('should list all approved ONGs', async () => {
      // Create additional ONGs
      await userRepository.save([
        {
          email: 'ong2@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: UserRole.ONG,
          ongName: 'Pet Rescue Porto',
          ongStatus: OngStatus.APPROVED,
        },
        {
          email: 'ong3@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: UserRole.ONG,
          ongName: 'Faro Animal Care',
          ongStatus: OngStatus.APPROVED,
        },
      ]);

      const response = await request(app.getHttpServer()).get('/ongs').expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should not require authentication to list ONGs', async () => {
      const response = await request(app.getHttpServer()).get('/ongs').expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  // ==================== ONG DETAILS ====================

  describe('ONG Details', () => {
    it('should get ONG details by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ongs/${ongId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', ongId);
      expect(response.body).toHaveProperty('ongName');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 404 for non-existent ONG', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer()).get(`/ongs/${fakeId}`).expect(404);
    });
  });

  // ==================== MY ONG MANAGEMENT ====================

  describe('My ONG Management', () => {
    it('should get current user ONG details', async () => {
      const response = await request(app.getHttpServer())
        .get('/ongs/my-ong')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', ongId);
      expect(response.body).toHaveProperty('ongName', 'Test Animal Shelter');
    });

    it('should deny access without authentication', async () => {
      await request(app.getHttpServer()).get('/ongs/my-ong').expect(401);
    });

    it('should get ONG statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/ongs/my-ong/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPets');
      expect(response.body).toHaveProperty('availablePets');
      expect(response.body).toHaveProperty('adoptedPets');
      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body).toHaveProperty('totalDonations');
    });
  });

  // ==================== PROFILE UPDATE FLOW ====================

  describe('Profile Update Flow', () => {
    it('should complete full flow: View → Update Profile → Upload Image', async () => {
      // Step 1: View current profile
      const profileResponse = await request(app.getHttpServer())
        .get('/ongs/my-ong')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.ongName).toBe('Test Animal Shelter');

      // Step 2: Update profile
      const updateResponse = await request(app.getHttpServer())
        .put('/ongs/my-ong/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ongName: 'Updated Animal Shelter',
          phone: '+351987654321',
          location: 'Porto',
        })
        .expect(200);

      expect(updateResponse.body.message).toBe('Profile updated successfully');
      expect(updateResponse.body.ong.ongName).toBe('Updated Animal Shelter');

      // Step 3: Verify changes
      const verifyResponse = await request(app.getHttpServer())
        .get('/ongs/my-ong')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.ongName).toBe('Updated Animal Shelter');
      expect(verifyResponse.body.location).toBe('Porto');

      // Step 4: Upload profile image
      const imageBuffer = Buffer.from('fake-image-data');
      const uploadResponse = await request(app.getHttpServer())
        .post('/ongs/my-ong/profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profileImage', imageBuffer, 'test.jpg')
        .expect(200);

      expect(uploadResponse.body).toHaveProperty('message', 'Profile image uploaded successfully');
      expect(uploadResponse.body).toHaveProperty('profileImageUrl');

      // Step 5: Verify image URL in profile
      const finalProfile = await request(app.getHttpServer())
        .get('/ongs/my-ong')
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
        .put('/ongs/my-ong/change-password')
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
          email: 'testong@example.com',
          password: currentPassword,
        })
        .expect(401);

      // Step 3: Login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testong@example.com',
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');

      // Step 4: Use new token to access protected resource
      const newToken = loginResponse.body.accessToken;
      const profileResponse = await request(app.getHttpServer())
        .get('/ongs/my-ong')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe('testong@example.com');
    });

    it('should reject password change with incorrect current password', async () => {
      await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
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
          email: 'testong@example.com',
          password: 'SecurePass123',
        })
        .expect(200);
    });
  });

  // ==================== UPDATE AND DELETE ====================

  describe('ONG Update and Delete', () => {
    it('should allow ONG owner to update their own ONG', async () => {
      const updateDto = {
        ongName: 'Super Updated Name',
        phone: '+351999999999',
        location: 'Faro',
      };

      const response = await request(app.getHttpServer())
        .put(`/ongs/${ongId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.ongName).toBe(updateDto.ongName);
      expect(response.body.phone).toBe(updateDto.phone);
    });

    it('should prevent other ONGs from updating different ONG', async () => {
      // Create another ONG
      const otherOng = await userRepository.save({
        email: 'other@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        role: UserRole.ONG,
        ongName: 'Other ONG',
        ongStatus: OngStatus.APPROVED,
      });

      // Try to update first ONG
      await request(app.getHttpServer())
        .put(`/ongs/${ongId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ongName: 'Hacked Name' })
        .expect(403);
    });

    it('should delete ONG successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/ongs/${ongId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('ONG deleted successfully');

      // Verify ONG no longer exists
      await request(app.getHttpServer()).get(`/ongs/${ongId}`).expect(404);
    });
  });

  // ==================== AUTHORIZATION TESTS ====================

  describe('Authorization and Access Control', () => {
    it('should deny access to protected routes without authentication', async () => {
      await request(app.getHttpServer()).get('/ongs/my-ong').expect(401);

      await request(app.getHttpServer()).get('/ongs/my-ong/stats').expect(401);

      await request(app.getHttpServer())
        .put('/ongs/my-ong/profile')
        .send({ ongName: 'Test' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/ongs/my-ong/profile-image')
        .attach('profileImage', Buffer.from('data'), 'test.jpg')
        .expect(401);

      await request(app.getHttpServer())
        .put('/ongs/my-ong/change-password')
        .send({
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: 'new',
        })
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/ongs/my-ong')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should prevent regular users from accessing ONG-only endpoints', async () => {
      // Create regular user
      const userResponse = await request(app.getHttpServer())
        .post('/auth/register/user')
        .send({
          email: 'user@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          firstName: 'Regular',
          lastName: 'User',
          location: 'Lisbon',
        });

      const userToken = userResponse.body.accessToken;

      // Try to access ONG endpoints
      await request(app.getHttpServer())
        .get('/ongs/my-ong')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // ==================== STATISTICS ACCESS CONTROL ====================

  describe('Statistics Access Control', () => {
    it('should allow ONG to view their own statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ongs/${ongId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPets');
    });

    it('should deny access to other ONG statistics', async () => {
      // Create another ONG
      const otherOng = await userRepository.save({
        email: 'other@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        role: UserRole.ONG,
        ongName: 'Other ONG',
        ongStatus: OngStatus.APPROVED,
      });

      // Try to access other ONG's stats
      await request(app.getHttpServer())
        .get(`/ongs/${otherOng.id}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should allow admin to view any ONG statistics', async () => {
      // Create admin user
      const adminUser = await userRepository.save({
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        role: UserRole.ADMIN,
        ongStatus: OngStatus.APPROVED,
      });

      // Login as admin
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password',
        });

      const adminToken = adminLogin.body.accessToken;

      // Access any ONG stats
      const response = await request(app.getHttpServer())
        .get(`/ongs/${ongId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPets');
    });
  });

  // ==================== DATA VALIDATION ====================

  describe('Data Validation and Security', () => {
    it('should not expose passwordHash in any response', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer()).get(`/ongs/${ongId}`),
        request(app.getHttpServer())
          .get('/ongs/my-ong')
          .set('Authorization', `Bearer ${authToken}`),
      ]);

      responses.forEach((response) => {
        expect(response.body).not.toHaveProperty('passwordHash');
        expect(response.body).not.toHaveProperty('password');
      });
    });

    it('should validate profile update data', async () => {
      const invalidData = {
        ongName: '', // Empty name should be invalid
      };

      await request(app.getHttpServer())
        .put('/ongs/my-ong/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should handle concurrent profile updates', async () => {
      const updates = [
        { ongName: 'Update1' },
        { ongName: 'Update2' },
        { ongName: 'Update3' },
      ];

      const requests = updates.map((update) =>
        request(app.getHttpServer())
          .put('/ongs/my-ong/profile')
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
        .get('/ongs/my-ong')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(['Update1', 'Update2', 'Update3']).toContain(finalProfile.body.ongName);
    });
  });
});
