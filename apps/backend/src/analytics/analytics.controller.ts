import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('experiments/:id')
  getExperimentStats(@Param('id') id: string) {
    return this.analyticsService.getExperimentStats(id);
  }

  @Get('predictions')
  async getPredictions(@Query('campaignId') campaignId?: string) {
    return this.prisma.performancePrediction.findMany({
      where: campaignId ? { campaignId } : {},
      include: { campaign: { select: { name: true, status: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  @Get('anomalies')
  async getAnomalies(@Query('severity') severity?: string) {
    return this.prisma.anomalyAlert.findMany({
      where: severity ? { severity } : {},
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}
