import { Injectable, Logger } from '@nestjs/common';

export type UTMPlatform = 'google' | 'meta' | 'tiktok' | 'naver' | 'kakao' | 'generic';

export interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  experimentId?: string;
  variationId?: string;
  segmentId?: string;
}

export interface GeneratedUTM {
  platform: UTMPlatform;
  params: Record<string, string>;
  fullUrl: string;
  trackingUrl: string;
}

@Injectable()
export class UTMGeneratorService {
  private readonly logger = new Logger(UTMGeneratorService.name);

  /**
   * Generate UTM parameters with experiment ID
   */
  generateUTM(baseUrl: string, params: UTMParams, platform: UTMPlatform = 'generic'): GeneratedUTM {
    const utmParams = this.buildUTMParams(params, platform);
    const queryString = this.buildQueryString(utmParams);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const fullUrl = `${baseUrl}${separator}${queryString}`;

    return {
      platform,
      params: utmParams,
      fullUrl,
      trackingUrl: this.generateTrackingUrl(platform, utmParams),
    };
  }

  /**
   * Build UTM parameters with platform-specific format
   */
  private buildUTMParams(params: UTMParams, platform: UTMPlatform): Record<string, string> {
    const base: Record<string, string> = {
      utm_source: params.source,
      utm_medium: params.medium,
      utm_campaign: params.campaign,
    };

    if (params.content) {
      base.utm_content = params.content;
    }

    if (params.term) {
      base.utm_term = params.term;
    }

    // Add experiment tracking
    if (params.experimentId) {
      base.exp_id = params.experimentId;
      if (params.variationId) {
        base.var_id = params.variationId;
      }
    }

    // Add segment tracking
    if (params.segmentId) {
      base.seg_id = params.segmentId;
    }

    // Platform-specific additions
    return this.addPlatformSpecificParams(base, platform);
  }

  /**
   * Add platform-specific tracking parameters
   */
  private addPlatformSpecificParams(params: Record<string, string>, platform: UTMPlatform): Record<string, string> {
    switch (platform) {
      case 'google':
        // Google Ads uses manual tagging or auto-tagging with gclid
        return {
          ...params,
          // Placeholder for dynamic values that Google will replace
          gclid: '{gclid}',
        };

      case 'meta':
        // Meta (Facebook/Instagram) specific
        return {
          ...params,
          // Facebook pixel ID integration
          fbclid: '{{ad.id}}',
        };

      case 'tiktok':
        return {
          ...params,
          ttclid: '__CLICKID__',
        };

      case 'naver':
        return {
          ...params,
          n_media: params.utm_source,
          n_query: params.utm_term || '',
          n_ad: params.utm_campaign,
        };

      case 'kakao':
        return {
          ...params,
          kakao_content: params.utm_content || '',
        };

      default:
        return params;
    }
  }

  /**
   * Generate tracking URL template for the platform
   */
  private generateTrackingUrl(platform: UTMPlatform, params: Record<string, string>): string {
    const trackingTemplates: Record<UTMPlatform, string> = {
      google: `?utm_source=${params.utm_source}&utm_medium=${params.utm_medium}&utm_campaign=${params.utm_campaign}&gclid={gclid}`,
      meta: `?utm_source=${params.utm_source}&utm_medium=${params.utm_medium}&utm_campaign=${params.utm_campaign}&fbclid={{ad.id}}`,
      tiktok: `?utm_source=${params.utm_source}&utm_medium=${params.utm_medium}&utm_campaign=${params.utm_campaign}&ttclid=__CLICKID__`,
      naver: `?n_media=${params.utm_source}&n_ad=${params.utm_campaign}&utm_source=${params.utm_source}&utm_medium=${params.utm_medium}`,
      kakao: `?utm_source=${params.utm_source}&utm_medium=${params.utm_medium}&utm_campaign=${params.utm_campaign}`,
      generic: this.buildQueryString(params),
    };

    return trackingTemplates[platform];
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, string>): string {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Bulk generate UTMs for multiple campaigns
   */
  bulkGenerate(
    baseUrl: string,
    campaigns: Array<{ name: string; platform: UTMPlatform; experimentId?: string; segmentId?: string }>,
  ): GeneratedUTM[] {
    return campaigns.map(campaign => {
      return this.generateUTM(baseUrl, {
        source: campaign.platform,
        medium: 'cpc',
        campaign: campaign.name,
        experimentId: campaign.experimentId,
        segmentId: campaign.segmentId,
      }, campaign.platform);
    });
  }

  /**
   * Parse UTM parameters from URL
   */
  parseUTM(url: string): Partial<UTMParams> {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      return {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        content: params.get('utm_content') || undefined,
        term: params.get('utm_term') || undefined,
        experimentId: params.get('exp_id') || undefined,
        variationId: params.get('var_id') || undefined,
        segmentId: params.get('seg_id') || undefined,
      };
    } catch (error) {
      this.logger.error(`Error parsing URL: ${error}`);
      return {};
    }
  }

  /**
   * Map internal segment to external campaign
   */
  mapSegmentToCampaign(segmentId: string, segmentName: string, platform: UTMPlatform): UTMParams {
    // Convert internal segment naming to platform-appropriate campaign names
    const campaignName = this.formatCampaignName(segmentName, platform);

    return {
      source: platform,
      medium: 'cpc',
      campaign: campaignName,
      segmentId,
    };
  }

  /**
   * Format campaign name according to platform conventions
   */
  private formatCampaignName(name: string, platform: UTMPlatform): string {
    // Clean the name
    let formatted = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100); // Max length

    // Platform-specific prefixes
    const prefixes: Record<UTMPlatform, string> = {
      google: 'gads_',
      meta: 'meta_',
      tiktok: 'tt_',
      naver: 'naver_',
      kakao: 'kakao_',
      generic: '',
    };

    return `${prefixes[platform]}${formatted}`;
  }

  /**
   * Get UTM templates for a platform
   */
  getTemplates(platform: UTMPlatform): Record<string, GeneratedUTM> {
    const templates = {
      awareness: this.generateUTM('{{baseUrl}}', {
        source: platform,
        medium: 'display',
        campaign: '{{campaign_name}}_awareness',
      }, platform),
      conversion: this.generateUTM('{{baseUrl}}', {
        source: platform,
        medium: 'cpc',
        campaign: '{{campaign_name}}_conversion',
      }, platform),
      retargeting: this.generateUTM('{{baseUrl}}', {
        source: platform,
        medium: 'remarketing',
        campaign: '{{campaign_name}}_retargeting',
      }, platform),
      experiment: this.generateUTM('{{baseUrl}}', {
        source: platform,
        medium: 'cpc',
        campaign: '{{campaign_name}}_experiment',
        experimentId: '{{exp_id}}',
        variationId: '{{var_id}}',
      }, platform),
    };

    return templates;
  }

  /**
   * Validate UTM parameters
   */
  validateUTM(params: Partial<UTMParams>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.source) {
      errors.push('utm_source is required');
    }

    if (!params.medium) {
      errors.push('utm_medium is required');
    }

    if (!params.campaign) {
      errors.push('utm_campaign is required');
    }

    // Check for invalid characters
    const invalidChars = /[<>'"&]/;
    if (params.campaign && invalidChars.test(params.campaign)) {
      errors.push('utm_campaign contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
