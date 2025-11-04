import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetImage } from './entities/pet-image.entity';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, PetImage])],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService, TypeOrmModule],
})
export class PetsModule {}
