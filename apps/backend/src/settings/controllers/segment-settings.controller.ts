import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SegmentSettingsService } from '../services/segment-settings.service';

@Controller('settings/segments')
export class SegmentSettingsController {
  constructor(private readonly service: SegmentSettingsService) {}

  // =====================
  // SegmentRule
  // =====================
  @Post('rules')
  async createSegmentRule(@Body() data: any) {
    return this.service.createSegmentRule(data);
  }

  @Get('rules')
  async findAllSegmentRules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllSegmentRules(tenantId);
  }

  @Get('rules/active')
  async findActiveSegmentRules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveSegmentRules(tenantId);
  }

  @Get('rules/type/:ruleType')
  async findSegmentRulesByType(
    @Param('ruleType') ruleType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findSegmentRulesByType(ruleType, tenantId);
  }

  @Get('rules/:id')
  async findSegmentRuleById(@Param('id') id: string) {
    return this.service.findSegmentRuleById(id);
  }

  @Put('rules/:id')
  async updateSegmentRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateSegmentRule(id, data);
  }

  @Delete('rules/:id')
  async deleteSegmentRule(@Param('id') id: string) {
    return this.service.deleteSegmentRule(id);
  }

  // =====================
  // AudienceSync
  // =====================
  @Post('audience-sync')
  async createAudienceSync(@Body() data: any) {
    return this.service.createAudienceSync(data);
  }

  @Get('audience-sync')
  async findAllAudienceSyncs(@Query('tenantId') tenantId?: string) {
    return this.service.findAllAudienceSyncs(tenantId);
  }

  @Get('audience-sync/platform/:platform')
  async findAudienceSyncsByPlatform(
    @Param('platform') platform: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findAudienceSyncsByPlatform(platform, tenantId);
  }

  @Get('audience-sync/:id')
  async findAudienceSyncById(@Param('id') id: string) {
    return this.service.findAudienceSyncById(id);
  }

  @Put('audience-sync/:id')
  async updateAudienceSync(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAudienceSync(id, data);
  }

  @Delete('audience-sync/:id')
  async deleteAudienceSync(@Param('id') id: string) {
    return this.service.deleteAudienceSync(id);
  }

  @Post('audience-sync/:id/sync')
  async triggerSync(@Param('id') id: string) {
    return this.service.updateLastSyncTime(id);
  }
}
