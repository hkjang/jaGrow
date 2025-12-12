import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { ROASSimulatorService } from './roas-simulator.service';
import { ReportGeneratorService } from './report-generator.service';

@Controller('analytics')
export class AdvancedAnalyticsController {
  constructor(
    private readonly predictionService: PredictionService,
    private readonly roasSimulator: ROASSimulatorService,
    private readonly reportGenerator: ReportGeneratorService,
  ) {}

  // ====================================================
  // Prediction Endpoints
  // ====================================================

  /**
   * Generate prediction for a campaign
   */
  @Post('prediction/generate')
  async generatePrediction(
    @Body() body: {
      campaignId: string;
      adAccountId?: string;
      predictionType: '7day' | '30day';
    },
  ) {
    return this.predictionService.generatePrediction(body);
  }

  /**
   * Get latest predictions for a campaign
   */
  @Get('prediction/:campaignId')
  async getPredictions(@Param('campaignId') campaignId: string) {
    return this.predictionService.getLatestPredictions(campaignId);
  }

  /**
   * Get prediction accuracy
   */
  @Get('prediction/:campaignId/accuracy')
  async getPredictionAccuracy(@Param('campaignId') campaignId: string) {
    return this.predictionService.getPredictionAccuracy(campaignId);
  }

  // ====================================================
  // ROAS Simulation Endpoints
  // ====================================================

  /**
   * Simulate budget change
   */
  @Post('roas-simulator/simulate')
  async simulateBudget(
    @Body() body: {
      campaignId: string;
      budgetChange: number;
      simulationDays: number;
    },
  ) {
    return this.roasSimulator.simulateBudgetChange(body);
  }

  /**
   * Find optimal budget
   */
  @Get('roas-simulator/:campaignId/optimal')
  async findOptimalBudget(@Param('campaignId') campaignId: string) {
    return this.roasSimulator.getOptimalBudgetRecommendation(campaignId);
  }

  /**
   * Run multiple simulations
   */
  @Get('roas-simulator/:campaignId/scenarios')
  async getScenarios(
    @Param('campaignId') campaignId: string,
    @Query('minChange') minChange: string = '-50',
    @Query('maxChange') maxChange: string = '100',
  ) {
    return this.roasSimulator.findOptimalBudget(
      campaignId,
      parseInt(minChange),
      parseInt(maxChange),
    );
  }

  // ====================================================
  // Report Endpoints
  // ====================================================

  /**
   * Generate funnel report
   */
  @Get('reports/funnel/:adAccountId')
  async getFunnelReport(
    @Param('adAccountId') adAccountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportGenerator.generateFunnelReport(
      adAccountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Generate cost vs quality report
   */
  @Get('reports/cost-quality/:adAccountId')
  async getCostQualityReport(
    @Param('adAccountId') adAccountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportGenerator.generateCostQualityReport(
      adAccountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Generate segment performance report
   */
  @Get('reports/segments/:adAccountId')
  async getSegmentReport(
    @Param('adAccountId') adAccountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportGenerator.generateSegmentReport(
      adAccountId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
