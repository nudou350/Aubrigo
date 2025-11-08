import { IsInt, IsBoolean, IsOptional, Min } from 'class-validator';
export class CreateAppointmentSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(15)
  visitDurationMinutes?: number; // Default: 60
  @IsOptional()
  @IsInt()
  @Min(1)
  maxConcurrentVisits?: number; // Default: 1
  @IsOptional()
  @IsInt()
  @Min(0)
  minAdvanceBookingHours?: number; // Default: 24
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAdvanceBookingDays?: number; // Default: 30
  @IsOptional()
  @IsInt()
  @Min(15)
  slotIntervalMinutes?: number; // Default: 30
  @IsOptional()
  @IsBoolean()
  allowWeekendBookings?: boolean; // Default: true
}
