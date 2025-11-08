import { IsString, IsEmail, IsOptional, IsUUID, IsDateString } from 'class-validator';
export class CreateAppointmentDto {
  @IsUUID()
  petId: string;
  @IsString()
  visitorName: string;
  @IsEmail()
  visitorEmail: string;
  @IsOptional()
  @IsString()
  visitorPhone?: string;
  @IsOptional()
  @IsDateString()
  preferredDate?: string; // Legacy field (kept for backward compatibility)
  @IsOptional()
  @IsString()
  preferredTime?: string; // Legacy field (kept for backward compatibility)
  @IsOptional()
  @IsDateString()
  scheduledStartTime?: string; // New field: ISO 8601 datetime
  @IsOptional()
  @IsString()
  notes?: string;
}
