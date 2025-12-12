import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StreamProcessingService } from './stream-processing.service';

export interface AnomalyConfig {
  zScoreThreshold: number;
  minDataPoints: number;
  lookbackPeriodDays: number;
}

export interface MetricStats {
  mean: number;
  stdDev: number;
  count: number;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);
  
  private readonly defaultConfig: AnomalyConfig = {
    zScoreThreshold: 2.5, // Alert if value is 2.5 standard deviations from mean
    minDataPoints: 7, // Minimum data points needed for reliable detection
    lookbackPeriodDays: 30, // Use last 30 days for baseline
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly streamService: StreamProcessingService,
  ) {}

  /**
   * Run anomaly detection for all active campaigns (every 15 minutes)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async detectAnomaliesScheduled(): Promise<void> {
    // Only run every 15 minutes
    const now = new Date();
    if (now.getMinutes() % 15 !== 0) return;

    this.logger.log('Running scheduled anomaly detection...');
    await this.detectAnomaliesForAllCampaigns();
  }

  /**
   * Detect anomalies for all active campaigns
   */
  async detectAnomaliesForAllCampaigns(): Promise<void> {
    try {
      const activeCampaigns = await this.prisma.adCampaign.findMany({
        where: { status: 'ENABLED' },
        select: { id: true, adAccountId: true },
      });

      for (const campaign of activeCampaigns) {
        await this.detectAnomaliesForCampaign(campaign.id);
      }
    } catch (error) {
      this.logger.error('Error in anomaly detection', error);
    }
  }

  /**
   * Detect anomalies for a specific campaign
   */
  async detectAnomaliesForCampaign(campaignId: string): Promise<void> {
    const metrics = ['ctr', 'roas', 'conversionRate', 'spend', 'cpc'];

    for (const metric of metrics) {
      await this.checkMetricAnomaly(campaignId, metric);
    }
  }

  /**
   * Check if a specific metric shows anomalous behavior
   */
  private async checkMetricAnomaly(campaignId: string, metricType: string): Promise<void> {
    try {
      // Get historical data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - this.defaultConfig.lookbackPeriodDays);

      const historicalMetrics = await this.prisma.adMetric.findMany({
        where: {
          campaignId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      if (historicalMetrics.length < this.defaultConfig.minDataPoints) {
        return; // Not enough data
      }

      // Calculate baseline statistics
      const values = this.extractMetricValues(historicalMetrics, metricType);
      const stats = this.calculateStatistics(values);

      if (stats.stdDev === 0) return; // No variance

      // Get latest value
      const latestMetric = historicalMetrics[historicalMetrics.length - 1];
      const latestValue = this.getMetricValue(latestMetric, metricType);

      // Calculate Z-score
      const zScore = (latestValue - stats.mean) / stats.stdDev;

      // Check for anomaly
      if (Math.abs(zScore) > this.defaultConfig.zScoreThreshold) {
        const alertType = zScore > 0 ? 'spike' : 'drop';
        const severity = this.determineSeverity(Math.abs(zScore));

        await this.streamService.publishAnomalyAlert({
          campaignId,
          metricType,
          alertType,
          currentValue: latestValue,
          expectedValue: stats.mean,
          deviation: zScore,
          severity,
        });

        this.logger.warn(
          `Anomaly detected: ${metricType} ${alertType} for campaign ${campaignId}. ` +
          `Current: ${latestValue.toFixed(2)}, Expected: ${stats.mean.toFixed(2)}, Z-Score: ${zScore.toFixed(2)}`
        );
      }

      // Cache the threshold for dynamic adjustment
      await this.updateDynamicThreshold(campaignId, metricType, stats);
    } catch (error) {
      this.logger.error(`Error checking anomaly for ${metricType}`, error);
    }
  }

  /**
   * Extract metric values from historical data
   */
  private extractMetricValues(metrics: any[], metricType: string): number[] {
    return metrics.map(m => this.getMetricValue(m, metricType)).filter(v => v !== null && v !== undefined);
  }

  /**
   * Get specific metric value from a metric record
   */
  private getMetricValue(metric: any, metricType: string): number {
    switch (metricType) {
      case 'ctr':
        return metric.ctr ?? (metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0);
      case 'roas':
        return metric.roas ?? (metric.spend > 0 ? metric.conversionValue / metric.spend : 0);
      case 'conversionRate':
        return metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0;
      case 'spend':
        return metric.spend ?? 0;
      case 'cpc':
        return metric.cpc ?? (metric.clicks > 0 ? metric.spend / metric.clicks : 0);
      default:
        return 0;
    }
  }

  /**
   * Calculate mean and standard deviation
   */
  private calculateStatistics(values: number[]): MetricStats {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, count: 0 };
    }

    const count = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / count;
    
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / count;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, count };
  }

  /**
   * Determine alert severity based on Z-score
   */
  private determineSeverity(absZScore: number): string {
    if (absZScore >= 4) return 'critical';
    if (absZScore >= 3.5) return 'high';
    if (absZScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Update dynamic threshold based on recent data
   */
  private async updateDynamicThreshold(
    campaignId: string,
    metricType: string,
    stats: MetricStats,
  ): Promise<void> {
    const thresholdKey = `anomaly:threshold:${campaignId}:${metricType}`;
    
    await this.cacheManager.set(thresholdKey, {
      mean: stats.mean,
      stdDev: stats.stdDev,
      upper: stats.mean + (stats.stdDev * this.defaultConfig.zScoreThreshold),
      lower: stats.mean - (stats.stdDev * this.defaultConfig.zScoreThreshold),
      updatedAt: new Date(),
    }, 86400); // 24 hours TTL
  }

  /**
   * Get current thresholds for a campaign metric
   */
  async getThreshold(campaignId: string, metricType: string): Promise<any> {
    const thresholdKey = `anomaly:threshold:${campaignId}:${metricType}`;
    return this.cacheManager.get(thresholdKey);
  }

  /**
   * Get unresolved anomaly alerts
   */
  async getUnresolvedAlerts(campaignId?: string): Promise<any[]> {
    const where: any = { isResolved: false };
    if (campaignId) {
      where.campaignId = campaignId;
    }

    return this.prisma.anomalyAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Resolve an anomaly alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.prisma.anomalyAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Custom threshold breach detection
   */
  async checkThresholdBreach(
    campaignId: string,
    metricType: string,
    currentValue: number,
    threshold: number,
    operator: 'gt' | 'lt' | 'gte' | 'lte',
  ): Promise<boolean> {
    let breached = false;

    switch (operator) {
      case 'gt':
        breached = currentValue > threshold;
        break;
      case 'lt':
        breached = currentValue < threshold;
        break;
      case 'gte':
        breached = currentValue >= threshold;
        break;
      case 'lte':
        breached = currentValue <= threshold;
        break;
    }

    if (breached) {
      await this.streamService.publishAnomalyAlert({
        campaignId,
        metricType,
        alertType: 'threshold_breach',
        currentValue,
        expectedValue: threshold,
        deviation: ((currentValue - threshold) / threshold) * 100,
        severity: 'medium',
      });
    }

    return breached;
  }
}
