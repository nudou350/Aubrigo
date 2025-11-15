import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateOngDto {
  @ApiProperty({ example: "Cantinho dos Animais" })
  @IsString()
  @MinLength(3)
  ongName: string;
  @ApiProperty({ example: "cantinho@gmail.com" })
  @IsEmail()
  email: string;
  @ApiProperty({ example: "912345678", required: false })
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiProperty({ example: "@cantinhoanimais", required: false })
  @IsOptional()
  @IsString()
  instagramHandle?: string;
  @ApiProperty({ example: "Lisboa, Portugal", required: false })
  @IsOptional()
  @IsString()
  location?: string;
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
}
