import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SecuritySettingsService } from '../services/security-settings.service';

@Controller('settings/security')
export class SecuritySettingsController {
  constructor(private readonly service: SecuritySettingsService) {}

  // =====================
  // AccessPolicy
  // =====================
  @Post('access-policies')
  async createAccessPolicy(@Body() data: any) {
    return this.service.createAccessPolicy(data);
  }

  @Get('access-policies')
  async findAllAccessPolicies(@Query('tenantId') tenantId?: string) {
    return this.service.findAllAccessPolicies(tenantId);
  }

  @Get('access-policies/active')
  async findActiveAccessPolicies(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveAccessPolicies(tenantId);
  }

  @Get('access-policies/type/:policyType')
  async findAccessPoliciesByType(
    @Param('policyType') policyType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findAccessPoliciesByType(policyType, tenantId);
  }

  @Get('access-policies/:id')
  async findAccessPolicyById(@Param('id') id: string) {
    return this.service.findAccessPolicyById(id);
  }

  @Put('access-policies/:id')
  async updateAccessPolicy(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAccessPolicy(id, data);
  }

  @Delete('access-policies/:id')
  async deleteAccessPolicy(@Param('id') id: string) {
    return this.service.deleteAccessPolicy(id);
  }

  @Post('access-policies/check-ip')
  async checkIpAccess(
    @Body() data: { ip: string; tenantId?: string },
  ) {
    const allowed = await this.service.checkIpAccess(data.ip, data.tenantId);
    return { ip: data.ip, allowed };
  }

  // =====================
  // ApiKeyConfig
  // =====================
  @Post('api-keys')
  async createApiKey(@Body() data: any) {
    return this.service.createApiKey(data);
  }

  @Get('api-keys')
  async findAllApiKeys(@Query('tenantId') tenantId?: string) {
    return this.service.findAllApiKeys(tenantId);
  }

  @Get('api-keys/active')
  async findActiveApiKeys(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveApiKeys(tenantId);
  }

  @Get('api-keys/:id')
  async findApiKeyById(@Param('id') id: string) {
    return this.service.findApiKeyById(id);
  }

  @Put('api-keys/:id')
  async updateApiKey(@Param('id') id: string, @Body() data: any) {
    return this.service.updateApiKey(id, data);
  }

  @Delete('api-keys/:id')
  async deleteApiKey(@Param('id') id: string) {
    return this.service.deleteApiKey(id);
  }

  @Post('api-keys/:id/regenerate')
  async regenerateApiKey(@Param('id') id: string) {
    return this.service.regenerateApiKey(id);
  }

  @Post('api-keys/validate')
  async validateApiKey(
    @Body() data: { apiKey: string; requiredPermission?: string },
  ) {
    const valid = await this.service.validateApiKey(data.apiKey, data.requiredPermission);
    return { valid };
  }
}
