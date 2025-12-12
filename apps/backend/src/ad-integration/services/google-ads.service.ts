import { Injectable, BadRequestException } from '@nestjs/common';
import { AdPlatformAdapter } from '../interfaces/ad-adapter.interface';
import axios from 'axios';

@Injectable()
export class GoogleAdsService implements AdPlatformAdapter {
  platform = 'GOOGLE';
  private readonly clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  private readonly clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  private readonly redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;

  getAuthUrl(state: string): string {
    const scope = [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/adsense.readonly'
    ].join(' ');
    
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      });
      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to exchange code for token: ' + error.response?.data?.error_description || error.message);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      });
      return response.data;
    } catch (error) {
       throw new BadRequestException('Failed to refresh token: ' + error.response?.data?.error_description || error.message);
    }
  }

  private readonly googleAdsUrl = 'https://googleads.googleapis.com/v16/customers';

  async getCampaigns(accountId: string, accessToken: string): Promise<any[]> {
    const query = `
      SELECT campaign.id, campaign.name, campaign.status, campaign.start_date, campaign.end_date, campaign_budget.amount_micros 
      FROM campaign`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  async getAdGroups(accountId: string, campaignId: string, accessToken: string): Promise<any[]> {
    const query = `
      SELECT ad_group.id, ad_group.name, ad_group.status 
      FROM ad_group 
      WHERE campaign.id = ${campaignId}`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  async getAds(accountId: string, adGroupId: string, accessToken: string): Promise<any[]> {
     const query = `
      SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status, ad_group_ad.ad.final_urls 
      FROM ad_group_ad 
      WHERE ad_group.id = ${adGroupId}`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  async getMetrics(accountId: string, dateRange: { start: string; end: string }, accessToken: string): Promise<any[]> {
     const query = `
      SELECT 
        campaign.id, 
        ad_group.id, 
        ad_group_ad.ad.id,
        segments.date, 
        metrics.impressions, 
        metrics.clicks, 
        metrics.cost_micros, 
        metrics.conversions, 
        metrics.conversions_value 
      FROM ad_group_ad 
      WHERE segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  async updateAdStatus(accountId: string, adId: string, status: 'ACTIVE' | 'PAUSED', accessToken: string): Promise<boolean> {
     // TODO: Implement Google Ads mutate operation
     console.log(`[GoogleAds] Updating Ad ${adId} status to ${status}`);
     return true;
  }
  
  private async runGoogleAdsQuery(accountId: string, accessToken: string, query: string): Promise<any[]> {
     try {
       // Note: In real Google Ads API, customerId is required in URL. 
       // We assume accountId IS the customerId for this implementation.
       // The endpoint is /customers/{customerId}/googleAds:search
       
       const response = await axios.post(
         `${this.googleAdsUrl}/${accountId}/googleAds:search`,
         { query },
         {
           headers: {
             'Authorization': `Bearer ${accessToken}`,
             'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN, // Needed for Google Ads
             'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID // Often needed if acting on behalf of client
           }
         }
       );
       
       // Google Ads returns rows
       return response.data.results || [];
     } catch (error) {
        console.error('Google Ads API Error:', error.response?.data || error.message);
        // Fallback or rethrow. Returning empty to avoid crash for now.
        return [];
     }
  }

  // ====================================================
  // Phase 3: Keyword Optimization
  // ====================================================

  /**
   * Get keywords for an ad group
   */
  async getKeywords(accountId: string, adGroupId: string, accessToken: string): Promise<any[]> {
    const query = `
      SELECT 
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.criterion_id,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM keyword_view
      WHERE ad_group.id = ${adGroupId}`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  /**
   * Generate keyword suggestions based on seed keywords
   */
  async generateKeywordIdeas(
    accountId: string,
    seedKeywords: string[],
    language: string = 'ko',
    accessToken: string,
  ): Promise<any[]> {
    try {
      // Using Google Ads Keyword Planner API
      const response = await axios.post(
        `${this.googleAdsUrl}/${accountId}:generateKeywordIdeas`,
        {
          keywordSeed: {
            keywords: seedKeywords,
          },
          language,
          geoTargetConstants: ['geoTargetConstants/2410'], // South Korea
          keywordPlanNetwork: 'GOOGLE_SEARCH',
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          },
        }
      );

      return (response.data.results || []).map((result: any) => ({
        keyword: result.text,
        avgMonthlySearches: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
        competition: result.keywordIdeaMetrics?.competition || 'UNKNOWN',
        lowTopOfPageBid: result.keywordIdeaMetrics?.lowTopOfPageBidMicros || 0,
        highTopOfPageBid: result.keywordIdeaMetrics?.highTopOfPageBidMicros || 0,
      }));
    } catch (error) {
      console.error('Keyword Ideas API Error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Add keywords to ad group
   */
  async addKeywords(
    accountId: string,
    adGroupId: string,
    keywords: { text: string; matchType: 'EXACT' | 'PHRASE' | 'BROAD' }[],
    accessToken: string,
  ): Promise<boolean> {
    try {
      const operations = keywords.map(keyword => ({
        create: {
          adGroup: `customers/${accountId}/adGroups/${adGroupId}`,
          keyword: {
            text: keyword.text,
            matchType: keyword.matchType,
          },
          status: 'ENABLED',
        },
      }));

      await axios.post(
        `${this.googleAdsUrl}/${accountId}/adGroupCriteria:mutate`,
        { operations },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          },
        }
      );

      console.log(`[GoogleAds] Added ${keywords.length} keywords to ad group ${adGroupId}`);
      return true;
    } catch (error) {
      console.error('Add Keywords Error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Add negative keywords to exclude
   */
  async addNegativeKeywords(
    accountId: string,
    campaignId: string,
    keywords: string[],
    accessToken: string,
  ): Promise<boolean> {
    try {
      const operations = keywords.map(keyword => ({
        create: {
          campaign: `customers/${accountId}/campaigns/${campaignId}`,
          keyword: {
            text: keyword,
            matchType: 'EXACT',
          },
          negative: true,
        },
      }));

      await axios.post(
        `${this.googleAdsUrl}/${accountId}/campaignCriteria:mutate`,
        { operations },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          },
        }
      );

      console.log(`[GoogleAds] Added ${keywords.length} negative keywords to campaign ${campaignId}`);
      return true;
    } catch (error) {
      console.error('Add Negative Keywords Error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get inefficient keywords (high spend, low conversions)
   */
  async getInefficientKeywords(
    accountId: string,
    accessToken: string,
    minSpend: number = 10,
    maxConversions: number = 0,
  ): Promise<any[]> {
    const query = `
      SELECT 
        ad_group_criterion.keyword.text,
        ad_group_criterion.criterion_id,
        ad_group.id,
        campaign.id,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        ad_group_criterion.quality_info.quality_score
      FROM keyword_view
      WHERE metrics.cost_micros > ${minSpend * 1000000}
        AND metrics.conversions <= ${maxConversions}
        AND segments.date DURING LAST_30_DAYS`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  /**
   * Auto-exclude inefficient keywords
   */
  async autoExcludeInefficientKeywords(
    accountId: string,
    accessToken: string,
    minSpend: number = 50,
  ): Promise<{ excluded: number; keywords: string[] }> {
    const inefficientKeywords = await this.getInefficientKeywords(
      accountId,
      accessToken,
      minSpend,
      0,
    );

    const keywordTexts = inefficientKeywords.map(
      (k: any) => k.adGroupCriterion?.keyword?.text
    ).filter(Boolean);

    if (keywordTexts.length === 0) {
      return { excluded: 0, keywords: [] };
    }

    // Group by campaign for negative keyword addition
    const campaignKeywords = new Map<string, string[]>();
    for (const keyword of inefficientKeywords) {
      const campaignId = keyword.campaign?.id;
      const text = keyword.adGroupCriterion?.keyword?.text;
      if (campaignId && text) {
        const existing = campaignKeywords.get(campaignId) || [];
        existing.push(text);
        campaignKeywords.set(campaignId, existing);
      }
    }

    // Add as negative keywords to each campaign
    for (const [campaignId, keywords] of campaignKeywords) {
      await this.addNegativeKeywords(accountId, campaignId, keywords, accessToken);
    }

    return { excluded: keywordTexts.length, keywords: keywordTexts };
  }

  /**
   * Get ad quality scores
   */
  async getQualityScores(accountId: string, accessToken: string): Promise<any[]> {
    const query = `
      SELECT 
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group.id,
        campaign.id,
        campaign.name,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.review_status,
        metrics.average_quality_score
      FROM ad_group_ad
      WHERE segments.date DURING LAST_7_DAYS`;
    
    return this.runGoogleAdsQuery(accountId, accessToken, query);
  }

  /**
   * Get keyword quality score summary
   */
  async getKeywordQualityScoreSummary(
    accountId: string,
    accessToken: string,
  ): Promise<{ total: number; avgScore: number; lowQualityCount: number }> {
    const keywords = await this.getKeywords(accountId, '', accessToken);
    
    const scoresData = keywords.filter(
      (k: any) => k.adGroupCriterion?.qualityInfo?.qualityScore != null
    );

    if (scoresData.length === 0) {
      return { total: 0, avgScore: 0, lowQualityCount: 0 };
    }

    const scores = scoresData.map(
      (k: any) => k.adGroupCriterion.qualityInfo.qualityScore
    );
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const lowQualityCount = scores.filter((s: number) => s < 5).length;

    return {
      total: scores.length,
      avgScore: Math.round(avgScore * 10) / 10,
      lowQualityCount,
    };
  }
}
