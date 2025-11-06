import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a pet to favorites' })
  @ApiResponse({ status: 201, description: 'Pet added to favorites' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @ApiResponse({ status: 409, description: 'Pet already in favorites' })
  async create(@Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.create(createFavoriteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get favorite pets for a user' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({ status: 200, description: 'List of favorite pets' })
  async findByEmail(@Query('email') email: string) {
    return this.favoritesService.findByEmail(email);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a pet from favorites by favorite ID' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async remove(@Param('id') id: string, @Query('email') email: string) {
    return this.favoritesService.remove(id, email);
  }

  @Get('check/:petId')
  @ApiOperation({ summary: 'Check if a pet is favorited by user' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns isFavorite status' })
  async checkIsFavorite(@Param('petId') petId: string, @Query('email') email: string) {
    return this.favoritesService.checkIsFavorite(petId, email);
  }

  @Delete('pet/:petId')
  @ApiOperation({ summary: 'Remove a pet from favorites by pet ID' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async removeByPetId(@Param('petId') petId: string, @Query('email') email: string) {
    return this.favoritesService.removeByPetId(petId, email);
  }
}
