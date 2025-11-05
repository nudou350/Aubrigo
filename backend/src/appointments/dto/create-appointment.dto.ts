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

  @IsDateString()
  preferredDate: string;

  @IsString()
  preferredTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
