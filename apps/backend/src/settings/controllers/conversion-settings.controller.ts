import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConversionSettingsService } from '../services/conversion-settings.service';

@Controller('settings/conversions')
export class ConversionSettingsController {
  constructor(private readonly service: ConversionSettingsService) {}

  // =====================
  // ConversionRule
  // =====================
  @Post('rules')
  async createConversionRule(@Body() data: any) {
    return this.service.createConversionRule(data);
  }

  @Get('rules')
  async findAllConversionRules(@Query('tenantId') tenantId?: string) {
    return this.service.findAllConversionRules(tenantId);
  }

  @Get('rules/active')
  async findActiveConversionRules(@Query('tenantId') tenantId?: string) {
    return this.service.findActiveConversionRules(tenantId);
  }

  @Get('rules/:id')
  async findConversionRuleById(@Param('id') id: string) {
    return this.service.findConversionRuleById(id);
  }

  @Put('rules/:id')
  async updateConversionRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateConversionRule(id, data);
  }

  @Delete('rules/:id')
  async deleteConversionRule(@Param('id') id: string) {
    return this.service.deleteConversionRule(id);
  }

  // =====================
  // AttributionModelConfig
  // =====================
  @Post('attribution')
  async createAttributionModel(@Body() data: any) {
    return this.service.createAttributionModel(data);
  }

  @Get('attribution')
  async findAllAttributionModels(@Query('tenantId') tenantId?: string) {
    return this.service.findAllAttributionModels(tenantId);
  }

  @Get('attribution/default')
  async findDefaultAttributionModel(@Query('tenantId') tenantId?: string) {
    return this.service.findDefaultAttributionModel(tenantId);
  }

  @Get('attribution/:id')
  async findAttributionModelById(@Param('id') id: string) {
    return this.service.findAttributionModelById(id);
  }

  @Put('attribution/:id')
  async updateAttributionModel(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAttributionModel(id, data);
  }

  @Delete('attribution/:id')
  async deleteAttributionModel(@Param('id') id: string) {
    return this.service.deleteAttributionModel(id);
  }

  @Put('attribution/:id/default')
  async setDefaultAttributionModel(
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.service.setDefaultAttributionModel(id, tenantId);
  }

  // =====================
  // FunnelWeight
  // =====================
  @Post('funnel-weights')
  async createFunnelWeight(@Body() data: any) {
    return this.service.createFunnelWeight(data);
  }

  @Get('funnel-weights')
  async findAllFunnelWeights(@Query('tenantId') tenantId?: string) {
    return this.service.findAllFunnelWeights(tenantId);
  }

  @Get('funnel-weights/:id')
  async findFunnelWeightById(@Param('id') id: string) {
    return this.service.findFunnelWeightById(id);
  }

  @Put('funnel-weights/:id')
  async updateFunnelWeight(@Param('id') id: string, @Body() data: any) {
    return this.service.updateFunnelWeight(id, data);
  }

  @Delete('funnel-weights/:id')
  async deleteFunnelWeight(@Param('id') id: string) {
    return this.service.deleteFunnelWeight(id);
  }

  @Put('funnel-weights/upsert/:funnelStep')
  async upsertFunnelWeight(
    @Param('funnelStep') funnelStep: string,
    @Body() data: { tenantId?: string; weight: number; autoOptimize: boolean },
  ) {
    return this.service.upsertFunnelWeight(data.tenantId || null, funnelStep, data.weight, data.autoOptimize);
  }
}
