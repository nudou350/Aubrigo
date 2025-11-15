import { IsOptional, IsEnum, IsInt, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
export class SearchPetsDto {
  @ApiProperty({ required: false, example: "Lisboa" })
  @IsOptional()
  @IsString()
  location?: string;
  @ApiProperty({
    required: false,
    example: "PT",
    description: "ISO 3166-1 alpha-2 country code",
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
  @ApiProperty({ required: false, example: "uuid-of-ong" })
  @IsOptional()
  @IsString()
  ongId?: string;
  @ApiProperty({
    required: false,
    enum: ["dog", "cat", "fish", "hamster"],
    example: "dog",
  })
  @IsOptional()
  @IsEnum(["dog", "cat", "fish", "hamster"])
  species?: string;
  @ApiProperty({
    required: false,
    enum: ["small", "medium", "large"],
    example: "large",
  })
  @IsOptional()
  @IsEnum(["small", "medium", "large"])
  size?: string;
  @ApiProperty({ required: false, enum: ["male", "female"], example: "male" })
  @IsOptional()
  @IsEnum(["male", "female"])
  gender?: string;
  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMin?: number;
  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMax?: number;
  @ApiProperty({
    required: false,
    enum: ["0-1", "2-3", "4-6", "7-10", "10+"],
    example: "0-1",
  })
  @IsOptional()
  @IsEnum(["0-1", "2-3", "4-6", "7-10", "10+"])
  ageRange?: string;
  @ApiProperty({
    required: false,
    enum: ["urgent", "oldest"],
    example: "urgent",
  })
  @IsOptional()
  @IsEnum(["urgent", "oldest"])
  sortBy?: string;
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
