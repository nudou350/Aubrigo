import { IsString, IsIn } from 'class-validator';
export class UpdateAppointmentStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'completed', 'cancelled'])
  status: string;
}
