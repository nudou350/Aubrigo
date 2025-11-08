import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { OngAvailabilityException } from '../entities/ong-availability-exception.entity';
import { CreateAvailabilityExceptionDto } from '../dto/create-availability-exception.dto';
@Injectable()
export class AvailabilityExceptionsService {
  constructor(
    @InjectRepository(OngAvailabilityException)
    private exceptionRepository: Repository<OngAvailabilityException>,
  ) {}
  async create(ongId: string, dto: CreateAvailabilityExceptionDto): Promise<OngAvailabilityException> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    // Validate dates
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }
    // Validate time if provided
    if (dto.startTime && dto.endTime) {
      this.validateTimeOrder(dto.startTime, dto.endTime);
    }
    // Check for overlapping exceptions
    const overlapping = await this.findOverlappingExceptions(ongId, startDate, endDate);
    if (overlapping.length > 0) {
      throw new BadRequestException(
        `This period overlaps with an existing exception: ${overlapping[0].reason || 'No reason provided'}`,
      );
    }
    const exception = this.exceptionRepository.create({
      ongId,
      ...dto,
      startDate,
      endDate,
    });
    return this.exceptionRepository.save(exception);
  }
  async findByOng(ongId: string): Promise<OngAvailabilityException[]> {
    return this.exceptionRepository.find({
      where: { ongId },
      order: { startDate: 'ASC' },
    });
  }
  async findActiveExceptions(ongId: string): Promise<OngAvailabilityException[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.exceptionRepository.find({
      where: {
        ongId,
        endDate: MoreThanOrEqual(today),
      },
      order: { startDate: 'ASC' },
    });
  }
  async findByDateRange(
    ongId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OngAvailabilityException[]> {
    return this.exceptionRepository.find({
      where: [
        {
          ongId,
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
        },
      ],
      order: { startDate: 'ASC' },
    });
  }
  async findOne(id: string, ongId: string): Promise<OngAvailabilityException> {
    const exception = await this.exceptionRepository.findOne({
      where: { id, ongId },
    });
    if (!exception) {
      throw new NotFoundException(`Exception with ID ${id} not found`);
    }
    return exception;
  }
  async update(
    id: string,
    ongId: string,
    dto: Partial<CreateAvailabilityExceptionDto>,
  ): Promise<OngAvailabilityException> {
    const exception = await this.findOne(id, ongId);
    // Validate dates if updated
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate ? new Date(dto.startDate) : exception.startDate;
      const endDate = dto.endDate ? new Date(dto.endDate) : exception.endDate;
      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before or equal to end date');
      }
    }
    // Validate time if provided
    if (dto.startTime && dto.endTime) {
      this.validateTimeOrder(dto.startTime, dto.endTime);
    }
    Object.assign(exception, dto);
    return this.exceptionRepository.save(exception);
  }
  async delete(id: string, ongId: string): Promise<void> {
    const exception = await this.findOne(id, ongId);
    await this.exceptionRepository.remove(exception);
  }
  async deleteExpired(ongId: string): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    const result = await this.exceptionRepository.delete({
      ongId,
      endDate: LessThanOrEqual(yesterday),
    });
    return result.affected || 0;
  }
  // Helper methods
  private async findOverlappingExceptions(
    ongId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OngAvailabilityException[]> {
    return this.exceptionRepository.find({
      where: {
        ongId,
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate),
      },
    });
  }
  private validateTimeOrder(startTime: string, endTime: string): void {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }
  }
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  // Utility: Get upcoming holidays for Portugal (can be enhanced with external API)
  async createHolidaysForYear(ongId: string, year: number): Promise<OngAvailabilityException[]> {
    const holidays = this.getPortugueseHolidays(year);
    const created: OngAvailabilityException[] = [];
    for (const holiday of holidays) {
      try {
        const exception = await this.create(ongId, {
          exceptionType: 'blocked',
          startDate: holiday.date,
          endDate: holiday.date,
          reason: holiday.name,
        });
        created.push(exception);
      } catch (error) {
        // Skip if holiday already exists
        continue;
      }
    }
    return created;
  }
  private getPortugueseHolidays(year: number): Array<{ date: string; name: string }> {
    return [
      { date: `${year}-01-01`, name: 'Ano Novo' },
      { date: `${year}-04-25`, name: 'Dia da Liberdade' },
      { date: `${year}-05-01`, name: 'Dia do Trabalhador' },
      { date: `${year}-06-10`, name: 'Dia de Portugal' },
      { date: `${year}-08-15`, name: 'Assunção de Nossa Senhora' },
      { date: `${year}-10-05`, name: 'Implantação da República' },
      { date: `${year}-11-01`, name: 'Todos os Santos' },
      { date: `${year}-12-01`, name: 'Restauração da Independência' },
      { date: `${year}-12-08`, name: 'Imaculada Conceição' },
      { date: `${year}-12-25`, name: 'Natal' },
    ];
  }
}
