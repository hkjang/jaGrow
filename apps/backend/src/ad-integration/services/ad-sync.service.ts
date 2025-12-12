import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';
import { TikTokAdsService } from './tiktok-ads.service';
import { AdPlatform } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdSyncService {
  private readonly logger = new Logger(AdSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleService: GoogleAdsService,
    private readonly metaService: MetaAdsService,
    private readonly tiktokService: TikTokAdsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async syncAllAccounts() {
    this.logger.log('Starting sync for all active ad accounts...');
    const accounts = await this.prisma.adAccount.findMany({
      where: { isActive: true },
    });

    for (const account of accounts) {
      try {
        await this.syncAccount(account);
      } catch (error) {
        this.logger.error(`Failed to sync account ${account.id} (${account.platform}): ${error.message}`);
      }
    }
    
    // After sync, apply rules
    await this.applyOptimizationRules();
    
    this.logger.log('Sync and Optimization completed.');
  }

  // Basic Rule: Pause Ad if CPA > 50 and Spend > 10 (Last 24h)
  private async applyOptimizationRules() {
    this.logger.log('Checking Optimization Rules...');
    
    // Get metrics for today
    // Note: In real world, we might aggregate last 7 days.
    // Simplifying to check today's performance which we just synced.
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const highCpaAds = await this.prisma.adMetric.findMany({
      where: {
        date: today,
        spend: { gt: 10 }, // Min spend filter
        ad: { status: 'ACTIVE' }
      },
      include: {
        ad: {
          include: { adGroup: { include: { campaign: { include: { adAccount: true } } } } }
        }
      }
    });

    for (const metric of highCpaAds) {
      const ad = metric.ad;
      if (!ad) continue;

      const cpa = metric.conversions > 0 ? (metric.spend / metric.conversions) : (metric.spend > 50 ? 9999 : 0);
      
      if (cpa > 50) {
        this.logger.warn(`Rule Triggered: Ad ${ad.name} (ID: ${ad.id}) has CPA ${cpa.toFixed(2)} > 50. Pausing...`);
        
        const account = ad.adGroup.campaign.adAccount;
        let adapter;
        if (account.platform === 'GOOGLE') adapter = this.googleService;
        else if (account.platform === 'META') adapter = this.metaService;
        else if (account.platform === 'TIKTOK') adapter = this.tiktokService;
        
        if (adapter && adapter.updateAdStatus) {
           await adapter.updateAdStatus(account.accountId, ad.externalId, 'PAUSED', account.accessToken);
           // Update local DB status
           await this.prisma.ad.update({
             where: { id: ad.id },
             data: { status: 'PAUSED' }
           });
        }
      }
    }
  }

  private async syncAccount(account: any) {
    this.logger.log(`Syncing account: ${account.name} (${account.platform})`);
    
    // Choose adapter
    let adapter;
    if (account.platform === 'GOOGLE') adapter = this.googleService;
    else if (account.platform === 'META') adapter = this.metaService;
    else if (account.platform === 'TIKTOK') adapter = this.tiktokService;
    else return;

    // 1. Sync Campaigns
    const campaigns = await adapter.getCampaigns(account.accountId, account.accessToken);
    for (const camp of campaigns) {
      await this.saveCampaign(account.id, account.platform, camp);
    }

    // Refresh campaigns from DB to get IDs for child entities
    // Optimized: In a real app we might pass IDs down, but fetching is safer to ensure parent existence
    const dbCampaigns = await this.prisma.adCampaign.findMany({
      where: { adAccountId: account.id },
    });

    for (const dbCamp of dbCampaigns) {
      // 2. Sync AdGroups
      const adGroups = await adapter.getAdGroups(account.accountId, dbCamp.externalId, account.accessToken);
      for (const group of adGroups) {
        await this.saveAdGroup(dbCamp.id, account.platform, group);
      }
      
      const dbAdGroups = await this.prisma.adGroup.findMany({ where: { campaignId: dbCamp.id } });
      for (const dbGroup of dbAdGroups) {
         // 3. Sync Ads
         const ads = await adapter.getAds(account.accountId, dbGroup.externalId, account.accessToken);
         for (const ad of ads) {
           await this.saveAd(dbGroup.id, account.platform, ad);
         }
      }
    }

    // 4. Sync Metrics (Last 1 day for now)
    const today = new Date().toISOString().split('T')[0];
    const metrics = await adapter.getMetrics(account.accountId, { start: today, end: today }, account.accessToken);
    await this.saveMetrics(metrics, account.platform, account.id);
  }

  private async saveCampaign(adAccountId: string, platform: AdPlatform, data: any) {
    let externalId, name, status, budget;
    
    // Normalization
    if (platform === 'GOOGLE') {
      externalId = String(data.campaign?.id || data.id);
      name = data.campaign?.name || data.name;
      status = data.campaign?.status || data.status;
      budget = (data.campaign_budget?.amount_micros || 0) / 1000000;
    } else if (platform === 'META') {
      externalId = data.id;
      name = data.name;
      status = data.status;
      budget = data.daily_budget ? Number(data.daily_budget) : (data.lifetime_budget ? Number(data.lifetime_budget) : 0);
    } else if (platform === 'TIKTOK') {
      externalId = data.campaign_id;
      name = data.campaign_name;
      status = data.primary_status; // or operation_status
      budget = data.budget;
    }

    if (!externalId) return;

    await this.prisma.adCampaign.upsert({
      where: { adAccountId_externalId: { adAccountId, externalId } },
      update: { name, status, budget },
      create: { adAccountId, externalId, name: name || 'Unknown', status: status || 'UNKNOWN', budget },
    });
  }

  private async saveAdGroup(campaignId: string, platform: AdPlatform, data: any) {
    let externalId, name, status;
    
    if (platform === 'GOOGLE') {
      externalId = String(data.ad_group?.id || data.id);
      name = data.ad_group?.name || data.name;
      status = data.ad_group?.status || data.status;
    } else if (platform === 'META') {
      externalId = data.id;
      name = data.name;
      status = data.status;
    } else if (platform === 'TIKTOK') {
      externalId = data.adgroup_id;
      name = data.adgroup_name;
      status = data.primary_status;
    }

    if (!externalId) return;

    await this.prisma.adGroup.upsert({
      where: { campaignId_externalId: { campaignId, externalId } },
      update: { name, status },
      create: { campaignId, externalId, name: name || 'Unknown', status: status || 'UNKNOWN' },
    });
  }

  private async saveAd(adGroupId: string, platform: AdPlatform, data: any) {
    let externalId, name, status, creativeUrl;
    
    if (platform === 'GOOGLE') {
      externalId = String(data.ad_group_ad?.ad?.id || data.id);
      name = data.ad_group_ad?.ad?.name || data.name;
      status = data.ad_group_ad?.status || data.status;
      creativeUrl = data.ad_group_ad?.ad?.final_urls?.[0]; 
    } else if (platform === 'META') {
      externalId = data.id;
      name = data.name;
      status = data.status;
      creativeUrl = data.creative?.thumbnail_url;
    } else if (platform === 'TIKTOK') {
      externalId = data.ad_id;
      name = data.ad_name;
      status = data.primary_status;
      // creative info might vary
    }

    if (!externalId) return;

    await this.prisma.ad.upsert({
      where: { adGroupId_externalId: { adGroupId, externalId } },
      update: { name, status, creativeUrl },
      create: { adGroupId, externalId, name: name || 'Unknown', status: status || 'UNKNOWN', creativeUrl },
    });
  }

  private async saveMetrics(metrics: any[], platform: AdPlatform, accountId: string) {
    for (const row of metrics) {
       let adExternalId: string | undefined;
       let impressions = 0;
       let clicks = 0;
       let spend = 0;
       let conversions = 0;
       const date = new Date(); // Default to today if missing

       if (platform === 'GOOGLE') {
         // Google row has segments.date
         adExternalId = String(row.ad_group_ad?.ad?.id);
         impressions = Number(row.metrics?.impressions || 0);
         clicks = Number(row.metrics?.clicks || 0);
         spend = (Number(row.metrics?.cost_micros || 0)) / 1000000;
         conversions = Number(row.metrics?.conversions || 0);
       } else if (platform === 'META') {
         adExternalId = row.ad_id;
         impressions = Number(row.impressions || 0);
         clicks = Number(row.clicks || 0);
         spend = Number(row.spend || 0);
         // Meta actions are array, need parsing. Simplified here.
         conversions = 0; 
       } else if (platform === 'TIKTOK') {
         adExternalId = row.dimensions?.ad_id;
         const m = row.metrics;
         impressions = Number(m?.impressions || 0);
         clicks = Number(m?.clicks || 0);
         spend = Number(m?.spend || 0);
         conversions = Number(m?.conversion || 0);
       }

       if (!adExternalId) continue;

       // Find Ad ID by external ID (complex because we need to know WHICH ad group/campaign it belongs to, 
       // but here we might only have external ID. 
       // Constraint: externalId is unique per AdGroup, but might be globally unique or not.
       // Assuming globally unique enough or we do a broad search.
       // BETTER: We should map from the hierarchy we just synced. 
       
       // For this MVP, let's find the Ad first.
       // This is expensive: findFirst where externalId matches and belongs to this account.
       // Optimization: In real system, we'd bulk load IDs.
       
       // Searching via AdAccount -> Campaign -> AdGroup -> Ad is too deep for a single query easily without join.
       // We'll rely on our specific sync flow where we just synced the ads.
       // To keep it simple: We skip if we can't easily find the ad, OR we do a findFirst.
       
       const ad = await this.prisma.ad.findFirst({
         where: { externalId: adExternalId, adGroup: { campaign: { adAccountId: accountId } } }
       });

       if (ad) {
         await this.prisma.adMetric.create({
            data: {
              adId: ad.id,
              date: date,
              impressions,
              clicks,
              spend,
              conversions,
              ctr: impressions > 0 ? (clicks / impressions) : 0,
              cpc: clicks > 0 ? (spend / clicks) : 0,
            }
         });
       }
    }
  }
}
