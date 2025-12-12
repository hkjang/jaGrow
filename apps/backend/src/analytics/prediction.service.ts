import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface PredictionInput {
  campaignId: string;
  adAccountId?: string;
  predictionType: '7day' | '30day';
}

export interface PredictionResult {
  campaignId: string;
  predictionType: string;
  predictedROAS: number;
  predictedSpend: number;
  predictedRevenue: number;
  predictedConversions: number;
  predictedCTR: number;
  predictedCPC: number;
  confidenceScore: number;
  trend: 'up' | 'down' | 'stable';
}

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate predictions for all active campaigns (daily at 6 AM)
   */
  @Cron('0 6 * * *')
  async generateDailyPredictions(): Promise<void> {
    this.logger.log('Generating daily predictions for all campaigns...');

    const campaigns = await this.prisma.adCampaign.findMany({
      where: { status: 'ENABLED' },
      select: { id: true, adAccountId: true },
    });

    for (const campaign of campaigns) {
      await this.generatePrediction({
        campaignId: campaign.id,
        adAccountId: campaign.adAccountId,
        predictionType: '7day',
      });
      await this.generatePrediction({
        campaignId: campaign.id,
        adAccountId: campaign.adAccountId,
        predictionType: '30day',
      });
    }
  }

  /**
   * Generate prediction for a specific campaign
   */
  async generatePrediction(input: PredictionInput): Promise<PredictionResult | null> {
    try {
      // Get historical data
      const lookbackDays = input.predictionType === '7day' ? 30 : 90;
      const historicalData = await this.getHistoricalData(input.campaignId, lookbackDays);

      if (historicalData.length < 7) {
        this.logger.warn(`Insufficient data for campaign ${input.campaignId}`);
        return null;
      }

      // Calculate prediction using linear regression with seasonality
      const prediction = this.calculatePrediction(historicalData, input.predictionType);

      // Save prediction to database
      await this.prisma.performancePrediction.create({
        data: {
          campaignId: input.campaignId,
          adAccountId: input.adAccountId,
          predictionType: input.predictionType,
          predictedROAS: prediction.predictedROAS,
          predictedSpend: prediction.predictedSpend,
          predictedRevenue: prediction.predictedRevenue,
          predictedConversions: prediction.predictedConversions,
          predictedCTR: prediction.predictedCTR,
          predictedCPC: prediction.predictedCPC,
          confidenceScore: prediction.confidenceScore,
          modelVersion: 'v1.0-linear',
        },
      });

      return prediction;
    } catch (error) {
      this.logger.error(`Error generating prediction for ${input.campaignId}`, error);
      return null;
    }
  }

  /**
   * Get historical metrics data
   */
  private async getHistoricalData(campaignId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.adMetric.findMany({
      where: {
        campaignId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Calculate prediction using linear regression with trend analysis
   */
  private calculatePrediction(data: any[], predictionType: string): PredictionResult {
    const forecastDays = predictionType === '7day' ? 7 : 30;

    // Extract metrics arrays
    const spends = data.map(d => d.spend);
    const revenues = data.map(d => d.conversionValue);
    const clicks = data.map(d => d.clicks);
    const impressions = data.map(d => d.impressions);
    const conversions = data.map(d => d.conversions);

    // Calculate trends using linear regression
    const spendTrend = this.linearRegression(spends);
    const revenueTrend = this.linearRegression(revenues);
    const clickTrend = this.linearRegression(clicks);
    const impressionTrend = this.linearRegression(impressions);
    const conversionTrend = this.linearRegression(conversions);

    // Predict future values
    const predictedSpend = this.forecastSum(spendTrend, data.length, forecastDays);
    const predictedRevenue = this.forecastSum(revenueTrend, data.length, forecastDays);
    const predictedClicks = Math.max(0, this.forecastSum(clickTrend, data.length, forecastDays));
    const predictedImpressions = Math.max(0, this.forecastSum(impressionTrend, data.length, forecastDays));
    const predictedConversions = Math.max(0, Math.round(this.forecastSum(conversionTrend, data.length, forecastDays)));

    // Calculate derived metrics
    const predictedROAS = predictedSpend > 0 ? predictedRevenue / predictedSpend : 0;
    const predictedCTR = predictedImpressions > 0 ? (predictedClicks / predictedImpressions) * 100 : 0;
    const predictedCPC = predictedClicks > 0 ? predictedSpend / predictedClicks : 0;

    // Calculate confidence based on data variance and trend stability
    const confidence = this.calculateConfidence(data, spendTrend, revenueTrend);

    // Determine overall trend
    const trend = this.determineTrend(revenueTrend.slope, spendTrend.slope);

    return {
      campaignId: data[0]?.campaignId || '',
      predictionType,
      predictedROAS: Math.round(predictedROAS * 100) / 100,
      predictedSpend: Math.round(predictedSpend * 100) / 100,
      predictedRevenue: Math.round(predictedRevenue * 100) / 100,
      predictedConversions,
      predictedCTR: Math.round(predictedCTR * 100) / 100,
      predictedCPC: Math.round(predictedCPC * 100) / 100,
      confidenceScore: confidence,
      trend,
    };
  }

  /**
   * Simple linear regression
   */
  private linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

    // x values are indices 0, 1, 2, ...
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;
    let ssTotal = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
      ssTotal += yDiff * yDiff;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R²
    let ssResidual = 0;
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * i;
      ssResidual += Math.pow(values[i] - predicted, 2);
    }
    const r2 = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

    return { slope, intercept, r2 };
  }

  /**
   * Forecast sum for future days
   */
  private forecastSum(
    trend: { slope: number; intercept: number },
    currentDay: number,
    forecastDays: number,
  ): number {
    let sum = 0;
    for (let i = 1; i <= forecastDays; i++) {
      const value = trend.intercept + trend.slope * (currentDay + i);
      sum += Math.max(0, value); // Don't allow negative predictions
    }
    return sum;
  }

  /**
   * Calculate prediction confidence score (0-1)
   */
  private calculateConfidence(
    data: any[],
    spendTrend: { r2: number },
    revenueTrend: { r2: number },
  ): number {
    // Factors affecting confidence:
    // 1. Amount of data (more data = higher confidence)
    const dataFactor = Math.min(1, data.length / 30);

    // 2. R² values (higher R² = more predictable)
    const trendFactor = (spendTrend.r2 + revenueTrend.r2) / 2;

    // 3. Data recency (no gaps = higher confidence)
    const recencyFactor = this.calculateRecencyFactor(data);

    // Weighted combination
    const confidence = dataFactor * 0.3 + trendFactor * 0.5 + recencyFactor * 0.2;

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calculate recency factor based on data gaps
   */
  private calculateRecencyFactor(data: any[]): number {
    if (data.length < 2) return 0.5;

    let gapCount = 0;
    for (let i = 1; i < data.length; i++) {
      const prevDate = new Date(data[i - 1].date);
      const currDate = new Date(data[i].date);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dayDiff > 1) gapCount++;
    }

    return Math.max(0, 1 - gapCount / data.length);
  }

  /**
   * Determine overall trend direction
   */
  private determineTrend(revenueSlope: number, spendSlope: number): 'up' | 'down' | 'stable' {
    // Calculate efficiency trend (revenue growth relative to spend growth)
    const efficiencyChange = revenueSlope - spendSlope;

    if (efficiencyChange > 0.05) return 'up';
    if (efficiencyChange < -0.05) return 'down';
    return 'stable';
  }

  /**
   * Get latest predictions for a campaign
   */
  async getLatestPredictions(campaignId: string): Promise<any[]> {
    return this.prisma.performancePrediction.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: 2, // Latest 7day and 30day predictions
    });
  }

  /**
   * Get prediction accuracy (compare past predictions with actuals)
   */
  async getPredictionAccuracy(campaignId: string): Promise<any> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get prediction made 7 days ago
    const pastPrediction = await this.prisma.performancePrediction.findFirst({
      where: {
        campaignId,
        predictionType: '7day',
        createdAt: {
          gte: new Date(sevenDaysAgo.getTime() - 24 * 60 * 60 * 1000),
          lte: sevenDaysAgo,
        },
      },
    });

    if (!pastPrediction) {
      return null;
    }

    // Get actual metrics for the past 7 days
    const actualMetrics = await this.prisma.adMetric.aggregate({
      where: {
        campaignId,
        date: { gte: sevenDaysAgo },
      },
      _sum: {
        spend: true,
        conversionValue: true,
        conversions: true,
        clicks: true,
        impressions: true,
      },
    });

    const actualSpend = actualMetrics._sum.spend || 0;
    const actualRevenue = actualMetrics._sum.conversionValue || 0;
    const actualConversions = actualMetrics._sum.conversions || 0;

    // Calculate accuracy metrics
    const spendAccuracy = this.calculateAccuracyPercentage(pastPrediction.predictedSpend, actualSpend);
    const revenueAccuracy = this.calculateAccuracyPercentage(pastPrediction.predictedRevenue, actualRevenue);
    const conversionsAccuracy = this.calculateAccuracyPercentage(pastPrediction.predictedConversions, actualConversions);

    return {
      predictionId: pastPrediction.id,
      predictionDate: pastPrediction.createdAt,
      predictions: {
        spend: pastPrediction.predictedSpend,
        revenue: pastPrediction.predictedRevenue,
        conversions: pastPrediction.predictedConversions,
      },
      actuals: {
        spend: actualSpend,
        revenue: actualRevenue,
        conversions: actualConversions,
      },
      accuracy: {
        spend: spendAccuracy,
        revenue: revenueAccuracy,
        conversions: conversionsAccuracy,
        overall: (spendAccuracy + revenueAccuracy + conversionsAccuracy) / 3,
      },
    };
  }

  /**
   * Calculate accuracy as percentage (100% = perfect prediction)
   */
  private calculateAccuracyPercentage(predicted: number, actual: number): number {
    if (actual === 0 && predicted === 0) return 100;
    if (actual === 0) return 0;

    const error = Math.abs(predicted - actual) / actual;
    return Math.round(Math.max(0, (1 - error) * 100));
  }
}
