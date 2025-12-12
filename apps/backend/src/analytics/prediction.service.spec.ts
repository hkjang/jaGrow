import { Test, TestingModule } from '@nestjs/testing';
import { PredictionService } from './prediction.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PredictionService', () => {
  let service: PredictionService;
  let prisma: PrismaService;

  const mockPrisma = {
    adMetric: {
      findMany: jest.fn(),
    },
    performancePrediction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PredictionService>(PredictionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePrediction', () => {
    it('should generate 7-day prediction', async () => {
      const mockMetrics = [
        { date: new Date('2024-01-01'), spend: 100, conversionValue: 300, conversions: 10 },
        { date: new Date('2024-01-02'), spend: 120, conversionValue: 350, conversions: 12 },
        { date: new Date('2024-01-03'), spend: 110, conversionValue: 320, conversions: 11 },
      ];

      mockPrisma.adMetric.findMany.mockResolvedValue(mockMetrics);
      mockPrisma.performancePrediction.create.mockResolvedValue({
        id: 'pred_1',
        predictionType: '7day',
        predictedROAS: 2.8,
        predictedSpend: 800,
        predictedConversions: 75,
        confidenceScore: 0.7,
      });

      const result = await service.generatePrediction({
        campaignId: 'camp_1',
        predictionType: '7day',
      });

      expect(result).toBeDefined();
      expect(result.predictionType).toBe('7day');
      expect(mockPrisma.adMetric.findMany).toHaveBeenCalled();
    });

    it('should generate 30-day prediction', async () => {
      const mockMetrics = Array(30).fill(null).map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        spend: 100 + Math.random() * 50,
        conversionValue: 300 + Math.random() * 100,
        conversions: 10 + Math.floor(Math.random() * 5),
      }));

      mockPrisma.adMetric.findMany.mockResolvedValue(mockMetrics);
      mockPrisma.performancePrediction.create.mockResolvedValue({
        id: 'pred_2',
        predictionType: '30day',
        predictedROAS: 2.5,
        predictedSpend: 3500,
        predictedConversions: 320,
        confidenceScore: 0.65,
      });

      const result = await service.generatePrediction({
        campaignId: 'camp_1',
        predictionType: '30day',
      });

      expect(result).toBeDefined();
      expect(result.predictionType).toBe('30day');
    });

    it('should handle empty metrics', async () => {
      mockPrisma.adMetric.findMany.mockResolvedValue([]);
      mockPrisma.performancePrediction.create.mockResolvedValue({
        id: 'pred_3',
        predictionType: '7day',
        predictedROAS: 0,
        predictedSpend: 0,
        predictedConversions: 0,
        confidenceScore: 0,
      });

      const result = await service.generatePrediction({
        campaignId: 'camp_1',
        predictionType: '7day',
      });

      expect(result.confidenceScore).toBeLessThan(0.5);
    });
  });

  describe('getLatestPredictions', () => {
    it('should return latest predictions for campaign', async () => {
      const mockPredictions = [
        { id: '1', predictionType: '7day', predictedROAS: 2.5 },
        { id: '2', predictionType: '30day', predictedROAS: 2.3 },
      ];

      mockPrisma.performancePrediction.findMany.mockResolvedValue(mockPredictions);

      const result = await service.getLatestPredictions('camp_1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.performancePrediction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'camp_1' },
        }),
      );
    });
  });
});
