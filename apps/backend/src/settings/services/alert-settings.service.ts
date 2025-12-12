import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlertSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // AlertRule CRUD
  // =====================
  async createAlertRule(data: Prisma.AlertRuleCreateInput) {
    return this.prisma.alertRule.create({
      data,
      include: { channels: true },
    });
  }

  async findAllAlertRules(tenantId?: string) {
    return this.prisma.alertRule.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { channels: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAlertRuleById(id: string) {
    return this.prisma.alertRule.findUnique({
      where: { id },
      include: { channels: true },
    });
  }

  async updateAlertRule(id: string, data: Prisma.AlertRuleUpdateInput) {
    return this.prisma.alertRule.update({
      where: { id },
      data,
      include: { channels: true },
    });
  }

  async deleteAlertRule(id: string) {
    return this.prisma.alertRule.delete({ where: { id } });
  }

  async findActiveAlertRules(tenantId?: string) {
    return this.prisma.alertRule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      include: { channels: true },
    });
  }

  async findAlertRulesByType(alertType: string, tenantId?: string) {
    return this.prisma.alertRule.findMany({
      where: {
        alertType,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      include: { channels: true },
    });
  }

  // =====================
  // AlertChannelConfig CRUD
  // =====================
  async createAlertChannel(data: Prisma.AlertChannelConfigCreateInput) {
    return this.prisma.alertChannelConfig.create({ data });
  }

  async findAlertChannelsByRuleId(alertRuleId: string) {
    return this.prisma.alertChannelConfig.findMany({
      where: { alertRuleId },
    });
  }

  async findAlertChannelById(id: string) {
    return this.prisma.alertChannelConfig.findUnique({ where: { id } });
  }

  async updateAlertChannel(id: string, data: Prisma.AlertChannelConfigUpdateInput) {
    return this.prisma.alertChannelConfig.update({
      where: { id },
      data,
    });
  }

  async deleteAlertChannel(id: string) {
    return this.prisma.alertChannelConfig.delete({ where: { id } });
  }

  // =====================
  // AutomationRule CRUD
  // =====================
  async createAutomationRule(data: Prisma.AutomationRuleCreateInput) {
    return this.prisma.automationRule.create({ data });
  }

  async findAllAutomationRules(tenantId?: string) {
    return this.prisma.automationRule.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAutomationRuleById(id: string) {
    return this.prisma.automationRule.findUnique({ where: { id } });
  }

  async updateAutomationRule(id: string, data: Prisma.AutomationRuleUpdateInput) {
    return this.prisma.automationRule.update({
      where: { id },
      data,
    });
  }

  async deleteAutomationRule(id: string) {
    return this.prisma.automationRule.delete({ where: { id } });
  }

  async findActiveAutomationRules(tenantId?: string) {
    return this.prisma.automationRule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findAutomationRulesByType(ruleType: string, tenantId?: string) {
    return this.prisma.automationRule.findMany({
      where: {
        ruleType,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async incrementTriggerCount(id: string) {
    return this.prisma.automationRule.update({
      where: { id },
      data: {
        triggerCount: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });
  }
}
