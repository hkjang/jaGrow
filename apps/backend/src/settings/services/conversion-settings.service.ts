import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversionSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // ConversionRule CRUD
  // =====================
  async createConversionRule(data: Prisma.ConversionRuleCreateInput) {
    return this.prisma.conversionRule.create({ data });
  }

  async findAllConversionRules(tenantId?: string) {
    return this.prisma.conversionRule.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findConversionRuleById(id: string) {
    return this.prisma.conversionRule.findUnique({ where: { id } });
  }

  async updateConversionRule(id: string, data: Prisma.ConversionRuleUpdateInput) {
    return this.prisma.conversionRule.update({
      where: { id },
      data,
    });
  }

  async deleteConversionRule(id: string) {
    return this.prisma.conversionRule.delete({ where: { id } });
  }

  async findActiveConversionRules(tenantId?: string) {
    return this.prisma.conversionRule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  // =====================
  // AttributionModelConfig CRUD
  // =====================
  async createAttributionModel(data: Prisma.AttributionModelConfigCreateInput) {
    return this.prisma.attributionModelConfig.create({ data });
  }

  async findAllAttributionModels(tenantId?: string) {
    return this.prisma.attributionModelConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAttributionModelById(id: string) {
    return this.prisma.attributionModelConfig.findUnique({ where: { id } });
  }

  async updateAttributionModel(id: string, data: Prisma.AttributionModelConfigUpdateInput) {
    return this.prisma.attributionModelConfig.update({
      where: { id },
      data,
    });
  }

  async deleteAttributionModel(id: string) {
    return this.prisma.attributionModelConfig.delete({ where: { id } });
  }

  async findDefaultAttributionModel(tenantId?: string) {
    return this.prisma.attributionModelConfig.findFirst({
      where: {
        isDefault: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async setDefaultAttributionModel(id: string, tenantId?: string) {
    // First, unset all default models
    await this.prisma.attributionModelConfig.updateMany({
      where: tenantId ? { tenantId } : {},
      data: { isDefault: false },
    });
    // Then set the specified model as default
    return this.prisma.attributionModelConfig.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  // =====================
  // FunnelWeight CRUD
  // =====================
  async createFunnelWeight(data: Prisma.FunnelWeightCreateInput) {
    return this.prisma.funnelWeight.create({ data });
  }

  async findAllFunnelWeights(tenantId?: string) {
    return this.prisma.funnelWeight.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFunnelWeightById(id: string) {
    return this.prisma.funnelWeight.findUnique({ where: { id } });
  }

  async updateFunnelWeight(id: string, data: Prisma.FunnelWeightUpdateInput) {
    return this.prisma.funnelWeight.update({
      where: { id },
      data,
    });
  }

  async deleteFunnelWeight(id: string) {
    return this.prisma.funnelWeight.delete({ where: { id } });
  }

  async upsertFunnelWeight(tenantId: string | null, funnelStep: string, weight: number, autoOptimize: boolean) {
    const existing = await this.prisma.funnelWeight.findFirst({
      where: { tenantId, funnelStep },
    });

    if (existing) {
      return this.prisma.funnelWeight.update({
        where: { id: existing.id },
        data: { weight, autoOptimize },
      });
    }

    return this.prisma.funnelWeight.create({
      data: { tenantId, funnelStep, weight, autoOptimize },
    });
  }
}
