import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { AdConnectController } from './controllers/ad-connect.controller';
import { AdSyncService } from './services/ad-sync.service';
import { GoogleAdsService } from './services/google-ads.service';
import { MetaAdsService } from './services/meta-ads.service';
import { TikTokAdsService } from './services/tiktok-ads.service';
import { AdAttributionService } from './services/ad-attribution.service';
import { TokenRefreshService } from './services/token-refresh.service';
import { AdAttributionController } from './controllers/ad-attribution.controller';
import { AdReportingController } from './controllers/ad-reporting.controller';
// Phase 1: Data & Analytics Enhancement
import { StreamProcessingService } from './services/stream-processing.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { MultiTouchAttributionService } from './services/multi-touch-attribution.service';
import { UTMGeneratorService } from './services/utm-generator.service';
// Phase 2: Auto Optimization
import { AutoCampaignManagerService } from './services/auto-campaign-manager.service';
import { BudgetOptimizerService } from './services/budget-optimizer.service';
// Phase 3: New Platform Adapters
import { NaverAdsService } from './services/naver-ads.service';
import { KakaoAdsService } from './services/kakao-ads.service';
// Phase 6: AI/ML Services
import { AICopyGeneratorService } from './services/ai-copy-generator.service';
import { AIRecommendationService } from './services/ai-recommendation.service';
// Phase 7: New Controllers
import { AttributionController } from './controllers/attribution.controller';
import { AIController } from './controllers/ai.controller';
import { UTMController } from './controllers/utm.controller';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(),
  ],
  controllers: [
    AdConnectController,
    AdAttributionController,
    AdReportingController,
    AttributionController,
    AIController,
    UTMController,
  ],
  providers: [
    // Existing services
    AdSyncService,
    GoogleAdsService,
    MetaAdsService,
    TikTokAdsService,
    AdAttributionService,
    TokenRefreshService,
    // Phase 1: Real-time & Analytics
    StreamProcessingService,
    AnomalyDetectionService,
    MultiTouchAttributionService,
    UTMGeneratorService,
    // Phase 2: Auto Optimization
    AutoCampaignManagerService,
    BudgetOptimizerService,
    // Phase 3: New Platform Adapters
    NaverAdsService,
    KakaoAdsService,
    // Phase 6: AI/ML Services
    AICopyGeneratorService,
    AIRecommendationService,
  ],
  exports: [
    AdSyncService,
    AdAttributionService,
    TokenRefreshService,
    StreamProcessingService,
    AnomalyDetectionService,
    MultiTouchAttributionService,
    UTMGeneratorService,
    AutoCampaignManagerService,
    BudgetOptimizerService,
    NaverAdsService,
    KakaoAdsService,
    AICopyGeneratorService,
    AIRecommendationService,
  ],
})
export class AdIntegrationModule {}
