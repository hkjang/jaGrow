import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationPlatform } from '@prisma/client';

@Injectable()
export class IntegrationStatusService {
  private readonly logger = new Logger(IntegrationStatusService.name);

  constructor(private prisma: PrismaService) {}

  async getAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.integrationStatus.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getByPlatform(platform: IntegrationPlatform, tenantId?: string) {
    return this.prisma.integrationStatus.findMany({
      where: {
        platform,
        ...(tenantId && { tenantId }),
      },
    });
  }

  async connect(
    tenantId: string,
    platform: IntegrationPlatform,
    data: {
      accountId: string;
      tokenStatus: string;
      tokenExpiresAt?: Date;
      permissionScope: string[];
    },
  ) {
    return this.prisma.integrationStatus.upsert({
      where: {
        tenantId_platform_accountId: {
          tenantId,
          platform,
          accountId: data.accountId,
        },
      },
      update: {
        tokenStatus: data.tokenStatus,
        tokenExpiresAt: data.tokenExpiresAt,
        permissionScope: data.permissionScope,
        lastSyncAt: new Date(),
      },
      create: {
        tenantId,
        platform,
        accountId: data.accountId,
        tokenStatus: data.tokenStatus,
        tokenExpiresAt: data.tokenExpiresAt,
        permissionScope: data.permissionScope,
      },
    });
  }

  async updateSyncStatus(
    id: string,
    status: {
      lastSyncAt?: Date;
      lastSuccessAt?: Date;
      lastErrorAt?: Date;
      lastErrorMessage?: string;
      apiErrorRate?: number;
    },
  ) {
    return this.prisma.integrationStatus.update({
      where: { id },
      data: status,
    });
  }

  async updateTokenStatus(
    id: string,
    tokenStatus: string,
    tokenExpiresAt?: Date,
  ) {
    return this.prisma.integrationStatus.update({
      where: { id },
      data: {
        tokenStatus,
        tokenExpiresAt,
      },
    });
  }

  async updateRateLimitInfo(
    id: string,
    rateLimitRemaining: number,
    rateLimitResetAt: Date,
  ) {
    return this.prisma.integrationStatus.update({
      where: { id },
      data: {
        rateLimitRemaining,
        rateLimitResetAt,
      },
    });
  }

  async getExpiringSoon(daysAhead: number = 7) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return this.prisma.integrationStatus.findMany({
      where: {
        tokenExpiresAt: {
          lte: expiryDate,
        },
        tokenStatus: {
          not: 'expired',
        },
        isActive: true,
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.integrationStatus.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
