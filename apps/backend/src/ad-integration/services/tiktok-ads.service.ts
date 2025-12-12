import { Injectable, BadRequestException } from '@nestjs/common';
import { AdPlatformAdapter } from '../interfaces/ad-adapter.interface';
import axios from 'axios';

@Injectable()
export class TikTokAdsService implements AdPlatformAdapter {
  platform = 'TIKTOK';
  private readonly appId = process.env.TIKTOK_APP_ID;
  private readonly clientSecret = process.env.TIKTOK_SECRET;
  private readonly redirectUri = process.env.TIKTOK_REDIRECT_URI;

  getAuthUrl(state: string): string {
    return `https://ads.tiktok.com/marketing_api/auth?app_id=${this.appId}&state=${state}&redirect_uri=${this.redirectUri}&scope=ad_management`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
        app_id: this.appId,
        secret: this.clientSecret,
        auth_code: code,
      });
      if (response.data?.code !== 0) {
        throw new Error(response.data?.message);
      }
      return response.data.data;
    } catch (error) {
       throw new BadRequestException('Failed to exchange code for token: ' + error.message);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // TikTok refresh flow not explicitly checked, assuming standard or implementation needed
    // TODO: Verify TikTok Refresh Token Endpoint
    return {}; 
  }

  private readonly tiktokApiUrl = 'https://business-api.tiktok.com/open_api/v1.3';

  async getCampaigns(accountId: string, accessToken: string): Promise<any[]> {
    return this.runTikTokQuery(`${this.tiktokApiUrl}/campaign/get/`, accessToken, {
      advertiser_id: accountId
    });
  }

  async getAdGroups(accountId: string, campaignId: string, accessToken: string): Promise<any[]> {
    return this.runTikTokQuery(`${this.tiktokApiUrl}/adgroup/get/`, accessToken, {
       advertiser_id: accountId,
       filtering: JSON.stringify({ campaign_ids: [campaignId] })
    });
  }

  async getAds(accountId: string, adGroupId: string, accessToken: string): Promise<any[]> {
    return this.runTikTokQuery(`${this.tiktokApiUrl}/ad/get/`, accessToken, {
      advertiser_id: accountId,
      filtering: JSON.stringify({ adgroup_ids: [adGroupId] })
    });
  }

  async getMetrics(accountId: string, dateRange: { start: string; end: string }, accessToken: string): Promise<any[]> {
    return this.runTikTokQuery(`${this.tiktokApiUrl}/report/integrated/get/`, accessToken, {
      advertiser_id: accountId,
      report_type: 'BASIC',
      data_level: 'AUCTION_AD',
      dimensions: JSON.stringify(['ad_id', 'stat_time_day']),
      metrics: JSON.stringify(['impressions', 'clicks', 'spend', 'conversion', 'cost_per_conversion', 'ctr']),
      start_date: dateRange.start,
      end_date: dateRange.end,
      page_size: 1000
    }, true);
  }

  async updateAdStatus(accountId: string, adId: string, status: 'ACTIVE' | 'PAUSED', accessToken: string): Promise<boolean> {
     // TODO: Implement TikTok Ads update
     console.log(`[TikTokAds] Updating Ad ${adId} status to ${status}`);
     return true;
  }

  private async runTikTokQuery(url: string, accessToken: string, params: any, isReport = false): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          'Access-Token': accessToken,
        },
        params: params
      });
      
      if (response.data?.code !== 0) {
        console.error('TikTok API Error Code:', response.data?.code, response.data?.message);
        return [];
      }

      const dataStr = response.data?.data;
      // TikTok structure varies. Basic get returns { list: [] }, Report returns { list: [] } inside data.
      return dataStr?.list || [];
    } catch (error) {
       console.error('TikTok API Error:', error.response?.data || error.message);
       return [];
    }
  }
}
