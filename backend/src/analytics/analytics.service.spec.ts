import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const mockAnalyticsEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    leftJoin: jest.fn().mockReturnThis(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockAnalyticsEventRepository },
      ],
    }).compile();
    service = module.get<AnalyticsService>(AnalyticsService);
    mockAnalyticsEventRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('trackEvent', () => {
    it('should track a single event', async () => {
      mockAnalyticsEventRepository.create.mockReturnValue({
        id: 'event-1',
        eventType: 'pet_view',
      });
      mockAnalyticsEventRepository.save.mockResolvedValue({
        id: 'event-1',
        eventType: 'pet_view',
      });
      const result = await service.trackEvent(
        {
          id: 'evt-1',
          type: 'pet_view',
          category: 'engagement',
          petId: 'pet-1',
          sessionId: 'session-1',
          timestamp: Date.now(),
          offline: false,
          sent: false,
        },
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(result).toBeDefined();
      expect(result.eventType).toBe('pet_view');
    });
  });
  describe('getOngStats', () => {
    it('should return ONG statistics', async () => {
      mockAnalyticsEventRepository.count
        .mockResolvedValueOnce(100) // petViews
        .mockResolvedValueOnce(20) // favorites
        .mockResolvedValueOnce(10) // appointments
        .mockResolvedValueOnce(5); // shares
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { date: '2024-01-01', count: '10' },
          { date: '2024-01-02', count: '15' },
        ]) // viewsByDay
        .mockResolvedValueOnce([
          { petId: 'pet-1', petName: 'Max', petSpecies: 'Dog', views: '50' },
          { petId: 'pet-2', petName: 'Luna', petSpecies: 'Cat', views: '30' },
        ]) // topPets
        .mockResolvedValueOnce([
          { eventType: 'pet_view', count: '100' },
          { eventType: 'pet_favorite', count: '20' },
        ]); // eventBreakdown
      const result = await service.getOngStats('ong-1', 30);
      expect(result.summary.petViews).toBe(100);
      expect(result.summary.favorites).toBe(20);
      expect(result.summary.appointments).toBe(10);
      expect(result.summary.shares).toBe(5);
      expect(result.viewsByDay).toHaveLength(2);
      expect(result.topPets).toHaveLength(2);
      expect(result.eventBreakdown).toHaveLength(2);
    });
  });
});
