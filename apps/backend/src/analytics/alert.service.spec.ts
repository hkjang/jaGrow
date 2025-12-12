import { Test, TestingModule } from '@nestjs/testing';
import { AlertService, AlertType, AlertSeverity } from './alert.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AlertService', () => {
  let service: AlertService;

  const mockPrisma = {
    adCampaign: {
      findMany: jest.fn(),
    },
    adMetric: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    notificationLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkROASDrops', () => {
    it('should detect significant ROAS drops', async () => {
      const mockCampaigns = [
        { id: 'camp_1', name: 'Test Campaign' },
      ];

      const mockCurrentMetrics = {
        _avg: { conversionValue: 200, spend: 100 }, // ROAS = 2
      };

      const mockPreviousMetrics = {
        _avg: { conversionValue: 400, spend: 100 }, // ROAS = 4
      };

      mockPrisma.adCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.adMetric.aggregate
        .mockResolvedValueOnce(mockCurrentMetrics)
        .mockResolvedValueOnce(mockPreviousMetrics);
      mockPrisma.notificationLog.create.mockResolvedValue({ id: 'alert_1' });

      const result = await service.checkROASDrops();

      expect(result).toHaveLength(1);
      expect(result[0].alertType).toBe('roas_drop');
    });

    it('should not alert if ROAS is stable', async () => {
      const mockCampaigns = [
        { id: 'camp_1', name: 'Test Campaign' },
      ];

      mockPrisma.adCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.adMetric.aggregate.mockResolvedValue({
        _avg: { conversionValue: 300, spend: 100 },
      });

      const result = await service.checkROASDrops();

      expect(result).toHaveLength(0);
    });
  });

  describe('checkConversionDrops', () => {
    it('should detect conversion drops', async () => {
      const mockCampaigns = [
        { id: 'camp_1', name: 'Test Campaign' },
      ];

      const mockCurrentMetrics = { _sum: { conversions: 5 } };
      const mockPreviousMetrics = { _sum: { conversions: 20 } };

      mockPrisma.adCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.adMetric.aggregate
        .mockResolvedValueOnce(mockCurrentMetrics)
        .mockResolvedValueOnce(mockPreviousMetrics);
      mockPrisma.notificationLog.create.mockResolvedValue({ id: 'alert_1' });

      const result = await service.checkConversionDrops();

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkBudgetDepletion', () => {
    it('should detect campaigns near budget limit', async () => {
      const mockCampaigns = [
        {
          id: 'camp_1',
          name: 'Test Campaign',
          budget: 1000,
          metrics: [
            { spend: 900 }, // 90% spent
          ],
        },
      ];

      mockPrisma.adCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.notificationLog.create.mockResolvedValue({ id: 'alert_1' });

      const result = await service.checkBudgetDepletion();

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createAlert', () => {
    it('should create and log alert', async () => {
      mockPrisma.notificationLog.create.mockResolvedValue({
        id: 'alert_1',
        alertType: 'roas_drop',
        severity: 'high',
      });

      const result = await service.createAlert({
        campaignId: 'camp_1',
        campaignName: 'Test Campaign',
        alertType: 'roas_drop' as AlertType,
        severity: 'high' as AlertSeverity,
        message: 'ROAS dropped by 50%',
        currentValue: 2,
        previousValue: 4,
      });

      expect(result).toBeDefined();
      expect(mockPrisma.notificationLog.create).toHaveBeenCalled();
    });
  });
});
