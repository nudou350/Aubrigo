import { IsBoolean, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class ApproveOngDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approve: boolean;
  @ApiProperty({ example: "Reason for rejection...", required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
