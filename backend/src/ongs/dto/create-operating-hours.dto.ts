import { IsInt, IsBoolean, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateOperatingHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  openTime: string; // Format: "HH:mm" (e.g., "09:00")

  @IsString()
  closeTime: string; // Format: "HH:mm" (e.g., "17:00")

  @IsOptional()
  @IsString()
  lunchBreakStart?: string; // Format: "HH:mm" (e.g., "12:00")

  @IsOptional()
  @IsString()
  lunchBreakEnd?: string; // Format: "HH:mm" (e.g., "13:00")
}
