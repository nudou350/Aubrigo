import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { PetImage } from './entities/pet-image.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { SearchPetsDto } from './dto/search-pets.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(PetImage)
    private petImageRepository: Repository<PetImage>,
  ) {}

  async search(searchDto: SearchPetsDto) {
    const { page = 1, limit = 10, ...filters } = searchDto;
    const skip = (page - 1) * limit;

    const query = this.petRepository
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.ong', 'ong')
      .leftJoinAndSelect('pet.images', 'images')
      .where('pet.status = :status', { status: 'available' });

    // Apply filters
    if (filters.species) {
      query.andWhere('pet.species = :species', { species: filters.species });
    }

    if (filters.size) {
      query.andWhere('pet.size = :size', { size: filters.size });
    }

    if (filters.gender) {
      query.andWhere('pet.gender = :gender', { gender: filters.gender });
    }

    if (filters.ageMin !== undefined) {
      query.andWhere('pet.age >= :ageMin', { ageMin: filters.ageMin });
    }

    if (filters.ageMax !== undefined) {
      query.andWhere('pet.age <= :ageMax', { ageMax: filters.ageMax });
    }

    if (filters.location) {
      query.andWhere('(pet.location ILIKE :location OR ong.location ILIKE :location)', {
        location: `%${filters.location}%`,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    const pets = await query
      .orderBy('pet.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Format response with primary image
    const formattedPets = pets.map((pet) => ({
      ...pet,
      primaryImage: pet.images.find((img) => img.isPrimary)?.imageUrl || pet.images[0]?.imageUrl,
    }));

    return {
      data: formattedPets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const pet = await this.petRepository.findOne({
      where: { id },
      relations: ['ong', 'images'],
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  async create(createPetDto: CreatePetDto, userId: string, imageUrls: string[] = []) {
    // Create pet
    const pet = this.petRepository.create({
      ...createPetDto,
      ongId: userId,
    });

    const savedPet = await this.petRepository.save(pet);

    // Create images
    if (imageUrls.length > 0) {
      const images = imageUrls.map((url, index) =>
        this.petImageRepository.create({
          petId: savedPet.id,
          imageUrl: url,
          isPrimary: index === 0,
          displayOrder: index,
        }),
      );

      await this.petImageRepository.save(images);
    }

    return this.findOne(savedPet.id);
  }

  async update(id: string, updatePetDto: UpdatePetDto, userId: string) {
    const pet = await this.findOne(id);

    // Check ownership
    if (pet.ongId !== userId) {
      throw new ForbiddenException('You do not have permission to update this pet');
    }

    // Update pet
    await this.petRepository.update(id, updatePetDto);

    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const pet = await this.findOne(id);

    // Check ownership
    if (pet.ongId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this pet');
    }

    await this.petRepository.remove(pet);

    return { message: 'Pet deleted successfully' };
  }

  async findByOng(ongId: string) {
    return this.petRepository.find({
      where: { ongId },
      relations: ['images'],
      order: { createdAt: 'DESC' },
    });
  }
}
