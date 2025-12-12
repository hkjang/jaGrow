import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';
import { TikTokAdsService } from './tiktok-ads.service';
import { StreamProcessingService } from './stream-processing.service';

export interface OptimizationRuleCondition {
  metric: 'roas' | 'ctr' | 'cpc' | 'cpa' | 'spend' | 'conversions';
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  period: 'day' | 'week' | 'month';
}

export interface OptimizationAction {
  type: 'pause' | 'resume' | 'increase_budget' | 'decrease_budget' | 'alert';
  params?: {
    percentage?: number;
    alertSeverity?: string;
  };
}

@Injectable()
export class AutoCampaignManagerService {
  private readonly logger = new Logger(AutoCampaignManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleService: GoogleAdsService,
    private readonly metaService: MetaAdsService,
    private readonly tiktokService: TikTokAdsService,
    private readonly streamService: StreamProcessingService,
  ) {}

  /**
   * Run auto optimization rules every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runAutoOptimization(): Promise<void> {
    this.logger.log('Running auto optimization rules...');

    // Get all active rules
    const rules = await this.prisma.optimizationRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    for (const rule of rules) {
      await this.evaluateRule(rule);
    }
  }

  /**
   * Evaluate a single optimization rule
   */
  private async evaluateRule(rule: any): Promise<void> {
    try {
      const conditions = rule.conditions as OptimizationRuleCondition[];
      const actions = rule.actions as OptimizationAction[];

      // Get campaigns that match the conditions
      const matchingCampaigns = await this.findMatchingCampaigns(conditions);

      for (const campaign of matchingCampaigns) {
        for (const action of actions) {
          await this.executeAction(campaign, action, rule.id);
        }
      }

      // Update rule trigger stats
      if (matchingCampaigns.length > 0) {
        await this.prisma.optimizationRule.update({
          where: { id: rule.id },
          data: {
            lastTriggeredAt: new Date(),
            triggerCount: { increment: 1 },
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error evaluating rule ${rule.id}`, error);
    }
  }

  /**
   * Find campaigns that match all conditions
   */
  private async findMatchingCampaigns(conditions: OptimizationRuleCondition[]): Promise<any[]> {
    // Get all active campaigns with their metrics
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { status: 'ENABLED' },
      include: {
        adAccount: true,
        metrics: {
          where: {
            date: {
              gte: this.getStartDate('week'), // Default to week for evaluation
            },
          },
        },
      },
    });

    // Filter campaigns that match all conditions
    return campaigns.filter(campaign => {
      return conditions.every(condition => {
        const metricValue = this.calculateMetricValue(campaign.metrics, condition.metric);
        return this.evaluateCondition(metricValue, condition.operator, condition.value);
      });
    });
  }

  /**
   * Calculate aggregate metric value from campaign metrics
   */
  private calculateMetricValue(metrics: any[], metricType: string): number {
    if (metrics.length === 0) return 0;

    const totals = metrics.reduce((acc, m) => ({
      spend: acc.spend + (m.spend || 0),
      revenue: acc.revenue + (m.conversionValue || 0),
      clicks: acc.clicks + (m.clicks || 0),
      impressions: acc.impressions + (m.impressions || 0),
      conversions: acc.conversions + (m.conversions || 0),
    }), { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 });

    switch (metricType) {
      case 'roas':
        return totals.spend > 0 ? totals.revenue / totals.spend : 0;
      case 'ctr':
        return totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      case 'cpc':
        return totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      case 'cpa':
        return totals.conversions > 0 ? totals.spend / totals.conversions : 0;
      case 'spend':
        return totals.spend;
      case 'conversions':
        return totals.conversions;
      default:
        return 0;
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  /**
   * Execute an optimization action
   */
  private async executeAction(campaign: any, action: OptimizationAction, ruleId: string): Promise<void> {
    const platform = campaign.adAccount.platform;
    let success = true;
    let errorMessage: string | undefined;
    let previousValue: string | undefined;
    let newValue: string | undefined;

    try {
      switch (action.type) {
        case 'pause':
          previousValue = campaign.status;
          newValue = 'PAUSED';
          await this.pauseCampaign(campaign.id, platform, campaign.externalId, campaign.adAccount.accessToken);
          this.logger.log(`Paused campaign ${campaign.name} (${campaign.id})`);
          break;

        case 'resume':
          previousValue = campaign.status;
          newValue = 'ENABLED';
          await this.resumeCampaign(campaign.id, platform, campaign.externalId, campaign.adAccount.accessToken);
          this.logger.log(`Resumed campaign ${campaign.name} (${campaign.id})`);
          break;

        case 'increase_budget':
          const increasePercent = action.params?.percentage || 10;
          previousValue = campaign.budget?.toString();
          const increasedBudget = (campaign.budget || 0) * (1 + increasePercent / 100);
          newValue = increasedBudget.toString();
          await this.updateBudget(campaign.id, platform, campaign.externalId, campaign.adAccount.accessToken, increasedBudget);
          this.logger.log(`Increased budget for ${campaign.name} by ${increasePercent}%`);
          break;

        case 'decrease_budget':
          const decreasePercent = action.params?.percentage || 10;
          previousValue = campaign.budget?.toString();
          const decreasedBudget = (campaign.budget || 0) * (1 - decreasePercent / 100);
          newValue = decreasedBudget.toString();
          await this.updateBudget(campaign.id, platform, campaign.externalId, campaign.adAccount.accessToken, decreasedBudget);
          this.logger.log(`Decreased budget for ${campaign.name} by ${decreasePercent}%`);
          break;

        case 'alert':
          await this.streamService.publishAnomalyAlert({
            campaignId: campaign.id,
            metricType: 'optimization_rule',
            alertType: 'rule_triggered',
            currentValue: 0,
            expectedValue: 0,
            deviation: 0,
            severity: action.params?.alertSeverity || 'medium',
          });
          break;
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to execute action ${action.type} on campaign ${campaign.id}`, error);
    }

    // Log the action
    await this.prisma.optimizationLog.create({
      data: {
        ruleId,
        campaignId: campaign.id,
        action: action.type,
        previousValue,
        newValue,
        reason: `Rule triggered: ${ruleId}`,
        success,
        errorMessage,
      },
    });
  }

  /**
   * Pause campaign on platform
   */
  private async pauseCampaign(
    campaignId: string,
    platform: string,
    externalId: string,
    accessToken: string,
  ): Promise<void> {
    // Update local status
    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });

    // Platform-specific pause (placeholder - would call actual API)
    switch (platform) {
      case 'GOOGLE':
        // await this.googleService.pauseCampaign(externalId, accessToken);
        break;
      case 'META':
        // await this.metaService.pauseCampaign(externalId, accessToken);
        break;
      case 'TIKTOK':
        // await this.tiktokService.pauseCampaign(externalId, accessToken);
        break;
    }
  }

  /**
   * Resume campaign on platform
   */
  private async resumeCampaign(
    campaignId: string,
    platform: string,
    externalId: string,
    accessToken: string,
  ): Promise<void> {
    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status: 'ENABLED' },
    });
  }

  /**
   * Update campaign budget on platform
   */
  private async updateBudget(
    campaignId: string,
    platform: string,
    externalId: string,
    accessToken: string,
    newBudget: number,
  ): Promise<void> {
    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { budget: newBudget },
    });
  }

  /**
   * Get start date for a period
   */
  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  /**
   * Auto-pause low performing ads
   */
  async autoPauseLowPerformers(
    minROAS: number = 1.0,
    minSpend: number = 10,
    lookbackDays: number = 7,
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    const lowPerformers = await this.prisma.adCampaign.findMany({
      where: {
        status: 'ENABLED',
        metrics: {
          some: {
            date: { gte: startDate },
          },
        },
      },
      include: {
        adAccount: true,
        metrics: {
          where: { date: { gte: startDate } },
        },
      },
    });

    let pausedCount = 0;

    for (const campaign of lowPerformers) {
      const totals = campaign.metrics.reduce((acc, m) => ({
        spend: acc.spend + (m.spend || 0),
        revenue: acc.revenue + (m.conversionValue || 0),
      }), { spend: 0, revenue: 0 });

      const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

      if (totals.spend >= minSpend && roas < minROAS) {
        await this.pauseCampaign(
          campaign.id,
          campaign.adAccount.platform,
          campaign.externalId,
          campaign.adAccount.accessToken,
        );
        pausedCount++;

        await this.prisma.optimizationLog.create({
          data: {
            campaignId: campaign.id,
            action: 'paused',
            previousValue: 'ENABLED',
            newValue: 'PAUSED',
            reason: `Auto-pause: ROAS ${roas.toFixed(2)} < ${minROAS} threshold`,
            success: true,
          },
        });
      }
    }

    this.logger.log(`Auto-paused ${pausedCount} low performing campaigns`);
    return pausedCount;
  }

  /**
   * Auto-expand high performing creatives
   */
  async autoExpandTopPerformers(
    minROAS: number = 3.0,
    budgetIncreasePercent: number = 20,
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const topPerformers = await this.prisma.adCampaign.findMany({
      where: {
        status: 'ENABLED',
      },
      include: {
        adAccount: true,
        metrics: {
          where: { date: { gte: startDate } },
        },
      },
    });

    let expandedCount = 0;

    for (const campaign of topPerformers) {
      const totals = campaign.metrics.reduce((acc, m) => ({
        spend: acc.spend + (m.spend || 0),
        revenue: acc.revenue + (m.conversionValue || 0),
      }), { spend: 0, revenue: 0 });

      const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

      if (roas >= minROAS && totals.spend > 0) {
        const newBudget = (campaign.budget || 0) * (1 + budgetIncreasePercent / 100);
        
        await this.updateBudget(
          campaign.id,
          campaign.adAccount.platform,
          campaign.externalId,
          campaign.adAccount.accessToken,
          newBudget,
        );
        expandedCount++;

        await this.prisma.optimizationLog.create({
          data: {
            campaignId: campaign.id,
            action: 'budget_increased',
            previousValue: campaign.budget?.toString(),
            newValue: newBudget.toString(),
            reason: `Auto-expand: ROAS ${roas.toFixed(2)} >= ${minROAS} threshold`,
            success: true,
          },
        });
      }
    }

    this.logger.log(`Auto-expanded ${expandedCount} top performing campaigns`);
    return expandedCount;
  }

  /**
   * Create an optimization rule
   */
  async createRule(
    name: string,
    description: string,
    conditions: OptimizationRuleCondition[],
    actions: OptimizationAction[],
    priority: number = 0,
  ): Promise<any> {
    return this.prisma.optimizationRule.create({
      data: {
        name,
        description,
        ruleType: actions[0]?.type || 'alert',
        conditions: conditions as any,
        actions: actions as any,
        priority,
      },
    });
  }

  /**
   * Get optimization logs
   */
  async getOptimizationLogs(
    campaignId?: string,
    limit: number = 100,
  ): Promise<any[]> {
    return this.prisma.optimizationLog.findMany({
      where: campaignId ? { campaignId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
