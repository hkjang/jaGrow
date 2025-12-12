import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AlertSettingsService } from '../services/alert-settings.service';

@Controller('settings/alerts')
export class AlertSettingsController {
  constructor(private readonly service: AlertSettingsService) {}

  // =====================
  // AlertRule
  // =====================
  @Post('rules')
  async createAlertRule(@Body() data: any) {
    return this.service.createAlertRule(data);
  }

  @Get('rules')
  async findAllAlertRules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllAlertRules(tenantId);
  }

  @Get('rules/active')
  async findActiveAlertRules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveAlertRules(tenantId);
  }

  @Get('rules/type/:alertType')
  async findAlertRulesByType(
    @Param('alertType') alertType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findAlertRulesByType(alertType, tenantId);
  }

  @Get('rules/:id')
  async findAlertRuleById(@Param('id') id: string) {
    return this.service.findAlertRuleById(id);
  }

  @Put('rules/:id')
  async updateAlertRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAlertRule(id, data);
  }

  @Delete('rules/:id')
  async deleteAlertRule(@Param('id') id: string) {
    return this.service.deleteAlertRule(id);
  }

  // =====================
  // AlertChannelConfig
  // =====================
  @Post('channels')
  async createAlertChannel(@Body() data: any) {
    return this.service.createAlertChannel(data);
  }

  @Get('rules/:alertRuleId/channels')
  async findAlertChannelsByRuleId(@Param('alertRuleId') alertRuleId: string) {
    return this.service.findAlertChannelsByRuleId(alertRuleId);
  }

  @Get('channels/:id')
  async findAlertChannelById(@Param('id') id: string) {
    return this.service.findAlertChannelById(id);
  }

  @Put('channels/:id')
  async updateAlertChannel(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAlertChannel(id, data);
  }

  @Delete('channels/:id')
  async deleteAlertChannel(@Param('id') id: string) {
    return this.service.deleteAlertChannel(id);
  }

  // =====================
  // AutomationRule
  // =====================
  @Post('automation')
  async createAutomationRule(@Body() data: any) {
    return this.service.createAutomationRule(data);
  }

  @Get('automation')
  async findAllAutomationRules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllAutomationRules(tenantId);
  }

  @Get('automation/active')
  async findActiveAutomationRules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveAutomationRules(tenantId);
  }

  @Get('automation/type/:ruleType')
  async findAutomationRulesByType(
    @Param('ruleType') ruleType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findAutomationRulesByType(ruleType, tenantId);
  }

  @Get('automation/:id')
  async findAutomationRuleById(@Param('id') id: string) {
    return this.service.findAutomationRuleById(id);
  }

  @Put('automation/:id')
  async updateAutomationRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAutomationRule(id, data);
  }

  @Delete('automation/:id')
  async deleteAutomationRule(@Param('id') id: string) {
    return this.service.deleteAutomationRule(id);
  }

  @Post('automation/:id/trigger')
  async incrementTriggerCount(@Param('id') id: string) {
    return this.service.incrementTriggerCount(id);
  }
}
