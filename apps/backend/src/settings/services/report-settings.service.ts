import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // KpiDefinition CRUD
  // =====================
  async createKpiDefinition(data: Prisma.KpiDefinitionCreateInput) {
    return this.prisma.kpiDefinition.create({ data });
  }

  async findAllKpiDefinitions(tenantId?: string) {
    return this.prisma.kpiDefinition.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findKpiDefinitionById(id: string) {
    return this.prisma.kpiDefinition.findUnique({ where: { id } });
  }

  async updateKpiDefinition(id: string, data: Prisma.KpiDefinitionUpdateInput) {
    return this.prisma.kpiDefinition.update({
      where: { id },
      data,
    });
  }

  async deleteKpiDefinition(id: string) {
    return this.prisma.kpiDefinition.delete({ where: { id } });
  }

  async findKpiDefinitionByType(kpiType: string, tenantId?: string) {
    return this.prisma.kpiDefinition.findFirst({
      where: {
        kpiType,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  // =====================
  // DashboardTemplate CRUD
  // =====================
  async createDashboardTemplate(data: Prisma.DashboardTemplateCreateInput) {
    return this.prisma.dashboardTemplate.create({ data });
  }

  async findAllDashboardTemplates(tenantId?: string) {
    return this.prisma.dashboardTemplate.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDashboardTemplateById(id: string) {
    return this.prisma.dashboardTemplate.findUnique({ where: { id } });
  }

  async updateDashboardTemplate(id: string, data: Prisma.DashboardTemplateUpdateInput) {
    return this.prisma.dashboardTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteDashboardTemplate(id: string) {
    return this.prisma.dashboardTemplate.delete({ where: { id } });
  }

  async findDefaultDashboardTemplate(tenantId?: string) {
    return this.prisma.dashboardTemplate.findFirst({
      where: {
        isDefault: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async setDefaultDashboardTemplate(id: string, tenantId?: string) {
    await this.prisma.dashboardTemplate.updateMany({
      where: tenantId ? { tenantId } : {},
      data: { isDefault: false },
    });
    return this.prisma.dashboardTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  // =====================
  // ReportSchedule CRUD
  // =====================
  async createReportSchedule(data: Prisma.ReportScheduleCreateInput) {
    return this.prisma.reportSchedule.create({ data });
  }

  async findAllReportSchedules(tenantId?: string) {
    return this.prisma.reportSchedule.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReportScheduleById(id: string) {
    return this.prisma.reportSchedule.findUnique({ where: { id } });
  }

  async updateReportSchedule(id: string, data: Prisma.ReportScheduleUpdateInput) {
    return this.prisma.reportSchedule.update({
      where: { id },
      data,
    });
  }

  async deleteReportSchedule(id: string) {
    return this.prisma.reportSchedule.delete({ where: { id } });
  }

  async findActiveReportSchedules(tenantId?: string) {
    return this.prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async updateLastSentTime(id: string) {
    return this.prisma.reportSchedule.update({
      where: { id },
      data: { lastSentAt: new Date() },
    });
  }
}
