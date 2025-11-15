import { PartialType } from "@nestjs/swagger";
import { CreateArticleDto } from "./create-article.dto";
import { IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ArticleStatus } from "../entities/article.entity";
export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiProperty({
    example: "active",
    enum: ArticleStatus,
    required: false,
  })
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;
}
