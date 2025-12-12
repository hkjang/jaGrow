import { Test, TestingModule } from '@nestjs/testing';
import { AICopyGeneratorService } from './ai-copy-generator.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AICopyGeneratorService', () => {
  let service: AICopyGeneratorService;

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AICopyGeneratorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AICopyGeneratorService>(AICopyGeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAdCopy', () => {
    it('should generate ad copy with AI', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: `HEADLINE: 최고의 상품을 만나보세요
DESCRIPTION: 품질과 가격 모두 만족스러운 선택
CTA: 지금 구매하기
VARIATION1: NEW 최고의 상품
VARIATION2: BEST 최고의 상품
VARIATION3: 특가 최고의 상품`,
              },
            },
          ],
        },
      });

      const result = await service.generateAdCopy({
        product: '신발',
        targetAudience: '20-30대 여성',
        platform: 'meta',
        tone: 'casual',
      });

      expect(result).toBeDefined();
      expect(result?.headline).toContain('최고의 상품');
      expect(result?.variations).toHaveLength(3);
    });

    it('should return fallback copy on API failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const result = await service.generateAdCopy({
        product: '신발',
        targetAudience: '20-30대 여성',
        platform: 'meta',
        tone: 'casual',
      });

      expect(result).toBeDefined();
      expect(result?.headline).toContain('신발');
    });

    it('should handle different tones', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const urgentResult = await service.generateAdCopy({
        product: '세일 상품',
        targetAudience: '쇼핑 고객',
        platform: 'google',
        tone: 'urgent',
      });

      expect(urgentResult?.headline).toContain('마감');
    });
  });

  describe('analyzeCopyPerformance', () => {
    it('should analyze copy and provide suggestions', async () => {
      const result = await service.analyzeCopyPerformance(
        '지금 바로 구매하세요!',
        { ctr: 0.5, conversionRate: 1 },
      );

      expect(result.score).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should suggest improvements for low CTR', async () => {
      const result = await service.analyzeCopyPerformance(
        '상품 안내',
        { ctr: 0.3, conversionRate: 0.5 },
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(70);
    });

    it('should give higher score for power words', async () => {
      const result = await service.analyzeCopyPerformance(
        '무료 배송! 한정 특가!',
        { ctr: 2, conversionRate: 3 },
      );

      expect(result.score).toBeGreaterThan(50);
    });
  });

  describe('generateABTestVariations', () => {
    it('should generate multiple variations', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const baseCopy = {
        headline: '테스트 헤드라인',
        description: '테스트 설명',
        callToAction: '구매하기',
        variations: [],
        targetAudience: '테스트 고객',
        tone: 'professional',
      };

      const result = await service.generateABTestVariations(baseCopy, 2);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
