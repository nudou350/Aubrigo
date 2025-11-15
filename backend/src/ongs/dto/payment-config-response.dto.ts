import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for public payment configuration
 * Contains masked/safe payment method information
 */
export class PaymentConfigResponseDto {
  @ApiProperty({ example: "PT" })
  countryCode: string;

  @ApiProperty({ example: ["mbway", "multibanco"] })
  availablePaymentMethods: string[];

  @ApiProperty({ example: true })
  hasPaymentMethodsConfigured: boolean;

  @ApiProperty({ example: "ONG Name" })
  ongName: string;
}

/**
 * Response DTO for payment instructions
 * Contains full payment details for completing a donation
 */
export class PaymentInstructionsDto {
  @ApiProperty({ example: "ONG Name" })
  ongName: string;

  // Portugal MB WAY
  @ApiProperty({ example: "+351912345678", required: false })
  mbwayPhone?: string;

  // Portugal Multibanco
  @ApiProperty({ example: "PT50000201231234567890154", required: false })
  iban?: string;

  // Brazil PIX
  @ApiProperty({ example: "12345678901", required: false })
  pixKey?: string;

  @ApiProperty({ example: "CPF", required: false })
  pixKeyType?: string;

  // Brazil Bank Transfer
  @ApiProperty({ example: "Banco do Brasil", required: false })
  bankName?: string;

  @ApiProperty({ example: "12345-6", required: false })
  bankAccountNumber?: string;

  @ApiProperty({ example: "001", required: false })
  bankRoutingNumber?: string;

  // Instructions array
  @ApiProperty({
    example: [
      "1. Open MB WAY app",
      "2. Send EUR 50 to +351912345678",
      "3. Wait for ONG confirmation",
    ],
  })
  instructions: string[];
}
