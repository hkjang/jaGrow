import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EtlSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // EtlSchedule CRUD
  // =====================
  async createSchedule(data: Prisma.EtlScheduleCreateInput) {
    return this.prisma.etlSchedule.create({ data });
  }

  async findAllSchedules(tenantId?: string) {
    return this.prisma.etlSchedule.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findScheduleById(id: string) {
    return this.prisma.etlSchedule.findUnique({ where: { id } });
  }

  async updateSchedule(id: string, data: Prisma.EtlScheduleUpdateInput) {
    return this.prisma.etlSchedule.update({
      where: { id },
      data,
    });
  }

  async deleteSchedule(id: string) {
    return this.prisma.etlSchedule.delete({ where: { id } });
  }

  async findActiveSchedules(tenantId?: string) {
    return this.prisma.etlSchedule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findSchedulesByType(scheduleType: string, tenantId?: string) {
    return this.prisma.etlSchedule.findMany({
      where: {
        scheduleType,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  // =====================
  // DataQualityRule CRUD
  // =====================
  async createDataQualityRule(data: Prisma.DataQualityRuleCreateInput) {
    return this.prisma.dataQualityRule.create({ data });
  }

  async findAllDataQualityRules(tenantId?: string) {
    return this.prisma.dataQualityRule.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDataQualityRuleById(id: string) {
    return this.prisma.dataQualityRule.findUnique({ where: { id } });
  }

  async updateDataQualityRule(id: string, data: Prisma.DataQualityRuleUpdateInput) {
    return this.prisma.dataQualityRule.update({
      where: { id },
      data,
    });
  }

  async deleteDataQualityRule(id: string) {
    return this.prisma.dataQualityRule.delete({ where: { id } });
  }

  async findActiveDataQualityRules(tenantId?: string) {
    return this.prisma.dataQualityRule.findMany({
      where: {
        alertEnabled: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  // =====================
  // StoragePolicy CRUD
  // =====================
  async createStoragePolicy(data: Prisma.StoragePolicyCreateInput) {
    return this.prisma.storagePolicy.create({ data });
  }

  async findAllStoragePolicies(tenantId?: string) {
    return this.prisma.storagePolicy.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStoragePolicyById(id: string) {
    return this.prisma.storagePolicy.findUnique({ where: { id } });
  }

  async updateStoragePolicy(id: string, data: Prisma.StoragePolicyUpdateInput) {
    return this.prisma.storagePolicy.update({
      where: { id },
      data,
    });
  }

  async deleteStoragePolicy(id: string) {
    return this.prisma.storagePolicy.delete({ where: { id } });
  }

  async findStoragePolicyByTable(tableName: string, tenantId?: string) {
    return this.prisma.storagePolicy.findFirst({
      where: {
        tableName,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }
}
