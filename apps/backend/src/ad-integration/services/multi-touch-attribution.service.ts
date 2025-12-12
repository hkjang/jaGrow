import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AttributionModel = 'last_touch' | 'first_touch' | 'linear' | 'time_decay' | 'data_driven';

export interface TouchPointData {
  channel: string;
  source?: string;
  medium?: string;
  campaign?: string;
  adGroup?: string;
  adId?: string;
  clickId?: string;
  clickIdType?: string;
  timestamp: Date;
}

export interface AttributionResult {
  journeyId: string;
  model: AttributionModel;
  touchpoints: {
    id: string;
    channel: string;
    weight: number;
    creditedValue: number;
  }[];
  totalValue: number;
}

@Injectable()
export class MultiTouchAttributionService {
  private readonly logger = new Logger(MultiTouchAttributionService.name);

  // Time decay half-life in days
  private readonly TIME_DECAY_HALF_LIFE = 7;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a touchpoint for a user journey
   */
  async trackTouchpoint(userId: string, sessionId: string, data: TouchPointData): Promise<void> {
    try {
      // Find or create journey
      let journey = await this.prisma.userJourney.findFirst({
        where: {
          userId,
          convertedAt: null, // Only open journeys
        },
        orderBy: { createdAt: 'desc' },
        include: { touchpoints: true },
      });

      if (!journey) {
        journey = await this.prisma.userJourney.create({
          data: {
            userId,
            sessionId,
          },
          include: { touchpoints: true },
        });
      }

      // Get the next order number
      const order = journey.touchpoints.length + 1;

      // Create touchpoint
      await this.prisma.touchPoint.create({
        data: {
          journeyId: journey.id,
          channel: data.channel,
          source: data.source,
          medium: data.medium,
          campaign: data.campaign,
          adGroup: data.adGroup,
          adId: data.adId,
          clickId: data.clickId,
          clickIdType: data.clickIdType,
          timestamp: data.timestamp,
          order,
        },
      });

      this.logger.debug(`Tracked touchpoint for user ${userId}, journey ${journey.id}`);
    } catch (error) {
      this.logger.error(`Error tracking touchpoint: ${error}`);
    }
  }

  /**
   * Record a conversion and calculate attribution
   */
  async recordConversion(
    userId: string,
    conversionValue: number,
    model: AttributionModel = 'last_touch',
  ): Promise<AttributionResult | null> {
    try {
      // Find the active journey
      const journey = await this.prisma.userJourney.findFirst({
        where: {
          userId,
          convertedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        include: { touchpoints: { orderBy: { order: 'asc' } } },
      });

      if (!journey || journey.touchpoints.length === 0) {
        this.logger.warn(`No journey or touchpoints found for user ${userId}`);
        return null;
      }

      // Calculate attribution weights based on model
      const weights = this.calculateWeights(journey.touchpoints, model);

      // Update touchpoints with attribution weights
      for (let i = 0; i < journey.touchpoints.length; i++) {
        await this.prisma.touchPoint.update({
          where: { id: journey.touchpoints[i].id },
          data: { attributionWeight: weights[i] },
        });
      }

      // Mark journey as converted
      await this.prisma.userJourney.update({
        where: { id: journey.id },
        data: {
          conversionValue,
          convertedAt: new Date(),
          attributionModel: model,
        },
      });

      // Build result
      const result: AttributionResult = {
        journeyId: journey.id,
        model,
        touchpoints: journey.touchpoints.map((tp, i) => ({
          id: tp.id,
          channel: tp.channel,
          weight: weights[i],
          creditedValue: conversionValue * weights[i],
        })),
        totalValue: conversionValue,
      };

      this.logger.log(`Conversion recorded for user ${userId} with ${model} model`);
      return result;
    } catch (error) {
      this.logger.error(`Error recording conversion: ${error}`);
      return null;
    }
  }

  /**
   * Calculate attribution weights based on model
   */
  private calculateWeights(touchpoints: any[], model: AttributionModel): number[] {
    const count = touchpoints.length;
    
    switch (model) {
      case 'last_touch':
        return this.lastTouchWeights(count);
      
      case 'first_touch':
        return this.firstTouchWeights(count);
      
      case 'linear':
        return this.linearWeights(count);
      
      case 'time_decay':
        return this.timeDecayWeights(touchpoints);
      
      case 'data_driven':
        return this.dataDrivenWeights(touchpoints);
      
      default:
        return this.lastTouchWeights(count);
    }
  }

  /**
   * Last Touch: 100% credit to last touchpoint
   */
  private lastTouchWeights(count: number): number[] {
    const weights = new Array(count).fill(0);
    if (count > 0) {
      weights[count - 1] = 1.0;
    }
    return weights;
  }

  /**
   * First Touch: 100% credit to first touchpoint
   */
  private firstTouchWeights(count: number): number[] {
    const weights = new Array(count).fill(0);
    if (count > 0) {
      weights[0] = 1.0;
    }
    return weights;
  }

  /**
   * Linear: Equal credit to all touchpoints
   */
  private linearWeights(count: number): number[] {
    if (count === 0) return [];
    const weight = 1.0 / count;
    return new Array(count).fill(weight);
  }

  /**
   * Time Decay: More credit to recent touchpoints
   */
  private timeDecayWeights(touchpoints: any[]): number[] {
    const count = touchpoints.length;
    if (count === 0) return [];

    const now = new Date();
    const halfLifeMs = this.TIME_DECAY_HALF_LIFE * 24 * 60 * 60 * 1000;

    // Calculate raw weights based on time decay
    const rawWeights = touchpoints.map(tp => {
      const ageMs = now.getTime() - new Date(tp.timestamp).getTime();
      return Math.pow(0.5, ageMs / halfLifeMs);
    });

    // Normalize weights to sum to 1
    const sum = rawWeights.reduce((a, b) => a + b, 0);
    return rawWeights.map(w => w / sum);
  }

  /**
   * Data-Driven: Based on historical conversion patterns
   * (Simplified implementation - in production, use ML model)
   */
  private dataDrivenWeights(touchpoints: any[]): number[] {
    const count = touchpoints.length;
    if (count === 0) return [];

    // Channel importance weights (can be learned from data)
    const channelWeights: Record<string, number> = {
      'google': 1.2,
      'meta': 1.1,
      'tiktok': 1.0,
      'direct': 0.8,
      'organic': 0.7,
      'email': 0.9,
      'referral': 0.85,
    };

    // Position weights (first and last are typically more important)
    const positionMultiplier = (index: number, total: number): number => {
      if (index === 0) return 1.3; // First touch bonus
      if (index === total - 1) return 1.5; // Last touch bonus
      return 1.0;
    };

    // Calculate raw weights
    const rawWeights = touchpoints.map((tp, i) => {
      const channelWeight = channelWeights[tp.channel.toLowerCase()] || 1.0;
      const posWeight = positionMultiplier(i, count);
      return channelWeight * posWeight;
    });

    // Normalize
    const sum = rawWeights.reduce((a, b) => a + b, 0);
    return rawWeights.map(w => w / sum);
  }

  /**
   * Get attribution report for a journey
   */
  async getJourneyAttribution(journeyId: string): Promise<any> {
    const journey = await this.prisma.userJourney.findUnique({
      where: { id: journeyId },
      include: { touchpoints: { orderBy: { order: 'asc' } } },
    });

    if (!journey) {
      return null;
    }

    return {
      journeyId: journey.id,
      userId: journey.userId,
      model: journey.attributionModel,
      conversionValue: journey.conversionValue,
      convertedAt: journey.convertedAt,
      touchpoints: journey.touchpoints.map(tp => ({
        id: tp.id,
        channel: tp.channel,
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        timestamp: tp.timestamp,
        weight: tp.attributionWeight,
        creditedValue: journey.conversionValue ? journey.conversionValue * (tp.attributionWeight || 0) : 0,
      })),
    };
  }

  /**
   * Get channel attribution summary
   */
  async getChannelAttributionSummary(
    startDate: Date,
    endDate: Date,
    model?: AttributionModel,
  ): Promise<any[]> {
    const whereClause: any = {
      convertedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (model) {
      whereClause.attributionModel = model;
    }

    const journeys = await this.prisma.userJourney.findMany({
      where: whereClause,
      include: { touchpoints: true },
    });

    // Aggregate by channel
    const channelSummary: Record<string, { conversions: number; value: number; touchpoints: number }> = {};

    for (const journey of journeys) {
      for (const tp of journey.touchpoints) {
        const channel = tp.channel.toLowerCase();
        if (!channelSummary[channel]) {
          channelSummary[channel] = { conversions: 0, value: 0, touchpoints: 0 };
        }

        channelSummary[channel].touchpoints++;
        const creditedValue = (journey.conversionValue || 0) * (tp.attributionWeight || 0);
        channelSummary[channel].value += creditedValue;
        
        // Count as conversion if this touchpoint has any weight
        if (tp.attributionWeight && tp.attributionWeight > 0) {
          channelSummary[channel].conversions += tp.attributionWeight;
        }
      }
    }

    return Object.entries(channelSummary).map(([channel, data]) => ({
      channel,
      ...data,
    }));
  }

  /**
   * Auto-assemble user path from click IDs
   */
  async assembleUserPath(userId: string): Promise<any[]> {
    // Get all attribution events for user
    const attributionEvents = await this.prisma.attributionEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });

    // Convert to touchpoint format
    return attributionEvents.map((event, index) => {
      let channel = 'direct';
      let clickIdType = null;

      if (event.gclid) {
        channel = 'google';
        clickIdType = 'gclid';
      } else if (event.fbp || event.fbc) {
        channel = 'meta';
        clickIdType = event.fbc ? 'fbc' : 'fbp';
      } else if (event.ttclid) {
        channel = 'tiktok';
        clickIdType = 'ttclid';
      } else if (event.source) {
        channel = event.source.toLowerCase();
      }

      return {
        order: index + 1,
        channel,
        source: event.source,
        medium: event.medium,
        campaign: event.campaign,
        clickId: event.gclid || event.fbc || event.fbp || event.ttclid,
        clickIdType,
        timestamp: event.timestamp,
      };
    });
  }

  /**
   * Compare attribution results across different models
   */
  async compareModels(journeyId: string): Promise<Record<AttributionModel, AttributionResult>> {
    const journey = await this.prisma.userJourney.findUnique({
      where: { id: journeyId },
      include: { touchpoints: { orderBy: { order: 'asc' } } },
    });

    if (!journey || !journey.conversionValue) {
      throw new Error('Journey not found or not converted');
    }

    const models: AttributionModel[] = ['last_touch', 'first_touch', 'linear', 'time_decay', 'data_driven'];
    const results: Record<string, AttributionResult> = {};

    for (const model of models) {
      const weights = this.calculateWeights(journey.touchpoints, model);
      
      results[model] = {
        journeyId: journey.id,
        model,
        touchpoints: journey.touchpoints.map((tp, i) => ({
          id: tp.id,
          channel: tp.channel,
          weight: weights[i],
          creditedValue: journey.conversionValue! * weights[i],
        })),
        totalValue: journey.conversionValue,
      };
    }

    return results as Record<AttributionModel, AttributionResult>;
  }
}
