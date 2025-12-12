/**
 * Normalized Ad Metrics Interface
 * This provides a unified structure for metrics across all platforms.
 */
export interface NormalizedAdMetric {
  adExternalId: string;
  platform: 'GOOGLE' | 'META' | 'TIKTOK';
  date: Date;
  
  // Core Metrics
  impressions: number;
  clicks: number;
  spend: number;          // In default currency (e.g., USD)
  conversions: number;
  conversionValue: number;
  
  // Calculated Metrics
  ctr: number;            // Click-Through Rate = clicks / impressions
  cpc: number;            // Cost Per Click = spend / clicks
  cpm: number;            // Cost Per Mille = (spend / impressions) * 1000
  cpa: number;            // Cost Per Acquisition = spend / conversions
  roas: number;           // Return On Ad Spend = conversionValue / spend
}

/**
 * Normalizes raw metrics from different ad platforms into a unified format.
 */
export class MetricsNormalizer {
  
  static normalizeGoogleMetrics(rawData: any): NormalizedAdMetric {
    const impressions = Number(rawData.metrics?.impressions || 0);
    const clicks = Number(rawData.metrics?.clicks || 0);
    const spend = (Number(rawData.metrics?.cost_micros || 0)) / 1_000_000; // Google uses micros
    const conversions = Number(rawData.metrics?.conversions || 0);
    const conversionValue = Number(rawData.metrics?.conversions_value || 0);

    return {
      adExternalId: String(rawData.ad_group_ad?.ad?.id || ''),
      platform: 'GOOGLE',
      date: rawData.segments?.date ? new Date(rawData.segments.date) : new Date(),
      impressions,
      clicks,
      spend,
      conversions,
      conversionValue,
      ...this.calculateDerivedMetrics(impressions, clicks, spend, conversions, conversionValue),
    };
  }

  static normalizeMetaMetrics(rawData: any): NormalizedAdMetric {
    const impressions = Number(rawData.impressions || 0);
    const clicks = Number(rawData.clicks || 0);
    const spend = Number(rawData.spend || 0);
    
    // Meta actions are complex - extract purchase conversions
    const actions = rawData.actions || [];
    const purchaseAction = actions.find((a: any) => a.action_type === 'purchase');
    const conversions = purchaseAction ? Number(purchaseAction.value || 0) : 0;
    
    const actionValues = rawData.action_values || [];
    const purchaseValue = actionValues.find((a: any) => a.action_type === 'purchase');
    const conversionValue = purchaseValue ? Number(purchaseValue.value || 0) : 0;

    return {
      adExternalId: rawData.ad_id || '',
      platform: 'META',
      date: rawData.date_start ? new Date(rawData.date_start) : new Date(),
      impressions,
      clicks,
      spend,
      conversions,
      conversionValue,
      ...this.calculateDerivedMetrics(impressions, clicks, spend, conversions, conversionValue),
    };
  }

  static normalizeTikTokMetrics(rawData: any): NormalizedAdMetric {
    const metrics = rawData.metrics || {};
    const impressions = Number(metrics.impressions || 0);
    const clicks = Number(metrics.clicks || 0);
    const spend = Number(metrics.spend || 0);
    const conversions = Number(metrics.conversion || 0);
    const conversionValue = Number(metrics.conversion_value || spend * 3); // Estimate if not available

    return {
      adExternalId: rawData.dimensions?.ad_id || '',
      platform: 'TIKTOK',
      date: rawData.dimensions?.stat_time_day ? new Date(rawData.dimensions.stat_time_day) : new Date(),
      impressions,
      clicks,
      spend,
      conversions,
      conversionValue,
      ...this.calculateDerivedMetrics(impressions, clicks, spend, conversions, conversionValue),
    };
  }

  private static calculateDerivedMetrics(
    impressions: number,
    clicks: number,
    spend: number,
    conversions: number,
    conversionValue: number
  ): Pick<NormalizedAdMetric, 'ctr' | 'cpc' | 'cpm' | 'cpa' | 'roas'> {
    return {
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? conversionValue / spend : 0,
    };
  }
}
