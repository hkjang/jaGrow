import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MultiTouchAttributionService } from '../services/multi-touch-attribution.service';

@Controller('attribution')
export class AttributionController {
  constructor(
    private readonly attributionService: MultiTouchAttributionService,
  ) {}

  /**
   * Track a touchpoint in user journey
   */
  @Post('touchpoint')
  async trackTouchpoint(
    @Body() body: {
      userId: string;
      sessionId?: string;
      channel: string;
      source?: string;
      medium?: string;
      campaign?: string;
      clickId?: string;
    },
  ) {
    await this.attributionService.trackTouchpoint(
      body.userId,
      body.sessionId || '',
      {
        channel: body.channel,
        source: body.source,
        medium: body.medium,
        campaign: body.campaign,
        clickId: body.clickId,
        timestamp: new Date(),
      },
    );
    return { success: true };
  }

  /**
   * Record a conversion
   */
  @Post('conversion')
  async recordConversion(
    @Body() body: {
      userId: string;
      conversionValue: number;
      model?: 'last_touch' | 'first_touch' | 'linear' | 'time_decay' | 'data_driven';
    },
  ) {
    const result = await this.attributionService.recordConversion(
      body.userId,
      body.conversionValue,
      body.model || 'last_touch',
    );
    return result;
  }

  /**
   * Get user journey
   */
  @Get('journey/:userId')
  async getUserJourney(@Param('userId') userId: string) {
    // Journey data would be retrieved from database
    return { userId, message: 'Journey tracking available via touchpoint API' };
  }

  /**
   * Compare attribution models
   */
  @Get('compare/:userId')
  async compareModels(@Param('userId') userId: string) {
    // Model comparison would use attribution service
    return { userId, message: 'Use conversion endpoint with different model parameters' };
  }

  /**
   * Get channel attribution summary
   */
  @Get('channels')
  async getChannelSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('model') model: string = 'last_touch',
  ) {
    return this.attributionService.getChannelAttributionSummary(
      new Date(startDate),
      new Date(endDate),
      model as any,
    );
  }
}
