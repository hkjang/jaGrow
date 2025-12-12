import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, TenantUsageDto } from '../dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        orgId: dto.orgId,
        plan: dto.plan || 'free',
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        integrationStatuses: {
          select: {
            platform: true,
            tokenStatus: true,
            lastSyncAt: true,
          },
        },
        _count: {
          select: {
            auditLogs: true,
            costQuotas: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        integrationStatuses: true,
        costQuotas: true,
      },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getUsage(id: string, from?: Date, to?: Date): Promise<TenantUsageDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get current usage
    const usage: TenantUsageDto = {
      tenantId: id,
      eventsCount: tenant.eventsCount,
      storageBytes: tenant.storageBytes,
      costEstimate: tenant.costEstimate,
      p95ResponseMs: tenant.p95ResponseMs ?? undefined,
      period: {
        from: from || new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: to || new Date(),
      },
    };

    return usage;
  }

  async updateUsageMetrics(
    id: string,
    metrics: {
      eventsCount?: bigint;
      storageBytes?: bigint;
      costEstimate?: number;
      p95ResponseMs?: number;
    },
  ) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        eventsCount: metrics.eventsCount,
        storageBytes: metrics.storageBytes,
        costEstimate: metrics.costEstimate,
        p95ResponseMs: metrics.p95ResponseMs,
      },
    });
  }

  async regenerateApiKey(id: string) {
    const newApiKey = crypto.randomUUID();
    return this.prisma.tenant.update({
      where: { id },
      data: { apiKey: newApiKey },
    });
  }
}
