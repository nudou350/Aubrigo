import { IsBoolean, IsString, IsOptional } from 'class-validator';
export class UpdateOperatingHoursDto {
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
  @IsOptional()
  @IsString()
  openTime?: string;
  @IsOptional()
  @IsString()
  closeTime?: string;
  @IsOptional()
  @IsString()
  lunchBreakStart?: string;
  @IsOptional()
  @IsString()
  lunchBreakEnd?: string;
}
