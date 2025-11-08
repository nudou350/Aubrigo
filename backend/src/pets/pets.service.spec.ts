import { Test, TestingModule } from '@nestjs/testing';
import { PetsService } from './pets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { PetImage } from './entities/pet-image.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { SearchPetsDto } from './dto/search-pets.dto';
describe('PetsService', () => {
  let service: PetsService;
  let petRepository: Repository<Pet>;
  let petImageRepository: Repository<PetImage>;
  const mockOngId = 'ong-123';
  const mockPet: Partial<Pet> = {
    id: 'pet-123',
    name: 'Max',
    species: 'Dog',
    breed: 'Labrador',
    age: 3,
    gender: 'Male',
    size: 'Large',
    status: 'available',
    ongId: mockOngId,
    location: 'Lisbon',
    description: 'Friendly dog',
    images: [],
  };
  const mockQueryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };
  const mockPetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
  const mockPetImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
        { provide: getRepositoryToken(PetImage), useValue: mockPetImageRepository },
      ],
    }).compile();
    service = module.get<PetsService>(PetsService);
    petRepository = module.get<Repository<Pet>>(getRepositoryToken(Pet));
    petImageRepository = module.get<Repository<PetImage>>(getRepositoryToken(PetImage));
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('create', () => {
    const createDto: CreatePetDto = {
      name: 'Max',
      species: 'Dog',
      breed: 'Labrador',
      age: 3,
      gender: 'Male',
      size: 'Large',
      description: 'Friendly dog',
      location: 'Lisbon',
    };
    it('should create pet successfully', async () => {
      mockPetRepository.create.mockReturnValue(mockPet);
      mockPetRepository.save.mockResolvedValue(mockPet);
      mockPetRepository.findOne.mockResolvedValue(mockPet);
      const result = await service.create(createDto, mockOngId, []);
      expect(mockPetRepository.create).toHaveBeenCalled();
      expect(mockPetRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockPet);
    });
    it('should create pet with images', async () => {
      const imageUrls = ['url1.jpg', 'url2.jpg'];
      mockPetRepository.create.mockReturnValue(mockPet);
      mockPetRepository.save.mockResolvedValue({ ...mockPet, id: 'pet-123' });
      mockPetRepository.findOne.mockResolvedValue(mockPet);
      mockPetImageRepository.create.mockImplementation((img) => img);
      mockPetImageRepository.save.mockResolvedValue([]);
      await service.create(createDto, mockOngId, imageUrls);
      expect(mockPetImageRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ imageUrl: 'url1.jpg', isPrimary: true }),
          expect.objectContaining({ imageUrl: 'url2.jpg', isPrimary: false }),
        ]),
      );
    });
  });
  describe('search', () => {
    it('should search pets with filters', async () => {
      const searchDto: SearchPetsDto = {
        species: 'Dog',
        size: 'Large',
        page: 1,
        limit: 10,
      };
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockPet]);
      const result = await service.search(searchDto);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
    it('should filter by species', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockPet]);
      await service.search({ species: 'Dog' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pet.species = :species',
        { species: 'Dog' },
      );
    });
    it('should filter by age range', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockPet]);
      await service.search({ ageRange: '2-3' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('pet.age >= 2 AND pet.age <= 3');
    });
  });
  describe('findOne', () => {
    it('should find pet by ID', async () => {
      mockPetRepository.findOne.mockResolvedValue(mockPet);
      const result = await service.findOne('pet-123');
      expect(result).toEqual(mockPet);
    });
    it('should throw NotFoundException when pet not found', async () => {
      mockPetRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
  describe('update', () => {
    it('should update own pet successfully', async () => {
      const updateDto: UpdatePetDto = { name: 'Updated Max' };
      mockPetRepository.findOne.mockResolvedValueOnce(mockPet);
      mockPetRepository.update.mockResolvedValue({ affected: 1 });
      mockPetRepository.findOne.mockResolvedValueOnce({ ...mockPet, name: 'Updated Max' });
      const result = await service.update('pet-123', updateDto, mockOngId, []);
      expect(result.name).toBe('Updated Max');
    });
    it('should throw ForbiddenException when updating other ONG pet', async () => {
      mockPetRepository.findOne.mockResolvedValue(mockPet);
      await expect(service.update('pet-123', {}, 'different-ong', [])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
  describe('remove', () => {
    it('should remove own pet', async () => {
      mockPetRepository.findOne.mockResolvedValue(mockPet);
      mockPetRepository.remove.mockResolvedValue(mockPet);
      const result = await service.remove('pet-123', mockOngId);
      expect(result.message).toBe('Pet deleted successfully');
    });
    it('should throw ForbiddenException when removing other ONG pet', async () => {
      mockPetRepository.findOne.mockResolvedValue(mockPet);
      await expect(service.remove('pet-123', 'different-ong')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
  describe('findByOng', () => {
    it('should find all pets for an ONG', async () => {
      mockPetRepository.find.mockResolvedValue([mockPet]);
      const result = await service.findByOng(mockOngId);
      expect(result).toHaveLength(1);
      expect(mockPetRepository.find).toHaveBeenCalledWith({
        where: { ongId: mockOngId },
        relations: ['images'],
        order: { createdAt: 'DESC' },
      });
    });
  });
  describe('getCitiesWithPets', () => {
    it('should return list of cities with available pets', async () => {
      const mockCities = [{ location: 'Lisbon' }, { location: 'Porto' }];
      mockQueryBuilder.select = jest.fn().mockReturnThis();
      mockQueryBuilder.getRawMany = jest.fn().mockResolvedValue(mockCities);
      const result = await service.getCitiesWithPets();
      expect(result).toEqual(['Lisbon', 'Porto']);
    });
  });
});
