import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
export class CreateAvailabilityExceptionDto {
  @IsString()
  @IsIn(['blocked', 'available'])
  exceptionType: 'blocked' | 'available';
  @IsDateString()
  startDate: string;
  @IsDateString()
  endDate: string;
  @IsOptional()
  @IsString()
  startTime?: string; // Format: "HH:mm"
  @IsOptional()
  @IsString()
  endTime?: string; // Format: "HH:mm"
  @IsOptional()
  @IsString()
  reason?: string;
}
