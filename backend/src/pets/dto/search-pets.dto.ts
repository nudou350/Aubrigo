import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchPetsDto {
  @ApiProperty({ required: false, example: 'Lisboa' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    required: false,
    enum: ['dog', 'cat', 'fish', 'hamster'],
    example: 'dog',
  })
  @IsOptional()
  @IsEnum(['dog', 'cat', 'fish', 'hamster'])
  species?: string;

  @ApiProperty({
    required: false,
    enum: ['small', 'medium', 'large'],
    example: 'large',
  })
  @IsOptional()
  @IsEnum(['small', 'medium', 'large'])
  size?: string;

  @ApiProperty({ required: false, enum: ['male', 'female'], example: 'male' })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: string;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMin?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMax?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
