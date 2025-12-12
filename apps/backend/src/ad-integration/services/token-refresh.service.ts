import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsService } from './google-ads.service';
import { MetaAdsService } from './meta-ads.service';
import { TikTokAdsService } from './tiktok-ads.service';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleService: GoogleAdsService,
    private readonly metaService: MetaAdsService,
    private readonly tiktokService: TikTokAdsService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshExpiringTokens() {
    this.logger.log('Checking for tokens that need refreshing...');
    
    // Find accounts where token expires within the next hour
    const expiryThreshold = new Date(Date.now() + 60 * 60 * 1000);

    const expiringAccounts = await this.prisma.adAccount.findMany({
      where: {
        isActive: true,
        tokenExpiresAt: { lt: expiryThreshold },
        refreshToken: { not: null },
      },
    });

    this.logger.log(`Found ${expiringAccounts.length} accounts with expiring tokens.`);

    for (const account of expiringAccounts) {
      try {
        await this.refreshAccountToken(account);
      } catch (error: any) {
        this.logger.error(`Failed to refresh token for account ${account.id}: ${error.message}`);
        
        // Mark account as needing re-authentication if refresh fails
        await this.prisma.adAccount.update({
          where: { id: account.id },
          data: { isActive: false } // Deactivate until user re-authenticates
        });
      }
    }
  }

  private async refreshAccountToken(account: any) {
    let newTokens: any;
    
    switch (account.platform) {
      case 'GOOGLE':
        newTokens = await this.googleService.refreshToken(account.refreshToken);
        break;
      case 'META':
        newTokens = await this.metaService.refreshToken(account.refreshToken);
        break;
      case 'TIKTOK':
        newTokens = await this.tiktokService.refreshToken(account.refreshToken);
        break;
      default:
        this.logger.warn(`Unknown platform: ${account.platform}`);
        return;
    }

    // Update the account with new tokens
    await this.prisma.adAccount.update({
      where: { id: account.id },
      data: {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || account.refreshToken, // Some providers don't return new refresh token
        tokenExpiresAt: new Date(Date.now() + (newTokens.expires_in || 3600) * 1000),
      },
    });

    this.logger.log(`Successfully refreshed token for account ${account.id} (${account.platform})`);
  }
}
