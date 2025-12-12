import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface FunnelStage {
  name: string;
  eventName: string;
  count: number;
  value: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface ChannelPerformance {
  channel: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  qualityScore: number;
}

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // Funnel-based Attribution Report
  // ====================================================

  /**
   * Generate funnel stage attribution report
   */
  async generateFunnelReport(
    adAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    stages: FunnelStage[];
    totalConversions: number;
    totalValue: number;
    overallConversionRate: number;
  }> {
    // Define funnel stages
    const funnelDefinition = [
      { name: 'Impression', eventName: 'ad_impression' },
      { name: 'Click', eventName: 'ad_click' },
      { name: 'Page View', eventName: 'page_view' },
      { name: 'Add to Cart', eventName: 'add_to_cart' },
      { name: 'Checkout', eventName: 'begin_checkout' },
      { name: 'Purchase', eventName: 'purchase' },
    ];

    const stages: FunnelStage[] = [];
    let previousCount = 0;

    for (let i = 0; i < funnelDefinition.length; i++) {
      const stage = funnelDefinition[i];
      
      // Get metrics for this stage from campaigns
      const metrics = await this.getStageMetrics(adAccountId, stage.eventName, startDate, endDate);
      
      const conversionRate = previousCount > 0 ? (metrics.count / previousCount) * 100 : 100;
      const dropOffRate = previousCount > 0 ? ((previousCount - metrics.count) / previousCount) * 100 : 0;

      stages.push({
        name: stage.name,
        eventName: stage.eventName,
        count: metrics.count,
        value: metrics.value,
        conversionRate: i === 0 ? 100 : conversionRate,
        dropOffRate,
      });

      previousCount = metrics.count;
    }

    const totalConversions = stages[stages.length - 1]?.count || 0;
    const totalValue = stages[stages.length - 1]?.value || 0;
    const overallConversionRate = stages[0]?.count > 0 
      ? (totalConversions / stages[0].count) * 100 
      : 0;

    return {
      stages,
      totalConversions,
      totalValue,
      overallConversionRate,
    };
  }

  private async getStageMetrics(
    adAccountId: string,
    eventName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ count: number; value: number }> {
    if (eventName === 'ad_impression' || eventName === 'ad_click') {
      // Get from ad metrics
      const metrics = await this.prisma.adMetric.aggregate({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        _sum: {
          impressions: true,
          clicks: true,
          conversionValue: true,
        },
      });

      return {
        count: eventName === 'ad_impression' 
          ? metrics._sum.impressions || 0 
          : metrics._sum.clicks || 0,
        value: metrics._sum.conversionValue || 0,
      };
    }

    // Get from event table
    const events = await this.prisma.event.count({
      where: {
        eventName,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    return { count: events, value: 0 };
  }

  // ====================================================
  // Cost vs Quality Report
  // ====================================================

  /**
   * Generate advertising cost vs traffic quality report
   */
  async generateCostQualityReport(
    adAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChannelPerformance[]> {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        adAccount: { id: adAccountId },
      },
      include: {
        adAccount: true,
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    // Group by channel (platform)
    const channelData = new Map<string, ChannelPerformance>();

    for (const campaign of campaigns) {
      const channel = campaign.adAccount.platform.toLowerCase();
      
      const existing = channelData.get(channel) || {
        channel,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
        roas: 0,
        cpa: 0,
        qualityScore: 0,
      };

      for (const metric of campaign.metrics) {
        existing.impressions += metric.impressions;
        existing.clicks += metric.clicks;
        existing.spend += metric.spend;
        existing.conversions += metric.conversions;
        existing.revenue += metric.conversionValue;
      }

      channelData.set(channel, existing);
    }

    // Calculate derived metrics
    const results: ChannelPerformance[] = [];
    for (const [channel, data] of channelData) {
      data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
      data.cpa = data.conversions > 0 ? data.spend / data.conversions : 0;
      data.qualityScore = this.calculateQualityScore(data);
      results.push(data);
    }

    return results.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  private calculateQualityScore(data: ChannelPerformance): number {
    // Quality score based on CTR, conversion rate, and ROAS
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const convRate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
    
    // Normalize and weight
    const ctrScore = Math.min(100, ctr * 20);  // 5% CTR = 100
    const convScore = Math.min(100, convRate * 10);  // 10% conv = 100
    const roasScore = Math.min(100, data.roas * 25);  // 4x ROAS = 100

    return Math.round((ctrScore * 0.2 + convScore * 0.4 + roasScore * 0.4));
  }

  // ====================================================
  // Segment Performance Report
  // ====================================================

  /**
   * Generate automated segment performance report
   */
  async generateSegmentReport(
    adAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    // Get campaigns grouped by naming convention (segment info in name)
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { adAccountId },
      include: {
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    // Parse segments from campaign names
    const segmentData = new Map<string, any>();

    for (const campaign of campaigns) {
      const segment = this.parseSegmentFromName(campaign.name);
      
      const existing = segmentData.get(segment) || {
        segment,
        campaigns: 0,
        spend: 0,
        revenue: 0,
        conversions: 0,
        roas: 0,
      };

      existing.campaigns++;
      for (const metric of campaign.metrics) {
        existing.spend += metric.spend;
        existing.revenue += metric.conversionValue;
        existing.conversions += metric.conversions;
      }

      segmentData.set(segment, existing);
    }

    // Calculate ROAS
    const results = [];
    for (const [segment, data] of segmentData) {
      data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
      results.push(data);
    }

    return results.sort((a, b) => b.roas - a.roas);
  }

  private parseSegmentFromName(name: string): string {
    // Try to extract segment from campaign name patterns
    // Examples: "Summer_Sale_Retargeting", "New_Users_Awareness"
    const patterns = [
      /retargeting/i,
      /new.?users?/i,
      /existing.?users?/i,
      /lookalike/i,
      /awareness/i,
      /conversion/i,
    ];

    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) return match[0].toLowerCase();
    }

    return 'other';
  }

  // ====================================================
  // Scheduled Report Generation
  // ====================================================

  /**
   * Generate daily reports at 7 AM
   */
  @Cron('0 7 * * *')
  async generateDailyReports(): Promise<void> {
    this.logger.log('Generating daily reports...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const accounts = await this.prisma.adAccount.findMany({
      where: { isActive: true },
    });

    for (const account of accounts) {
      try {
        await this.generateFunnelReport(account.id, yesterday, today);
        await this.generateCostQualityReport(account.id, yesterday, today);
        await this.generateSegmentReport(account.id, yesterday, today);
        this.logger.log(`Reports generated for account ${account.id}`);
      } catch (error) {
        this.logger.error(`Failed to generate reports for ${account.id}`, error);
      }
    }
  }
}
