import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Pet } from "./entities/pet.entity";
import { PetImage } from "./entities/pet-image.entity";
import { User } from "../users/entities/user.entity";
import { CreatePetDto } from "./dto/create-pet.dto";
import { UpdatePetDto } from "./dto/update-pet.dto";
import { SearchPetsDto } from "./dto/search-pets.dto";
import { CacheService } from "../common/cache/cache.service";

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(PetImage)
    private petImageRepository: Repository<PetImage>,
    private cacheService: CacheService,
  ) {}
  async search(searchDto: SearchPetsDto) {
    const { page = 1, limit = 10, ...filters } = searchDto;

    // Check cache first
    const cacheKey = this.cacheService.getPetsCacheKey(searchDto);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;
    const query = this.petRepository
      .createQueryBuilder("pet")
      .leftJoinAndSelect("pet.ong", "ong")
      .leftJoinAndSelect("pet.images", "images")
      .where("pet.status = :status", { status: "available" });
    // Apply filters
    // IMPORTANT: Filter by country code - pets are only visible in their country
    if (filters.countryCode) {
      query.andWhere("pet.countryCode = :countryCode", {
        countryCode: filters.countryCode,
      });
    }
    if (filters.ongId) {
      query.andWhere("pet.ongId = :ongId", { ongId: filters.ongId });
    }
    if (filters.species) {
      query.andWhere("pet.species = :species", { species: filters.species });
    }
    if (filters.size) {
      query.andWhere("pet.size = :size", { size: filters.size });
    }
    if (filters.gender) {
      query.andWhere("pet.gender = :gender", { gender: filters.gender });
    }
    // Process age range
    if (filters.ageRange) {
      switch (filters.ageRange) {
        case "0-1":
          query.andWhere("pet.age >= 0 AND pet.age <= 1");
          break;
        case "2-3":
          query.andWhere("pet.age >= 2 AND pet.age <= 3");
          break;
        case "4-6":
          query.andWhere("pet.age >= 4 AND pet.age <= 6");
          break;
        case "7-10":
          query.andWhere("pet.age >= 7 AND pet.age <= 10");
          break;
        case "10+":
          query.andWhere("pet.age > 10");
          break;
      }
    } else {
      // Fallback to ageMin/ageMax if ageRange not provided
      if (filters.ageMin !== undefined) {
        query.andWhere("pet.age >= :ageMin", { ageMin: filters.ageMin });
      }
      if (filters.ageMax !== undefined) {
        query.andWhere("pet.age <= :ageMax", { ageMax: filters.ageMax });
      }
    }
    if (filters.location) {
      query.andWhere(
        "(pet.location ILIKE :location OR ong.location ILIKE :location)",
        {
          location: `%${filters.location}%`,
        },
      );
    }
    // Get total count
    const total = await query.getCount();
    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "urgent":
          // TODO: When urgent needs field is added, implement proper sorting
          // For now, sort by creation date (newest first)
          query.orderBy("pet.createdAt", "DESC");
          break;
        case "oldest":
          query.orderBy("pet.createdAt", "ASC");
          break;
        default:
          query.orderBy("pet.createdAt", "DESC");
      }
    } else {
      query.orderBy("pet.createdAt", "DESC");
    }
    // Apply pagination
    const pets = await query.skip(skip).take(limit).getMany();
    // Format response with primary image
    const formattedPets = pets.map((pet) => ({
      ...pet,
      primaryImage:
        pet.images.find((img) => img.isPrimary)?.imageUrl ||
        pet.images[0]?.imageUrl,
    }));
    const result = {
      data: formattedPets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result for 3 hours (10800 seconds)
    await this.cacheService.set(cacheKey, result, 10800);

    return result;
  }
  async findOne(id: string) {
    const pet = await this.petRepository.findOne({
      where: { id },
      relations: ["ong", "images"],
    });
    if (!pet) {
      throw new NotFoundException("Pet not found");
    }
    return pet;
  }
  async create(
    createPetDto: CreatePetDto,
    userId: string,
    imageUrls: string[] = [],
  ) {
    // Get ONG's country code from userId
    const ong = await this.petRepository.manager.findOne(User, {
      where: { id: userId },
    });
    // Create pet with ONG's country code if not provided
    const pet = this.petRepository.create({
      ...createPetDto,
      ongId: userId,
      countryCode: createPetDto.countryCode || ong?.countryCode || "PT",
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
  async update(
    id: string,
    updatePetDto: UpdatePetDto,
    userId: string,
    imageUrls: string[] = [],
    deletedImageIds: string[] = [],
    primaryImageId?: string,
  ) {
    const pet = await this.findOne(id);
    // Check ownership
    if (pet.ongId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to update this pet",
      );
    }
    // Update pet
    await this.petRepository.update(id, updatePetDto);
    // Delete removed images
    if (deletedImageIds.length > 0) {
      // Filter out empty or invalid IDs
      const validIds = deletedImageIds.filter((id) => id && id.trim() !== "");
      if (validIds.length > 0) {
        // Get images to delete for cleanup
        const imagesToDelete = await this.petImageRepository.find({
          where: {
            id: require("typeorm").In(validIds),
            petId: id,
          },
        });
        // Delete from database
        await this.petImageRepository.delete(validIds);
        // TODO: Delete physical files from storage
        // Uncomment when UploadService has deleteImage method
        // for (const img of imagesToDelete) {
        //   await this.uploadService.deleteImage(img.imageUrl);
        // }
      }
    }
    // Add new images if provided
    if (imageUrls.length > 0) {
      // Get current images after deletion
      const existingImages = await this.petImageRepository.find({
        where: { petId: id },
        order: { displayOrder: "DESC" },
      });
      const maxOrder =
        existingImages.length > 0 ? existingImages[0].displayOrder : -1;
      const images = imageUrls.map((url, index) =>
        this.petImageRepository.create({
          petId: id,
          imageUrl: url,
          isPrimary: existingImages.length === 0 && index === 0, // Only set primary if no existing images
          displayOrder: maxOrder + index + 1,
        }),
      );
      await this.petImageRepository.save(images);
    }
    // Update primary image if specified
    if (primaryImageId) {
      // First, set all images to not primary
      await this.petImageRepository.update({ petId: id }, { isPrimary: false });
      // Then, set the selected image as primary
      await this.petImageRepository.update(
        { id: primaryImageId, petId: id },
        { isPrimary: true },
      );
    }
    return this.findOne(id);
  }
  async remove(id: string, userId: string) {
    const pet = await this.findOne(id);
    // Check ownership
    if (pet.ongId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to delete this pet",
      );
    }
    await this.petRepository.remove(pet);
    return { message: "Pet deleted successfully" };
  }
  async findByOng(ongId: string) {
    return this.petRepository.find({
      where: { ongId },
      relations: ["images"],
      order: { createdAt: "DESC" },
    });
  }
  async getCitiesWithPets(countryCode?: string) {
    const query = this.petRepository
      .createQueryBuilder("pet")
      .select("DISTINCT pet.location", "location")
      .where("pet.status = :status", { status: "available" })
      .andWhere("pet.location IS NOT NULL")
      .andWhere("pet.location != ''");
    // Filter by country if provided
    if (countryCode) {
      query.andWhere("pet.countryCode = :countryCode", { countryCode });
    }
    const result = await query.orderBy("pet.location", "ASC").getRawMany();
    return result.map((row) => row.location);
  }
}
