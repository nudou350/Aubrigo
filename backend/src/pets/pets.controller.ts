import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { SearchPetsDto } from './dto/search-pets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter pets' })
  @ApiResponse({ status: 200, description: 'Returns list of pets' })
  async search(@Query() searchDto: SearchPetsDto) {
    return this.petsService.search(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiResponse({ status: 200, description: 'Returns pet details' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new pet' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createPetDto: CreatePetDto, @Request() req) {
    return this.petsService.create(createPetDto, req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update pet' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
    @Request() req,
  ) {
    return this.petsService.update(id, updatePetDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete pet' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.petsService.remove(id, req.user.userId);
  }
}
