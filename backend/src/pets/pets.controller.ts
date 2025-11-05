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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { SearchPetsDto } from './dto/search-pets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(
    private readonly petsService: PetsService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter pets' })
  @ApiResponse({ status: 200, description: 'Returns list of pets' })
  async search(@Query() searchDto: SearchPetsDto) {
    return this.petsService.search(searchDto);
  }

  @Get('my-pets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pets belonging to current ONG' })
  @ApiResponse({ status: 200, description: 'Returns list of ONG pets' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyPets(@Request() req) {
    return this.petsService.findByOng(req.user.userId);
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
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new pet' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createPetDto: CreatePetDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    // Upload images if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.uploadService.uploadMultipleImages(files, 'pets');
    }

    return this.petsService.create(createPetDto, req.user.userId, imageUrls);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update pet' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    // Upload new images if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.uploadService.uploadMultipleImages(files, 'pets');
    }

    return this.petsService.update(id, updatePetDto, req.user.userId, imageUrls);
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
