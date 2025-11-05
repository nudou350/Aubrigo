import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Pet } from '../pets/entities/pet.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  async create(createFavoriteDto: CreateFavoriteDto) {
    const { visitorEmail, petId } = createFavoriteDto;

    // Check if pet exists
    const pet = await this.petRepository.findOne({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Check if already favorited (duplicate prevention)
    const existing = await this.favoriteRepository.findOne({
      where: { visitorEmail, petId },
    });

    if (existing) {
      throw new ConflictException('Pet already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      visitorEmail,
      petId,
    });

    return this.favoriteRepository.save(favorite);
  }

  async findByEmail(email: string) {
    const favorites = await this.favoriteRepository.find({
      where: { visitorEmail: email },
      relations: ['pet', 'pet.images', 'pet.ong'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map(favorite => ({
      id: favorite.id,
      pet: {
        id: favorite.pet.id,
        name: favorite.pet.name,
        species: favorite.pet.species,
        breed: favorite.pet.breed,
        age: favorite.pet.age,
        gender: favorite.pet.gender,
        size: favorite.pet.size,
        location: favorite.pet.location,
        primaryImage: favorite.pet.images?.find(img => img.isPrimary)?.url ||
                      favorite.pet.images?.[0]?.url || null,
        ong: {
          id: favorite.pet.ong.id,
          ongName: favorite.pet.ong.ongName,
          location: favorite.pet.ong.location,
        },
      },
      addedAt: favorite.createdAt,
    }));
  }

  async remove(id: string, email: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: { id, visitorEmail: email },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
    return { message: 'Favorite removed successfully' };
  }

  async removeByPetId(petId: string, email: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: { petId, visitorEmail: email },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
    return { message: 'Favorite removed successfully' };
  }
}
