import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Redis = require('ioredis');

export interface AdPerformanceEvent {
  campaignId: string;
  adAccountId: string;
  platform: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversionValue: number;
  timestamp: Date;
}

export interface QualityScore {
  campaignId: string;
  score: number;
  factors: {
    ctr: number;
    conversionRate: number;
    roas: number;
    spendEfficiency: number;
  };
  timestamp: Date;
}

@Injectable()
export class StreamProcessingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamProcessingService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redisSubscriber: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redisPublisher: any = null;
  private readonly CHANNEL_AD_PERFORMANCE = 'ad:performance:stream';
  private readonly CHANNEL_ANOMALY_ALERTS = 'ad:anomaly:alerts';
  private readonly CHANNEL_QUALITY_SCORES = 'ad:quality:scores';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisSubscriber = new Redis(redisUrl);
      this.redisPublisher = new Redis(redisUrl);

      // Subscribe to performance events channel
      await this.redisSubscriber.subscribe(this.CHANNEL_AD_PERFORMANCE);
      
      this.redisSubscriber.on('message', async (channel: string, message: string) => {
        if (channel === this.CHANNEL_AD_PERFORMANCE) {
          await this.processPerformanceEvent(JSON.parse(message));
        }
      });

      this.logger.log('Stream processing service initialized with Redis Pub/Sub');
    } catch (error) {
      this.logger.error('Failed to initialize Redis connection', error);
    }
  }

  async onModuleDestroy() {
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
    if (this.redisPublisher) {
      await this.redisPublisher.quit();
    }
  }

  /**
   * Publish ad performance event to the stream
   */
  async publishPerformanceEvent(event: AdPerformanceEvent): Promise<void> {
    if (!this.redisPublisher) {
      this.logger.warn('Redis publisher not initialized');
      return;
    }

    try {
      await this.redisPublisher.publish(
        this.CHANNEL_AD_PERFORMANCE,
        JSON.stringify(event),
      );
      this.logger.debug(`Published performance event for campaign ${event.campaignId}`);
    } catch (error) {
      this.logger.error('Failed to publish performance event', error);
    }
  }

  /**
   * Process incoming performance events
   */
  private async processPerformanceEvent(event: AdPerformanceEvent): Promise<void> {
    this.logger.debug(`Processing performance event for campaign ${event.campaignId}`);

    try {
      // Calculate real-time metrics
      const ctr = event.impressions > 0 ? (event.clicks / event.impressions) * 100 : 0;
      const roas = event.spend > 0 ? event.conversionValue / event.spend : 0;
      const conversionRate = event.clicks > 0 ? (event.conversions / event.clicks) * 100 : 0;
      const cpc = event.clicks > 0 ? event.spend / event.clicks : 0;

      // Update rolling statistics cache
      await this.updateRollingStats(event.campaignId, { ctr, roas, conversionRate, cpc, spend: event.spend });

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(event.campaignId, {
        ctr,
        roas,
        conversionRate,
        spend: event.spend,
      });

      // Publish quality score
      if (this.redisPublisher) {
        await this.redisPublisher.publish(
          this.CHANNEL_QUALITY_SCORES,
          JSON.stringify(qualityScore),
        );
      }

      // Cache latest metrics for dashboard
      await this.cacheManager.set(
        `realtime:metrics:${event.campaignId}`,
        { ctr, roas, conversionRate, cpc, timestamp: new Date() },
        300, // 5 minutes TTL
      );
    } catch (error) {
      this.logger.error(`Error processing performance event: ${error}`);
    }
  }

  /**
   * Update rolling statistics for trend analysis
   */
  private async updateRollingStats(
    campaignId: string,
    metrics: { ctr: number; roas: number; conversionRate: number; cpc: number; spend: number },
  ): Promise<void> {
    const statsKey = `rolling:stats:${campaignId}`;
    const existingStats = await this.cacheManager.get<any[]>(statsKey) || [];

    // Keep last 100 data points for rolling calculations
    const updatedStats = [
      ...existingStats.slice(-99),
      { ...metrics, timestamp: Date.now() },
    ];

    await this.cacheManager.set(statsKey, updatedStats, 3600); // 1 hour TTL
  }

  /**
   * Calculate campaign quality score (0-100)
   */
  private async calculateQualityScore(
    campaignId: string,
    metrics: { ctr: number; roas: number; conversionRate: number; spend: number },
  ): Promise<QualityScore> {
    // Benchmark values (can be customized per industry/account)
    const benchmarks = {
      ctr: 2.0, // 2% CTR is good
      roas: 4.0, // 4x ROAS is good
      conversionRate: 3.0, // 3% conversion rate is good
    };

    // Calculate individual factor scores (0-25 each)
    const ctrScore = Math.min(25, (metrics.ctr / benchmarks.ctr) * 25);
    const roasScore = Math.min(25, (metrics.roas / benchmarks.roas) * 25);
    const conversionScore = Math.min(25, (metrics.conversionRate / benchmarks.conversionRate) * 25);
    
    // Spend efficiency (higher spend with good metrics = better)
    const spendEfficiency = Math.min(25, Math.log10(metrics.spend + 1) * 5);

    const totalScore = ctrScore + roasScore + conversionScore + spendEfficiency;

    return {
      campaignId,
      score: Math.round(totalScore),
      factors: {
        ctr: Math.round(ctrScore),
        conversionRate: Math.round(conversionScore),
        roas: Math.round(roasScore),
        spendEfficiency: Math.round(spendEfficiency),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get real-time metrics for a campaign
   */
  async getRealtimeMetrics(campaignId: string): Promise<any> {
    return this.cacheManager.get(`realtime:metrics:${campaignId}`);
  }

  /**
   * Get quality score for a campaign
   */
  async getQualityScore(campaignId: string): Promise<QualityScore | null> {
    const result = await this.cacheManager.get<QualityScore>(`quality:score:${campaignId}`);
    return result ?? null;
  }

  /**
   * Get rolling statistics for trend analysis
   */
  async getRollingStats(campaignId: string): Promise<any[]> {
    return await this.cacheManager.get<any[]>(`rolling:stats:${campaignId}`) || [];
  }

  /**
   * Publish anomaly alert
   */
  async publishAnomalyAlert(alert: {
    campaignId: string;
    metricType: string;
    alertType: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    severity: string;
  }): Promise<void> {
    if (!this.redisPublisher) {
      this.logger.warn('Redis publisher not initialized');
      return;
    }

    try {
      // Save to database
      await this.prisma.anomalyAlert.create({
        data: {
          campaignId: alert.campaignId,
          metricType: alert.metricType,
          alertType: alert.alertType,
          currentValue: alert.currentValue,
          expectedValue: alert.expectedValue,
          threshold: Math.abs(alert.deviation),
          deviation: alert.deviation,
          severity: alert.severity,
          message: `${alert.metricType} ${alert.alertType}: current ${alert.currentValue.toFixed(2)}, expected ${alert.expectedValue.toFixed(2)}`,
        },
      });

      // Publish to subscribers
      await this.redisPublisher.publish(
        this.CHANNEL_ANOMALY_ALERTS,
        JSON.stringify(alert),
      );

      this.logger.warn(`Anomaly alert published: ${alert.metricType} ${alert.alertType} for campaign ${alert.campaignId}`);
    } catch (error) {
      this.logger.error('Failed to publish anomaly alert', error);
    }
  }
}
