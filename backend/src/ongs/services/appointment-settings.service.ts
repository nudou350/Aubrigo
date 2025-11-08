import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSettings } from '../entities/appointment-settings.entity';
import { CreateAppointmentSettingsDto } from '../dto/create-appointment-settings.dto';
import { UpdateAppointmentSettingsDto } from '../dto/update-appointment-settings.dto';
@Injectable()
export class AppointmentSettingsService {
  constructor(
    @InjectRepository(AppointmentSettings)
    private settingsRepository: Repository<AppointmentSettings>,
  ) {}
  async findByOng(ongId: string): Promise<AppointmentSettings> {
    const settings = await this.settingsRepository.findOne({
      where: { ongId },
    });
    // If settings don't exist, return default values
    if (!settings) {
      return this.createDefaultSettings(ongId);
    }
    return settings;
  }
  async createOrUpdate(ongId: string, dto: CreateAppointmentSettingsDto | UpdateAppointmentSettingsDto): Promise<AppointmentSettings> {
    const existing = await this.settingsRepository.findOne({
      where: { ongId },
    });
    if (existing) {
      // Update existing settings
      Object.assign(existing, dto);
      return this.settingsRepository.save(existing);
    } else {
      // Create new settings
      const settings = this.settingsRepository.create({
        ongId,
        ...dto,
      });
      return this.settingsRepository.save(settings);
    }
  }
  async delete(ongId: string): Promise<void> {
    const result = await this.settingsRepository.delete({ ongId });
    if (result.affected === 0) {
      throw new NotFoundException(`Settings for ONG ${ongId} not found`);
    }
  }
  private async createDefaultSettings(ongId: string): Promise<AppointmentSettings> {
    const settings = this.settingsRepository.create({
      ongId,
      visitDurationMinutes: 60,
      maxConcurrentVisits: 1,
      minAdvanceBookingHours: 24,
      maxAdvanceBookingDays: 30,
      slotIntervalMinutes: 30,
      allowWeekendBookings: true,
    });
    return this.settingsRepository.save(settings);
  }
}
