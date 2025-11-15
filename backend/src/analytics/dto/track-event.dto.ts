import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
export class SingleEventDto {
  @IsString()
  id: string;
  @IsString()
  type: string;
  @IsString()
  category: string;
  @IsOptional()
  @IsString()
  petId?: string;
  @IsOptional()
  @IsString()
  ongId?: string;
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
  @IsString()
  sessionId: string;
  @IsNumber()
  timestamp: number;
  @IsBoolean()
  offline: boolean;
  @IsBoolean()
  sent: boolean;
}
export class TrackEventDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleEventDto)
  events: SingleEventDto[];
}
