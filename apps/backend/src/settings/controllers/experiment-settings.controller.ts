import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ExperimentSettingsService } from '../services/experiment-settings.service';

@Controller('settings/experiments')
export class ExperimentSettingsController {
  constructor(private readonly service: ExperimentSettingsService) {}

  // =====================
  // ExperimentTemplate
  // =====================
  @Post('templates')
  async createTemplate(@Body() data: any) {
    return this.service.createTemplate(data);
  }

  @Get('templates')
  async findAllTemplates(@Query('tenantId') tenantId?: string) {
    return this.service.findAllTemplates(tenantId);
  }

  @Get('templates/active')
  async findActiveTemplates(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveTemplates(tenantId);
  }

  @Get('templates/type/:templateType')
  async findTemplatesByType(
    @Param('templateType') templateType: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.findTemplatesByType(templateType, tenantId);
  }

  @Get('templates/:id')
  async findTemplateById(@Param('id') id: string) {
    return this.service.findTemplateById(id);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.service.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // =====================
  // ExperimentAutoConfig
  // =====================
  @Post('auto-config')
  async createAutoConfig(@Body() data: any) {
    return this.service.createAutoConfig(data);
  }

  @Get('auto-config')
  async findAllAutoConfigs(@Query('tenantId') tenantId?: string) {
    return this.service.findAllAutoConfigs(tenantId);
  }

  @Get('auto-config/current')
  async getOrCreateAutoConfig(@Query('tenantId') tenantId?: string) {
    return this.service.getOrCreateAutoConfig(tenantId);
  }

  @Get('auto-config/:id')
  async findAutoConfigById(@Param('id') id: string) {
    return this.service.findAutoConfigById(id);
  }

  @Put('auto-config/:id')
  async updateAutoConfig(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAutoConfig(id, data);
  }

  @Delete('auto-config/:id')
  async deleteAutoConfig(@Param('id') id: string) {
    return this.service.deleteAutoConfig(id);
  }

  // =====================
  // StatisticalConfig
  // =====================
  @Post('statistical-config')
  async createStatisticalConfig(@Body() data: any) {
    return this.service.createStatisticalConfig(data);
  }

  @Get('statistical-config')
  async findAllStatisticalConfigs(@Query('tenantId') tenantId?: string) {
    return this.service.findAllStatisticalConfigs(tenantId);
  }

  @Get('statistical-config/current')
  async getOrCreateStatisticalConfig(@Query('tenantId') tenantId?: string) {
    return this.service.getOrCreateStatisticalConfig(tenantId);
  }

  @Get('statistical-config/:id')
  async findStatisticalConfigById(@Param('id') id: string) {
    return this.service.findStatisticalConfigById(id);
  }

  @Put('statistical-config/:id')
  async updateStatisticalConfig(@Param('id') id: string, @Body() data: any) {
    return this.service.updateStatisticalConfig(id, data);
  }

  @Delete('statistical-config/:id')
  async deleteStatisticalConfig(@Param('id') id: string) {
    return this.service.deleteStatisticalConfig(id);
  }
}
