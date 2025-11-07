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

  describe('addFavorite', () => {
    it('should add pet to favorites', async () => {
      mockPetRepository.findOne.mockResolvedValue({ id: 'pet-1' });
      mockFavoriteRepository.findOne.mockResolvedValue(null);
      mockFavoriteRepository.create.mockReturnValue({});
      mockFavoriteRepository.save.mockResolvedValue({ id: 'fav-1' });

      const result = await service.addFavorite('pet-1', 'user@test.com');

      expect(result).toBeDefined();
      expect(mockFavoriteRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if already favorited', async () => {
      mockPetRepository.findOne.mockResolvedValue({ id: 'pet-1' });
      mockFavoriteRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.addFavorite('pet-1', 'user@test.com')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if pet not found', async () => {
      mockPetRepository.findOne.mockResolvedValue(null);

      await expect(service.addFavorite('invalid-id', 'user@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue({ id: 'fav-1' });
      mockFavoriteRepository.remove.mockResolvedValue({});

      const result = await service.removeFavorite('fav-1');

      expect(result.message).toBe('Favorite removed successfully');
    });

    it('should throw NotFoundException if favorite not found', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFavorite('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user favorites', async () => {
      mockFavoriteRepository.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await service.findByEmail('user@test.com');

      expect(result).toHaveLength(2);
    });
  });
});
