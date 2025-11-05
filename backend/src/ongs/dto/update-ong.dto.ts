import { PartialType } from '@nestjs/swagger';
import { CreateOngDto } from './create-ong.dto';

export class UpdateOngDto extends PartialType(CreateOngDto) {}
