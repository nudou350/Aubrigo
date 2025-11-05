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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OngsService } from './ongs.service';
import { UpdateOngDto } from './dto/update-ong.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('ONGs')
@Controller('ongs')
export class OngsController {
  constructor(
    private readonly ongsService: OngsService,
    private readonly uploadService: UploadService,
  ) {}

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

  @Get('my-ong/stats')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user ONG statistics' })
  @ApiResponse({ status: 200, description: 'ONG statistics' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async getMyOngStats(@CurrentUser() user: any) {
    const ong = await this.ongsService.getMyOng(user.id);
    return this.ongsService.getOngStats(ong.id, user.id);
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

  @Put('my-ong/profile')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user ONG profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.ongsService.updateMyProfile(user.id, updateProfileDto);
  }

  @Post('my-ong/profile-image')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile image for current user ONG' })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async uploadProfileImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const imageUrl = await this.uploadService.uploadImage(file, 'profiles');
    return this.ongsService.updateProfileImage(user.id, imageUrl);
  }

  @Put('my-ong/change-password')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for current user ONG' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.ongsService.changePassword(user.id, changePasswordDto);
  }

  // Member management endpoints removed - not implemented in current architecture
}
