import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { UTMGeneratorService } from '../services/utm-generator.service';

@Controller('utm')
export class UTMController {
  constructor(private readonly utmService: UTMGeneratorService) {}

  /**
   * Generate UTM URL
   */
  @Post('generate')
  async generateUTM(
    @Body() body: {
      baseUrl: string;
      source: string;
      medium: string;
      campaign: string;
      content?: string;
      term?: string;
      experimentId?: string;
      variationId?: string;
      segmentId?: string;
      platform?: 'google' | 'meta' | 'tiktok' | 'naver' | 'kakao' | 'generic';
    },
  ) {
    const params = {
      source: body.source,
      medium: body.medium,
      campaign: body.campaign,
      content: body.content,
      term: body.term,
      experimentId: body.experimentId,
      variationId: body.variationId,
      segmentId: body.segmentId,
    };

    return this.utmService.generateUTM(
      body.baseUrl,
      params,
      body.platform || 'generic',
    );
  }

  /**
   * Generate UTMs for multiple platforms
   */
  @Post('generate-all-platforms')
  async generateAllPlatforms(
    @Body() body: {
      baseUrl: string;
      source: string;
      medium: string;
      campaign: string;
      content?: string;
      term?: string;
      experimentId?: string;
      variationId?: string;
      segmentId?: string;
    },
  ) {
    const params = {
      source: body.source,
      medium: body.medium,
      campaign: body.campaign,
      content: body.content,
      term: body.term,
      experimentId: body.experimentId,
      variationId: body.variationId,
      segmentId: body.segmentId,
    };

    // Generate for each platform
    const platforms = ['google', 'meta', 'tiktok', 'naver', 'kakao'] as const;
    const results = platforms.map(platform => 
      this.utmService.generateUTM(body.baseUrl, params, platform)
    );
    return results;
  }

  /**
   * Bulk generate UTMs
   */
  @Post('bulk-generate')
  async bulkGenerate(
    @Body() body: {
      baseUrl: string;
      items: Array<{
        name: string;
        platform: 'google' | 'meta' | 'tiktok' | 'naver' | 'kakao' | 'generic';
        experimentId?: string;
        segmentId?: string;
      }>;
    },
  ) {
    return this.utmService.bulkGenerate(body.baseUrl, body.items);
  }

  /**
   * Parse UTM from URL
   */
  @Get('parse')
  async parseUTM(@Query('url') url: string) {
    return this.utmService.parseUTM(url);
  }

  /**
   * Get platform template
   */
  @Get('templates/:platform')
  async getTemplate(@Param('platform') platform: string) {
    return this.utmService.getTemplates(platform as any);
  }
}
