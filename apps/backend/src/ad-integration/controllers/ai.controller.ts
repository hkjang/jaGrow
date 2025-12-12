import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AICopyGeneratorService } from '../services/ai-copy-generator.service';
import { AIRecommendationService } from '../services/ai-recommendation.service';

@Controller('ai')
export class AIController {
  constructor(
    private readonly copyGenerator: AICopyGeneratorService,
    private readonly recommendation: AIRecommendationService,
  ) {}

  // ====================================================
  // AI Copy Generation
  // ====================================================

  /**
   * Generate ad copy
   */
  @Post('copy/generate')
  async generateCopy(
    @Body() body: {
      product: string;
      targetAudience: string;
      platform: 'google' | 'meta' | 'tiktok' | 'naver' | 'kakao';
      tone: 'professional' | 'casual' | 'urgent' | 'friendly' | 'luxury';
      keywords?: string[];
      promotionDetails?: string;
    },
  ) {
    return this.copyGenerator.generateAdCopy(body);
  }

  /**
   * Generate A/B test variations
   */
  @Post('copy/variations')
  async generateVariations(
    @Body() body: {
      headline: string;
      description: string;
      callToAction: string;
      targetAudience: string;
      tone: string;
      numVariations?: number;
    },
  ) {
    const baseCopy = {
      headline: body.headline,
      description: body.description,
      callToAction: body.callToAction,
      variations: [],
      targetAudience: body.targetAudience,
      tone: body.tone,
    };
    return this.copyGenerator.generateABTestVariations(
      baseCopy,
      body.numVariations || 3,
    );
  }

  /**
   * Analyze copy performance
   */
  @Post('copy/analyze')
  async analyzeCopy(
    @Body() body: {
      copyText: string;
      metrics: { ctr: number; conversionRate: number };
    },
  ) {
    return this.copyGenerator.analyzeCopyPerformance(
      body.copyText,
      body.metrics,
    );
  }

  // ====================================================
  // AI Recommendations
  // ====================================================

  /**
   * Get budget recommendations
   */
  @Get('recommendations/budget/:adAccountId')
  async getBudgetRecommendations(@Param('adAccountId') adAccountId: string) {
    return this.recommendation.getBudgetRecommendations(adAccountId);
  }

  /**
   * Get channel mix recommendation
   */
  @Get('recommendations/channel-mix/:adAccountId')
  async getChannelMix(
    @Param('adAccountId') adAccountId: string,
    @Query('totalBudget') totalBudget: string,
  ) {
    return this.recommendation.getChannelMixRecommendation(
      adAccountId,
      parseFloat(totalBudget || '100000'),
    );
  }

  /**
   * Get creative recommendations
   */
  @Get('recommendations/creatives/:adAccountId')
  async getCreativeRecommendations(@Param('adAccountId') adAccountId: string) {
    return this.recommendation.getCreativeRecommendations(adAccountId);
  }

  /**
   * Predict conversion probability
   */
  @Get('predictions/conversion')
  async predictConversion(
    @Query('segment') segment: string,
    @Query('channel') channel: string,
    @Query('daysSinceClick') daysSinceClick: string = '0',
  ) {
    return this.recommendation.predictConversionProbability(
      segment,
      channel,
      parseInt(daysSinceClick),
    );
  }
}
