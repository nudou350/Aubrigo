import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(ongId: string, createArticleDto: CreateArticleDto): Promise<Article> {
    const article = this.articleRepository.create({
      ...createArticleDto,
      ongId,
      status: ArticleStatus.ACTIVE,
    });

    return await this.articleRepository.save(article);
  }

  async findAll(): Promise<Article[]> {
    return await this.articleRepository.find({
      where: { status: ArticleStatus.ACTIVE },
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByOng(ongId: string): Promise<Article[]> {
    return await this.articleRepository.find({
      where: { ongId, status: ArticleStatus.ACTIVE },
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async findMyArticles(ongId: string): Promise<Article[]> {
    return await this.articleRepository.find({
      where: { ongId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['ong'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async update(id: string, ongId: string, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const article = await this.findOne(id);

    if (article.ongId !== ongId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    Object.assign(article, updateArticleDto);
    return await this.articleRepository.save(article);
  }

  async remove(id: string, ongId: string): Promise<void> {
    const article = await this.findOne(id);

    if (article.ongId !== ongId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.articleRepository.remove(article);
  }

  async updateStatus(id: string, ongId: string, status: ArticleStatus): Promise<Article> {
    const article = await this.findOne(id);

    if (article.ongId !== ongId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    article.status = status;
    return await this.articleRepository.save(article);
  }
}
