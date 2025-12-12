
export interface AdPlatformAdapter {
  platform: string;
  
  // Authentication
  getAuthUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<any>;
  refreshToken(refreshToken: string): Promise<any>;
  
  // Data Fetching
  getCampaigns(accountId: string, accessToken: string): Promise<any[]>;
  getAdGroups(accountId: string, campaignId: string, accessToken: string): Promise<any[]>;
  getAds(accountId: string, adGroupId: string, accessToken: string): Promise<any[]>;
  getMetrics(accountId: string, dateRange: { start: string; end: string }, accessToken: string): Promise<any[]>;
  
  // Automation
  updateAdStatus?(accountId: string, adId: string, status: 'ACTIVE' | 'PAUSED', accessToken: string): Promise<boolean>;
}
