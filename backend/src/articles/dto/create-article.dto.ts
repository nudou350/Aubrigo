import { IsString, IsEnum, IsOptional, IsNumber, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ArticleCategory, ArticlePriority } from "../entities/article.entity";
export class CreateArticleDto {
  @ApiProperty({ example: "Ração para cães" })
  @IsString()
  title: string;
  @ApiProperty({
    example:
      "Precisamos de 50kg de ração para alimentar os cães do abrigo durante o próximo mês.",
  })
  @IsString()
  description: string;
  @ApiProperty({
    example: "food",
    enum: ArticleCategory,
    default: ArticleCategory.OTHER,
  })
  @IsEnum(ArticleCategory)
  @IsOptional()
  category?: ArticleCategory;
  @ApiProperty({
    example: "high",
    enum: ArticlePriority,
    default: ArticlePriority.MEDIUM,
  })
  @IsEnum(ArticlePriority)
  @IsOptional()
  priority?: ArticlePriority;
  @ApiProperty({
    example: 150.0,
    required: false,
    description: "Target amount for financial needs",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;
}
