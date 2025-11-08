import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Pet } from '../pets/entities/pet.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoriteRepository: Repository<Favorite>;
  let petRepository: Repository<Pet>;
  const mockFavoriteRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockPetRepository = {
    findOne: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: getRepositoryToken(Favorite), useValue: mockFavoriteRepository },
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
      ],
    }).compile();
    service = module.get<FavoritesService>(FavoritesService);
    favoriteRepository = module.get(getRepositoryToken(Favorite));
    petRepository = module.get(getRepositoryToken(Pet));
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('create', () => {
    it('should add pet to favorites', async () => {
      mockPetRepository.findOne.mockResolvedValue({ id: 'pet-1' });
      mockFavoriteRepository.findOne.mockResolvedValue(null);
      mockFavoriteRepository.create.mockReturnValue({});
      mockFavoriteRepository.save.mockResolvedValue({ id: 'fav-1' });
      const result = await service.create({
        petId: 'pet-1',
        visitorEmail: 'user@test.com',
      });
      expect(result).toBeDefined();
      expect(mockFavoriteRepository.save).toHaveBeenCalled();
    });
    it('should throw ConflictException if already favorited', async () => {
      mockPetRepository.findOne.mockResolvedValue({ id: 'pet-1' });
      mockFavoriteRepository.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ petId: 'pet-1', visitorEmail: 'user@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
    it('should throw NotFoundException if pet not found', async () => {
      mockPetRepository.findOne.mockResolvedValue(null);
      await expect(
        service.create({ petId: 'invalid-id', visitorEmail: 'user@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('remove', () => {
    it('should remove favorite successfully', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue({
        id: 'fav-1',
        visitorEmail: 'user@test.com',
      });
      mockFavoriteRepository.remove.mockResolvedValue({});
      const result = await service.remove('fav-1', 'user@test.com');
      expect(result.message).toBe('Favorite removed successfully');
    });
    it('should throw NotFoundException if favorite not found', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('invalid-id', 'user@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('findByEmail', () => {
    it('should return user favorites', async () => {
      mockFavoriteRepository.find.mockResolvedValue([
        {
          id: '1',
          pet: {
            id: 'pet-1',
            name: 'Max',
            species: 'Dog',
            images: [],
            ong: { id: 'ong-1', ongName: 'Shelter', location: 'Lisbon' },
          },
          createdAt: new Date(),
        },
        {
          id: '2',
          pet: {
            id: 'pet-2',
            name: 'Luna',
            species: 'Cat',
            images: [],
            ong: { id: 'ong-1', ongName: 'Shelter', location: 'Lisbon' },
          },
          createdAt: new Date(),
        },
      ]);
      const result = await service.findByEmail('user@test.com');
      expect(result).toHaveLength(2);
    });
  });
  describe('removeByPetId', () => {
    it('should remove favorite by pet ID', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue({
        id: 'fav-1',
        petId: 'pet-1',
        visitorEmail: 'user@test.com',
      });
      mockFavoriteRepository.remove.mockResolvedValue({});
      const result = await service.removeByPetId('pet-1', 'user@test.com');
      expect(result.message).toBe('Favorite removed successfully');
    });
  });
  describe('checkIsFavorite', () => {
    it('should return true if pet is favorited', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue({ id: 'fav-1' });
      const result = await service.checkIsFavorite('pet-1', 'user@test.com');
      expect(result.isFavorite).toBe(true);
    });
    it('should return false if pet is not favorited', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue(null);
      const result = await service.checkIsFavorite('pet-1', 'user@test.com');
      expect(result.isFavorite).toBe(false);
    });
  });
});
