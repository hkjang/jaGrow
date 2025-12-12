import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SimulationInput {
  campaignId: string;
  budgetChange: number; // percentage change (-50 to +200)
  simulationDays: number;
}

export interface SimulationResult {
  campaignId: string;
  originalBudget: number;
  simulatedBudget: number;
  originalROAS: number;
  simulatedROAS: number;
  originalRevenue: number;
  simulatedRevenue: number;
  originalConversions: number;
  simulatedConversions: number;
  marginalROAS: number; // ROAS of additional spend
  recommendation: 'increase' | 'decrease' | 'maintain';
  confidenceScore: number;
}

@Injectable()
export class ROASSimulatorService {
  private readonly logger = new Logger(ROASSimulatorService.name);

  // Diminishing returns factor (how quickly ROAS decreases as budget increases)
  private readonly DIMINISHING_FACTOR = 0.15;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Simulate ROAS for a budget change
   */
  async simulateBudgetChange(input: SimulationInput): Promise<SimulationResult | null> {
    try {
      // Get campaign current data
      const campaign = await this.prisma.adCampaign.findUnique({
        where: { id: input.campaignId },
        include: {
          metrics: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!campaign || campaign.metrics.length === 0) {
        return null;
      }

      // Calculate baseline metrics
      const baseline = this.calculateBaseline(campaign.metrics);

      // Simulate new performance
      const simulation = this.simulatePerformance(baseline, input.budgetChange);

      // Determine recommendation
      const recommendation = this.getRecommendation(baseline, simulation);

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(campaign.metrics);

      return {
        campaignId: input.campaignId,
        originalBudget: baseline.avgDailySpend * input.simulationDays,
        simulatedBudget: simulation.dailySpend * input.simulationDays,
        originalROAS: baseline.roas,
        simulatedROAS: simulation.roas,
        originalRevenue: baseline.avgDailyRevenue * input.simulationDays,
        simulatedRevenue: simulation.dailyRevenue * input.simulationDays,
        originalConversions: Math.round(baseline.avgDailyConversions * input.simulationDays),
        simulatedConversions: Math.round(simulation.dailyConversions * input.simulationDays),
        marginalROAS: simulation.marginalROAS,
        recommendation,
        confidenceScore: confidence,
      };
    } catch (error) {
      this.logger.error(`Simulation error for campaign ${input.campaignId}`, error);
      return null;
    }
  }

  /**
   * Calculate baseline metrics from historical data
   */
  private calculateBaseline(metrics: any[]): {
    avgDailySpend: number;
    avgDailyRevenue: number;
    avgDailyConversions: number;
    roas: number;
    conversionRate: number;
    cpc: number;
  } {
    const totalSpend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.conversionValue || 0), 0);
    const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const days = metrics.length;

    return {
      avgDailySpend: days > 0 ? totalSpend / days : 0,
      avgDailyRevenue: days > 0 ? totalRevenue / days : 0,
      avgDailyConversions: days > 0 ? totalConversions / days : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    };
  }

  /**
   * Simulate performance with diminishing returns model
   */
  private simulatePerformance(
    baseline: ReturnType<typeof this.calculateBaseline>,
    budgetChangePercent: number,
  ): {
    dailySpend: number;
    dailyRevenue: number;
    dailyConversions: number;
    roas: number;
    marginalROAS: number;
  } {
    // New spend amount
    const multiplier = 1 + budgetChangePercent / 100;
    const newDailySpend = baseline.avgDailySpend * multiplier;

    // Apply diminishing returns for budget increases
    let revenueMultiplier: number;
    let marginalROAS: number;

    if (budgetChangePercent > 0) {
      // Diminishing returns: each additional dollar is less effective
      const diminishingFactor = Math.pow(multiplier, 1 - this.DIMINISHING_FACTOR);
      revenueMultiplier = diminishingFactor;
      
      // Marginal ROAS = ROAS of additional spend only
      const additionalSpend = newDailySpend - baseline.avgDailySpend;
      const additionalRevenue = (baseline.avgDailyRevenue * revenueMultiplier) - baseline.avgDailyRevenue;
      marginalROAS = additionalSpend > 0 ? additionalRevenue / additionalSpend : 0;
    } else {
      // Budget decrease: assume linear reduction, slightly better efficiency
      const efficiencyBonus = 1 + Math.abs(budgetChangePercent) * 0.001;
      revenueMultiplier = multiplier * efficiencyBonus;
      marginalROAS = baseline.roas;
    }

    const newDailyRevenue = baseline.avgDailyRevenue * revenueMultiplier;
    const newDailyConversions = baseline.avgDailyConversions * revenueMultiplier;
    const newROAS = newDailySpend > 0 ? newDailyRevenue / newDailySpend : 0;

    return {
      dailySpend: newDailySpend,
      dailyRevenue: newDailyRevenue,
      dailyConversions: newDailyConversions,
      roas: newROAS,
      marginalROAS,
    };
  }

  /**
   * Get recommendation based on simulation results
   */
  private getRecommendation(
    baseline: ReturnType<typeof this.calculateBaseline>,
    simulation: { roas: number; marginalROAS: number },
  ): 'increase' | 'decrease' | 'maintain' {
    // If marginal ROAS is still good (> 2.0), recommend increase
    if (simulation.marginalROAS > 2.0 && simulation.roas > 1.5) {
      return 'increase';
    }

    // If ROAS is dropping significantly, recommend decrease
    if (simulation.roas < baseline.roas * 0.7) {
      return 'decrease';
    }

    return 'maintain';
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidence(metrics: any[]): number {
    const dataPoints = metrics.length;
    const hasRecentData = metrics.some(m => {
      const date = new Date(m.date);
      const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 3;
    });

    let confidence = 0.5;

    // More data = higher confidence
    confidence += Math.min(0.3, dataPoints * 0.01);

    // Recent data = higher confidence
    if (hasRecentData) {
      confidence += 0.1;
    }

    // Consistent data (low variance in ROAS) = higher confidence
    const roasValues = metrics
      .filter(m => m.spend > 0)
      .map(m => m.conversionValue / m.spend);
    
    if (roasValues.length > 5) {
      const variance = this.calculateVariance(roasValues);
      const cv = Math.sqrt(variance) / (roasValues.reduce((a, b) => a + b, 0) / roasValues.length);
      confidence += Math.max(0, 0.1 - cv * 0.1);
    }

    return Math.min(1, Math.round(confidence * 100) / 100);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  /**
   * Run multiple simulations for budget optimization
   */
  async findOptimalBudget(
    campaignId: string,
    minChange: number = -50,
    maxChange: number = 100,
    step: number = 10,
  ): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (let change = minChange; change <= maxChange; change += step) {
      const result = await this.simulateBudgetChange({
        campaignId,
        budgetChange: change,
        simulationDays: 7,
      });
      if (result) {
        results.push(result);
      }
    }

    // Sort by simulated ROAS
    return results.sort((a, b) => b.simulatedROAS - a.simulatedROAS);
  }

  /**
   * Get optimal budget recommendation
   */
  async getOptimalBudgetRecommendation(campaignId: string): Promise<{
    currentBudget: number;
    optimalBudget: number;
    expectedROAS: number;
    expectedRevenue: number;
    budgetChangePercent: number;
  } | null> {
    const simulations = await this.findOptimalBudget(campaignId);
    
    if (simulations.length === 0) {
      return null;
    }

    // Find the sweet spot: highest ROAS with reasonable marginal returns
    const optimal = simulations.reduce((best, current) => {
      // Score based on ROAS and marginal ROAS
      const currentScore = current.simulatedROAS * 0.6 + current.marginalROAS * 0.4;
      const bestScore = best.simulatedROAS * 0.6 + best.marginalROAS * 0.4;
      return currentScore > bestScore ? current : best;
    });

    const changePercent = ((optimal.simulatedBudget - optimal.originalBudget) / optimal.originalBudget) * 100;

    return {
      currentBudget: optimal.originalBudget,
      optimalBudget: optimal.simulatedBudget,
      expectedROAS: optimal.simulatedROAS,
      expectedRevenue: optimal.simulatedRevenue,
      budgetChangePercent: Math.round(changePercent),
    };
  }
}
