import { Injectable, BadRequestException } from '@nestjs/common';
import { AdPlatformAdapter } from '../interfaces/ad-adapter.interface';
import axios from 'axios';

@Injectable()
export class MetaAdsService implements AdPlatformAdapter {
  platform = 'META';
  private readonly clientId = process.env.META_APP_ID;
  private readonly clientSecret = process.env.META_APP_SECRET;
  private readonly redirectUri = process.env.META_REDIRECT_URI;

  getAuthUrl(state: string): string {
    const scope = 'ads_management,ads_read,read_insights';
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}&scope=${scope}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          client_secret: this.clientSecret,
          code: code,
        },
      });
      return response.data;
    } catch (error) {
       throw new BadRequestException('Failed to exchange code for token: ' + error.response?.data?.error?.message || error.message);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // Meta long-lived tokens don't use refresh tokens in the same way, but we can exchange an existing token for a long-lived one.
    // However, if we assume standard pattern, we might need a different specific call or just re-exchange the access token.
    // For now, implementing standard exchange for long-lived token pattern if applicable.
    // Actually Meta uses "exchange token" flow to get a long-lived token from a short-lived one.
    throw new BadRequestException('Meta Long-Lived tokens should be handled via token exchange, not standard refresh flow');
  }

  private readonly metaGraphUrl = 'https://graph.facebook.com/v19.0';

  async getCampaigns(accountId: string, accessToken: string): Promise<any[]> {
    return this.runMetaQuery(`${this.metaGraphUrl}/act_${accountId}/campaigns`, accessToken, {
      fields: 'id,name,status,start_time,stop_time,daily_budget,lifetime_budget'
    });
  }

  async getAdGroups(accountId: string, campaignId: string, accessToken: string): Promise<any[]> {
    // Meta calls AdGroups "AdSets"
    return this.runMetaQuery(`${this.metaGraphUrl}/${campaignId}/adsets`, accessToken, {
      fields: 'id,name,status'
    });
  }

  async getAds(accountId: string, adGroupId: string, accessToken: string): Promise<any[]> {
    return this.runMetaQuery(`${this.metaGraphUrl}/${adGroupId}/ads`, accessToken, {
      fields: 'id,name,status,creative{thumbnail_url,body}'
    });
  }

  async getMetrics(accountId: string, dateRange: { start: string; end: string }, accessToken: string): Promise<any[]> {
    // Insights API
    return this.runMetaQuery(`${this.metaGraphUrl}/act_${accountId}/insights`, accessToken, {
      time_range: JSON.stringify({ since: dateRange.start, until: dateRange.end }),
      fields: 'campaign_id,adset_id,ad_id,date_start,impressions,clicks,spend,actions',
      level: 'ad'
    });
  }

  async updateAdStatus(accountId: string, adId: string, status: 'ACTIVE' | 'PAUSED', accessToken: string): Promise<boolean> {
     // TODO: Implement Meta Ads update
     console.log(`[MetaAds] Updating Ad ${adId} status to ${status}`);
     return true;
  }

  private async runMetaQuery(url: string, accessToken: string, params: any): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          ...params
        }
      });
      return response.data.data || [];
    } catch (error) {
       console.error('Meta Ads API Error:', error.response?.data || error.message);
       return [];
    }
  }

  // ====================================================
  // Phase 3: CAPI (Conversions API) Enhancement
  // ====================================================

  private readonly pixelId = process.env.META_PIXEL_ID;

  /**
   * Send server-side conversion event via CAPI
   */
  async sendConversionEvent(
    pixelId: string,
    event: {
      eventName: string;
      eventTime: number;
      userData: {
        em?: string;   // email (hashed)
        ph?: string;   // phone (hashed)
        fn?: string;   // first name (hashed)
        ln?: string;   // last name (hashed)
        client_ip_address?: string;
        client_user_agent?: string;
        fbp?: string;  // Facebook Browser ID
        fbc?: string;  // Facebook Click ID
        external_id?: string;
      };
      customData?: {
        value?: number;
        currency?: string;
        content_ids?: string[];
        content_type?: string;
        num_items?: number;
      };
      eventSourceUrl?: string;
      actionSource: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
      eventId?: string; // For deduplication
    },
    accessToken: string,
  ): Promise<{ success: boolean; eventsReceived: number; fbtrace_id: string }> {
    try {
      const response = await axios.post(
        `${this.metaGraphUrl}/${pixelId}/events`,
        {
          data: [event],
          access_token: accessToken,
        }
      );

      return {
        success: true,
        eventsReceived: response.data.events_received,
        fbtrace_id: response.data.fbtrace_id,
      };
    } catch (error) {
      console.error('CAPI Error:', error.response?.data || error.message);
      return { success: false, eventsReceived: 0, fbtrace_id: '' };
    }
  }

  /**
   * Send batch of conversion events
   */
  async sendBatchConversionEvents(
    pixelId: string,
    events: any[],
    accessToken: string,
  ): Promise<{ success: boolean; eventsReceived: number }> {
    try {
      // Apply deduplication using event_id
      const deduplicatedEvents = this.deduplicateEvents(events);

      const response = await axios.post(
        `${this.metaGraphUrl}/${pixelId}/events`,
        {
          data: deduplicatedEvents,
          access_token: accessToken,
        }
      );

      return {
        success: true,
        eventsReceived: response.data.events_received,
      };
    } catch (error) {
      console.error('CAPI Batch Error:', error.response?.data || error.message);
      return { success: false, eventsReceived: 0 };
    }
  }

  /**
   * Deduplicate events based on event_id
   */
  private deduplicateEvents(events: any[]): any[] {
    const seen = new Set<string>();
    return events.filter(event => {
      if (!event.eventId) {
        // Generate event_id if not provided
        event.eventId = `${event.eventName}_${event.eventTime}_${event.userData?.external_id || 'anon'}`;
      }
      if (seen.has(event.eventId)) {
        return false;
      }
      seen.add(event.eventId);
      return true;
    });
  }

  /**
   * Get CAPI quality score (Event Match Quality)
   */
  async getCAPIQualityScore(
    pixelId: string,
    accessToken: string,
  ): Promise<{
    eventMatchQuality: number;
    parametersQuality: {
      em: number;
      ph: number;
      fn: number;
      ln: number;
      fbp: number;
      fbc: number;
    };
    recommendations: string[];
  }> {
    try {
      const response = await axios.get(
        `${this.metaGraphUrl}/${pixelId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'server_events_diagnostics,server_events_conversion_coverage',
          }
        }
      );

      const diagnostics = response.data.server_events_diagnostics || {};
      const coverage = response.data.server_events_conversion_coverage || {};

      // Calculate quality score (0-10 scale)
      const qualityScore = this.calculateCAPIQualityScore(diagnostics, coverage);

      return qualityScore;
    } catch (error) {
      console.error('CAPI Quality Score Error:', error.response?.data || error.message);
      return {
        eventMatchQuality: 0,
        parametersQuality: { em: 0, ph: 0, fn: 0, ln: 0, fbp: 0, fbc: 0 },
        recommendations: ['Unable to fetch CAPI quality data'],
      };
    }
  }

  private calculateCAPIQualityScore(
    diagnostics: any,
    coverage: any,
  ): {
    eventMatchQuality: number;
    parametersQuality: { em: number; ph: number; fn: number; ln: number; fbp: number; fbc: number };
    recommendations: string[];
  } {
    // Placeholder scores - in production, this would parse actual diagnostics
    const recommendations: string[] = [];

    // Check parameter quality
    const paramStats = {
      em: diagnostics.em_coverage || 0,
      ph: diagnostics.ph_coverage || 0,
      fn: diagnostics.fn_coverage || 0,
      ln: diagnostics.ln_coverage || 0,
      fbp: diagnostics.fbp_coverage || 0,
      fbc: diagnostics.fbc_coverage || 0,
    };

    // Generate recommendations
    if (paramStats.em < 50) recommendations.push('이메일 해시 추가를 권장합니다');
    if (paramStats.fbp < 30) recommendations.push('Facebook Browser ID (fbp) 전달률을 높여주세요');
    if (paramStats.fbc < 20) recommendations.push('Facebook Click ID (fbc) 전달률을 높여주세요');

    // Calculate overall Event Match Quality
    const eventMatchQuality = Math.round(
      (paramStats.em * 0.3 + paramStats.ph * 0.2 + paramStats.fbp * 0.25 + paramStats.fbc * 0.25) / 10
    );

    return {
      eventMatchQuality,
      parametersQuality: paramStats,
      recommendations,
    };
  }

  /**
   * Upload offline conversion data
   */
  async uploadOfflineConversions(
    adAccountId: string,
    offlineEventSetId: string,
    conversions: Array<{
      matchKeys: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
      };
      eventTime: number;
      eventName: string;
      value: number;
      currency: string;
    }>,
    accessToken: string,
  ): Promise<{ success: boolean; uploaded: number }> {
    try {
      // Convert to Meta offline conversion format
      const formattedData = conversions.map(conv => ({
        match_keys: {
          em: conv.matchKeys.email ? this.hashValue(conv.matchKeys.email) : undefined,
          ph: conv.matchKeys.phone ? this.hashValue(conv.matchKeys.phone) : undefined,
          fn: conv.matchKeys.firstName ? this.hashValue(conv.matchKeys.firstName) : undefined,
          ln: conv.matchKeys.lastName ? this.hashValue(conv.matchKeys.lastName) : undefined,
        },
        event_time: conv.eventTime,
        event_name: conv.eventName,
        value: conv.value,
        currency: conv.currency,
      }));

      const response = await axios.post(
        `${this.metaGraphUrl}/${offlineEventSetId}/events`,
        {
          upload_tag: `offline_upload_${Date.now()}`,
          data: formattedData,
          access_token: accessToken,
        }
      );

      return {
        success: true,
        uploaded: response.data.num_processed_entries || conversions.length,
      };
    } catch (error) {
      console.error('Offline Conversion Error:', error.response?.data || error.message);
      return { success: false, uploaded: 0 };
    }
  }

  /**
   * Hash value for privacy (SHA256)
   */
  private hashValue(value: string): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  /**
   * Create offline event set for store conversions
   */
  async createOfflineEventSet(
    adAccountId: string,
    name: string,
    description: string,
    accessToken: string,
  ): Promise<{ id: string | null }> {
    try {
      const response = await axios.post(
        `${this.metaGraphUrl}/act_${adAccountId}/offline_conversion_data_sets`,
        {
          name,
          description,
          access_token: accessToken,
        }
      );

      return { id: response.data.id };
    } catch (error) {
      console.error('Create Offline Event Set Error:', error.response?.data || error.message);
      return { id: null };
    }
  }
}
