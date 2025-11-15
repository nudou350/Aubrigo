import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateOperatingHoursDto } from "./create-operating-hours.dto";
export class BulkOperatingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOperatingHoursDto)
  operatingHours: CreateOperatingHoursDto[];
}
