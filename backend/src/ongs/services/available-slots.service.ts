import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { OngOperatingHours } from '../entities/ong-operating-hours.entity';
import { AppointmentSettings } from '../entities/appointment-settings.entity';
import { OngAvailabilityException } from '../entities/ong-availability-exception.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { AvailableSlotDto, AvailableSlotsResponseDto, AvailableDatesResponseDto } from '../dto/available-slot.dto';
import { OperatingHoursService } from './operating-hours.service';
import { AppointmentSettingsService } from './appointment-settings.service';

@Injectable()
export class AvailableSlotsService {
  constructor(
    @InjectRepository(OngAvailabilityException)
    private exceptionRepository: Repository<OngAvailabilityException>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private operatingHoursService: OperatingHoursService,
    private settingsService: AppointmentSettingsService,
  ) {}

  async getAvailableSlots(ongId: string, date: Date): Promise<AvailableSlotsResponseDto> {
    const dateString = this.formatDate(date);
    const dayOfWeek = date.getDay();

    // 1. Get operating hours for this day
    const operatingHours = await this.operatingHoursService.findByOngAndDay(ongId, dayOfWeek);

    if (!operatingHours || !operatingHours.isOpen) {
      return {
        date: dateString,
        slots: [],
        ongOperatingHours: operatingHours
          ? {
              isOpen: false,
              openTime: operatingHours.openTime,
              closeTime: operatingHours.closeTime,
            }
          : undefined,
      };
    }

    // 2. Get appointment settings
    const settings = await this.settingsService.findByOng(ongId);

    // 3. Check for exceptions (blocked days)
    const exceptions = await this.exceptionRepository.find({
      where: {
        ongId,
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      },
    });

    const blockedExceptions = exceptions.filter((e) => e.exceptionType === 'blocked');
    if (blockedExceptions.length > 0) {
      return {
        date: dateString,
        slots: [],
        ongOperatingHours: {
          isOpen: false,
          openTime: operatingHours.openTime,
          closeTime: operatingHours.closeTime,
        },
      };
    }

    // 4. Generate all possible slots for the day
    const allSlots = this.generateTimeSlots(date, operatingHours, settings);

    // 5. Get existing appointments for this day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentRepository.find({
      where: {
        ongId,
        scheduledStartTime: Between(startOfDay, endOfDay),
        status: 'confirmed',
      },
    });

    // 6. Mark slots as available or not
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + settings.minAdvanceBookingHours * 60 * 60 * 1000);

    const slots: AvailableSlotDto[] = allSlots.map((slot) => {
      // Check if slot is in the past or too soon
      if (slot.startTime < minBookingTime) {
        return {
          ...slot,
          available: false,
          reason: 'Too soon to book',
        };
      }

      // Count concurrent appointments at this time
      const concurrentCount = appointments.filter((apt) =>
        this.isOverlapping(slot.startTime, slot.endTime, apt.scheduledStartTime, apt.scheduledEndTime),
      ).length;

      const available = concurrentCount < settings.maxConcurrentVisits;

      return {
        ...slot,
        available,
        reason: available ? undefined : 'Fully booked',
      };
    });

    return {
      date: dateString,
      slots,
      ongOperatingHours: {
        isOpen: true,
        openTime: operatingHours.openTime,
        closeTime: operatingHours.closeTime,
        lunchBreakStart: operatingHours.lunchBreakStart,
        lunchBreakEnd: operatingHours.lunchBreakEnd,
      },
    };
  }

  async getAvailableDates(ongId: string, year: number, month: number): Promise<AvailableDatesResponseDto> {
    const settings = await this.settingsService.findByOng(ongId);
    const operatingHours = await this.operatingHoursService.findByOng(ongId);

    console.log('📅 Getting available dates for:', { ongId, year, month });
    console.log('⚙️ Settings:', { maxAdvanceBookingDays: settings.maxAdvanceBookingDays, minAdvanceBookingHours: settings.minAdvanceBookingHours });
    console.log('🕐 Operating hours count:', operatingHours.length);

    // Get all days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const availableDates: string[] = [];

    // Normalize today's date to start of day for comparison (set to midnight local time)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + settings.maxAdvanceBookingDays);

    console.log('📆 Date range:', { today: this.formatDate(today), maxDate: this.formatDate(maxDate), daysInMonth });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);

      // Skip if date is in the past (before today) or beyond max advance booking
      const isBeforeToday = date.getTime() < today.getTime();
      const isBeyondMax = date.getTime() > maxDate.getTime();

      if (isBeforeToday || isBeyondMax) {
        continue;
      }

      const dayOfWeek = date.getDay();

      // Check if ONG is open on this day
      const hoursForDay = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
      if (!hoursForDay || !hoursForDay.isOpen) {
        console.log(`⏭️ Skipping ${this.formatDate(date)} (day ${dayOfWeek}): ${!hoursForDay ? 'No hours configured' : 'Closed'}`);
        continue;
      }

      // Check for exceptions
      const exceptions = await this.exceptionRepository.find({
        where: {
          ongId,
          startDate: LessThanOrEqual(date),
          endDate: MoreThanOrEqual(date),
          exceptionType: 'blocked',
        },
      });

      if (exceptions.length > 0) {
        continue;
      }

      // If we got here, the day has availability
      const formattedDate = this.formatDate(date);
      availableDates.push(formattedDate);
      console.log(`✅ Added available date: ${formattedDate} (day ${dayOfWeek})`);
    }

    console.log(`📊 Total available dates: ${availableDates.length}`);

    return {
      year,
      month,
      availableDates,
    };
  }

  // Helper methods
  private generateTimeSlots(
    date: Date,
    operatingHours: OngOperatingHours,
    settings: AppointmentSettings,
  ): AvailableSlotDto[] {
    const slots: AvailableSlotDto[] = [];

    const openMinutes = this.timeToMinutes(operatingHours.openTime);
    const closeMinutes = this.timeToMinutes(operatingHours.closeTime);
    const lunchStartMinutes = operatingHours.lunchBreakStart ? this.timeToMinutes(operatingHours.lunchBreakStart) : null;
    const lunchEndMinutes = operatingHours.lunchBreakEnd ? this.timeToMinutes(operatingHours.lunchBreakEnd) : null;

    let currentMinutes = openMinutes;

    while (currentMinutes + settings.visitDurationMinutes <= closeMinutes) {
      // Check if slot overlaps with lunch break
      const slotEnd = currentMinutes + settings.visitDurationMinutes;

      const overlapsLunch =
        lunchStartMinutes !== null &&
        lunchEndMinutes !== null &&
        !(slotEnd <= lunchStartMinutes || currentMinutes >= lunchEndMinutes);

      if (!overlapsLunch) {
        const startTime = this.minutesToDateTime(date, currentMinutes);
        const endTime = this.minutesToDateTime(date, slotEnd);

        slots.push({
          startTime,
          endTime,
          available: true,
        });
      }

      currentMinutes += settings.slotIntervalMinutes;
    }

    return slots;
  }

  private isOverlapping(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToDateTime(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setMinutes(minutes);
    return result;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
