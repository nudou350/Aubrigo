import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetImage } from './entities/pet-image.entity';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { UploadModule } from '../upload/upload.module';
import { CacheModule } from '../common/cache/cache.module';
import { CacheService } from '../common/cache/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet, PetImage]),
    UploadModule,
    CacheModule,
  ],
  controllers: [PetsController],
  providers: [PetsService, CacheService],
  exports: [PetsService, TypeOrmModule],
})
export class PetsModule {}
