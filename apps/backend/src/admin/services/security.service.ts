import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PiiRedactDto } from '../dto/security.dto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // PII Redaction
  // ============================================

  async createRedactionJob(dto: PiiRedactDto) {
    return this.prisma.piiRedactionJob.create({
      data: {
        tenantId: dto.tenantId,
        fields: dto.fields,
        retentionDays: dto.retentionDays || 30,
        status: 'pending',
      },
    });
  }

  async getRedactionJob(jobId: string) {
    return this.prisma.piiRedactionJob.findUnique({
      where: { id: jobId },
    });
  }

  async processRedactionJob(jobId: string) {
    // Update job status to running
    await this.prisma.piiRedactionJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      const job = await this.prisma.piiRedactionJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // TODO: Implement actual PII redaction logic
      // This would involve scanning the specified fields and masking PII data
      const processedCount = 0;

      await this.prisma.piiRedactionJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          processedCount,
          completedAt: new Date(),
        },
      });

      return { success: true, processedCount };
    } catch (error) {
      await this.prisma.piiRedactionJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  // ============================================
  // Security Alerts
  // ============================================

  async createAlert(data: {
    alertType: string;
    severity: string;
    source: string;
    description: string;
    metadata?: any;
  }) {
    return this.prisma.securityAlert.create({
      data,
    });
  }

  async getAlerts(filters?: {
    alertType?: string;
    severity?: string;
    isResolved?: boolean;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.alertType) {
      where.alertType = filters.alertType;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.isResolved !== undefined) {
      where.isResolved = filters.isResolved;
    }

    return this.prisma.securityAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async resolveAlert(alertId: string, resolvedBy: string, resolutionNote?: string) {
    return this.prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        metadata: resolutionNote
          ? { resolutionNote }
          : undefined,
      },
    });
  }

  async getUnresolvedAlertCount() {
    return this.prisma.securityAlert.count({
      where: { isResolved: false },
    });
  }

  async getAlertsBySeverity() {
    const alerts = await this.prisma.securityAlert.groupBy({
      by: ['severity'],
      where: { isResolved: false },
      _count: { id: true },
    });

    return alerts.reduce(
      (acc, item) => {
        acc[item.severity] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  // ============================================
  // Abnormal Access Detection
  // ============================================

  async detectAbnormalAccess(userId: string, ipAddress: string, action: string) {
    // Check for suspicious patterns
    const recentLogs = await this.prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    // Check for too many actions
    if (recentLogs.length > 100) {
      await this.createAlert({
        alertType: 'abnormal_access',
        severity: 'high',
        source: `user:${userId}`,
        description: `Unusual activity detected: ${recentLogs.length} actions in the last hour`,
        metadata: { userId, ipAddress, actionCount: recentLogs.length },
      });
      return true;
    }

    // Check for multiple IPs
    const uniqueIps = new Set(recentLogs.map((log) => log.ipAddress));
    if (uniqueIps.size > 5) {
      await this.createAlert({
        alertType: 'abnormal_access',
        severity: 'medium',
        source: `user:${userId}`,
        description: `Multiple IP addresses detected: ${uniqueIps.size} unique IPs`,
        metadata: { userId, ips: Array.from(uniqueIps) },
      });
      return true;
    }

    return false;
  }

  // ============================================
  // Token Expiration Monitoring
  // ============================================

  async checkTokenExpirations() {
    const integrations = await this.prisma.integrationStatus.findMany({
      where: {
        tokenExpiresAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        tokenStatus: { not: 'expired' },
        isActive: true,
      },
    });

    for (const integration of integrations) {
      const daysUntilExpiry = Math.ceil(
        ((integration.tokenExpiresAt?.getTime() || 0) - Date.now()) / (24 * 60 * 60 * 1000),
      );

      await this.createAlert({
        alertType: 'token_expired',
        severity: daysUntilExpiry <= 1 ? 'critical' : daysUntilExpiry <= 3 ? 'high' : 'medium',
        source: `integration:${integration.id}`,
        description: `Token for ${integration.platform} will expire in ${daysUntilExpiry} days`,
        metadata: {
          integrationId: integration.id,
          platform: integration.platform,
          tenantId: integration.tenantId,
          expiresAt: integration.tokenExpiresAt,
        },
      });
    }

    return integrations.length;
  }
}
