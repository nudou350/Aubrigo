import { IsString, IsOptional, IsEmail, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiProperty({ example: '912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'user@example.com', required: false, description: 'PIX key for Brazilian ONGs (can be email, CPF/CNPJ, phone, or random key)' })
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiProperty({ example: 'Lisboa, Portugal', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: true, required: false, description: 'Allow appointment scheduling for this ONG' })
  @IsOptional()
  @IsBoolean()
  allowAppointments?: boolean;
}
