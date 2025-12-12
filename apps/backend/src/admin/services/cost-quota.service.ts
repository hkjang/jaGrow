import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCostQuotaDto, CostQuotaResponseDto, CostSummaryDto } from '../dto/cost-quota.dto';

@Injectable()
export class CostQuotaService {
  private readonly logger = new Logger(CostQuotaService.name);

  constructor(private prisma: PrismaService) {}

  async getQuotas(tenantId: string): Promise<CostQuotaResponseDto[]> {
    const quotas = await this.prisma.costQuota.findMany({
      where: { tenantId },
    });

    return quotas.map((quota) => ({
      id: quota.id,
      tenantId: quota.tenantId,
      quotaType: quota.quotaType,
      limitValue: quota.limitValue,
      currentValue: quota.currentValue,
      usagePercent: Number(quota.limitValue) > 0
        ? (Number(quota.currentValue) / Number(quota.limitValue)) * 100
        : 0,
      alertThreshold: quota.alertThreshold,
      period: quota.period,
      periodStartAt: quota.periodStartAt,
      isAutoBlock: quota.isAutoBlock,
    }));
  }

  async setQuota(tenantId: string, dto: UpdateCostQuotaDto) {
    if (!dto.quotaType || !dto.limitValue) {
      throw new Error('quotaType and limitValue are required');
    }

    return this.prisma.costQuota.upsert({
      where: {
        tenantId_quotaType_period: {
          tenantId,
          quotaType: dto.quotaType,
          period: dto.period || 'monthly',
        },
      },
      update: {
        limitValue: BigInt(dto.limitValue),
        alertThreshold: dto.alertThreshold,
        isAutoBlock: dto.isAutoBlock,
      },
      create: {
        tenantId,
        quotaType: dto.quotaType,
        limitValue: BigInt(dto.limitValue),
        alertThreshold: dto.alertThreshold || 0.8,
        period: dto.period || 'monthly',
        isAutoBlock: dto.isAutoBlock || false,
      },
    });
  }

  async updateUsage(tenantId: string, quotaType: string, increment: bigint) {
    const quota = await this.prisma.costQuota.findFirst({
      where: { tenantId, quotaType },
    });

    if (!quota) {
      return null;
    }

    const newValue = quota.currentValue + increment;

    // Check if quota exceeded
    if (newValue > quota.limitValue && quota.isAutoBlock) {
      this.logger.warn(`Quota exceeded for tenant ${tenantId}, type ${quotaType}`);
      // TODO: Implement blocking logic
    }

    return this.prisma.costQuota.update({
      where: { id: quota.id },
      data: { currentValue: newValue },
    });
  }

  async getCostSummary(tenantId: string): Promise<CostSummaryDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { costQuotas: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const breakdown = tenant.costQuotas.map((quota) => ({
      type: quota.quotaType,
      cost: this.calculateCost(quota.quotaType, Number(quota.currentValue)),
      usage: quota.currentValue,
    }));

    const alerts = tenant.costQuotas
      .filter((quota) => {
        const usagePercent = Number(quota.currentValue) / Number(quota.limitValue);
        return usagePercent >= quota.alertThreshold;
      })
      .map((quota) => ({
        type: quota.quotaType,
        message: `${quota.quotaType} usage at ${((Number(quota.currentValue) / Number(quota.limitValue)) * 100).toFixed(1)}%`,
        severity: Number(quota.currentValue) > Number(quota.limitValue) ? 'critical' : 'warning',
      }));

    return {
      tenantId,
      totalCostEstimate: tenant.costEstimate,
      breakdown,
      alerts,
    };
  }

  private calculateCost(type: string, usage: number): number {
    // Pricing model (example rates)
    const rates: Record<string, number> = {
      events: 0.0001, // $0.0001 per event
      storage: 0.023, // $0.023 per GB
      query: 0.005, // $0.005 per query
      api_calls: 0.0001, // $0.0001 per call
    };

    return usage * (rates[type] || 0);
  }

  async checkAlerts(tenantId: string) {
    const quotas = await this.prisma.costQuota.findMany({
      where: { tenantId },
    });

    const alerts: { quotaType: string; percentage: number; isExceeded: boolean }[] = [];

    for (const quota of quotas) {
      const percentage = Number(quota.limitValue) > 0
        ? (Number(quota.currentValue) / Number(quota.limitValue)) * 100
        : 0;

      if (percentage >= quota.alertThreshold * 100) {
        alerts.push({
          quotaType: quota.quotaType,
          percentage,
          isExceeded: Number(quota.currentValue) > Number(quota.limitValue),
        });
      }
    }

    return alerts;
  }

  async resetPeriod(tenantId: string, quotaType: string) {
    return this.prisma.costQuota.updateMany({
      where: { tenantId, quotaType },
      data: {
        currentValue: BigInt(0),
        periodStartAt: new Date(),
      },
    });
  }
}
