import { PartialType } from '@nestjs/swagger';
import { CreatePetDto } from './create-pet.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePetDto extends PartialType(CreatePetDto) {
  @ApiProperty({
    required: false,
    enum: ['available', 'pending', 'adopted'],
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(['available', 'pending', 'adopted'])
  status?: string;
}
