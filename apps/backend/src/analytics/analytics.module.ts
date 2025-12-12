import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
// Phase 1: Prediction & Simulation
import { PredictionService } from './prediction.service';
import { ROASSimulatorService } from './roas-simulator.service';
// Phase 5: Alert and Report System
import { AlertService } from './alert.service';
import { ReportGeneratorService } from './report-generator.service';
// Phase 7: Advanced Analytics Controller
import { AdvancedAnalyticsController } from './advanced-analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController, AdvancedAnalyticsController],
  providers: [
    AnalyticsService,
    PredictionService,
    ROASSimulatorService,
    AlertService,
    ReportGeneratorService,
  ],
  exports: [
    AnalyticsService,
    PredictionService,
    ROASSimulatorService,
    AlertService,
    ReportGeneratorService,
  ],
})
export class AnalyticsModule {}
