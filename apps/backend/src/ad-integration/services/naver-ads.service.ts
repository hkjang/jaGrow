import { Injectable, Logger } from '@nestjs/common';
import { AdPlatformAdapter } from '../interfaces/ad-adapter.interface';
import axios from 'axios';

@Injectable()
export class NaverAdsService implements AdPlatformAdapter {
  private readonly logger = new Logger(NaverAdsService.name);
  platform = 'NAVER';
  
  private readonly clientId = process.env.NAVER_ADS_CLIENT_ID;
  private readonly clientSecret = process.env.NAVER_ADS_CLIENT_SECRET;
  private readonly customerId = process.env.NAVER_ADS_CUSTOMER_ID;
  private readonly baseUrl = 'https://api.naver.com';

  /**
   * Get authentication header for Naver Ads API
   */
  private getAuthHeaders(accessToken: string): Record<string, string> {
    const timestamp = Date.now().toString();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.clientSecret);
    const signature = hmac.update(`${timestamp}.${accessToken}`).digest('base64');

    return {
      'X-Timestamp': timestamp,
      'X-API-KEY': this.clientId || '',
      'X-CUSTOMER': this.customerId || '',
      'X-Signature': signature,
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  getAuthUrl(state: string): string {
    // Naver uses different OAuth flow - API key based
    return `https://manage.naver.com/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${process.env.NAVER_ADS_REDIRECT_URI}&state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: process.env.NAVER_ADS_REDIRECT_URI,
        }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Token exchange failed', error.response?.data);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Token refresh failed', error.response?.data);
      throw error;
    }
  }

  async getCampaigns(accountId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/ncc/campaigns`,
        { headers: this.getAuthHeaders(accessToken) }
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error('Get campaigns failed', error.response?.data);
      return [];
    }
  }

  async getAdGroups(accountId: string, campaignId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/ncc/adgroups`,
        {
          headers: this.getAuthHeaders(accessToken),
          params: { nccCampaignId: campaignId },
        }
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error('Get ad groups failed', error.response?.data);
      return [];
    }
  }

  async getAds(accountId: string, adGroupId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/ncc/ads`,
        {
          headers: this.getAuthHeaders(accessToken),
          params: { nccAdgroupId: adGroupId },
        }
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error('Get ads failed', error.response?.data);
      return [];
    }
  }

  async getMetrics(
    accountId: string,
    dateRange: { start: string; end: string },
    accessToken: string,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/stats`,
        {
          headers: this.getAuthHeaders(accessToken),
          params: {
            id: accountId,
            fields: 'impCnt,clkCnt,salesAmt,convCnt,convAmt',
            timeRange: JSON.stringify({
              since: dateRange.start,
              until: dateRange.end,
            }),
          },
        }
      );
      return response.data?.data || [];
    } catch (error: any) {
      this.logger.error('Get metrics failed', error.response?.data);
      return [];
    }
  }

  async updateAdStatus(
    accountId: string,
    adId: string,
    status: 'ACTIVE' | 'PAUSED',
    accessToken: string,
  ): Promise<boolean> {
    try {
      const naverStatus = status === 'ACTIVE' ? 'ELIGIBLE' : 'PAUSED';
      await axios.put(
        `${this.baseUrl}/ncc/ads/${adId}`,
        { status: naverStatus, userLock: status === 'PAUSED' },
        { headers: this.getAuthHeaders(accessToken) }
      );
      return true;
    } catch (error: any) {
      this.logger.error('Update ad status failed', error.response?.data);
      return false;
    }
  }

  // ====================================================
  // Naver-specific features
  // ====================================================

  /**
   * Get keywords for power link ads
   */
  async getKeywords(adGroupId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/ncc/keywords`,
        {
          headers: this.getAuthHeaders(accessToken),
          params: { nccAdgroupId: adGroupId },
        }
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error('Get keywords failed', error.response?.data);
      return [];
    }
  }

  /**
   * Add keywords to ad group
   */
  async addKeywords(
    adGroupId: string,
    keywords: Array<{ keyword: string; bidAmt: number }>,
    accessToken: string,
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.baseUrl}/ncc/keywords`,
        keywords.map(k => ({
          nccAdgroupId: adGroupId,
          keyword: k.keyword,
          bidAmt: k.bidAmt,
          useGroupBidAmt: false,
        })),
        { headers: this.getAuthHeaders(accessToken) }
      );
      return true;
    } catch (error: any) {
      this.logger.error('Add keywords failed', error.response?.data);
      return false;
    }
  }

  /**
   * Get keyword suggestions
   */
  async getKeywordSuggestions(
    seedKeyword: string,
    accessToken: string,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/keywordstool`,
        {
          headers: this.getAuthHeaders(accessToken),
          params: {
            hintKeywords: seedKeyword,
            showDetail: 1,
          },
        }
      );
      return response.data?.keywordList || [];
    } catch (error: any) {
      this.logger.error('Get keyword suggestions failed', error.response?.data);
      return [];
    }
  }

  /**
   * Get estimated performance for keywords
   */
  async getKeywordEstimate(
    keywords: string[],
    accessToken: string,
  ): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/estimate/performance/keyword`,
        { keywords },
        { headers: this.getAuthHeaders(accessToken) }
      );
      return response.data?.estimate || [];
    } catch (error: any) {
      this.logger.error('Get keyword estimate failed', error.response?.data);
      return [];
    }
  }
}
