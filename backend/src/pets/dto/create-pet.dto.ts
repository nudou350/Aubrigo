import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePetDto {
  @ApiProperty({ example: 'Nina' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'dog', enum: ['dog', 'cat', 'fish', 'hamster'] })
  @IsEnum(['dog', 'cat', 'fish', 'hamster'])
  species: string;

  @ApiProperty({ example: 'Border Collie', required: false })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(30)
  age?: number;

  @ApiProperty({ example: 'male', enum: ['male', 'female'], required: false })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: string;

  @ApiProperty({
    example: 'large',
    enum: ['small', 'medium', 'large'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['small', 'medium', 'large'])
  size?: string;

  @ApiProperty({ example: 'black and white', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 6, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  @ApiProperty({
    example: 'A Nina é uma cachorrinha bem brincalhona...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'Lisboa', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}
