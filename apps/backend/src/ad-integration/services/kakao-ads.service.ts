import { Injectable, Logger } from '@nestjs/common';
import { AdPlatformAdapter } from '../interfaces/ad-adapter.interface';
import axios from 'axios';

@Injectable()
export class KakaoAdsService implements AdPlatformAdapter {
  private readonly logger = new Logger(KakaoAdsService.name);
  platform = 'KAKAO';
  
  private readonly clientId = process.env.KAKAO_ADS_CLIENT_ID;
  private readonly clientSecret = process.env.KAKAO_ADS_CLIENT_SECRET;
  private readonly baseUrl = 'https://moment.kakao.com/openapi';

  /**
   * Get authorization headers
   */
  private getHeaders(accessToken: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'adAccountId': process.env.KAKAO_ADS_ACCOUNT_ID || '',
    };
  }

  getAuthUrl(state: string): string {
    return `https://kauth.kakao.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${process.env.KAKAO_ADS_REDIRECT_URI}&response_type=code&state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId || '',
          client_secret: this.clientSecret || '',
          redirect_uri: process.env.KAKAO_ADS_REDIRECT_URI || '',
          code,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
        'https://kauth.kakao.com/oauth/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId || '',
          client_secret: this.clientSecret || '',
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
        `${this.baseUrl}/v4/campaigns`,
        { headers: { ...this.getHeaders(accessToken), adAccountId: accountId } }
      );
      return response.data?.content || [];
    } catch (error: any) {
      this.logger.error('Get campaigns failed', error.response?.data);
      return [];
    }
  }

  async getAdGroups(accountId: string, campaignId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v4/adGroups`,
        {
          headers: { ...this.getHeaders(accessToken), adAccountId: accountId },
          params: { campaignId },
        }
      );
      return response.data?.content || [];
    } catch (error: any) {
      this.logger.error('Get ad groups failed', error.response?.data);
      return [];
    }
  }

  async getAds(accountId: string, adGroupId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v4/creatives`,
        {
          headers: { ...this.getHeaders(accessToken), adAccountId: accountId },
          params: { adGroupId },
        }
      );
      return response.data?.content || [];
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
        `${this.baseUrl}/v4/reports/daily`,
        {
          headers: { ...this.getHeaders(accessToken), adAccountId: accountId },
          params: {
            start: dateRange.start,
            end: dateRange.end,
            metricsGroup: 'BASIC,CONVERSION',
            dimension: 'CREATIVE',
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
      const kakaoStatus = status === 'ACTIVE' ? 'ON' : 'OFF';
      await axios.put(
        `${this.baseUrl}/v4/creatives/${adId}/onOff`,
        { onOff: kakaoStatus },
        { headers: { ...this.getHeaders(accessToken), adAccountId: accountId } }
      );
      return true;
    } catch (error: any) {
      this.logger.error('Update ad status failed', error.response?.data);
      return false;
    }
  }

  // ====================================================
  // Kakao-specific features
  // ====================================================

  /**
   * Get audience targeting options
   */
  async getAudienceTargets(accountId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v4/targets/demographics`,
        { headers: { ...this.getHeaders(accessToken), adAccountId: accountId } }
      );
      return response.data?.content || [];
    } catch (error: any) {
      this.logger.error('Get audience targets failed', error.response?.data);
      return [];
    }
  }

  /**
   * Create Kakao Message Ad
   */
  async createMessageAd(
    accountId: string,
    adGroupId: string,
    creative: {
      name: string;
      messageType: 'WIDE_MESSAGE' | 'WIDE_LIST' | 'CAROUSEL';
      landingUrl: string;
      title: string;
      description: string;
      imageUrl?: string;
    },
    accessToken: string,
  ): Promise<{ id: string | null }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v4/creatives`,
        {
          adGroupId,
          name: creative.name,
          creativeType: 'MESSAGE',
          messageType: creative.messageType,
          landingUrl: creative.landingUrl,
          messageContent: {
            title: creative.title,
            description: creative.description,
            imageUrl: creative.imageUrl,
          },
        },
        { headers: { ...this.getHeaders(accessToken), adAccountId: accountId } }
      );
      return { id: response.data?.id || null };
    } catch (error: any) {
      this.logger.error('Create message ad failed', error.response?.data);
      return { id: null };
    }
  }

  /**
   * Get conversion tracking data
   */
  async getConversionData(
    accountId: string,
    dateRange: { start: string; end: string },
    accessToken: string,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v4/reports/conversion`,
        {
          headers: { ...this.getHeaders(accessToken), adAccountId: accountId },
          params: {
            start: dateRange.start,
            end: dateRange.end,
          },
        }
      );
      return response.data?.data || [];
    } catch (error: any) {
      this.logger.error('Get conversion data failed', error.response?.data);
      return [];
    }
  }

  /**
   * Get pixel/SDK events
   */
  async getPixelEvents(
    pixelId: string,
    accessToken: string,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v4/pixels/${pixelId}/events`,
        { headers: this.getHeaders(accessToken) }
      );
      return response.data?.content || [];
    } catch (error: any) {
      this.logger.error('Get pixel events failed', error.response?.data);
      return [];
    }
  }
}
