import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterUserDto {
  @ApiProperty({ example: 'João' })
  @IsString()
  @MinLength(2)
  firstName: string;
  @ApiProperty({ example: 'Silva' })
  @IsString()
  @MinLength(2)
  lastName: string;
  @ApiProperty({ example: 'joao.silva@gmail.com' })
  @IsEmail()
  email: string;
  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  confirmPassword: string;
  @ApiProperty({ example: '912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiProperty({ example: 'Lisboa, Portugal', required: false })
  @IsOptional()
  @IsString()
  location?: string;
  @ApiProperty({ example: 'PT', required: false, description: 'ISO 3166-1 alpha-2 country code' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
