import { IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  visitorEmail: string;

  @ApiProperty({ example: 'uuid-of-pet' })
  @IsUUID()
  petId: string;
}
