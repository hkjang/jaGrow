import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('experiments/:id')
  getExperimentStats(@Param('id') id: string) {
    return this.analyticsService.getExperimentStats(id);
  }
}
