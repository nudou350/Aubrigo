import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PetsController (Integration)', () => {
  let app: INestApplication;

  const mockPetsService = {
    search: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByOng: jest.fn(),
    getCitiesWithPets: jest.fn(),
  };

  const mockUploadService = {
    uploadMultipleImages: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [
        { provide: PetsService, useValue: mockPetsService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /pets', () => {
    it('should return list of pets', async () => {
      mockPetsService.search.mockResolvedValue({
        data: [{ id: '1', name: 'Max' }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      const response = await request(app.getHttpServer()).get('/pets').expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter by species', async () => {
      mockPetsService.search.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      });

      await request(app.getHttpServer()).get('/pets?species=Dog').expect(200);

      expect(mockPetsService.search).toHaveBeenCalledWith(
        expect.objectContaining({ species: 'Dog' }),
      );
    });
  });

  describe('POST /pets', () => {
    it('should create pet successfully', async () => {
      const createDto = {
        name: 'Max',
        species: 'Dog',
        age: 3,
        gender: 'Male',
        size: 'Large',
      };

      mockPetsService.create.mockResolvedValue({ id: '1', ...createDto });

      const response = await request(app.getHttpServer())
        .post('/pets')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Max');
    });

    it('should return 401 without authentication', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer()).post('/pets').send({}).expect(401);
    });
  });

  describe('PUT /pets/:id', () => {
    it('should update pet successfully', async () => {
      mockPetsService.update.mockResolvedValue({ id: '1', name: 'Updated Max' });

      const response = await request(app.getHttpServer())
        .put('/pets/1')
        .send({ name: 'Updated Max' })
        .expect(200);

      expect(response.body.name).toBe('Updated Max');
    });
  });

  describe('DELETE /pets/:id', () => {
    it('should delete pet successfully', async () => {
      mockPetsService.remove.mockResolvedValue({ message: 'Pet deleted successfully' });

      const response = await request(app.getHttpServer()).delete('/pets/1').expect(200);

      expect(response.body.message).toBe('Pet deleted successfully');
    });
  });
});
