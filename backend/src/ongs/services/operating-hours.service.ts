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
    // Validate time format
    this.validateTimeFormat(dto.openTime);
    this.validateTimeFormat(dto.closeTime);
    if (dto.lunchBreakStart) this.validateTimeFormat(dto.lunchBreakStart);
    if (dto.lunchBreakEnd) this.validateTimeFormat(dto.lunchBreakEnd);

    // Validate time logic
    if (dto.isOpen) {
      this.validateTimeOrder(dto.openTime, dto.closeTime, 'Open time must be before close time');

      if (dto.lunchBreakStart && dto.lunchBreakEnd) {
        this.validateTimeOrder(dto.lunchBreakStart, dto.lunchBreakEnd, 'Lunch break start must be before end');
        this.validateTimeOrder(dto.openTime, dto.lunchBreakStart, 'Lunch break must be within operating hours');
        this.validateTimeOrder(dto.lunchBreakEnd, dto.closeTime, 'Lunch break must be within operating hours');
      }
    }

    const operatingHours = this.operatingHoursRepository.create({
      ...dto,
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
    return this.operatingHoursRepository.find({
      where: { ongId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findByOngAndDay(ongId: string, dayOfWeek: number): Promise<OngOperatingHours | null> {
    return this.operatingHoursRepository.findOne({
      where: { ongId, dayOfWeek },
    });
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
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
