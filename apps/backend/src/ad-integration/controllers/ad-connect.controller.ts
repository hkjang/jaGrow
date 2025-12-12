import { Controller, Get, Query, Res, BadRequestException, Delete, Param } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsService } from '../services/google-ads.service';
import { MetaAdsService } from '../services/meta-ads.service';
import { TikTokAdsService } from '../services/tiktok-ads.service';

@Controller('ad-connect')
export class AdConnectController {
  constructor(
    private readonly googleService: GoogleAdsService,
    private readonly metaService: MetaAdsService,
    private readonly tiktokService: TikTokAdsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('google/auth-url')
  getGoogleAuthUrl(@Query('state') state: string) {
    if (!state) throw new BadRequestException('State is required');
    return { url: this.googleService.getAuthUrl(state) };
  }

  @Get('meta/auth-url')
  getMetaAuthUrl(@Query('state') state: string) {
    if (!state) throw new BadRequestException('State is required');
    return { url: this.metaService.getAuthUrl(state) };
  }

  @Get('tiktok/auth-url')
  getTikTokAuthUrl(@Query('state') state: string) {
    if (!state) throw new BadRequestException('State is required');
    return { url: this.tiktokService.getAuthUrl(state) };
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    const tokens = await this.googleService.exchangeCodeForToken(code);
    await this.saveAdAccount('GOOGLE', state, tokens);
    return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?status=success&platform=google`);
  }

  @Get('meta/callback')
  async metaCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    const tokens = await this.metaService.exchangeCodeForToken(code);
    await this.saveAdAccount('META', state, tokens);
    return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?status=success&platform=meta`);
  }

  @Get('tiktok/callback')
  async tiktokCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    const tokens = await this.tiktokService.exchangeCodeForToken(code); 
    await this.saveAdAccount('TIKTOK', state, tokens);
    return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?status=success&platform=tiktok`);
  }

  @Get('accounts')
  async getAccounts(@Query('organizationId') organizationId: string) {
    if (!organizationId) throw new BadRequestException('Organization ID is required'); // Or get from Req user
    return this.prisma.adAccount.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, platform: true, name: true, createdAt: true }
    });
  }

  @Delete('accounts/:id')
  async disconnectAccount(@Param('id') id: string) {
    // Soft delete or hard delete? 'isActive: false' is better.
    return this.prisma.adAccount.update({
      where: { id },
      data: { isActive: false }
    });
  }
  
  private async saveAdAccount(platform: 'GOOGLE' | 'META' | 'TIKTOK', organizationId: string, tokens: any) {
    const externalAccountId = 'PENDING_' + Date.now();
    
    await this.prisma.adAccount.upsert({
       where: {
         platform_accountId: {
            platform,
            accountId: externalAccountId 
         }
       },
       update: {
         accessToken: tokens.access_token,
         refreshToken: tokens.refresh_token,
         tokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
         isActive: true
       },
       create: {
         platform,
         accountId: externalAccountId, 
         name: `${platform} Account`,
         accessToken: tokens.access_token,
         refreshToken: tokens.refresh_token,
         tokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
         organizationId: organizationId,
       }
    });
  }
}
