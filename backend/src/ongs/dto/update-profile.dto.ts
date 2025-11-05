import { IsString, IsOptional, MinLength, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Cantinho dos Animais', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  ongName?: string;

  @ApiProperty({ example: '912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '@cantinhoanimais', required: false })
  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @ApiProperty({ example: 'Lisboa, Portugal', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'Uma breve descrição sobre a ONG...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ example: 'https://cantinhoanimais.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: true, required: false, description: 'Allow appointment scheduling for this ONG' })
  @IsOptional()
  @IsBoolean()
  allowAppointments?: boolean;
}
