import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class RegisterOngDto {
  @ApiProperty({ example: "Cantinho dos Animais" })
  @IsString()
  @MinLength(3)
  ongName: string;
  @ApiProperty({ example: "cantinho@gmail.com" })
  @IsEmail()
  email: string;
  @ApiProperty({ example: "SecurePass123" })
  @IsString()
  @MinLength(8)
  password: string;
  @ApiProperty({ example: "SecurePass123" })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
  @ApiProperty({ example: "Lisboa", required: false })
  @IsOptional()
  @IsString()
  city?: string;
  @ApiProperty({ example: "Lisboa, Portugal", required: false })
  @IsOptional()
  @IsString()
  location?: string;
  @ApiProperty({ example: "912345678", required: false })
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  hasWhatsapp?: boolean;
  @ApiProperty({ example: "@cantinhoanimais", required: false })
  @IsOptional()
  @IsString()
  instagramHandle?: string;
  @ApiProperty({
    example: "Uma breve descrição sobre a ONG...",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({ example: "123456789", required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;
  @ApiProperty({ example: "https://cantinhoanimais.com", required: false })
  @IsOptional()
  @IsString()
  website?: string;
  @ApiProperty({
    example: "PT",
    required: false,
    description: "ISO 3166-1 alpha-2 country code",
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  // Stripe Connect / Payment fields
  @ApiProperty({
    example: "123456789",
    required: false,
    description: "Tax ID (NIPC for PT, CNPJ for BR)",
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({
    example: "PT50000000000000000000000",
    required: false,
    description: "IBAN for Portugal",
  })
  @IsOptional()
  @IsString()
  bankAccountIban?: string;

  @ApiProperty({
    example: "001",
    required: false,
    description: "Bank routing number for Brazil",
  })
  @IsOptional()
  @IsString()
  bankRoutingNumber?: string;

  @ApiProperty({
    example: "12345678",
    required: false,
    description: "Bank account number for Brazil",
  })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiProperty({
    example: "contato@abrigo.com.br",
    required: false,
    description: "PIX key for Brazil (CPF, CNPJ, Email, Phone, or Random)",
  })
  @IsOptional()
  @IsString()
  pixKey?: string;
}
