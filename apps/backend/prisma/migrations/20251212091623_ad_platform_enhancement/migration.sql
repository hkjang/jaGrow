-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ROAS_DROP', 'CONVERSION_DROP', 'BUDGET_DEPLETED', 'ANOMALY_DETECTED', 'OPTIMIZATION_APPLIED', 'TRACKING_LOSS', 'CLICK_ID_MISMATCH');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SLACK', 'WEBHOOK', 'IN_APP');

-- CreateTable
CREATE TABLE "UserJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "conversionValue" DOUBLE PRECISION,
    "convertedAt" TIMESTAMP(3),
    "attributionModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouchPoint" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "adGroup" TEXT,
    "adId" TEXT,
    "clickId" TEXT,
    "clickIdType" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,
    "attributionWeight" DOUBLE PRECISION,

    CONSTRAINT "TouchPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformancePrediction" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "adAccountId" TEXT,
    "predictionType" TEXT NOT NULL,
    "predictedROAS" DOUBLE PRECISION NOT NULL,
    "predictedSpend" DOUBLE PRECISION NOT NULL,
    "predictedRevenue" DOUBLE PRECISION NOT NULL,
    "predictedConversions" INTEGER NOT NULL,
    "predictedCTR" DOUBLE PRECISION,
    "predictedCPC" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformancePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dayOfWeek" INTEGER[],
    "hourOfDay" INTEGER[],
    "monthOfYear" INTEGER[],
    "multiplier" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyAlert" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "adAccountId" TEXT,
    "metricType" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "expectedValue" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "deviation" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "campaignId" TEXT,
    "adGroupId" TEXT,
    "adId" TEXT,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "period" TEXT NOT NULL,
    "targetROAS" DOUBLE PRECISION,
    "targetCPA" DOUBLE PRECISION,
    "currentBudget" DOUBLE PRECISION NOT NULL,
    "recommendedBudget" DOUBLE PRECISION,
    "minBudget" DOUBLE PRECISION,
    "maxBudget" DOUBLE PRECISION,
    "allocationScore" DOUBLE PRECISION,
    "isAutoApply" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" DOUBLE PRECISION,
    "webhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserJourney_userId_idx" ON "UserJourney"("userId");

-- CreateIndex
CREATE INDEX "UserJourney_convertedAt_idx" ON "UserJourney"("convertedAt");

-- CreateIndex
CREATE INDEX "TouchPoint_journeyId_idx" ON "TouchPoint"("journeyId");

-- CreateIndex
CREATE INDEX "TouchPoint_clickId_idx" ON "TouchPoint"("clickId");

-- CreateIndex
CREATE INDEX "PerformancePrediction_campaignId_idx" ON "PerformancePrediction"("campaignId");

-- CreateIndex
CREATE INDEX "PerformancePrediction_createdAt_idx" ON "PerformancePrediction"("createdAt");

-- CreateIndex
CREATE INDEX "AnomalyAlert_campaignId_idx" ON "AnomalyAlert"("campaignId");

-- CreateIndex
CREATE INDEX "AnomalyAlert_createdAt_idx" ON "AnomalyAlert"("createdAt");

-- CreateIndex
CREATE INDEX "AnomalyAlert_isResolved_idx" ON "AnomalyAlert"("isResolved");

-- CreateIndex
CREATE INDEX "OptimizationLog_ruleId_idx" ON "OptimizationLog"("ruleId");

-- CreateIndex
CREATE INDEX "OptimizationLog_campaignId_idx" ON "OptimizationLog"("campaignId");

-- CreateIndex
CREATE INDEX "OptimizationLog_createdAt_idx" ON "OptimizationLog"("createdAt");

-- CreateIndex
CREATE INDEX "BudgetAllocation_adAccountId_idx" ON "BudgetAllocation"("adAccountId");

-- CreateIndex
CREATE INDEX "BudgetAllocation_campaignId_idx" ON "BudgetAllocation"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_notificationType_channel_key" ON "NotificationPreference"("userId", "notificationType", "channel");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");

-- AddForeignKey
ALTER TABLE "TouchPoint" ADD CONSTRAINT "TouchPoint_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "UserJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformancePrediction" ADD CONSTRAINT "PerformancePrediction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
