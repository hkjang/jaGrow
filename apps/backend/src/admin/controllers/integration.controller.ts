import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { IntegrationStatusService } from '../services/integration-status.service';
import { IntegrationConnectDto, IntegrationPlatformDto } from '../dto/integration.dto';

@Controller('admin/integrations')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class IntegrationController {
  constructor(private integrationStatusService: IntegrationStatusService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async getIntegrations(@Query('tenantId') tenantId?: string) {
    return this.integrationStatusService.getAll(tenantId);
  }

  @Get('status')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async getAll(@Query('tenantId') tenantId?: string) {
    return this.integrationStatusService.getAll(tenantId);
  }

  @Get('status/:platform')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async getByPlatform(
    @Param('platform') platform: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const platformEnum = platform.toUpperCase() as IntegrationPlatformDto;
    return this.integrationStatusService.getByPlatform(platformEnum as any, tenantId);
  }

  @Post(':platform/connect')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async connect(
    @Param('platform') platform: string,
    @Body() dto: IntegrationConnectDto,
  ) {
    const platformEnum = platform.toUpperCase() as IntegrationPlatformDto;
    
    // TODO: Exchange OAuth code for tokens
    // This would call the respective platform's OAuth API
    const accountId = 'account_' + Date.now(); // Placeholder
    
    const status = await this.integrationStatusService.connect(
      dto.tenantId,
      platformEnum as any,
      {
        accountId,
        tokenStatus: 'valid',
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        permissionScope: ['read_ads', 'read_metrics'],
      },
    );

    return {
      status: 'connected',
      accountId: status.accountId,
      integrationId: status.id,
    };
  }

  @Post(':platform/refresh')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async refreshToken(
    @Param('platform') platform: string,
    @Query('tenantId') tenantId: string,
    @Query('accountId') accountId: string,
  ) {
    // TODO: Call platform API to refresh token
    // For now, just update the status
    const integrations = await this.integrationStatusService.getByPlatform(
      platform.toUpperCase() as any,
      tenantId,
    );

    const integration = integrations.find((i: { accountId: string }) => i.accountId === accountId);
    if (!integration) {
      return { status: 'not_found' };
    }

    await this.integrationStatusService.updateTokenStatus(
      integration.id,
      'valid',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    return {
      status: 'refreshed',
      tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  @Get('expiring')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'AD_OPS')
  async getExpiring(@Query('days') days?: number) {
    return this.integrationStatusService.getExpiringSoon(days || 7);
  }
}
