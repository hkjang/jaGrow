import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Services
import { AIModelSettingsService } from './services/ai-model-settings.service';
import { AdPlatformSettingsService } from './services/ad-platform-settings.service';
import { ConversionSettingsService } from './services/conversion-settings.service';
import { ExperimentSettingsService } from './services/experiment-settings.service';
import { SegmentSettingsService } from './services/segment-settings.service';
import { EtlSettingsService } from './services/etl-settings.service';
import { ReportSettingsService } from './services/report-settings.service';
import { AlertSettingsService } from './services/alert-settings.service';
import { SecuritySettingsService } from './services/security-settings.service';

// Controllers
import { AIModelSettingsController } from './controllers/ai-model-settings.controller';
import { AdPlatformSettingsController } from './controllers/ad-platform-settings.controller';
import { ConversionSettingsController } from './controllers/conversion-settings.controller';
import { ExperimentSettingsController } from './controllers/experiment-settings.controller';
import { SegmentSettingsController } from './controllers/segment-settings.controller';
import { EtlSettingsController } from './controllers/etl-settings.controller';
import { ReportSettingsController } from './controllers/report-settings.controller';
import { AlertSettingsController } from './controllers/alert-settings.controller';
import { SecuritySettingsController } from './controllers/security-settings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AIModelSettingsController,
    AdPlatformSettingsController,
    ConversionSettingsController,
    ExperimentSettingsController,
    SegmentSettingsController,
    EtlSettingsController,
    ReportSettingsController,
    AlertSettingsController,
    SecuritySettingsController,
  ],
  providers: [
    AIModelSettingsService,
    AdPlatformSettingsService,
    ConversionSettingsService,
    ExperimentSettingsService,
    SegmentSettingsService,
    EtlSettingsService,
    ReportSettingsService,
    AlertSettingsService,
    SecuritySettingsService,
  ],
  exports: [
    AIModelSettingsService,
    AdPlatformSettingsService,
    ConversionSettingsService,
    ExperimentSettingsService,
    SegmentSettingsService,
    EtlSettingsService,
    ReportSettingsService,
    AlertSettingsService,
    SecuritySettingsService,
  ],
})
export class SettingsModule {}
