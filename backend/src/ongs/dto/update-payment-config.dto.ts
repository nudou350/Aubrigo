import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateIf,
  Matches,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for updating ONG payment configuration
 * Validates payment method details based on country
 */
export class UpdatePaymentConfigDto {
  // Portugal Payment Methods
  @ApiPropertyOptional({
    example: "+351912345678",
    description: "MB WAY phone number (Portugal only, format: +351XXXXXXXXX)",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+351\d{9}$/, {
    message: "Phone must be in format +351XXXXXXXXX (9 digits after +351)",
  })
  phone?: string;

  @ApiPropertyOptional({
    example: "PT50000201231234567890154",
    description:
      "IBAN for bank transfers (Portugal only, 25 characters, no spaces)",
  })
  @IsOptional()
  @IsString()
  @Matches(/^PT\d{23}$/, {
    message: "IBAN must be in format PT followed by 23 digits (no spaces)",
  })
  bankAccountIban?: string;

  // Brazil Payment Methods
  @ApiPropertyOptional({
    example: "12345678901",
    description: "PIX key (Brazil only, can be CPF, CNPJ, Email, Phone, or Random key)",
  })
  @IsOptional()
  @IsString()
  @MinLength(11, { message: "PIX key must be at least 11 characters" })
  @MaxLength(77, { message: "PIX key must be at most 77 characters" })
  pixKey?: string;

  @ApiPropertyOptional({
    example: "CPF",
    enum: ["CPF", "CNPJ", "Email", "Phone", "Random"],
    description: "PIX key type (required if pixKey is provided)",
  })
  @ValidateIf((o) => o.pixKey !== undefined && o.pixKey !== null)
  @IsEnum(["CPF", "CNPJ", "Email", "Phone", "Random"], {
    message: "PIX key type must be one of: CPF, CNPJ, Email, Phone, Random",
  })
  pixKeyType?: string;

  @ApiPropertyOptional({
    example: "Banco do Brasil",
    description: "Bank name (Brazil only, required for bank transfers)",
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Bank name must be at least 2 characters" })
  @MaxLength(100, { message: "Bank name must be at most 100 characters" })
  bankName?: string;

  @ApiPropertyOptional({
    example: "001",
    description: "Bank routing number / branch code (Brazil only)",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3,4}$/, {
    message: "Bank routing number must be 3 or 4 digits",
  })
  bankRoutingNumber?: string;

  @ApiPropertyOptional({
    example: "12345-6",
    description: "Bank account number (Brazil only)",
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: "Bank account number must be at least 4 characters" })
  @MaxLength(20, { message: "Bank account number must be at most 20 characters" })
  bankAccountNumber?: string;
}
