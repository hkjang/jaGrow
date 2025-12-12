import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdPlatformSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // PlatformConfig CRUD
  // =====================
  async createPlatformConfig(data: Prisma.PlatformConfigCreateInput) {
    return this.prisma.platformConfig.create({ data });
  }

  async findAllPlatformConfigs(tenantId?: string) {
    return this.prisma.platformConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { trackingConfigs: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPlatformConfigById(id: string) {
    return this.prisma.platformConfig.findUnique({
      where: { id },
      include: { trackingConfigs: true },
    });
  }

  async updatePlatformConfig(id: string, data: Prisma.PlatformConfigUpdateInput) {
    return this.prisma.platformConfig.update({
      where: { id },
      data,
    });
  }

  async deletePlatformConfig(id: string) {
    return this.prisma.platformConfig.delete({ where: { id } });
  }

  // =====================
  // TrackingConfig CRUD
  // =====================
  async createTrackingConfig(data: Prisma.TrackingConfigCreateInput) {
    return this.prisma.trackingConfig.create({ data });
  }

  async findTrackingConfigsByPlatformId(platformConfigId: string) {
    return this.prisma.trackingConfig.findMany({
      where: { platformConfigId },
    });
  }

  async findTrackingConfigById(id: string) {
    return this.prisma.trackingConfig.findUnique({ where: { id } });
  }

  async updateTrackingConfig(id: string, data: Prisma.TrackingConfigUpdateInput) {
    return this.prisma.trackingConfig.update({
      where: { id },
      data,
    });
  }

  async deleteTrackingConfig(id: string) {
    return this.prisma.trackingConfig.delete({ where: { id } });
  }

  // =====================
  // BudgetConfig CRUD
  // =====================
  async createBudgetConfig(data: Prisma.BudgetConfigCreateInput) {
    return this.prisma.budgetConfig.create({ data });
  }

  async findAllBudgetConfigs(tenantId?: string) {
    return this.prisma.budgetConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBudgetConfigById(id: string) {
    return this.prisma.budgetConfig.findUnique({ where: { id } });
  }

  async updateBudgetConfig(id: string, data: Prisma.BudgetConfigUpdateInput) {
    return this.prisma.budgetConfig.update({
      where: { id },
      data,
    });
  }

  async deleteBudgetConfig(id: string) {
    return this.prisma.budgetConfig.delete({ where: { id } });
  }

  async findBudgetConfigByType(budgetType: string, tenantId?: string) {
    return this.prisma.budgetConfig.findFirst({
      where: {
        budgetType,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }
}
