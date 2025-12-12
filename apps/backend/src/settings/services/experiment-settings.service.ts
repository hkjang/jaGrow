import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExperimentSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // ExperimentTemplate CRUD
  // =====================
  async createTemplate(data: Prisma.ExperimentTemplateCreateInput) {
    return this.prisma.experimentTemplate.create({ data });
  }

  async findAllTemplates(tenantId?: string) {
    return this.prisma.experimentTemplate.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplateById(id: string) {
    return this.prisma.experimentTemplate.findUnique({ where: { id } });
  }

  async updateTemplate(id: string, data: Prisma.ExperimentTemplateUpdateInput) {
    return this.prisma.experimentTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.experimentTemplate.delete({ where: { id } });
  }

  async findActiveTemplates(tenantId?: string) {
    return this.prisma.experimentTemplate.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findTemplatesByType(templateType: string, tenantId?: string) {
    return this.prisma.experimentTemplate.findMany({
      where: {
        templateType,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  // =====================
  // ExperimentAutoConfig CRUD
  // =====================
  async createAutoConfig(data: Prisma.ExperimentAutoConfigCreateInput) {
    return this.prisma.experimentAutoConfig.create({ data });
  }

  async findAllAutoConfigs(tenantId?: string) {
    return this.prisma.experimentAutoConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAutoConfigById(id: string) {
    return this.prisma.experimentAutoConfig.findUnique({ where: { id } });
  }

  async updateAutoConfig(id: string, data: Prisma.ExperimentAutoConfigUpdateInput) {
    return this.prisma.experimentAutoConfig.update({
      where: { id },
      data,
    });
  }

  async deleteAutoConfig(id: string) {
    return this.prisma.experimentAutoConfig.delete({ where: { id } });
  }

  async getOrCreateAutoConfig(tenantId?: string) {
    let config = await this.prisma.experimentAutoConfig.findFirst({
      where: tenantId ? { tenantId } : {},
    });

    if (!config) {
      config = await this.prisma.experimentAutoConfig.create({
        data: {
          tenantId,
          winnerKpi: 'conversion_rate',
          minSampleSize: 1000,
          autoApply: false,
          autoRollback: true,
        },
      });
    }

    return config;
  }

  // =====================
  // StatisticalConfig CRUD
  // =====================
  async createStatisticalConfig(data: Prisma.StatisticalConfigCreateInput) {
    return this.prisma.statisticalConfig.create({ data });
  }

  async findAllStatisticalConfigs(tenantId?: string) {
    return this.prisma.statisticalConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStatisticalConfigById(id: string) {
    return this.prisma.statisticalConfig.findUnique({ where: { id } });
  }

  async updateStatisticalConfig(id: string, data: Prisma.StatisticalConfigUpdateInput) {
    return this.prisma.statisticalConfig.update({
      where: { id },
      data,
    });
  }

  async deleteStatisticalConfig(id: string) {
    return this.prisma.statisticalConfig.delete({ where: { id } });
  }

  async getOrCreateStatisticalConfig(tenantId?: string) {
    let config = await this.prisma.statisticalConfig.findFirst({
      where: tenantId ? { tenantId } : {},
    });

    if (!config) {
      config = await this.prisma.statisticalConfig.create({
        data: {
          tenantId,
          confidenceLevel: 0.95,
          method: 'frequentist',
        },
      });
    }

    return config;
  }
}
