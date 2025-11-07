import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus, ArticleCategory, ArticlePriority } from './entities/article.entity';
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
      mockArticleRepository.create.mockReturnValue({
        id: 'art-1',
        title: 'Test Article',
        status: ArticleStatus.ACTIVE,
      });
      mockArticleRepository.save.mockResolvedValue({
        id: 'art-1',
        title: 'Test Article',
        status: ArticleStatus.ACTIVE,
      });

      const result = await service.create('ong-1', {
        title: 'Test Article',
        description: 'Content',
        category: ArticleCategory.OTHER,
        priority: ArticlePriority.MEDIUM,
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Article');
      expect(result.status).toBe(ArticleStatus.ACTIVE);
    });
  });

  describe('findAll', () => {
    it('should return all active articles', async () => {
      mockArticleRepository.find.mockResolvedValue([
        { id: '1', title: 'Article 1', status: ArticleStatus.ACTIVE },
        { id: '2', title: 'Article 2', status: ArticleStatus.ACTIVE },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockArticleRepository.find).toHaveBeenCalledWith({
        where: { status: ArticleStatus.ACTIVE },
        order: { priority: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  describe('findByOng', () => {
    it('should return all active articles for an ONG', async () => {
      mockArticleRepository.find.mockResolvedValue([
        { id: '1', ongId: 'ong-1', status: ArticleStatus.ACTIVE },
      ]);

      const result = await service.findByOng('ong-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update own article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({
        id: 'art-1',
        ongId: 'ong-1',
        title: 'Old Title',
      });
      mockArticleRepository.save.mockResolvedValue({
        id: 'art-1',
        ongId: 'ong-1',
        title: 'Updated Title',
      });

      const result = await service.update('art-1', 'ong-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException when updating other ONG article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id: 'art-1', ongId: 'ong-1' });

      await expect(service.update('art-1', 'different-ong', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update article status', async () => {
      mockArticleRepository.findOne.mockResolvedValue({
        id: 'art-1',
        ongId: 'ong-1',
        status: ArticleStatus.ACTIVE,
      });
      mockArticleRepository.save.mockResolvedValue({
        id: 'art-1',
        status: ArticleStatus.INACTIVE,
      });

      const result = await service.updateStatus('art-1', 'ong-1', ArticleStatus.INACTIVE);

      expect(result.status).toBe(ArticleStatus.INACTIVE);
    });

    it('should throw ForbiddenException when updating other ONG article status', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id: 'art-1', ongId: 'ong-1' });

      await expect(
        service.updateStatus('art-1', 'different-ong', ArticleStatus.INACTIVE),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove own article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({
        id: 'art-1',
        ongId: 'ong-1',
      });
      mockArticleRepository.remove.mockResolvedValue({});

      await service.remove('art-1', 'ong-1');

      expect(mockArticleRepository.remove).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when removing other ONG article', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id: 'art-1', ongId: 'ong-1' });

      await expect(service.remove('art-1', 'different-ong')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
