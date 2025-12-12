import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BudgetRecommendation {
  channel: string;
  currentBudget: number;
  recommendedBudget: number;
  expectedROAS: number;
  confidence: number;
  reason: string;
}

export interface ChannelMixRecommendation {
  channels: Record<string, number>;  // channel -> percentage
  totalBudget: number;
  expectedBlendedROAS: number;
  changes: Array<{ channel: string; change: string; impact: string }>;
}

@Injectable()
export class AIRecommendationService {
  private readonly logger = new Logger(AIRecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // Budget Optimization Recommendations
  // ====================================================

  /**
   * Get optimal budget allocation recommendations
   */
  async getBudgetRecommendations(adAccountId: string): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    // Get campaigns with performance data
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        adAccountId,
        status: 'ENABLED',
      },
      include: {
        adAccount: true,
        metrics: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    // Group by channel and analyze
    const channelPerformance = new Map<string, any>();

    for (const campaign of campaigns) {
      const channel = campaign.adAccount.platform.toLowerCase();
      const existing = channelPerformance.get(channel) || {
        spend: 0,
        revenue: 0,
        campaigns: [],
      };

      const totals = campaign.metrics.reduce(
        (acc: { spend: number; revenue: number }, m: any) => ({
          spend: acc.spend + m.spend,
          revenue: acc.revenue + m.conversionValue,
        }),
        { spend: 0, revenue: 0 }
      );

      existing.spend += totals.spend;
      existing.revenue += totals.revenue;
      existing.campaigns.push({ campaign, totals });
      channelPerformance.set(channel, existing);
    }

    // Generate recommendations for each channel
    for (const [channel, data] of channelPerformance) {
      const roas = data.spend > 0 ? data.revenue / data.spend : 0;
      
      let recommendation: BudgetRecommendation;

      if (roas > 3) {
        // High performer - recommend increase
        recommendation = {
          channel,
          currentBudget: data.spend,
          recommendedBudget: data.spend * 1.3,
          expectedROAS: roas * 0.95, // Slight decrease due to diminishing returns
          confidence: 0.85,
          reason: `ROAS ${roas.toFixed(2)}로 우수한 성과. 30% 예산 증가 권장`,
        };
      } else if (roas > 1.5) {
        // Good performer - maintain or slight increase
        recommendation = {
          channel,
          currentBudget: data.spend,
          recommendedBudget: data.spend * 1.1,
          expectedROAS: roas,
          confidence: 0.7,
          reason: `양호한 ROAS ${roas.toFixed(2)}. 10% 예산 증가 테스트 권장`,
        };
      } else if (roas > 1) {
        // Break-even - optimize or reduce
        recommendation = {
          channel,
          currentBudget: data.spend,
          recommendedBudget: data.spend * 0.9,
          expectedROAS: roas * 1.1,
          confidence: 0.6,
          reason: `ROAS ${roas.toFixed(2)}로 손익분기 수준. 예산 10% 감소 및 최적화 필요`,
        };
      } else {
        // Poor performer - reduce significantly
        recommendation = {
          channel,
          currentBudget: data.spend,
          recommendedBudget: data.spend * 0.5,
          expectedROAS: roas * 1.3,
          confidence: 0.75,
          reason: `ROAS ${roas.toFixed(2)}로 저조. 50% 예산 감소 및 전략 재검토 필요`,
        };
      }

      recommendations.push(recommendation);
    }

    return recommendations.sort((a, b) => b.expectedROAS - a.expectedROAS);
  }

  // ====================================================
  // Channel Mix Optimization
  // ====================================================

  /**
   * Get recommended channel mix
   */
  async getChannelMixRecommendation(
    adAccountId: string,
    totalBudget: number,
  ): Promise<ChannelMixRecommendation> {
    const budgetRecs = await this.getBudgetRecommendations(adAccountId);

    // Calculate optimal allocation based on ROAS
    const totalExpectedRevenue = budgetRecs.reduce(
      (sum, rec) => sum + rec.recommendedBudget * rec.expectedROAS,
      0
    );

    const channels: Record<string, number> = {};
    const changes: Array<{ channel: string; change: string; impact: string }> = [];

    for (const rec of budgetRecs) {
      // Weight by expected revenue contribution
      const expectedRevenue = rec.recommendedBudget * rec.expectedROAS;
      const proportion = totalExpectedRevenue > 0 
        ? expectedRevenue / totalExpectedRevenue 
        : 1 / budgetRecs.length;
      
      channels[rec.channel] = Math.round(proportion * 100);

      // Calculate change from current
      const currentProportion = rec.currentBudget / budgetRecs.reduce((s, r) => s + r.currentBudget, 0);
      const change = proportion - currentProportion;

      if (Math.abs(change) > 0.05) {
        changes.push({
          channel: rec.channel,
          change: change > 0 ? `+${(change * 100).toFixed(0)}%` : `${(change * 100).toFixed(0)}%`,
          impact: change > 0 
            ? `예상 ROAS ${rec.expectedROAS.toFixed(2)} 기반 성장 가능` 
            : '다른 채널로 예산 재배분 권장',
        });
      }
    }

    // Calculate blended ROAS
    const expectedBlendedROAS = budgetRecs.reduce(
      (sum, rec) => sum + (channels[rec.channel] / 100) * rec.expectedROAS,
      0
    );

    return {
      channels,
      totalBudget,
      expectedBlendedROAS,
      changes,
    };
  }

  // ====================================================
  // Creative Quality Recommendations
  // ====================================================

  /**
   * Get creative quality-based recommendations
   */
  async getCreativeRecommendations(adAccountId: string): Promise<any[]> {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { adAccountId },
      include: {
        adGroups: {
          include: {
            ads: {
              include: {
                metrics: {
                  where: {
                    date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
                  },
                },
              },
            },
          },
        },
      },
    });

    const recommendations = [];

    for (const campaign of campaigns) {
      for (const adGroup of campaign.adGroups) {
        for (const ad of adGroup.ads) {
          const totals = ad.metrics.reduce(
            (acc: { impressions: number; clicks: number; spend: number; conversions: number }, m: any) => ({
              impressions: acc.impressions + m.impressions,
              clicks: acc.clicks + m.clicks,
              spend: acc.spend + m.spend,
              conversions: acc.conversions + m.conversions,
            }),
            { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
          );

          const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
          const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

          // Score creative
          const qualityScore = this.calculateCreativeScore(ctr, cvr, totals.spend);

          if (qualityScore < 50) {
            recommendations.push({
              adId: ad.id,
              adName: ad.name,
              qualityScore,
              metrics: { ctr, cvr, spend: totals.spend },
              recommendation: qualityScore < 30 
                ? '소재 교체 권장' 
                : '소재 A/B 테스트 권장',
              suggestions: this.getCreativeSuggestions(ctr, cvr),
            });
          }
        }
      }
    }

    return recommendations.sort((a, b) => a.qualityScore - b.qualityScore);
  }

  private calculateCreativeScore(ctr: number, cvr: number, spend: number): number {
    // Weight: CTR 30%, CVR 50%, spend 20%
    const ctrScore = Math.min(100, ctr * 25); // 4% CTR = 100
    const cvrScore = Math.min(100, cvr * 10); // 10% CVR = 100
    const spendScore = spend > 100 ? 100 : spend; // More data = more reliable

    return Math.round(ctrScore * 0.3 + cvrScore * 0.5 + spendScore * 0.2);
  }

  private getCreativeSuggestions(ctr: number, cvr: number): string[] {
    const suggestions = [];

    if (ctr < 1) {
      suggestions.push('클릭률을 높이기 위해 더 눈에 띄는 이미지나 훅을 추가하세요');
      suggestions.push('CTA 버튼을 더 명확하게 표시하세요');
    }

    if (cvr < 2) {
      suggestions.push('랜딩 페이지와 광고 메시지 일관성을 확인하세요');
      suggestions.push('구매 혜택이나 긴급성을 강조하세요');
    }

    if (ctr > 3 && cvr < 1) {
      suggestions.push('광고와 랜딩 페이지간 기대치 불일치 가능성 - 메시지 정합성 점검');
    }

    return suggestions;
  }

  // ====================================================
  // Conversion Probability Prediction
  // ====================================================

  /**
   * Predict conversion probability for user segment
   */
  async predictConversionProbability(
    segment: string,
    channel: string,
    daysSinceClick: number,
  ): Promise<{ probability: number; confidence: number }> {
    // Get historical conversion data for segment/channel
    const conversions = await this.prisma.event.count({
      where: {
        eventName: 'purchase',
        timestamp: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const clicks = await this.prisma.event.count({
      where: {
        eventName: 'ad_click',
        timestamp: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Base conversion rate
    const baseRate = clicks > 0 ? conversions / clicks : 0.02;

    // Apply decay based on days since click
    // Conversion probability typically decays exponentially
    const decayFactor = Math.exp(-0.15 * daysSinceClick);

    // Segment adjustments (placeholder - would use ML model in production)
    const segmentMultipliers: Record<string, number> = {
      'retargeting': 2.5,
      'lookalike': 1.5,
      'new_users': 0.8,
      'existing_users': 1.8,
    };

    const channelMultipliers: Record<string, number> = {
      'google': 1.2,
      'meta': 1.0,
      'tiktok': 0.9,
      'naver': 1.1,
      'kakao': 1.0,
    };

    const segmentMult = segmentMultipliers[segment] || 1;
    const channelMult = channelMultipliers[channel] || 1;

    const probability = Math.min(1, baseRate * decayFactor * segmentMult * channelMult);

    // Confidence based on data volume
    const confidence = Math.min(0.95, clicks / 1000);

    return {
      probability: Math.round(probability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}
