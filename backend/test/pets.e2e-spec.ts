import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, PetStatus } from '../src/pets/entities/pet.entity';
import { User, UserRole } from '../src/users/entities/user.entity';

describe('Pets E2E Tests', () => {
  let app: INestApplication;
  let petRepository: Repository<Pet>;
  let userRepository: Repository<User>;
  let authToken: string;
  let ongId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    petRepository = moduleFixture.get<Repository<Pet>>(getRepositoryToken(Pet));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await petRepository.delete({});
    await userRepository.delete({});

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register/ong')
      .send({
        email: 'petong@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        ongName: 'Pet Shelter',
        phone: '+351912345678',
        city: 'Lisbon',
      });

    authToken = registerResponse.body.accessToken;
    ongId = registerResponse.body.user.id;
  });

  describe('Complete Pet Management Flow', () => {
    it('should complete flow: Create → Update → Mark as Adopted', async () => {
      // Create pet
      const createResponse = await request(app.getHttpServer())
        .post('/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          age: 3,
          gender: 'male',
          size: 'large',
          description: 'Friendly dog',
        })
        .expect(201);

      const petId = createResponse.body.id;
      expect(createResponse.body.name).toBe('Max');

      // Update pet
      await request(app.getHttpServer())
        .put(`/pets/${petId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Maximus' })
        .expect(200);

      // Mark as adopted
      await request(app.getHttpServer())
        .put(`/pets/${petId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: PetStatus.ADOPTED })
        .expect(200);
    });
  });

  describe('Search and Filter', () => {
    it('should search pets with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/pets?species=Dog&size=large')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('Authorization', () => {
    it('should deny pet creation without authentication', async () => {
      await request(app.getHttpServer()).post('/pets').send({}).expect(401);
    });

    it('should deny updating other ONG pets', async () => {
      // Create another ONG
      const otherResponse = await request(app.getHttpServer())
        .post('/auth/register/ong')
        .send({
          email: 'other@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          ongName: 'Other Shelter',
          city: 'Porto',
        });

      const otherToken = otherResponse.body.accessToken;

      // Create pet with first ONG
      const petResponse = await request(app.getHttpServer())
        .post('/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Max', species: 'Dog', age: 2, gender: 'male', size: 'medium' });

      // Try to update with other ONG
      await request(app.getHttpServer())
        .put(`/pets/${petResponse.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });
});
