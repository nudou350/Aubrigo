import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ArticlesService', () => {
  let service: ArticlesService;

  const mockArticleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useValue: mockArticleRepository },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create article successfully', async () => {
      mockArticleRepository.create.mockReturnValue({});
      mockArticleRepository.save.mockResolvedValue({
        id: 'art-1',
        title: 'Test Article',
        status: ArticleStatus.DRAFT,
      });

      const result = await service.create(
        {
          title: 'Test Article',
          content: 'Content',
          category: 'news',
          priority: 'medium',
        },
        'ong-1',
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Article');
    });
  });

  describe('update', () => {
    it('should update own article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id: 'art-1', ongId: 'ong-1' });
      mockArticleRepository.save.mockResolvedValue({ id: 'art-1', title: 'Updated' });

      const result = await service.update('art-1', { title: 'Updated' }, 'ong-1');

      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException when updating other ONG article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id: 'art-1', ongId: 'ong-1' });

      await expect(service.update('art-1', {}, 'different-ong')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('publish', () => {
    it('should publish article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({
        id: 'art-1',
        ongId: 'ong-1',
        status: ArticleStatus.DRAFT,
      });
      mockArticleRepository.save.mockResolvedValue({
        id: 'art-1',
        status: ArticleStatus.ACTIVE,
      });

      const result = await service.publish('art-1', 'ong-1');

      expect(result.status).toBe(ArticleStatus.ACTIVE);
    });
  });
});
