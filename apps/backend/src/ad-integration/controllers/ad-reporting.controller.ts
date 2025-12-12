import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('ad-reporting')
export class AdReportingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('performance')
  async getPerformance(
    @Query('organizationId') organizationId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('groupBy') groupBy?: 'platform' | 'campaign' | 'day'
  ) {
    // Basic aggregation
    // Note: Use Prisma's groupBy or raw query for performance
    
    // Validate inputs
    if (!organizationId) return [];
    
    const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 7));
    const endDate = end ? new Date(end) : new Date();

    // Simplify: fetch all metrics for the org in range and aggregate in code for MVP flexibility
    // Or use prisma aggregate.
    
    // Fetch accounts first to filter
    const accounts = await this.prisma.adAccount.findMany({
      where: { organizationId },
      select: { id: true, platform: true, name: true }
    });
    
    const accountIds = accounts.map(a => a.id);
    if (accountIds.length === 0) return [];

    // Fetch metrics
    // We need to join via Ad -> AdGroup -> Campaign -> AdAccount
    // This is expensive with Prisma. 
    // Optimization: Filter AdMetrics where ad.adGroup.campaign.adAccountId IN accountIds
    
    const metrics = await this.prisma.adMetric.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ad: {
          adGroup: {
            campaign: {
              adAccountId: { in: accountIds }
            }
          }
        }
      },
      include: {
        ad: {
           include: {
             adGroup: {
               include: {
                 campaign: {
                    include: { adAccount: true }
                 }
               }
             }
           }
        }
      }
    });

    // Aggregation logic
    const report: Record<string, any> = {};
    
    for (const m of metrics) {
       const key = this.getGroupKey(m, groupBy);
       if (!report[key]) {
         report[key] = { 
           key, 
           impressions: 0, clicks: 0, spend: 0, conversions: 0, 
           conversionValue: 0
         };
       }
       report[key].impressions += m.impressions;
       report[key].clicks += m.clicks;
       report[key].spend += m.spend;
       report[key].conversions += m.conversions;
       report[key].conversionValue += m.conversionValue;
    }
    
    // Calculate CTR, CPC, ROAS
    return Object.values(report).map((r: any) => ({
      ...r,
      ctr: r.impressions > 0 ? r.clicks / r.impressions : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      roas: r.spend > 0 ? r.conversionValue / r.spend : 0,
    }));
  }

  private getGroupKey(metric: any, groupBy?: string) {
     if (groupBy === 'platform') return metric.ad.adGroup.campaign.adAccount.platform;
     if (groupBy === 'campaign') return metric.ad.adGroup.campaign.name;
     if (groupBy === 'day') return metric.date.toISOString().split('T')[0];
     return 'total';
  }
}
