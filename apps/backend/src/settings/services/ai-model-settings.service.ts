import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AIModelSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // AIModelConfig CRUD
  // =====================
  async createModelConfig(data: Prisma.AIModelConfigCreateInput) {
    return this.prisma.aIModelConfig.create({ data });
  }

  async findAllModelConfigs(tenantId?: string) {
    return this.prisma.aIModelConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { parameters: true, validations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findModelConfigById(id: string) {
    return this.prisma.aIModelConfig.findUnique({
      where: { id },
      include: { parameters: true, validations: true },
    });
  }

  async updateModelConfig(id: string, data: Prisma.AIModelConfigUpdateInput) {
    return this.prisma.aIModelConfig.update({
      where: { id },
      data,
    });
  }

  async deleteModelConfig(id: string) {
    return this.prisma.aIModelConfig.delete({ where: { id } });
  }

  // =====================
  // AIModelParameter CRUD
  // =====================
  async createParameter(data: Prisma.AIModelParameterCreateInput) {
    return this.prisma.aIModelParameter.create({ data });
  }

  async findParametersByModelId(modelConfigId: string) {
    return this.prisma.aIModelParameter.findMany({
      where: { modelConfigId },
    });
  }

  async updateParameter(id: string, data: Prisma.AIModelParameterUpdateInput) {
    return this.prisma.aIModelParameter.update({
      where: { id },
      data,
    });
  }

  async deleteParameter(id: string) {
    return this.prisma.aIModelParameter.delete({ where: { id } });
  }

  async upsertParameter(modelConfigId: string, paramName: string, paramValue: string, paramType: string) {
    return this.prisma.aIModelParameter.upsert({
      where: { modelConfigId_paramName: { modelConfigId, paramName } },
      update: { paramValue, paramType },
      create: {
        modelConfig: { connect: { id: modelConfigId } },
        paramName,
        paramValue,
        paramType,
      },
    });
  }

  // =====================
  // AIModelValidation CRUD
  // =====================
  async createValidation(data: Prisma.AIModelValidationCreateInput) {
    return this.prisma.aIModelValidation.create({ data });
  }

  async findValidationsByModelId(modelConfigId: string) {
    return this.prisma.aIModelValidation.findMany({
      where: { modelConfigId },
      orderBy: { validatedAt: 'desc' },
    });
  }

  async findLatestValidation(modelConfigId: string) {
    return this.prisma.aIModelValidation.findFirst({
      where: { modelConfigId },
      orderBy: { validatedAt: 'desc' },
    });
  }

  async deleteValidation(id: string) {
    return this.prisma.aIModelValidation.delete({ where: { id } });
  }

  // =====================
  // AIModelSafety CRUD
  // =====================
  async createSafetyRule(data: Prisma.AIModelSafetyCreateInput) {
    return this.prisma.aIModelSafety.create({ data });
  }

  async findAllSafetyRules(tenantId?: string) {
    return this.prisma.aIModelSafety.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findSafetyRuleById(id: string) {
    return this.prisma.aIModelSafety.findUnique({ where: { id } });
  }

  async updateSafetyRule(id: string, data: Prisma.AIModelSafetyUpdateInput) {
    return this.prisma.aIModelSafety.update({
      where: { id },
      data,
    });
  }

  async deleteSafetyRule(id: string) {
    return this.prisma.aIModelSafety.delete({ where: { id } });
  }

  async findSafetyRulesByType(ruleType: string, tenantId?: string) {
    return this.prisma.aIModelSafety.findMany({
      where: {
        ruleType,
        ...(tenantId ? { tenantId } : {}),
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
  }
}
