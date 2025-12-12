import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SegmentSettingsService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // SegmentRule CRUD
  // =====================
  async createSegmentRule(data: Prisma.SegmentRuleCreateInput) {
    return this.prisma.segmentRule.create({ data });
  }

  async findAllSegmentRules(tenantId?: string) {
    return this.prisma.segmentRule.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSegmentRuleById(id: string) {
    return this.prisma.segmentRule.findUnique({ where: { id } });
  }

  async updateSegmentRule(id: string, data: Prisma.SegmentRuleUpdateInput) {
    return this.prisma.segmentRule.update({
      where: { id },
      data,
    });
  }

  async deleteSegmentRule(id: string) {
    return this.prisma.segmentRule.delete({ where: { id } });
  }

  async findActiveSegmentRules(tenantId?: string) {
    return this.prisma.segmentRule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findSegmentRulesByType(ruleType: string, tenantId?: string) {
    return this.prisma.segmentRule.findMany({
      where: {
        ruleType,
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  // =====================
  // AudienceSync CRUD
  // =====================
  async createAudienceSync(data: Prisma.AudienceSyncCreateInput) {
    return this.prisma.audienceSync.create({ data });
  }

  async findAllAudienceSyncs(tenantId?: string) {
    return this.prisma.audienceSync.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAudienceSyncById(id: string) {
    return this.prisma.audienceSync.findUnique({ where: { id } });
  }

  async updateAudienceSync(id: string, data: Prisma.AudienceSyncUpdateInput) {
    return this.prisma.audienceSync.update({
      where: { id },
      data,
    });
  }

  async deleteAudienceSync(id: string) {
    return this.prisma.audienceSync.delete({ where: { id } });
  }

  async findAudienceSyncsByPlatform(platform: string, tenantId?: string) {
    return this.prisma.audienceSync.findMany({
      where: {
        platform: platform as any,
        syncEnabled: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async updateLastSyncTime(id: string) {
    return this.prisma.audienceSync.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }
}
