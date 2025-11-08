import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ArticleStatus } from './entities/article.entity';
@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new article/need (ONG only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: any,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.create(user.id, createArticleDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all active articles' })
  @ApiResponse({ status: 200, description: 'Returns all active articles' })
  async findAll() {
    return this.articlesService.findAll();
  }
  @Get('ong/:ongId')
  @ApiOperation({ summary: 'Get active articles for a specific ONG (public)' })
  @ApiResponse({ status: 200, description: 'Returns active articles for the ONG' })
  async findByOng(@Param('ongId') ongId: string) {
    return this.articlesService.findByOng(ongId);
  }
  @Get('my-articles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my articles (including inactive)' })
  @ApiResponse({ status: 200, description: 'Returns all articles for authenticated ONG' })
  async findMyArticles(@CurrentUser() user: any) {
    return this.articlesService.findMyArticles(user.id);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID' })
  @ApiResponse({ status: 200, description: 'Returns article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article (ONG owner only)' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not article owner' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, user.id, updateArticleDto);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete article (ONG owner only)' })
  @ApiResponse({ status: 204, description: 'Article deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not article owner' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.articlesService.remove(id, user.id);
  }
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article status (activate/deactivate)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not article owner' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: ArticleStatus,
  ) {
    return this.articlesService.updateStatus(id, user.id, status);
  }
}
