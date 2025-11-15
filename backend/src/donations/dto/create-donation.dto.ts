import {
  IsNumber,
  IsString,
  IsEmail,
  IsEnum,
  Min,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Simplified DTO for creating donations
 * Payment method is auto-selected based on ONG configuration
 */
export class CreateDonationDto {
  @ApiProperty({ example: "uuid-of-ong", description: "ONG ID to receive the donation" })
  @IsString()
  @MinLength(1, { message: "ONG ID is required" })
  ongId: string;

  @ApiProperty({ example: "João Silva", description: "Donor's full name" })
  @IsString()
  @MinLength(2, { message: "Donor name must be at least 2 characters" })
  @MaxLength(255, { message: "Donor name must be at most 255 characters" })
  donorName: string;

  @ApiProperty({ example: "joao@example.com", description: "Donor's email address" })
  @IsEmail({}, { message: "Invalid email format" })
  donorEmail: string;

  @ApiProperty({ example: 50.0, description: "Donation amount" })
  @IsNumber({}, { message: "Amount must be a number" })
  @Min(5, { message: "Minimum donation amount is 5" })
  amount: number;

  @ApiProperty({
    example: "one_time",
    enum: ["one_time", "monthly"],
    description: "Donation type (one-time or recurring monthly)",
  })
  @IsEnum(["one_time", "monthly"], {
    message: "Donation type must be either 'one_time' or 'monthly'",
  })
  donationType: string;

  @ApiProperty({
    example: "mbway",
    enum: ["mbway", "multibanco", "pix"],
    description: "Payment method (must be configured by ONG)",
  })
  @IsEnum(["mbway", "multibanco", "pix"], {
    message: "Payment method must be one of: mbway, multibanco, pix",
  })
  paymentMethod: string;
}
