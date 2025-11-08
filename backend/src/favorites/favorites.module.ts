import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { Pet } from '../pets/entities/pet.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Pet])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService, TypeOrmModule],
})
export class FavoritesModule {}
