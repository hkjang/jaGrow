import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface AlertConfig {
  roasDropThreshold: number;      // e.g., 0.3 = 30% drop
  conversionDropThreshold: number; // e.g., 0.5 = 50% drop
  budgetDepletionWarningDays: number; // e.g., 2 = warn when 2 days budget left
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  private readonly defaultConfig: AlertConfig = {
    roasDropThreshold: 0.3,
    conversionDropThreshold: 0.5,
    budgetDepletionWarningDays: 2,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run alert checks every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async runAlertChecks(): Promise<void> {
    this.logger.log('Running scheduled alert checks...');
    
    await this.checkROASDrops();
    await this.checkConversionDrops();
    await this.checkBudgetDepletion();
  }

  /**
   * Check for significant ROAS drops
   */
  async checkROASDrops(): Promise<void> {
    const campaigns = await this.getCampaignsWithMetrics();

    for (const campaign of campaigns) {
      const { current, previous } = this.getPerformanceComparison(campaign.metrics);
      
      if (previous.roas > 0) {
        const roasChange = (current.roas - previous.roas) / previous.roas;
        
        if (roasChange < -this.defaultConfig.roasDropThreshold) {
          await this.createNotification({
            userId: campaign.adAccount?.organization?.users?.[0]?.id,
            type: 'ROAS_DROP',
            title: `ROAS 급감 알림: ${campaign.name}`,
            message: `캠페인 "${campaign.name}"의 ROAS가 ${Math.abs(roasChange * 100).toFixed(1)}% 하락했습니다. (${previous.roas.toFixed(2)} → ${current.roas.toFixed(2)})`,
            metadata: {
              campaignId: campaign.id,
              previousROAS: previous.roas,
              currentROAS: current.roas,
              changePercent: roasChange * 100,
            },
          });
        }
      }
    }
  }

  /**
   * Check for significant conversion drops
   */
  async checkConversionDrops(): Promise<void> {
    const campaigns = await this.getCampaignsWithMetrics();

    for (const campaign of campaigns) {
      const { current, previous } = this.getPerformanceComparison(campaign.metrics);
      
      if (previous.conversions > 0) {
        const conversionChange = (current.conversions - previous.conversions) / previous.conversions;
        
        if (conversionChange < -this.defaultConfig.conversionDropThreshold) {
          await this.createNotification({
            userId: campaign.adAccount?.organization?.users?.[0]?.id,
            type: 'CONVERSION_DROP',
            title: `전환 감소 알림: ${campaign.name}`,
            message: `캠페인 "${campaign.name}"의 전환이 ${Math.abs(conversionChange * 100).toFixed(1)}% 감소했습니다. (${previous.conversions} → ${current.conversions})`,
            metadata: {
              campaignId: campaign.id,
              previousConversions: previous.conversions,
              currentConversions: current.conversions,
              changePercent: conversionChange * 100,
            },
          });
        }
      }
    }
  }

  /**
   * Check for budget depletion warnings
   */
  async checkBudgetDepletion(): Promise<void> {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { status: 'ENABLED' },
      include: {
        adAccount: {
          include: {
            organization: {
              include: { users: true },
            },
          },
        },
        metrics: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    for (const campaign of campaigns) {
      if (!campaign.budget) continue;

      // Calculate average daily spend
      const totalSpend = campaign.metrics.reduce((sum, m) => sum + (m.spend || 0), 0);
      const avgDailySpend = campaign.metrics.length > 0 
        ? totalSpend / campaign.metrics.length 
        : 0;

      if (avgDailySpend > 0) {
        const daysRemaining = campaign.budget / avgDailySpend;

        if (daysRemaining <= this.defaultConfig.budgetDepletionWarningDays) {
          await this.createNotification({
            userId: campaign.adAccount?.organization?.users?.[0]?.id,
            type: 'BUDGET_DEPLETED',
            title: `예산 소진 임박 알림: ${campaign.name}`,
            message: `캠페인 "${campaign.name}"의 예산이 약 ${daysRemaining.toFixed(1)}일 후 소진될 예정입니다.`,
            metadata: {
              campaignId: campaign.id,
              budget: campaign.budget,
              avgDailySpend,
              daysRemaining,
            },
          });
        }
      }
    }
  }

  /**
   * Get campaigns with recent metrics
   */
  private async getCampaignsWithMetrics(): Promise<any[]> {
    return this.prisma.adCampaign.findMany({
      where: { status: 'ENABLED' },
      include: {
        adAccount: {
          include: {
            organization: {
              include: { users: true },
            },
          },
        },
        metrics: {
          where: {
            date: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  /**
   * Compare current period vs previous period performance
   */
  private getPerformanceComparison(metrics: any[]): {
    current: { roas: number; conversions: number; spend: number };
    previous: { roas: number; conversions: number; spend: number };
  } {
    const midpoint = Math.floor(metrics.length / 2);
    const currentMetrics = metrics.slice(0, midpoint);
    const previousMetrics = metrics.slice(midpoint);

    const calcPerformance = (m: any[]) => {
      const spend = m.reduce((sum, x) => sum + (x.spend || 0), 0);
      const revenue = m.reduce((sum, x) => sum + (x.conversionValue || 0), 0);
      const conversions = m.reduce((sum, x) => sum + (x.conversions || 0), 0);
      return {
        roas: spend > 0 ? revenue / spend : 0,
        conversions,
        spend,
      };
    };

    return {
      current: calcPerformance(currentMetrics),
      previous: calcPerformance(previousMetrics),
    };
  }

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId?: string;
    type: 'ROAS_DROP' | 'CONVERSION_DROP' | 'BUDGET_DEPLETED' | 'ANOMALY_DETECTED' | 'OPTIMIZATION_APPLIED' | 'TRACKING_LOSS' | 'CLICK_ID_MISMATCH';
    title: string;
    message: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Check if similar notification was sent recently (avoid spam)
      const recentNotification = await this.prisma.notificationLog.findFirst({
        where: {
          userId: data.userId,
          notificationType: data.type,
          sentAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      if (recentNotification) {
        this.logger.debug(`Skipping duplicate notification for ${data.type}`);
        return;
      }

      // Create notification log
      await this.prisma.notificationLog.create({
        data: {
          userId: data.userId,
          notificationType: data.type,
          channel: 'IN_APP',
          title: data.title,
          message: data.message,
          metadata: data.metadata,
        },
      });

      this.logger.log(`Created notification: ${data.type} - ${data.title}`);
    } catch (error) {
      this.logger.error(`Error creating notification: ${error}`);
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<any[]> {
    return this.prisma.notificationLog.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notificationLog.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notificationLog.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<any[]> {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreference(
    userId: string,
    type: string,
    channel: string,
    isEnabled: boolean,
    threshold?: number,
  ): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: {
        userId_notificationType_channel: {
          userId,
          notificationType: type as any,
          channel: channel as any,
        },
      },
      update: { isEnabled, threshold },
      create: {
        userId,
        notificationType: type as any,
        channel: channel as any,
        isEnabled,
        threshold,
      },
    });
  }
}
