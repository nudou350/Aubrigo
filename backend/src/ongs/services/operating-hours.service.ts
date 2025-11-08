import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OngOperatingHours } from '../entities/ong-operating-hours.entity';
import { CreateOperatingHoursDto } from '../dto/create-operating-hours.dto';
import { UpdateOperatingHoursDto } from '../dto/update-operating-hours.dto';
import { BulkOperatingHoursDto } from '../dto/bulk-operating-hours.dto';
@Injectable()
export class OperatingHoursService {
  constructor(
    @InjectRepository(OngOperatingHours)
    private operatingHoursRepository: Repository<OngOperatingHours>,
  ) {}
  async create(ongId: string, dto: CreateOperatingHoursDto): Promise<OngOperatingHours> {
    // Normalize time formats (remove seconds if present)
    const normalizedDto = {
      ...dto,
      openTime: this.normalizeTime(dto.openTime),
      closeTime: this.normalizeTime(dto.closeTime),
      lunchBreakStart: dto.lunchBreakStart ? this.normalizeTime(dto.lunchBreakStart) : undefined,
      lunchBreakEnd: dto.lunchBreakEnd ? this.normalizeTime(dto.lunchBreakEnd) : undefined,
    };
    // Validate time format
    this.validateTimeFormat(normalizedDto.openTime);
    this.validateTimeFormat(normalizedDto.closeTime);
    if (normalizedDto.lunchBreakStart) this.validateTimeFormat(normalizedDto.lunchBreakStart);
    if (normalizedDto.lunchBreakEnd) this.validateTimeFormat(normalizedDto.lunchBreakEnd);
    // Validate time logic
    if (normalizedDto.isOpen) {
      this.validateTimeOrder(normalizedDto.openTime, normalizedDto.closeTime, 'Open time must be before close time');
      if (normalizedDto.lunchBreakStart && normalizedDto.lunchBreakEnd) {
        this.validateTimeOrder(normalizedDto.lunchBreakStart, normalizedDto.lunchBreakEnd, 'Lunch break start must be before end');
        this.validateTimeOrder(normalizedDto.openTime, normalizedDto.lunchBreakStart, 'Lunch break must be within operating hours');
        this.validateTimeOrder(normalizedDto.lunchBreakEnd, normalizedDto.closeTime, 'Lunch break must be within operating hours');
      }
    }
    const operatingHours = this.operatingHoursRepository.create({
      ...normalizedDto,
      ongId,
    });
    return this.operatingHoursRepository.save(operatingHours);
  }
  async bulkUpsert(ongId: string, dto: BulkOperatingHoursDto): Promise<OngOperatingHours[]> {
    // Delete existing entries
    await this.operatingHoursRepository.delete({ ongId });
    // Create new entries
    const results: OngOperatingHours[] = [];
    for (const entry of dto.operatingHours) {
      const created = await this.create(ongId, entry);
      results.push(created);
    }
    return results;
  }
  async findByOng(ongId: string): Promise<OngOperatingHours[]> {
    const hours = await this.operatingHoursRepository.find({
      where: { ongId },
      order: { dayOfWeek: 'ASC' },
    });
    // If no operating hours exist, create default ones
    if (hours.length === 0) {
      return this.createDefaultOperatingHours(ongId);
    }
    return hours;
  }
  private async createDefaultOperatingHours(ongId: string): Promise<OngOperatingHours[]> {
    const defaultHours = [
      // Monday to Friday: 9:00 - 18:00 with lunch break 12:00 - 13:00
      { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00' },
      { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00' },
      { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00' },
      { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00' },
      { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00' },
      // Saturday: 9:00 - 13:00, no lunch break
      { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00', lunchBreakStart: null, lunchBreakEnd: null },
      // Sunday: Closed
      { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '18:00', lunchBreakStart: null, lunchBreakEnd: null },
    ];
    const created: OngOperatingHours[] = [];
    for (const hours of defaultHours) {
      const entity = this.operatingHoursRepository.create({
        ongId,
        ...hours,
      });
      const saved = await this.operatingHoursRepository.save(entity);
      created.push(saved);
    }
    return created;
  }
  async findByOngAndDay(ongId: string, dayOfWeek: number): Promise<OngOperatingHours | null> {
    let hours = await this.operatingHoursRepository.findOne({
      where: { ongId, dayOfWeek },
    });
    // If no hours exist for this day, check if we need to create defaults
    if (!hours) {
      const allHours = await this.operatingHoursRepository.find({ where: { ongId } });
      // If no operating hours exist at all, create defaults for all days
      if (allHours.length === 0) {
        await this.createDefaultOperatingHours(ongId);
        // Now fetch the hours for the requested day
        hours = await this.operatingHoursRepository.findOne({
          where: { ongId, dayOfWeek },
        });
      }
    }
    return hours;
  }
  async update(ongId: string, dayOfWeek: number, dto: UpdateOperatingHoursDto): Promise<OngOperatingHours> {
    const existing = await this.findByOngAndDay(ongId, dayOfWeek);
    if (!existing) {
      throw new NotFoundException(`Operating hours for day ${dayOfWeek} not found`);
    }
    // Validate time format if provided
    if (dto.openTime) this.validateTimeFormat(dto.openTime);
    if (dto.closeTime) this.validateTimeFormat(dto.closeTime);
    if (dto.lunchBreakStart) this.validateTimeFormat(dto.lunchBreakStart);
    if (dto.lunchBreakEnd) this.validateTimeFormat(dto.lunchBreakEnd);
    // Merge with existing data for validation
    const merged = { ...existing, ...dto };
    // Validate time logic
    if (merged.isOpen) {
      this.validateTimeOrder(merged.openTime, merged.closeTime, 'Open time must be before close time');
      if (merged.lunchBreakStart && merged.lunchBreakEnd) {
        this.validateTimeOrder(merged.lunchBreakStart, merged.lunchBreakEnd, 'Lunch break start must be before end');
        this.validateTimeOrder(merged.openTime, merged.lunchBreakStart, 'Lunch break must be within operating hours');
        this.validateTimeOrder(merged.lunchBreakEnd, merged.closeTime, 'Lunch break must be within operating hours');
      }
    }
    Object.assign(existing, dto);
    return this.operatingHoursRepository.save(existing);
  }
  async delete(ongId: string, dayOfWeek: number): Promise<void> {
    const result = await this.operatingHoursRepository.delete({ ongId, dayOfWeek });
    if (result.affected === 0) {
      throw new NotFoundException(`Operating hours for day ${dayOfWeek} not found`);
    }
  }
  // Helper methods
  private normalizeTime(time: string): string {
    // Remove seconds if present (e.g., "09:00:00" -> "09:00")
    if (time.length === 8 && time.split(':').length === 3) {
      return time.substring(0, 5);
    }
    return time;
  }
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException(`Invalid time format: ${time}. Expected format: HH:mm (e.g., 09:00)`);
    }
  }
  private validateTimeOrder(startTime: string, endTime: string, errorMessage: string): void {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    if (start >= end) {
      throw new BadRequestException(errorMessage);
    }
  }
  private timeToMinutes(time: string): number {
    // Handle both "HH:mm" and "HH:mm:ss" formats
    const parts = time.split(':').map(Number);
    const hours = parts[0];
    const minutes = parts[1];
    return hours * 60 + minutes;
  }
}
