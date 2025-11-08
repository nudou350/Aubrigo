import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { OperatingHoursService } from '../services/operating-hours.service';
import { AppointmentSettingsService } from '../services/appointment-settings.service';
import { AvailableSlotsService } from '../services/available-slots.service';
import { AvailabilityExceptionsService } from '../services/availability-exceptions.service';
import { CreateOperatingHoursDto } from '../dto/create-operating-hours.dto';
import { UpdateOperatingHoursDto } from '../dto/update-operating-hours.dto';
import { BulkOperatingHoursDto } from '../dto/bulk-operating-hours.dto';
import { CreateAppointmentSettingsDto } from '../dto/create-appointment-settings.dto';
import { UpdateAppointmentSettingsDto } from '../dto/update-appointment-settings.dto';
import { CreateAvailabilityExceptionDto } from '../dto/create-availability-exception.dto';
@ApiTags('ONG - Operating Hours & Settings')
@Controller('ongs')
export class OperatingHoursController {
  constructor(
    private readonly operatingHoursService: OperatingHoursService,
    private readonly settingsService: AppointmentSettingsService,
    private readonly availableSlotsService: AvailableSlotsService,
    private readonly exceptionsService: AvailabilityExceptionsService,
  ) {}
  // ==================== OPERATING HOURS ====================
  @Get('my-ong/operating-hours')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my ONG operating hours' })
  @ApiResponse({ status: 200, description: 'Operating hours retrieved successfully' })
  async getMyOperatingHours(@CurrentUser() user: any) {
    return this.operatingHoursService.findByOng(user.id);
  }
  @Post('my-ong/operating-hours')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create operating hours for a specific day' })
  @ApiResponse({ status: 201, description: 'Operating hours created successfully' })
  async createOperatingHours(@CurrentUser() user: any, @Body() dto: CreateOperatingHoursDto) {
    return this.operatingHoursService.create(user.id, dto);
  }
  @Post('my-ong/operating-hours/bulk')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set operating hours for all days of the week (replaces existing)' })
  @ApiResponse({ status: 201, description: 'Operating hours configured successfully' })
  async bulkUpsertOperatingHours(@CurrentUser() user: any, @Body() dto: BulkOperatingHoursDto) {
    return this.operatingHoursService.bulkUpsert(user.id, dto);
  }
  @Put('my-ong/operating-hours/:dayOfWeek')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update operating hours for a specific day' })
  @ApiResponse({ status: 200, description: 'Operating hours updated successfully' })
  async updateOperatingHours(
    @CurrentUser() user: any,
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Body() dto: UpdateOperatingHoursDto,
  ) {
    return this.operatingHoursService.update(user.id, dayOfWeek, dto);
  }
  @Delete('my-ong/operating-hours/:dayOfWeek')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete operating hours for a specific day' })
  @ApiResponse({ status: 200, description: 'Operating hours deleted successfully' })
  async deleteOperatingHours(@CurrentUser() user: any, @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number) {
    await this.operatingHoursService.delete(user.id, dayOfWeek);
    return { message: 'Operating hours deleted successfully' };
  }
  @Get(':ongId/operating-hours')
  @ApiOperation({ summary: 'Get operating hours for any ONG (public)' })
  @ApiResponse({ status: 200, description: 'Operating hours retrieved successfully' })
  async getOngOperatingHours(@Param('ongId') ongId: string) {
    return this.operatingHoursService.findByOng(ongId);
  }
  // ==================== APPOINTMENT SETTINGS ====================
  @Get('my-ong/appointment-settings')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my appointment settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getMySettings(@CurrentUser() user: any) {
    return this.settingsService.findByOng(user.id);
  }
  @Post('my-ong/appointment-settings')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update appointment settings' })
  @ApiResponse({ status: 201, description: 'Settings saved successfully' })
  async createOrUpdateSettings(@CurrentUser() user: any, @Body() dto: CreateAppointmentSettingsDto) {
    return this.settingsService.createOrUpdate(user.id, dto);
  }
  @Put('my-ong/appointment-settings')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@CurrentUser() user: any, @Body() dto: UpdateAppointmentSettingsDto) {
    return this.settingsService.createOrUpdate(user.id, dto);
  }
  @Get(':ongId/appointment-settings')
  @ApiOperation({ summary: 'Get appointment settings for any ONG (public)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getOngSettings(@Param('ongId') ongId: string) {
    return this.settingsService.findByOng(ongId);
  }
  // ==================== AVAILABLE SLOTS ====================
  @Get(':ongId/available-slots')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved successfully' })
  async getAvailableSlots(@Param('ongId') ongId: string, @Query('date') dateString: string) {
    const date = new Date(dateString);
    return this.availableSlotsService.getAvailableSlots(ongId, date);
  }
  @Get(':ongId/available-dates')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ summary: 'Get all available dates in a month' })
  @ApiResponse({ status: 200, description: 'Available dates retrieved successfully' })
  async getAvailableDates(
    @Param('ongId') ongId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.availableSlotsService.getAvailableDates(ongId, year, month);
  }
  // ==================== AVAILABILITY EXCEPTIONS ====================
  @Get('my-ong/exceptions')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my availability exceptions (blocks/holidays)' })
  @ApiResponse({ status: 200, description: 'Exceptions retrieved successfully' })
  async getMyExceptions(@CurrentUser() user: any) {
    return this.exceptionsService.findByOng(user.id);
  }
  @Get('my-ong/exceptions/active')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get only active/future exceptions' })
  @ApiResponse({ status: 200, description: 'Active exceptions retrieved successfully' })
  async getMyActiveExceptions(@CurrentUser() user: any) {
    return this.exceptionsService.findActiveExceptions(user.id);
  }
  @Post('my-ong/exceptions')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new availability exception (block dates)' })
  @ApiResponse({ status: 201, description: 'Exception created successfully' })
  async createException(@CurrentUser() user: any, @Body() dto: CreateAvailabilityExceptionDto) {
    return this.exceptionsService.create(user.id, dto);
  }
  @Post('my-ong/exceptions/holidays/:year')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-create exceptions for all Portuguese holidays in a year' })
  @ApiResponse({ status: 201, description: 'Holidays created successfully' })
  async createHolidays(@CurrentUser() user: any, @Param('year', ParseIntPipe) year: number) {
    return this.exceptionsService.createHolidaysForYear(user.id, year);
  }
  @Put('my-ong/exceptions/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an exception' })
  @ApiResponse({ status: 200, description: 'Exception updated successfully' })
  async updateException(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAvailabilityExceptionDto>,
  ) {
    return this.exceptionsService.update(id, user.id, dto);
  }
  @Delete('my-ong/exceptions/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an exception' })
  @ApiResponse({ status: 200, description: 'Exception deleted successfully' })
  async deleteException(@CurrentUser() user: any, @Param('id') id: string) {
    await this.exceptionsService.delete(id, user.id);
    return { message: 'Exception deleted successfully' };
  }
  @Delete('my-ong/exceptions/cleanup/expired')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all expired exceptions' })
  @ApiResponse({ status: 200, description: 'Expired exceptions deleted successfully' })
  async cleanupExpired(@CurrentUser() user: any) {
    const count = await this.exceptionsService.deleteExpired(user.id);
    return { message: `${count} expired exceptions deleted` };
  }
  @Get(':ongId/exceptions')
  @ApiOperation({ summary: 'Get exceptions for any ONG (public)' })
  @ApiResponse({ status: 200, description: 'Exceptions retrieved successfully' })
  async getOngExceptions(@Param('ongId') ongId: string) {
    return this.exceptionsService.findActiveExceptions(ongId);
  }
}
