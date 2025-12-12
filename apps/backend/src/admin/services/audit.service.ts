import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueryDto, AuditLogPaginatedDto } from '../dto/audit.dto';

export interface AuditLogCreateParams {
  tenantId?: string;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: AuditLogCreateParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          userEmail: params.userEmail,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          oldValue: params.oldValue,
          newValue: params.newValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  async query(dto: AuditQueryDto): Promise<AuditLogPaginatedDto> {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.tenantId) {
      where.tenantId = dto.tenantId;
    }
    if (dto.userId) {
      where.userId = dto.userId;
    }
    if (dto.actionType) {
      where.action = dto.actionType;
    }
    if (dto.resource) {
      where.resource = dto.resource;
    }
    if (dto.from || dto.to) {
      where.timestamp = {};
      if (dto.from) {
        where.timestamp.gte = new Date(dto.from);
      }
      if (dto.to) {
        where.timestamp.lte = new Date(dto.to);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => ({
        id: log.id,
        tenantId: log.tenantId ?? undefined,
        userId: log.userId,
        userEmail: log.userEmail ?? undefined,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        timestamp: log.timestamp,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getByResource(resource: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getByUser(userId: string, limit: number = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getRecentActivity(tenantId: string, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async cleanupOldLogs(retentionDays: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoff },
      },
    });

    this.logger.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);
    return result.count;
  }
}
