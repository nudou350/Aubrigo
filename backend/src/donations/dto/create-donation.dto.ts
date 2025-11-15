import {
  IsNumber,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  Min,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateDonationDto {
  @ApiProperty({ example: "uuid-of-ong" })
  @IsString()
  ongId: string;
  @ApiProperty({ example: "João Silva" })
  @IsString()
  donorName: string;
  @ApiProperty({ example: "joao@example.com" })
  @IsEmail()
  donorEmail: string;
  @ApiProperty({ example: "123.456.789-00", required: false })
  @IsOptional()
  @IsString()
  donorCpf?: string;
  @ApiProperty({ example: "1990-05-15", required: false })
  @IsOptional()
  @IsDateString()
  donorBirthDate?: string;
  @ApiProperty({ example: "male", required: false })
  @IsOptional()
  @IsString()
  donorGender?: string;
  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0.05)
  amount: number;
  @ApiProperty({ example: "one_time", enum: ["one_time", "monthly"] })
  @IsEnum(["one_time", "monthly"])
  donationType: string;

  @ApiProperty({
    example: "PT",
    enum: ["PT", "BR"],
    description: "Country code (Portugal or Brazil)",
  })
  @IsEnum(["PT", "BR"])
  country: string;

  @ApiProperty({
    example: "EUR",
    enum: ["EUR", "BRL"],
    description: "Currency code (Euro or Brazilian Real)",
  })
  @IsEnum(["EUR", "BRL"])
  currency: string;

  @ApiProperty({
    example: "mbway",
    enum: ["mbway", "multibanco", "card", "pix", "boleto"],
    description: "Payment method",
  })
  @IsEnum(["mbway", "multibanco", "card", "pix", "boleto"])
  paymentMethod: string;

  // For MB Way
  @ApiProperty({ example: "+351912345678", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // For Cards
  @ApiProperty({ example: "JOAO SILVA", required: false })
  @IsOptional()
  @IsString()
  cardHolderName?: string;
}
