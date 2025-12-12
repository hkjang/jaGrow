import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface BudgetRecommendation {
  adAccountId: string;
  campaignId: string;
  currentBudget: number;
  recommendedBudget: number;
  changePercent: number;
  reason: string;
  expectedROAS: number;
  iROASScore: number;
}

@Injectable()
export class BudgetOptimizerService {
  private readonly logger = new Logger(BudgetOptimizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run daily budget optimization at 5 AM
   */
  @Cron('0 5 * * *')
  async runDailyBudgetOptimization(): Promise<void> {
    this.logger.log('Running daily budget optimization...');
    await this.optimizeAllAccounts();
  }

  /**
   * Run weekly budget review on Monday at 6 AM
   */
  @Cron('0 6 * * 1')
  async runWeeklyBudgetReview(): Promise<void> {
    this.logger.log('Running weekly budget review...');
    await this.generateWeeklyRecommendations();
  }

  /**
   * Optimize budgets for all active accounts
   */
  async optimizeAllAccounts(): Promise<void> {
    const accounts = await this.prisma.adAccount.findMany({
      where: { isActive: true },
    });

    for (const account of accounts) {
      await this.optimizeAccountBudgets(account.id);
    }
  }

  /**
   * Optimize budgets for a specific account
   */
  async optimizeAccountBudgets(adAccountId: string): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    // Get all campaigns with recent performance
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        adAccountId,
        status: 'ENABLED',
      },
      include: {
        metrics: {
          where: {
            date: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
            },
          },
        },
      },
    });

    // Calculate iROAS (incremental ROAS) for each campaign
    const campaignScores = campaigns.map(campaign => {
      const performance = this.calculatePerformance(campaign.metrics);
      const iROAS = this.calculateIncrementalROAS(campaign.metrics);
      
      return {
        campaign,
        performance,
        iROAS,
      };
    });

    // Sort by iROAS score
    campaignScores.sort((a, b) => b.iROAS - a.iROAS);

    // Calculate total budget and redistribute based on iROAS
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalScore = campaignScores.reduce((sum, c) => sum + Math.max(0, c.iROAS), 0);

    for (const { campaign, performance, iROAS } of campaignScores) {
      const currentBudget = campaign.budget || 0;
      let recommendedBudget: number;
      let reason: string;

      if (totalScore > 0 && iROAS > 0) {
        // Allocate based on iROAS proportion
        const proportion = iROAS / totalScore;
        recommendedBudget = totalBudget * proportion;

        // Apply caps (don't change more than 30% at once)
        const maxBudget = currentBudget * 1.3;
        const minBudget = currentBudget * 0.7;
        recommendedBudget = Math.max(minBudget, Math.min(maxBudget, recommendedBudget));

        reason = `iROAS-based allocation (score: ${iROAS.toFixed(2)})`;
      } else if (performance.roas < 1) {
        // Poor performer, decrease budget
        recommendedBudget = currentBudget * 0.8;
        reason = `Low ROAS (${performance.roas.toFixed(2)}) - decrease budget`;
      } else {
        recommendedBudget = currentBudget;
        reason = 'Maintain current budget';
      }

      const changePercent = currentBudget > 0 
        ? ((recommendedBudget - currentBudget) / currentBudget) * 100 
        : 0;

      const recommendation: BudgetRecommendation = {
        adAccountId,
        campaignId: campaign.id,
        currentBudget,
        recommendedBudget: Math.round(recommendedBudget * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        reason,
        expectedROAS: performance.roas,
        iROASScore: iROAS,
      };

      recommendations.push(recommendation);

      // Save allocation record
      await this.saveAllocation(recommendation);
    }

    return recommendations;
  }

  /**
   * Calculate performance metrics from historical data
   */
  private calculatePerformance(metrics: any[]): {
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
    cpa: number;
  } {
    const totals = metrics.reduce((acc, m) => ({
      spend: acc.spend + (m.spend || 0),
      revenue: acc.revenue + (m.conversionValue || 0),
      conversions: acc.conversions + (m.conversions || 0),
    }), { spend: 0, revenue: 0, conversions: 0 });

    return {
      spend: totals.spend,
      revenue: totals.revenue,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      conversions: totals.conversions,
      cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    };
  }

  /**
   * Calculate incremental ROAS
   * This measures the efficiency of the marginal dollar spent
   */
  private calculateIncrementalROAS(metrics: any[]): number {
    if (metrics.length < 3) return 0;

    // Sort by date
    const sorted = [...metrics].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate ROAS trend
    let positiveSlopes = 0;
    let negativeSlopes = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prevROAS = sorted[i - 1].spend > 0 
        ? sorted[i - 1].conversionValue / sorted[i - 1].spend 
        : 0;
      const currROAS = sorted[i].spend > 0 
        ? sorted[i].conversionValue / sorted[i].spend 
        : 0;
      const spendChange = sorted[i].spend - sorted[i - 1].spend;

      if (spendChange > 0 && currROAS >= prevROAS) {
        positiveSlopes++;
      } else if (spendChange > 0 && currROAS < prevROAS) {
        negativeSlopes++;
      }
    }

    // Calculate base iROAS
    const totalSpend = sorted.reduce((sum, m) => sum + m.spend, 0);
    const totalRevenue = sorted.reduce((sum, m) => sum + m.conversionValue, 0);
    const baseROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Adjust based on trend
    const trendFactor = positiveSlopes > negativeSlopes ? 1.1 : 0.9;

    return baseROAS * trendFactor;
  }

  /**
   * Save budget allocation record
   */
  private async saveAllocation(recommendation: BudgetRecommendation): Promise<void> {
    await this.prisma.budgetAllocation.upsert({
      where: {
        id: `${recommendation.adAccountId}_${recommendation.campaignId}`,
      },
      update: {
        currentBudget: recommendation.currentBudget,
        recommendedBudget: recommendation.recommendedBudget,
        allocationScore: recommendation.iROASScore,
        lastUpdatedAt: new Date(),
      },
      create: {
        adAccountId: recommendation.adAccountId,
        campaignId: recommendation.campaignId,
        period: 'daily',
        currentBudget: recommendation.currentBudget,
        recommendedBudget: recommendation.recommendedBudget,
        allocationScore: recommendation.iROASScore,
      },
    });
  }

  /**
   * Generate weekly budget recommendations report
   */
  async generateWeeklyRecommendations(): Promise<any> {
    const allocations = await this.prisma.budgetAllocation.findMany({
      where: {
        lastUpdatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { allocationScore: 'desc' },
    });

    const summary = {
      totalCampaigns: allocations.length,
      increaseBudget: allocations.filter(a => 
        a.recommendedBudget && a.currentBudget && a.recommendedBudget > a.currentBudget
      ).length,
      decreaseBudget: allocations.filter(a => 
        a.recommendedBudget && a.currentBudget && a.recommendedBudget < a.currentBudget
      ).length,
      maintainBudget: allocations.filter(a => 
        a.recommendedBudget && a.currentBudget && 
        Math.abs(a.recommendedBudget - a.currentBudget) < a.currentBudget * 0.05
      ).length,
      topPerformers: allocations.slice(0, 5),
      bottomPerformers: allocations.slice(-5).reverse(),
    };

    return summary;
  }

  /**
   * Apply auto budget adjustments
   */
  async applyAutoAdjustments(): Promise<number> {
    const allocations = await this.prisma.budgetAllocation.findMany({
      where: {
        isAutoApply: true,
        recommendedBudget: { not: null },
      },
    });

    let appliedCount = 0;

    for (const allocation of allocations) {
      if (allocation.recommendedBudget && allocation.campaignId) {
        await this.prisma.adCampaign.update({
          where: { id: allocation.campaignId },
          data: { budget: allocation.recommendedBudget },
        });

        await this.prisma.optimizationLog.create({
          data: {
            campaignId: allocation.campaignId,
            action: allocation.recommendedBudget > allocation.currentBudget 
              ? 'budget_increased' 
              : 'budget_decreased',
            previousValue: allocation.currentBudget.toString(),
            newValue: allocation.recommendedBudget.toString(),
            reason: 'Auto budget adjustment based on iROAS',
            success: true,
          },
        });

        appliedCount++;
      }
    }

    this.logger.log(`Applied ${appliedCount} automatic budget adjustments`);
    return appliedCount;
  }

  /**
   * Prioritize budget for high-converting segments
   */
  async prioritizeConvertingSegments(
    adAccountId: string,
    extraBudgetPercent: number = 20,
  ): Promise<void> {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { adAccountId, status: 'ENABLED' },
      include: {
        metrics: {
          where: {
            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
      },
    });

    // Calculate conversion rate for each campaign
    const campaignConversions = campaigns.map(campaign => {
      const totals = campaign.metrics.reduce((acc, m) => ({
        clicks: acc.clicks + (m.clicks || 0),
        conversions: acc.conversions + (m.conversions || 0),
      }), { clicks: 0, conversions: 0 });

      return {
        campaign,
        conversionRate: totals.clicks > 0 ? totals.conversions / totals.clicks : 0,
      };
    });

    // Sort by conversion rate
    campaignConversions.sort((a, b) => b.conversionRate - a.conversionRate);

    // Top 20% get extra budget
    const topCount = Math.max(1, Math.floor(campaigns.length * 0.2));
    const topCampaigns = campaignConversions.slice(0, topCount);

    for (const { campaign } of topCampaigns) {
      const newBudget = (campaign.budget || 0) * (1 + extraBudgetPercent / 100);
      
      await this.prisma.budgetAllocation.upsert({
        where: { id: campaign.id },
        update: {
          recommendedBudget: newBudget,
          allocationScore: 1.0,
          lastUpdatedAt: new Date(),
        },
        create: {
          adAccountId,
          campaignId: campaign.id,
          period: 'daily',
          currentBudget: campaign.budget || 0,
          recommendedBudget: newBudget,
          allocationScore: 1.0,
        },
      });
    }
  }
}
