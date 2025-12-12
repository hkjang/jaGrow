import { Test, TestingModule } from '@nestjs/testing';
import { UTMGeneratorService } from './utm-generator.service';

describe('UTMGeneratorService', () => {
  let service: UTMGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UTMGeneratorService],
    }).compile();

    service = module.get<UTMGeneratorService>(UTMGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUTM', () => {
    it('should generate UTM with all parameters', () => {
      const result = service.generateUTM(
        'https://example.com',
        {
          source: 'google',
          medium: 'cpc',
          campaign: 'summer_sale',
          content: 'banner_1',
          term: 'shoes',
        },
        'google',
      );

      expect(result.fullUrl).toContain('utm_source=google');
      expect(result.fullUrl).toContain('utm_medium=cpc');
      expect(result.fullUrl).toContain('utm_campaign=summer_sale');
      expect(result.platform).toBe('google');
    });

    it('should handle experimentId and segmentId', () => {
      const result = service.generateUTM(
        'https://example.com',
        {
          source: 'meta',
          medium: 'social',
          campaign: 'test_campaign',
          experimentId: 'exp_123',
          segmentId: 'seg_456',
        },
        'meta',
      );

      expect(result.fullUrl).toContain('exp_123');
      expect(result.fullUrl).toContain('seg_456');
    });

    it('should append to existing query string', () => {
      const result = service.generateUTM(
        'https://example.com?existing=param',
        {
          source: 'test',
          medium: 'test',
          campaign: 'test',
        },
        'generic',
      );

      expect(result.fullUrl).toContain('existing=param');
      expect(result.fullUrl).toContain('&utm_source=');
    });
  });

  describe('parseUTM', () => {
    it('should parse UTM parameters from URL', () => {
      const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=test';
      const result = service.parseUTM(url);

      expect(result.source).toBe('google');
      expect(result.medium).toBe('cpc');
      expect(result.campaign).toBe('test');
    });

    it('should return empty values for missing parameters', () => {
      const url = 'https://example.com?utm_source=google';
      const result = service.parseUTM(url);

      expect(result.source).toBe('google');
      expect(result.medium).toBeUndefined();
    });
  });

  describe('bulkGenerate', () => {
    it('should generate multiple UTMs', () => {
      const items = [
        { name: 'Campaign 1', platform: 'google' as const },
        { name: 'Campaign 2', platform: 'meta' as const },
      ];

      const results = service.bulkGenerate('https://example.com', items);

      expect(results).toHaveLength(2);
      expect(results[0].platform).toBe('google');
      expect(results[1].platform).toBe('meta');
    });
  });

  describe('getTemplates', () => {
    it('should return templates for Google', () => {
      const template = service.getTemplates('google');
      expect(template).toBeDefined();
    });

    it('should return templates for Meta', () => {
      const template = service.getTemplates('meta');
      expect(template).toBeDefined();
    });
  });
});
