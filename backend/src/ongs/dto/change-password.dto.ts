import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class ChangePasswordDto {
  @ApiProperty({ example: "currentPassword123" })
  @IsString()
  @MinLength(6)
  currentPassword: string;
  @ApiProperty({ example: "newPassword123" })
  @IsString()
  @MinLength(6)
  newPassword: string;
  @ApiProperty({ example: "newPassword123" })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
