import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OngsService } from './ongs.service';
import { UpdateOngDto } from './dto/update-ong.dto';

@ApiTags('ONGs')
@Controller('ongs')
export class OngsController {
  constructor(private readonly ongsService: OngsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all approved ONGs' })
  @ApiResponse({ status: 200, description: 'List of approved ONGs' })
  async findAll() {
    return this.ongsService.findAll();
  }

  @Get('my-ong')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user ONG details' })
  @ApiResponse({ status: 200, description: 'Current user ONG details' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async getMyOng(@CurrentUser() user: any) {
    return this.ongsService.getMyOng(user.id);
  }

  @Get('my-ongs')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ONGs the current user belongs to' })
  @ApiResponse({ status: 200, description: 'List of user ONGs' })
  async getMyOngs(@CurrentUser() user: any) {
    return this.ongsService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ONG by ID' })
  @ApiResponse({ status: 200, description: 'ONG details' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async findOne(@Param('id') id: string) {
    return this.ongsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ONG statistics' })
  @ApiResponse({ status: 200, description: 'ONG statistics' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async getOngStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ongsService.getOngStats(id, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ONG information' })
  @ApiResponse({ status: 200, description: 'ONG updated successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOngDto: UpdateOngDto,
    @CurrentUser() user: any,
  ) {
    return this.ongsService.update(id, updateOngDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ONG' })
  @ApiResponse({ status: 200, description: 'ONG deleted successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ongsService.remove(id, user.id);
  }

  // Member management endpoints removed - not implemented in current architecture
}
